import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { eventsApi } from "@/lib/api";
import { EventForm } from "@/components/event-form";
import { LoadingBlock, PageHeader } from "@/components/ui-blocks";

export const Route = createFileRoute("/dashboard/events/$id/edit")({
  component: EditEvent,
});

function EditEvent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["events", id], queryFn: () => eventsApi.get(id) });

  const update = useMutation({
    mutationFn: (values: Parameters<typeof eventsApi.update>[1]) =>
      eventsApi.update(id, values),
    onSuccess: () => {
      toast.success("Event updated");
      qc.invalidateQueries({ queryKey: ["events"] });
      navigate({ to: "/dashboard/events/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit event" />
      {q.isLoading && <LoadingBlock />}
      {q.data && (
        <div className="rounded-lg border bg-card p-6">
          <EventForm
            initial={q.data}
            submitLabel="Save changes"
            submitting={update.isPending}
            onSubmit={(v) => update.mutate(v)}
          />
        </div>
      )}
    </div>
  );
}
