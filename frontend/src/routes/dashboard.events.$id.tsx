import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api";
import { LoadingBlock, ErrorBlock } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronLeft, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_STYLES, statusLabel, eventGradient } from "@/components/public/event-utils";
import { resolveImageUrl } from "@/lib/images";

export const Route = createFileRoute("/dashboard/events/$id")({
  component: EventDetailLayout,
});

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
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 rounded-full">
        <Link to="/dashboard/events">
          <ChevronLeft className="mr-1 h-4 w-4" /> All events
        </Link>
      </Button>

      {q.isLoading && <LoadingBlock />}
      {q.error && <ErrorBlock error={q.error} />}
      {q.data && (
        <>
          <div className="relative mb-6 overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm">
            <div
              className="h-2 w-full"
              style={{
                background: q.data.bannerImage
                  ? `url(${resolveImageUrl(q.data.bannerImage)}) center/cover`
                  : eventGradient(q.data.slug),
              }}
            />
            <div className="flex flex-wrap items-start justify-between gap-4 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {q.data.title}
                  </h1>
                  <Badge
                    variant="outline"
                    className={STATUS_STYLES[q.data.status] ?? STATUS_STYLES.upcoming}
                  >
                    {statusLabel(q.data.status)}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(q.data.eventDate).toLocaleString()}
                  </span>
                  {q.data.venue && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      {q.data.venue}
                    </span>
                  )}
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/dashboard/events/$id/edit" params={{ id }}>
                  <Pencil className="mr-1.5 h-4 w-4" /> Edit event
                </Link>
              </Button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = t.exact
                ? loc.pathname === t.to
                : loc.pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
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
