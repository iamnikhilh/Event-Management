import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { sessionsApi, speakersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { EmptyState, LoadingBlock } from "@/components/ui-blocks";
import type { Session } from "@/lib/types";

export const Route = createFileRoute("/dashboard/events/$id/sessions")({
  component: Sessions,
});

const schema = z.object({
  title: z.string().min(2, "Required"),
  description: z.string().optional(),
  track: z.string().optional(),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  speakerIds: z.array(z.string()).optional().default([]),
});
type FormValues = z.input<typeof schema>;


function toLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function Sessions() {
  const { id: eventId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);

  const list = useQuery({
    queryKey: ["sessions", eventId],
    queryFn: () => sessionsApi.list(eventId),
  });
  const speakers = useQuery({ queryKey: ["speakers"], queryFn: () => speakersApi.list() });

  const create = useMutation({
    mutationFn: (v: FormValues) =>
      sessionsApi.create(eventId, {
        ...v,
        startTime: new Date(v.startTime).toISOString(),
        endTime: new Date(v.endTime).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", eventId] });
      toast.success("Session added");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: ({ sid, v }: { sid: string; v: FormValues }) =>
      sessionsApi.update(eventId, sid, {
        ...v,
        startTime: new Date(v.startTime).toISOString(),
        endTime: new Date(v.endTime).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", eventId] });
      toast.success("Session updated");
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (sid: string) => sessionsApi.remove(eventId, sid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", eventId] });
      toast.success("Session removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add session</Button>
          </DialogTrigger>
          <SessionDialog
            title="Add session"
            speakers={speakers.data ?? []}
            submitting={create.isPending}
            onSubmit={(v) => create.mutate(v)}
          />
        </Dialog>
      </div>

      {list.isLoading && <LoadingBlock />}
      {list.data && list.data.length === 0 && (
        <EmptyState
          title="No sessions yet"
          description="Add the first talk, workshop, or break to the agenda."
        />
      )}

      <div className="space-y-3">
        {list.data?.map((s) => (
          <div key={s.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{s.title}</h3>
                  {s.track && <Badge variant="secondary">{s.track}</Badge>}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(s.startTime).toLocaleString()} –{" "}
                  {new Date(s.endTime).toLocaleTimeString()}
                </p>
                {s.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                )}
                {s.speakers && s.speakers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.speakers.map((sp) => (
                      <Badge key={sp.id} variant="outline">{sp.name}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(s.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <SessionDialog
            title="Edit session"
            initial={editing}
            speakers={speakers.data ?? []}
            submitting={update.isPending}
            onSubmit={(v) => update.mutate({ sid: editing.id, v })}
          />
        )}
      </Dialog>
    </div>
  );
}

function SessionDialog({
  title,
  initial,
  speakers,
  submitting,
  onSubmit,
}: {
  title: string;
  initial?: Session;
  speakers: { id: string; name: string }[];
  submitting?: boolean;
  onSubmit: (v: FormValues) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      track: initial?.track ?? "",
      startTime: toLocal(initial?.startTime),
      endTime: toLocal(initial?.endTime),
      speakerIds: initial?.speakers?.map((s) => s.id) ?? initial?.speakerIds ?? [],
    },
  });
  const selected = form.watch("speakerIds") ?? [];

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    form.setValue("speakerIds", next);
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input {...form.register("title")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Start</Label>
            <Input type="datetime-local" {...form.register("startTime")} />
          </div>
          <div className="space-y-2">
            <Label>End</Label>
            <Input type="datetime-local" {...form.register("endTime")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Track</Label>
          <Input placeholder="Main" {...form.register("track")} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea rows={3} {...form.register("description")} />
        </div>
        <div className="space-y-2">
          <Label>Speakers</Label>
          {speakers.length === 0 && (
            <p className="text-xs text-muted-foreground">Add speakers first.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {speakers.map((sp) => {
              const on = selected.includes(sp.id);
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => toggle(sp.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {sp.name}
                </button>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
