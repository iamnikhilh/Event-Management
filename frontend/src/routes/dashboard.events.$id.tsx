import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api";
import { LoadingBlock, ErrorBlock } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/events/$id")({
  component: EventDetailLayout,
});

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  active: "bg-green-500/10 text-green-700",
  completed: "bg-muted text-muted-foreground",
  draft: "bg-amber-500/10 text-amber-700",
  cancelled: "bg-destructive/10 text-destructive",
};

function EventDetailLayout() {
  const { id } = Route.useParams();
  const loc = useLocation();
  const q = useQuery({
    queryKey: ["events", id],
    queryFn: () => eventsApi.get(id),
  });

  const tabs = [
    { to: `/dashboard/events/${id}`, label: "Overview", exact: true },
    { to: `/dashboard/events/${id}/sessions`, label: "Sessions" },
    { to: `/dashboard/events/${id}/sponsors`, label: "Sponsors" },
    { to: `/dashboard/events/${id}/tickets`, label: "Tickets" },
    { to: `/dashboard/events/${id}/attendees`, label: "Attendees" },
    { to: `/dashboard/events/${id}/analytics`, label: "Analytics" },
  ];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/dashboard/events">
          <ChevronLeft className="mr-1 h-4 w-4" /> All events
        </Link>
      </Button>

      {q.isLoading && <LoadingBlock />}
      {q.error && <ErrorBlock error={q.error} />}
      {q.data && (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{q.data.title}</h1>
                <Badge variant="secondary" className={STATUS_COLORS[q.data.status]}>
                  {q.data.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(q.data.eventDate).toLocaleString()} · {q.data.venue || "Venue TBD"}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/events/$id/edit" params={{ id }}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Link>
            </Button>
          </div>

          <div className="mb-6 flex flex-wrap gap-1 border-b">
            {tabs.map((t) => {
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          <Outlet />
        </>
      )}
    </div>
  );
}
