import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Activity,
  CalendarCheck2,
  ScanLine,
  Sparkles,
  Ticket,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public/public-header";
import { publicApi } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Landing,
});

/* ---------- floating 3D module deck ---------- */
const MODULES = [
  { label: "Schedule & agendas", icon: CalendarCheck2, stat: "42 sessions synced", x: -30, y: -22, z: 20, rotY: -12, dur: 7 },
  { label: "Ticketing", icon: Ticket, stat: "3 tiers, 1 checkout", x: 26, y: -30, z: 80, rotY: 8, dur: 8.5 },
  { label: "Check-in", icon: ScanLine, stat: "98% scan success", x: -22, y: 18, z: 140, rotY: -6, dur: 6.5 },
  { label: "Live analytics", icon: Activity, stat: "Updates every 4s", x: 28, y: 24, z: 200, rotY: 10, dur: 9 },
];

function ModuleDeck() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 6, y: -8 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setRot({ x: (0.5 - py) * 18, y: (px - 0.5) * 22 });
  }

  function handleLeave() {
    setRot({ x: 6, y: -8 });
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative mx-auto h-[420px] w-full max-w-md [perspective:1400px]"
    >
      <div
        className="relative h-full w-full"
        style={{
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 350ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* base glass plate for grounding */}
        <div
          className="absolute inset-8 rounded-2xl border bg-card/40 backdrop-blur-sm"
          style={{ transform: "translateZ(0px)" }}
        />

        {MODULES.map((m) => (
          <div
            key={m.label}
            className="absolute w-44"
            style={{
              left: `calc(50% + ${m.x}%)`,
              top: `calc(50% + ${m.y}%)`,
              transform: `translate(-50%, -50%) translateZ(${m.z}px) rotateY(${m.rotY}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur-md"
              style={{ animation: `em-float ${m.dur}s ease-in-out infinite` }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <m.icon className="h-4 w-4 text-primary" />
              </span>
              <p className="mt-3 text-sm font-medium">{m.label}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {m.stat}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- primary CTA with shine sweep ---------- */
function ShineButton({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Button asChild size="lg" className="group relative overflow-hidden">
      <Link to={to}>
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
        <span className="relative z-10 flex items-center gap-1">
          {children}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </Button>
  );
}

const EVENT_TYPES = ["Product launches", "Music festivals", "Conferences", "Weddings", "Hackathons", "Galas"];

function Landing() {
  const [spot, setSpot] = useState({ x: 50, y: 20 });
  const eventCount = useQuery({
    queryKey: ["public-events-total-count"],
    queryFn: () => publicApi.eventCount(),
    staleTime: 60_000,
  });
  const totalEvents = eventCount.data ?? 0;

  function handleHeroMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/40">
      <style>{`
        @keyframes em-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes em-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes em-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes em-drift { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-20px); } }
        @keyframes em-marquee { to { transform: translateX(-50%); } }
        .em-in { animation: em-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"], .em-in { animation: none !important; }
        }
      `}</style>

      {/* ambient background orbs, tinted with theme colors */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-32 top-[-10%] h-[420px] w-[420px] rounded-full bg-primary/10 blur-[100px]"
          style={{ animation: "em-drift 14s ease-in-out infinite" }}
        />
        <div
          className="absolute right-[-10%] top-[20%] h-[380px] w-[380px] rounded-full bg-secondary/40 blur-[100px]"
          style={{ animation: "em-drift 18s ease-in-out infinite reverse" }}
        />
      </div>

      <PublicHeader showBrowseEvents large hideOnScroll />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-4">
        <div className="relative" onMouseMove={handleHeroMove}>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(600px circle at ${spot.x}% ${spot.y}%, hsl(var(--primary) / 0.08), transparent 45%)`,
            }}
          />
          <section className="grid gap-14 py-12 md:grid-cols-[1.05fr_1fr] md:items-center md:py-24">
            <div className="text-center md:text-left">
              <div className="em-in mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground md:mx-0">
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-primary"
                    style={{ animation: "em-blink 1.6s ease-in-out infinite" }}
                  />
                </span>
                {eventCount.isLoading
                  ? "Loading events…"
                  : `${totalEvents} event${totalEvents === 1 ? "" : "s"} live right now`}
              </div>

              <h1
                className="em-in mt-6 text-4xl font-semibold tracking-tight md:text-6xl"
                style={{ animationDelay: "80ms" }}
              >
                The control room for
                <br />
                <span className="text-primary">every event you run.</span>
              </h1>

              <p
                className="em-in mx-auto mt-5 max-w-xl text-base text-muted-foreground md:mx-0 md:text-lg"
                style={{ animationDelay: "160ms" }}
              >
                Plan agendas, sell tickets, wrangle sponsors, and check attendees in — all from
                one calm, opinionated dashboard.
              </p>

              <div
                className="em-in mt-8 flex flex-wrap justify-center gap-3 md:justify-start"
                style={{ animationDelay: "240ms" }}
              >
                <ShineButton to="/login">Open the dashboard</ShineButton>
                <Button asChild size="lg" variant="outline">
                  <Link to="/events">See live events</Link>
                </Button>
              </div>
            </div>

            <div className="em-in" style={{ animationDelay: "200ms" }}>
              <ModuleDeck />
            </div>
          </section>
        </div>

        <div className="-mx-6 overflow-hidden border-y bg-card/60 py-3">
          <div
            className="flex w-max gap-8 whitespace-nowrap text-xs font-medium uppercase tracking-widest text-muted-foreground"
            style={{ animation: "em-marquee 30s linear infinite" }}
          >
            {[...EVENT_TYPES, ...EVENT_TYPES].map((label, i) => (
              <span key={i} className="flex items-center gap-8">
                {label}
                <span className="text-primary">•</span>
              </span>
            ))}
          </div>
        </div>

        <section className="grid gap-4 py-12 md:grid-cols-3">
          {[
            { icon: CalendarCheck2, title: "Every event, one place", body: "Create events, publish schedules, and manage sessions and speakers without stitching tools together.", stat: "0 spreadsheets" },
            { icon: Users2, title: "Registration that scales", body: "Configure ticket tiers, take public registrations, and check in attendees with a QR scan.", stat: "98% scan success" },
            { icon: Sparkles, title: "Answers, not spreadsheets", body: "Real-time attendance, check-in rate, and revenue mix — no CSV gymnastics required.", stat: "Live from minute one" },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
            >
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-primary">
                {f.stat}
              </p>
            </div>
          ))}
        </section>

        <section className="relative overflow-hidden rounded-2xl border bg-card px-8 py-12 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(400px circle at 50% 0%, hsl(var(--primary) / 0.12), transparent 60%)" }}
          />
          <h2 className="relative text-2xl font-semibold tracking-tight md:text-3xl">
            Ready to run the show?
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Set up your first event in minutes. No spreadsheets, no tab explosion.
          </p>
          <div className="relative mt-6 flex justify-center">
            <ShineButton to="/login">Open the dashboard</ShineButton>
          </div>
        </section>
      </main>
    </div>
  );
}