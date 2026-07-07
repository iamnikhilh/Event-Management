import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { attendeesApi, publicApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LoadingBlock, ErrorBlock } from "@/components/ui-blocks";
import { Calendar, MapPin, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/events/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Eventide` },
      { name: "description", content: "Event details and registration." },
      { property: "og:title", content: `${params.slug} — Eventide` },
      { property: "og:description", content: "Event details and registration." },
    ],
  }),
  component: PublicEvent,
});

const regSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  ticketTypeId: z.string().min(1, "Choose a ticket"),
});
type RegValues = z.infer<typeof regSchema>;

function PublicEvent() {
  const { slug } = Route.useParams();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ qrCode?: string; fullName: string } | null>(null);

  const q = useQuery({
    queryKey: ["public", "event", slug],
    queryFn: () => publicApi.eventBySlug(slug),
  });

  const register = useMutation({
    mutationFn: (v: RegValues) =>
      attendeesApi.register(q.data!.id, v),
    onSuccess: (a) => {
      setConfirmation({ qrCode: a.qrCode, fullName: a.fullName });
      setOpen(false);
      toast.success("You're registered!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const form = useForm<RegValues>({
    resolver: zodResolver(regSchema),
    defaultValues: { fullName: "", email: "", ticketTypeId: "" },
  });

  if (q.isLoading) return <div className="p-10"><LoadingBlock /></div>;
  if (q.error) return <div className="p-10"><ErrorBlock error={q.error} /></div>;
  if (!q.data) return null;
  const e = q.data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-semibold">
              E
            </div>
            <span className="font-semibold tracking-tight">Eventide</span>
          </Link>
          <Button asChild size="sm" variant="ghost">
            <Link to="/events">All events</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Badge variant="secondary">{e.status}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{e.title}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {new Date(e.eventDate).toLocaleString()}
          </span>
          {e.venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {e.venue}
            </span>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {e.description || "No description yet."}
                </p>
              </CardContent>
            </Card>

            {e.sessions && e.sessions.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Agenda</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {e.sessions.map((s) => (
                    <div key={s.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{s.title}</p>
                        {s.track && <Badge variant="outline">{s.track}</Badge>}
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(s.startTime).toLocaleString()} –{" "}
                        {new Date(s.endTime).toLocaleTimeString()}
                      </p>
                      {s.speakers && s.speakers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {s.speakers.map((sp) => (
                            <Badge key={sp.id} variant="secondary">{sp.name}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {e.sponsors && e.sponsors.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Sponsors</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {e.sponsors.map((sp) => (
                      <div key={sp.id} className="flex items-center gap-2 rounded-md border p-2">
                        {sp.logoUrl && (
                          <img src={sp.logoUrl} alt={sp.name} className="h-8 w-8 object-contain" />
                        )}
                        <div className="text-sm">
                          <p className="font-medium">{sp.name}</p>
                          <p className="text-xs capitalize text-muted-foreground">{sp.tier}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader><CardTitle className="text-base">Tickets</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(!e.ticketTypes || e.ticketTypes.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    Registration isn't open yet.
                  </p>
                )}
                {e.ticketTypes?.map((t) => {
                  const soldOut = t.quantitySold >= t.quantity;
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {soldOut ? "Sold out" : `${t.quantity - t.quantitySold} left`}
                        </p>
                      </div>
                      <p className="font-semibold">${t.price}</p>
                    </div>
                  );
                })}
                {e.ticketTypes && e.ticketTypes.length > 0 && (
                  <Button className="w-full" onClick={() => setOpen(true)}>
                    Register
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Register for {e.title}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => register.mutate(v))} className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input {...form.register("fullName")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label>Ticket</Label>
              <Select
                value={form.watch("ticketTypeId")}
                onValueChange={(v) => form.setValue("ticketTypeId", v)}
              >
                <SelectTrigger><SelectValue placeholder="Choose a ticket" /></SelectTrigger>
                <SelectContent>
                  {e.ticketTypes?.map((t) => (
                    <SelectItem key={t.id} value={t.id} disabled={t.quantitySold >= t.quantity}>
                      {t.name} — ${t.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.ticketTypeId && (
                <p className="text-xs text-destructive">{form.formState.errors.ticketTypeId.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={register.isPending}>Confirm registration</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmation} onOpenChange={(o) => !o && setConfirmation(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogHeader>
            <DialogTitle>You're in, {confirmation?.fullName}!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Show this code at check-in. We've also emailed it to you.
          </p>
          {confirmation?.qrCode && (
            <div className="rounded-md border bg-muted/40 p-4 font-mono text-xs break-all">
              {confirmation.qrCode}
            </div>
          )}
          <DialogFooter>
            <Button className="w-full" onClick={() => setConfirmation(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
