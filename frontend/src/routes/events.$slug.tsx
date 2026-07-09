import { createFileRoute } from "@tanstack/react-router";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingBlock, ErrorBlock } from "@/components/ui-blocks";
import { PublicHeader } from "@/components/public/public-header";
import { PublicAmbientBackground, PublicMotionStyles } from "@/components/public/public-motion";
import {
  eventGradient,
  formatEventDateTime,
  formatPrice,
  SPONSOR_TIER_STYLES,
  statusLabel,
  STATUS_STYLES,
} from "@/components/public/event-utils";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  Mic2,
  Share2,
  Ticket,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/events/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — EventMatrix` },
      { name: "description", content: "Event details and registration." },
      { property: "og:title", content: `${params.slug} — EventMatrix` },
      { property: "og:description", content: "Event details and registration." },
    ],
  }),
  component: PublicEvent,
});

const regSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  ticketTypeId: z.string().min(1, "Choose a ticket"),
});
type RegValues = z.infer<typeof regSchema>;

function PublicEvent() {
  const { slug } = Route.useParams();
  const [open, setOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    qrCode?: string;
    fullName: string;
  } | null>(null);

  const q = useQuery({
    queryKey: ["public", "event", slug],
    queryFn: () => publicApi.eventBySlug(slug),
  });

  const register = useMutation({
    mutationFn: (v: RegValues) => attendeesApi.register(q.data!.id, v),
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

  function openRegister(ticketId?: string) {
    if (ticketId) {
      setSelectedTicket(ticketId);
      form.setValue("ticketTypeId", ticketId);
    }
    setOpen(true);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  }

  function copyQr() {
    if (confirmation?.qrCode) {
      navigator.clipboard.writeText(confirmation.qrCode);
      toast.success("Check-in code copied");
    }
  }

  if (q.isLoading) {
    return (
      <div className="min-h-screen p-10">
        <LoadingBlock label="Loading event…" />
      </div>
    );
  }
  if (q.error) {
    return (
      <div className="min-h-screen p-10">
        <ErrorBlock error={q.error} />
      </div>
    );
  }
  if (!q.data) return null;

  const e = q.data;
  const lowestPrice = e.ticketTypes?.reduce((min, t) => {
    const p = parseFloat(t.price);
    return p < min ? p : min;
  }, Infinity);
  const hasTickets = e.ticketTypes && e.ticketTypes.length > 0;
  const anyAvailable = e.ticketTypes?.some((t) => t.quantitySold < t.quantity);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <PublicMotionStyles />
      <PublicAmbientBackground />
      <PublicHeader backTo={{ label: "All events", to: "/events" }} />

      {/* Hero banner */}
      <section className="relative z-10 overflow-hidden border-b">
        <div className="relative h-[280px] md:h-[360px]">
          {e.bannerImage ? (
            <img src={e.bannerImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: eventGradient(e.slug) }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/30" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 pb-8">
          <div className="-mt-20 md:-mt-24">
            <div className="em-in flex flex-wrap items-center gap-2">
              {e.category && (
                <Badge variant="secondary" className="backdrop-blur-sm">
                  {e.category.name}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={STATUS_STYLES[e.status] ?? STATUS_STYLES.upcoming}
              >
                {statusLabel(e.status)}
              </Badge>
            </div>

            <h1 className="em-in mt-4 text-3xl font-semibold tracking-tight md:text-5xl" style={{ animationDelay: "80ms" }}>
              {e.title}
            </h1>

            <div
              className="em-in mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
              style={{ animationDelay: "120ms" }}
            >
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {formatEventDateTime(e.eventDate)}
              </span>
              {e.venue && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {e.venue}
                </span>
              )}
              {e.capacity != null && (
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {e.capacity} capacity
                </span>
              )}
            </div>

            <div className="em-in mt-5 flex flex-wrap gap-2" style={{ animationDelay: "160ms" }}>
              {hasTickets && anyAvailable && (
                <Button
                  className="rounded-full shadow-sm shadow-primary/20"
                  onClick={() => openRegister()}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  Register now
                  {lowestPrice != null && lowestPrice !== Infinity && (
                    <span className="ml-2 opacity-80">
                      from {formatPrice(lowestPrice)}
                    </span>
                  )}
                </Button>
              )}
              <Button variant="outline" className="rounded-full" onClick={copyLink}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* About */}
            <section className="em-in rounded-2xl border bg-card/80 p-6 backdrop-blur-sm md:p-8">
              <h2 className="text-lg font-semibold">About this event</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground md:text-base">
                {e.description || "More details coming soon."}
              </p>
            </section>

            {/* Agenda */}
            {e.sessions && e.sessions.length > 0 && (
              <section className="em-in rounded-2xl border bg-card/80 p-6 backdrop-blur-sm md:p-8">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Agenda</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {e.sessions.length} session{e.sessions.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="mt-6 space-y-0">
                  {e.sessions.map((s, i) => (
                    <div key={s.id} className="relative flex gap-4 pb-8 last:pb-0">
                      {i < e.sessions!.length - 1 && (
                        <div className="absolute left-[11px] top-8 h-[calc(100%-8px)] w-px bg-border" />
                      )}
                      <div className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-primary bg-background" />
                      <div className="min-w-0 flex-1 rounded-xl border bg-background/60 p-4 transition-colors hover:border-primary/30">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-medium">{s.title}</p>
                          {s.track && (
                            <Badge variant="outline" className="shrink-0">
                              {s.track}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(s.startTime).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" – "}
                          {new Date(s.endTime).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        {s.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {s.description}
                          </p>
                        )}
                        {s.speakers && s.speakers.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {s.speakers.map((sp) => (
                              <span
                                key={sp.id}
                                className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs"
                              >
                                <Mic2 className="h-3 w-3 text-primary" />
                                {sp.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sponsors */}
            {e.sponsors && e.sponsors.length > 0 && (
              <section className="em-in rounded-2xl border bg-card/80 p-6 backdrop-blur-sm md:p-8">
                <h2 className="text-lg font-semibold">Sponsors</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {e.sponsors.map((sp) => (
                    <div
                      key={sp.id}
                      className={`flex items-center gap-3 rounded-xl border bg-gradient-to-br p-4 ${SPONSOR_TIER_STYLES[sp.tier] ?? SPONSOR_TIER_STYLES.bronze}`}
                    >
                      {sp.logoUrl ? (
                        <img
                          src={sp.logoUrl}
                          alt={sp.name}
                          className="h-10 w-10 rounded-lg bg-white/80 object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 text-sm font-bold">
                          {sp.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{sp.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">{sp.tier}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Tickets sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 overflow-hidden border-primary/10 bg-card/90 shadow-lg shadow-primary/5 backdrop-blur-md">
              <div
                className="h-1.5 w-full"
                style={{ background: eventGradient(e.slug) }}
              />
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Get tickets</h2>
                </div>

                {!hasTickets && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Registration isn't open yet. Check back soon.
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {e.ticketTypes?.map((t) => {
                    const soldOut = t.quantitySold >= t.quantity;
                    const left = t.quantity - t.quantitySold;
                    const pct = Math.round((t.quantitySold / t.quantity) * 100);

                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => !soldOut && openRegister(t.id)}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                          soldOut
                            ? "cursor-not-allowed opacity-50"
                            : "hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                        } ${selectedTicket === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{t.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {soldOut ? "Sold out" : `${left} remaining`}
                            </p>
                          </div>
                          <p className="text-lg font-semibold text-primary">
                            {formatPrice(t.price)}
                          </p>
                        </div>
                        {!soldOut && (
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/70 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {hasTickets && anyAvailable && (
                  <Button className="mt-5 w-full rounded-full" onClick={() => openRegister()}>
                    Register now
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Registration dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <div className="h-1.5 w-full" style={{ background: eventGradient(e.slug) }} />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Register for {e.title}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((v) => register.mutate(v))}
              className="mt-4 space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" placeholder="Jane Doe" {...form.register("fullName")} />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Ticket type</Label>
                <Select
                  value={form.watch("ticketTypeId")}
                  onValueChange={(v) => {
                    form.setValue("ticketTypeId", v);
                    setSelectedTicket(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a ticket" />
                  </SelectTrigger>
                  <SelectContent>
                    {e.ticketTypes?.map((t) => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        disabled={t.quantitySold >= t.quantity}
                      >
                        {t.name} — {formatPrice(t.price)}
                        {t.quantitySold >= t.quantity ? " (sold out)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.ticketTypeId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.ticketTypeId.message}
                  </p>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={register.isPending}
                >
                  {register.isPending ? "Registering…" : "Confirm registration"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmation} onOpenChange={(o) => !o && setConfirmation(null)}>
        <DialogContent className="gap-0 overflow-hidden p-0 text-center sm:max-w-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-primary" />
          <div className="p-6">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <DialogHeader className="mt-4">
              <DialogTitle className="text-xl">
                You're in, {confirmation?.fullName}!
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-muted-foreground">
              Show this code at check-in. We've also emailed it to you.
            </p>
            {confirmation?.qrCode && (
              <div className="relative mt-4 rounded-xl border bg-muted/40 p-4">
                <p className="font-mono text-sm font-medium tracking-wider break-all">
                  {confirmation.qrCode}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 h-8 w-8 p-0"
                  onClick={copyQr}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button
                className="w-full rounded-full"
                onClick={() => setConfirmation(null)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
