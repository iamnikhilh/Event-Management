import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { speakersApi } from "@/lib/api";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Speaker } from "@/lib/types";

export const Route = createFileRoute("/dashboard/speakers")({
  component: Speakers,
});

const schema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().url().or(z.literal("")).optional(),
});
type FormValues = z.infer<typeof schema>;

function Speakers() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Speaker | null>(null);

  const list = useQuery({ queryKey: ["speakers"], queryFn: () => speakersApi.list() });

  const create = useMutation({
    mutationFn: (v: FormValues) => speakersApi.create(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["speakers"] });
      toast.success("Speaker added"); setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: ({ sid, v }: { sid: string; v: FormValues }) => speakersApi.update(sid, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["speakers"] });
      toast.success("Speaker updated"); setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (sid: string) => speakersApi.remove(sid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["speakers"] });
      toast.success("Speaker removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Speakers"
        description="Your shared roster — reuse across events."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Add speaker</Button>
            </DialogTrigger>
            <SpeakerDialog
              title="Add speaker"
              submitting={create.isPending}
              onSubmit={(v) => create.mutate(v)}
            />
          </Dialog>
        }
      />

      {list.isLoading && <LoadingBlock />}
      {list.data && list.data.length === 0 && (
        <EmptyState title="No speakers yet" description="Build your roster of experts." />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.data?.map((s) => (
          <div key={s.id} className="flex gap-3 rounded-lg border bg-card p-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={s.photoUrl} />
              <AvatarFallback>{s.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{s.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[s.title, s.company].filter(Boolean).join(" · ") || "—"}
              </p>
              {s.bio && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{s.bio}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
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
                    <AlertDialogTitle>Remove speaker?</AlertDialogTitle>
                    <AlertDialogDescription>They'll be unlinked from sessions.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove.mutate(s.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <SpeakerDialog
            title="Edit speaker"
            initial={editing}
            submitting={update.isPending}
            onSubmit={(v) => update.mutate({ sid: editing.id, v })}
          />
        )}
      </Dialog>
    </div>
  );
}

function SpeakerDialog({
  title, initial, submitting, onSubmit,
}: {
  title: string;
  initial?: Speaker;
  submitting?: boolean;
  onSubmit: (v: FormValues) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      title: initial?.title ?? "",
      company: initial?.company ?? "",
      bio: initial?.bio ?? "",
      photoUrl: initial?.photoUrl ?? "",
    },
  });
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input {...form.register("company")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Photo URL</Label>
          <Input placeholder="https://..." {...form.register("photoUrl")} />
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea rows={3} {...form.register("bio")} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
