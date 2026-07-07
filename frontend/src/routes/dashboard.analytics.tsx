import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { analyticsApi } from "@/lib/api";
import { PageHeader, LoadingBlock, ErrorBlock } from "@/components/ui-blocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/analytics")({
  component: Analytics,
});

function Analytics() {
  const q = useQuery({ queryKey: ["analytics", "overview"], queryFn: () => analyticsApi.overview() });

  return (
    <div>
      <PageHeader title="Analytics" description="Portfolio-wide performance across your events." />
      {q.isLoading && <LoadingBlock />}
      {q.error && <ErrorBlock error={q.error} />}
      {q.data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Events by status</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {Object.entries(q.data.eventsByStatus ?? {}).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Top 5 events by attendance</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q.data.top5Events ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Top events</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y">
                {q.data.top5Events?.map((t) => (
                  <li key={t.eventId} className="flex items-center justify-between py-2">
                    <Link
                      to="/dashboard/events/$id"
                      params={{ id: t.eventId }}
                      className="text-sm hover:underline"
                    >
                      {t.title}
                    </Link>
                    <span className="text-sm font-medium">{t.attendance}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
