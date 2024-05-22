import { Hono } from "hono";
import { env } from 'hono/adapter'
import { cors } from "hono/cors"
import { NeonDbError, neon } from "@neondatabase/serverless";
import { drizzle } from 'drizzle-orm/neon-http';

type Bindings = {
  DATABASE_URL: string;
};

export function createApp() {
  const app = new Hono<{ Bindings: Bindings }>();

  const DB_ERRORS: Array<NeonDbError> = [];

  app.use(async (c, next) => {
    try {
      await next();
    } catch (err) {
      console.error(err);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

  app.post("/v0/logs", async (c) => {
    const { level, service, message, args, traceId, timestamp } = await c.req.json();
    const sql = neon(env(c).DATABASE_URL);
    const db = drizzle(sql);

    const jsonMessage = isJsonParseable(message) ? message : JSON.stringify(message);
    const jsonArgs = isJsonParseable(args) ? args : JSON.stringify(args);

    try {
      // Ideally would use `c.ctx.waitUntil` on sql call here but no need to optimize this project yet or maybe ever
      const mizuLevel = level === "log" ? "info" : level;
      await sql("insert into mizu_logs (level, service, message, args, trace_id, timestamp) values ($1, $2, $3, $4, $5, $6)", [mizuLevel, service, jsonMessage, jsonArgs, traceId, timestamp]);
      return c.text("OK");
    } catch (err) {
      if (err instanceof NeonDbError) {
        console.log("DB ERROR FOR:", { message, jsonMessage });
        console.error(err);
        DB_ERRORS.push(err);
      }
      return c.json({ error: "Error processing log data" }, 500);
    }
  });

  // Data equivalent of home page (for a frontend to consume)
  app.get("/v0/logs", cors(), async (c) => {
    const sql = neon(env(c).DATABASE_URL);
    const logs = await sql("SELECT * FROM mizu_logs");
    return c.json({
      logs
    });
  });



  // HACK - Route to inspect any db errors during this session
  app.get("db-errors", async (c) => {
    return c.json(DB_ERRORS);
  });

  // TODO - Otel support, would need to decode protobuf
  app.post("/v1/logs", async (c) => {
    const body = await c.req.json();
    console.log(body);
    return c.json(body);
  });

  return app;
}

/**
 * Check if value is json-parseable
 */
function isJsonParseable(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}