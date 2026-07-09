import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api";
import { LoadingBlock, Panel, PanelHeader } from "@/components/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Hash } from "lucide-react";
import { STATUS_STYLES, statusLabel } from "@/components/public/event-utils";

export const Route = createFileRoute("/dashboard/events/$id/")({
  component: EventOverview,
});

function EventOverview() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["events", id], queryFn: () => eventsApi.get(id) });

  if (q.isLoading) return <LoadingBlock />;
  if (!q.data) return null;
  const e = q.data;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Panel className="md:col-span-2">
        <PanelHeader title="About this event" />
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground md:text-base">
          {e.description || "No description yet. Add one when editing the event."}
        </p>
      </Panel>

      <Panel>
        <PanelHeader title="Event details" />
        <dl className="space-y-4 text-sm">
          <DetailRow icon={Hash} label="Slug" value={`/${e.slug}`} />
          <DetailRow
            label="Date"
            value={new Date(e.eventDate).toLocaleString()}
          />
          <DetailRow label="Venue" value={e.venue || "—"} />
          <DetailRow label="Capacity" value={e.capacity ? String(e.capacity) : "—"} />
          <DetailRow
            icon={e.isPublic ? Globe : Lock}
            label="Visibility"
            value={e.isPublic ? "Public" : "Private"}
          />
          <div className="flex items-center justify-between gap-4 pt-2">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant="outline"
              className={STATUS_STYLES[e.status] ?? STATUS_STYLES.upcoming}
            >
              {statusLabel(e.status)}
            </Badge>
          </div>
        </dl>
      </Panel>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
