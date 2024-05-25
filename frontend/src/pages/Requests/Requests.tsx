import { useEffect, useState } from "react"
import {
  // FileIcon,
  TrashIcon,
  MoonIcon,
  // ListBulletIcon as ListFilter, // FIXME
} from "@radix-ui/react-icons"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useMizulogs } from "@/queries/logs"
import { Button } from "@/components/ui/button"
import { DataTable } from "./DataTable";
import { columns } from "./columns";

export function RequestsPage() {
  const [rerenderHack, setRerenderHack] = useState(0);
  const { traces } = useMizulogs(rerenderHack);
  useEffect(() => {
    // console.log("TRACES", traces)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traces.length])

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="error">Error Responses</TabsTrigger>
          <TabsTrigger value="ignored" className="hidden sm:flex">
            With Any Errors
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Error
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Ignored
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button> */}
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => {
            fetch("http://localhost:8788/v0/logs/ignore", {
              method: "POST",
              body: JSON.stringify({
                logIds: traces.flatMap(t => t.logs?.map(l => l.id))
              })
            }).then(() => {
              setRerenderHack(v => v + 1);
              alert("Successfully ignored all");
            })
          }}>
            <MoonIcon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Ignore All
            </span>
          </Button>
          <Button variant="destructive" size="sm" className="h-8 gap-1" onClick={() => {
            fetch("http://localhost:8788/v0/logs/delete-all-hack", {
              method: "POST",
            }).then(() => {
              setRerenderHack(v => v + 1);
              alert("Successfully deleted all");
            })
          }}>
            <TrashIcon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Delete All
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>
              Inspect requests to your development environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={traces} filter="all" />
            {/* <RequestsTable traces={traces} filter="all" /> */}
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{traces.length}</strong> of <strong>{traces.length}</strong>{" "}
              requests
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="error">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader>
            <CardTitle>4xx and 5xx Errors</CardTitle>
            <CardDescription>
              View requests that resulted in 4xx or 5xx errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={traces} filter="error" />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{traces.length}</strong> of <strong>{traces.length}</strong>{" "}
              requests
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}