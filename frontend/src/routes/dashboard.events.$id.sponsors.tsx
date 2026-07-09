import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { sponsorsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { EmptyState, LoadingBlock } from "@/components/ui-blocks";
import type { Sponsor } from "@/lib/types";
import { ImageUpload } from "@/components/image-upload";
import { resolveImageUrl } from "@/lib/images";

export const Route = createFileRoute("/dashboard/events/$id/sponsors")({
  component: Sponsors,
});

const schema = z.object({
  name: z.string().min(1),
  tier: z.enum(["platinum", "gold", "silver", "bronze"]),
  logoUrl: z.string().optional(),
  website: z.string().url().or(z.literal("")).optional(),
});
type FormValues = z.infer<typeof schema>;

const TIER_COLORS: Record<string, string> = {
  platinum: "bg-slate-200 text-slate-900",
  gold: "bg-amber-200 text-amber-900",
  silver: "bg-zinc-200 text-zinc-900",
  bronze: "bg-orange-200 text-orange-900",
};

function Sponsors() {
  const { id: eventId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);

  const list = useQuery({
    queryKey: ["sponsors", eventId],
    queryFn: () => sponsorsApi.list(eventId),
  });

  const create = useMutation({
    mutationFn: (v: FormValues) => sponsorsApi.create(eventId, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsors", eventId] });
      toast.success("Sponsor added");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: ({ sid, v }: { sid: string; v: FormValues }) =>
      sponsorsApi.update(eventId, sid, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsors", eventId] });
      toast.success("Sponsor updated");
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (sid: string) => sponsorsApi.remove(eventId, sid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsors", eventId] });
      toast.success("Sponsor removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add sponsor</Button>
          </DialogTrigger>
          <SponsorDialog
            title="Add sponsor"
            submitting={create.isPending}
            onSubmit={(v) => create.mutate(v)}
          />
        </Dialog>
      </div>

      {list.isLoading && <LoadingBlock />}
      {list.data && list.data.length === 0 && (
        <EmptyState title="No sponsors yet" description="Add partners powering this event." />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.data?.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded bg-muted">
              {s.logoUrl ? (
                <img src={resolveImageUrl(s.logoUrl)} alt={s.name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">{s.name.slice(0, 2)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{s.name}</p>
                <Badge variant="secondary" className={TIER_COLORS[s.tier as string]}>
                  {s.tier}
                </Badge>
              </div>
              {s.website && (
                <a
                  href={s.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
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
                    <AlertDialogTitle>Remove sponsor?</AlertDialogTitle>
                    <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
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
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <SponsorDialog
            title="Edit sponsor"
            initial={editing}
            submitting={update.isPending}
            onSubmit={(v) => update.mutate({ sid: editing.id, v })}
          />
        )}
      </Dialog>
    </div>
  );
}

function SponsorDialog({
  title, initial, submitting, onSubmit,
}: {
  title: string;
  initial?: Sponsor;
  submitting?: boolean;
  onSubmit: (v: FormValues) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      tier: (initial?.tier as FormValues["tier"]) ?? "gold",
      logoUrl: initial?.logoUrl ?? "",
      website: initial?.website ?? "",
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
        <div className="space-y-2">
          <Label>Tier</Label>
          <Select
            value={form.watch("tier")}
            onValueChange={(v) => form.setValue("tier", v as FormValues["tier"])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ImageUpload
          label="Logo"
          aspect="square"
          previewClassName="max-w-40"
          value={form.watch("logoUrl")}
          onChange={(url) => form.setValue("logoUrl", url, { shouldDirty: true })}
        />
        <div className="space-y-2">
          <Label>Website</Label>
          <Input placeholder="https://..." {...form.register("website")} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
