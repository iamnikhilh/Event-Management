import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Bell } from "lucide-react";

export const Route = createFileRoute("/dashboard/notifications")({
  component: Notifications,
});

function Notifications() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list({ page: 1, limit: 50 }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked read");
    },
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Recent activity across your events."
        action={
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="mr-1 h-4 w-4" /> Mark all read
          </Button>
        }
      />
      {list.isLoading && <LoadingBlock />}
      {list.data && list.data.items.length === 0 && (
        <EmptyState title="You're all caught up" description="New activity will appear here." />
      )}
      <div className="space-y-2">
        {list.data?.items.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-lg border bg-card p-4 ${
              n.isRead ? "opacity-70" : ""
            }`}
          >
            <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{n.title}</p>
                {!n.isRead && <Badge variant="default">New</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              {n.createdAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            {!n.isRead && (
              <Button size="icon" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
