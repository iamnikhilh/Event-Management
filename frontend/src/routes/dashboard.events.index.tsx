import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { eventsApi } from "@/lib/api";
import { PageHeader, LoadingBlock, ErrorBlock, EmptyState } from "@/components/ui-blocks";
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
import { CalendarPlus, Search, Trash2, Pencil } from "lucide-react";
import type { EventStatus } from "@/lib/types";

const searchSchema = z.object({
  page: z.coerce.number().default(1).catch(1),
  search: z.string().optional().catch(undefined),
  status: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/dashboard/events/")({
  validateSearch: searchSchema,
  component: EventsList,
});

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  active: "bg-green-500/10 text-green-700",
  completed: "bg-muted text-muted-foreground",
  draft: "bg-amber-500/10 text-amber-700",
  cancelled: "bg-destructive/10 text-destructive",
};

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
      search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, page: 1, ...patch }),
    });
  };


  return (
    <div>
      <PageHeader
        title="Events"
        description="Every event you're planning, running, or wrapped."
        action={
          <Button asChild>
            <Link to="/dashboard/events/new">
              <CalendarPlus className="mr-1 h-4 w-4" /> New event
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          className="relative flex-1 min-w-[240px]"
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ search: searchInput || undefined });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search events…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select
          value={search.status || "all"}
          onValueChange={(v) => updateSearch({ status: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[160px]">
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
      </div>

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
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link
                      to="/dashboard/events/$id"
                      params={{ id: e.id }}
                      className="font-medium hover:underline"
                    >
                      {e.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">/{e.slug}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(e.eventDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">{e.venue || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_COLORS[e.status]}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {e.isPublic ? "Public" : "Private"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="icon" variant="ghost">
                        <Link to="/dashboard/events/$id/edit" params={{ id: e.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete event?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes "{e.title}" and its data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(e.id)}>
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
        </div>
      )}

      {q.data && q.data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {q.data.pagination.page} of {q.data.pagination.totalPages} ·{" "}
            {q.data.pagination.totalItems} events
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={search.page <= 1}
              onClick={() => updateSearch({ page: search.page - 1 })}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
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
