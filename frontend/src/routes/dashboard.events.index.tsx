import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { eventsApi } from "@/lib/api";
import {
  PageHeader,
  LoadingBlock,
  ErrorBlock,
  EmptyState,
  FilterBar,
  Panel,
} from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarPlus, Search, Trash2, Pencil, Globe, Lock } from "lucide-react";
import type { EventStatus } from "@/lib/types";
import { STATUS_STYLES, statusLabel } from "@/components/public/event-utils";

const searchSchema = z.object({
  page: z.coerce.number().default(1).catch(1),
  search: z.string().optional().catch(undefined),
  status: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/dashboard/events/")({
  validateSearch: searchSchema,
  component: EventsList,
});

function EventsList() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState(search.search || "");

  const q = useQuery({
    queryKey: ["events", search],
    queryFn: () =>
      eventsApi.list({
        page: search.page,
        limit: 10,
        search: search.search,
        status: (search.status || "") as EventStatus | "",
      }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: () => {
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSearch = (patch: Partial<z.infer<typeof searchSchema>>) => {
    navigate({
      to: "/dashboard/events",
      search: (prev) => ({ ...prev, page: 1, ...patch }),
    });
  };

  return (
    <div>
      <PageHeader
        title="Events"
        description="Every event you're planning, running, or wrapped."
        action={
          <Button asChild className="rounded-full shadow-sm shadow-primary/20">
            <Link to="/dashboard/events/new">
              <CalendarPlus className="mr-1.5 h-4 w-4" /> New event
            </Link>
          </Button>
        }
      />

      <FilterBar>
        <form
          className="relative min-w-[200px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ search: searchInput || undefined });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-xl border-0 bg-background/80 pl-9"
            placeholder="Search events…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select
          value={search.status || "all"}
          onValueChange={(v) => updateSearch({ status: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[160px] rounded-xl border-0 bg-background/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {q.isLoading && <LoadingBlock />}
      {q.error && <ErrorBlock error={q.error} />}
      {q.data && q.data.items.length === 0 && (
        <EmptyState
          title="No events match"
          description="Try clearing filters or creating your first event."
          action={{
            label: "Create event",
            onClick: () => navigate({ to: "/dashboard/events/new" }),
          }}
        />
      )}

      {q.data && q.data.items.length > 0 && (
        <Panel noPadding>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.items.map((e) => (
                <TableRow key={e.id} className="group">
                  <TableCell>
                    <Link
                      to="/dashboard/events/$id"
                      params={{ id: e.id }}
                      className="font-medium hover:text-primary"
                    >
                      {e.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">/{e.slug}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(e.eventDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">{e.venue || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_STYLES[e.status] ?? STATUS_STYLES.upcoming}
                    >
                      {statusLabel(e.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      {e.isPublic ? (
                        <Globe className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      {e.isPublic ? "Public" : "Private"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                        <Link to="/dashboard/events/$id/edit" params={{ id: e.id }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete event?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes &ldquo;{e.title}&rdquo; and all its data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-full"
                              onClick={() => remove.mutate(e.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      {q.data && q.data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {q.data.pagination.page} of {q.data.pagination.totalPages} ·{" "}
            {q.data.pagination.totalItems} events
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={search.page <= 1}
              onClick={() => updateSearch({ page: search.page - 1 })}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={search.page >= q.data.pagination.totalPages}
              onClick={() => updateSearch({ page: search.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
