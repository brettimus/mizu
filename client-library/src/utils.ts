// HACK - We inject this symbol in our request/response logger in order to skip logging massive payloads
export const PRETTIFY_MIZU_LOGGER_LOG = Symbol("PRETTIFY_MIZU_LOGGER_LOG");

export type ExtendedExecutionContext = ExecutionContext & {
	__waitUntilTimer?: ReturnType<typeof setInterval>;
	__waitUntilPromises?: Promise<void>[];
	waitUntilFinished?: () => Promise<void>;
};

export type PrintFunc = (str: string, ...rest: unknown[]) => void;

export function tryPrettyPrintLoggerLog(fn: PrintFunc, message: string) {
	try {
		const requestOrResponse = JSON.parse(message);
		const lifecycle = requestOrResponse?.lifecycle;
		const method = requestOrResponse?.method;
		const path = requestOrResponse?.path;
		const status = requestOrResponse?.status;
		const elapsed = requestOrResponse?.elapsed;
		const out =
			lifecycle === "request"
				? `  <-- ${method} ${path}`
				: lifecycle === "response"
					? `  --> ${method} ${path} ${colorStatus(status)} ${elapsed}`
					: null;

		if (out) {
			fn.apply(fn, [out]);
		}
	} catch (error) {
		// Fail silently
	}
}

const colorStatus = (status: number) => {
	const colorEnabled = getColorEnabled();
	const out: { [key: string]: string } = {
		7: colorEnabled ? `\x1b[35m${status}\x1b[0m` : `${status}`,
		5: colorEnabled ? `\x1b[31m${status}\x1b[0m` : `${status}`,
		4: colorEnabled ? `\x1b[33m${status}\x1b[0m` : `${status}`,
		3: colorEnabled ? `\x1b[36m${status}\x1b[0m` : `${status}`,
		2: colorEnabled ? `\x1b[32m${status}\x1b[0m` : `${status}`,
		1: colorEnabled ? `\x1b[32m${status}\x1b[0m` : `${status}`,
		0: colorEnabled ? `\x1b[33m${status}\x1b[0m` : `${status}`,
	};

	const calculateStatus = (status / 100) | 0;

	return out[calculateStatus];
};

export function getColorEnabled(): boolean {
	return (
		typeof process !== "undefined" && process.stdout && process.stdout.isTTY
	);
}

// ================= //
// === Utilities === //
// ================= //

function errorToJson(error: Error) {
	return {
		name: error.name, // Includes the name of the error, e.g., 'TypeError'
		message: error.message, // The message string of the error
		stack: error.stack, // Stack trace of where the error occurred (useful for debugging)
		// Optionally add more properties here if needed
	};
}

function neonDbErrorToJson(error: NeonDbError) {
	// console.log('hahaaa', error)
	// console.log('SOURCE', error.sourceError)

	// export class NeonDbError extends Error {
	//   name = 'NeonDbError' as const;

	//   severity: string | undefined;
	//   code: string | undefined;
	//   detail: string | undefined;
	//   hint: string | undefined;
	//   position: string | undefined;
	//   internalPosition: string | undefined;
	//   internalQuery: string | undefined;
	//   where: string | undefined;
	//   schema: string | undefined;
	//   table: string | undefined;
	//   column: string | undefined;
	//   dataType: string | undefined;
	//   constraint: string | undefined;
	//   file: string | undefined;
	//   line: string | undefined;
	//   routine: string | undefined;

	//   sourceError: Error | undefined;
	// }

	return {
		name: error.name,
		message: error.message,
		sourceError: error.sourceError ? errorToJson(error.sourceError) : undefined,
		// detail: error.detail,

		// NOTE - NeonDbError does not include a stack trace! https://github.com/neondatabase/serverless/issues/82
		stack: error?.sourceError?.stack,

		// TODO - Figure out how to extract these fields from NeonDbError...
		//
		// where: error?.sourceError?.where,
		// table: error?.sourceError?.table,
		// column: error?.sourceError?.column,
		// dataType: error?.sourceError?.dataType,
		// internalQuery: error?.sourceError?.internalQuery,
	};
}
export function polyfillWaitUntil(ctx: ExtendedExecutionContext) {
	if (typeof ctx.waitUntil !== "function") {
		if (!Array.isArray(ctx.__waitUntilPromises)) {
			ctx.__waitUntilPromises = [];
		}

		ctx.waitUntil = function waitUntil(promise: Promise<void>) {
			// biome-ignore lint/style/noNonNullAssertion: https://github.com/highlight/highlight/pull/6480
			ctx.__waitUntilPromises!.push(promise);
			ctx.__waitUntilTimer = setInterval(() => {
				Promise.allSettled(ctx.__waitUntilPromises || []).then(() => {
					if (ctx.__waitUntilTimer) {
						clearInterval(ctx.__waitUntilTimer);
						ctx.__waitUntilTimer = undefined;
					}
				});
			}, 200);
		};
	}

	ctx.waitUntilFinished = async function waitUntilFinished() {
		if (ctx.__waitUntilPromises) {
			await Promise.allSettled(ctx.__waitUntilPromises);
		}
	};
}
