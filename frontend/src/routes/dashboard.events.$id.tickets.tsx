import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ticketsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { EmptyState, LoadingBlock } from "@/components/ui-blocks";
import type { TicketType } from "@/lib/types";

export const Route = createFileRoute("/dashboard/events/$id/tickets")({
  component: Tickets,
});

const schema = z.object({
  name: z.string().min(1),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Numeric price, e.g. 49.99"),
  quantity: z.coerce.number().int().nonnegative(),
});
type FormValues = z.input<typeof schema>;

function Tickets() {
  const { id: eventId } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TicketType | null>(null);

  const list = useQuery({
    queryKey: ["tickets", eventId],
    queryFn: () => ticketsApi.list(eventId),
  });

  const create = useMutation({
    mutationFn: (v: FormValues) => ticketsApi.create(eventId, v as Partial<TicketType>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets", eventId] });
      toast.success("Ticket type added");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: ({ tid, v }: { tid: string; v: FormValues }) =>
      ticketsApi.update(eventId, tid, v as Partial<TicketType>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets", eventId] });
      toast.success("Ticket type updated");
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (tid: string) => ticketsApi.remove(eventId, tid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets", eventId] });
      toast.success("Ticket type removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Add ticket type</Button>
          </DialogTrigger>
          <TicketDialog
            title="Add ticket type"
            submitting={create.isPending}
            onSubmit={(v) => create.mutate(v)}
          />
        </Dialog>
      </div>

      {list.isLoading && <LoadingBlock />}
      {list.data && list.data.length === 0 && (
        <EmptyState title="No ticket types" description="Create the first tier to open registrations." />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {list.data?.map((t) => {
          const pct = t.quantity > 0 ? Math.round((t.quantitySold / t.quantity) * 100) : 0;
          return (
            <div key={t.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">${t.price}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(t)}>
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
                        <AlertDialogTitle>Delete ticket type?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Not allowed once tickets have been sold.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove.mutate(t.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t.quantitySold} sold</span>
                  <span>{t.quantity} total</span>
                </div>
                <Progress value={pct} />
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <TicketDialog
            title="Edit ticket type"
            initial={editing}
            submitting={update.isPending}
            onSubmit={(v) => update.mutate({ tid: editing.id, v })}
          />
        )}
      </Dialog>
    </div>
  );
}

function TicketDialog({
  title, initial, submitting, onSubmit,
}: {
  title: string;
  initial?: TicketType;
  submitting?: boolean;
  onSubmit: (v: FormValues) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      price: initial?.price ?? "0",
      quantity: initial?.quantity ?? 100,
    },
  });
  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input placeholder="Early bird" {...form.register("name")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Price ($)</Label>
            <Input inputMode="decimal" {...form.register("price")} />
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" min={0} {...form.register("quantity")} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
