import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck2, Sparkles, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/40">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-semibold">
            E
          </div>
          <span className="font-semibold tracking-tight">Eventide</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/events">Browse events</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="py-16 text-center md:py-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Event ops, without the tab explosion
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
            The control room for
            <br />
            <span className="text-primary">every event you run.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Plan agendas, sell tickets, wrangle sponsors, and check attendees in — all from
            one calm, opinionated dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/login">
                Open the dashboard <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/events">See live events</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-3">
          {[
            {
              icon: CalendarCheck2,
              title: "Every event, one place",
              body: "Create events, publish schedules, and manage sessions and speakers without stitching tools together.",
            },
            {
              icon: Users2,
              title: "Registration that scales",
              body: "Configure ticket tiers, take public registrations, and check in attendees with a QR scan.",
            },
            {
              icon: Sparkles,
              title: "Answers, not spreadsheets",
              body: "Real-time attendance, check-in rate, and revenue mix — no CSV gymnastics required.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
