import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "@/lib/api";
import { LoadingBlock } from "@/components/ui-blocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground">
            {e.description || "No description yet."}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row k="Slug" v={`/${e.slug}`} />
          <Row k="Date" v={new Date(e.eventDate).toLocaleString()} />
          <Row k="Venue" v={e.venue || "—"} />
          <Row k="Capacity" v={e.capacity ? String(e.capacity) : "—"} />
          <Row k="Visibility" v={e.isPublic ? "Public" : "Private"} />
          <Row k="Status" v={e.status} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
