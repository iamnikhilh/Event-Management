import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api";
import { PageHeader, EmptyState, LoadingBlock, Panel } from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const unreadCount = list.data?.items.filter((n) => !n.isRead).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Recent activity across your events."
        action={
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || unreadCount === 0}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />

      {unreadCount > 0 && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
        </div>
      )}

      {list.isLoading && <LoadingBlock />}
      {list.data && list.data.items.length === 0 && (
        <EmptyState
          title="You're all caught up"
          description="New activity will appear here."
          icon={BellOff}
        />
      )}

      <div className="space-y-3">
        {list.data?.items.map((n) => (
          <Panel
            key={n.id}
            className={cn(
              "transition-all",
              !n.isRead && "border-primary/20 bg-primary/[0.02]",
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                )}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {!n.isRead && (
                    <Badge className="rounded-full px-2 py-0 text-[10px]">New</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                {n.createdAt && (
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              {!n.isRead && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 rounded-lg"
                  onClick={() => markRead.mutate(n.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
