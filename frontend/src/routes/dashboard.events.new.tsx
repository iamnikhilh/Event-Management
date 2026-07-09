import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-blocks";
import { EventForm } from "@/components/event-form";
import { eventsApi } from "@/lib/api";

export const Route = createFileRoute("/dashboard/events/new")({
  component: NewEvent,
});

function NewEvent() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: (e) => {
      toast.success("Event created");
      qc.invalidateQueries({ queryKey: ["events"] });
      navigate({ to: "/dashboard/events/$id", params: { id: e.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="w-full max-w-6xl">
      <PageHeader title="New event" description="Set the essentials — you can refine later." />
      <EventForm
        submitLabel="Create event"
        submitting={create.isPending}
        onSubmit={(v) => create.mutate(v)}
      />
    </div>
  );
}
