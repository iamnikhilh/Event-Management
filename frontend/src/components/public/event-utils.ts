import type { EventStatus } from "@/lib/types";

export const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-primary/15 text-primary border-primary/20",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  completed: "bg-muted text-muted-foreground border-border",
  draft: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export const SPONSOR_TIER_STYLES: Record<string, string> = {
  platinum: "from-slate-400/20 to-slate-600/10 border-slate-400/30",
  gold: "from-amber-400/25 to-amber-600/10 border-amber-400/40",
  silver: "from-zinc-300/25 to-zinc-500/10 border-zinc-400/30",
  bronze: "from-orange-400/20 to-orange-700/10 border-orange-500/30",
};

export function formatEventDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventTime(date: string) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventDateTime(date: string) {
  return `${formatEventDate(date)} · ${formatEventTime(date)}`;
}

export function formatPrice(price: string | number) {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(n)) return price.toString();
  return n === 0 ? "Free" : `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export function statusLabel(status: EventStatus | string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function eventGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, oklch(0.55 0.18 ${hue}) 0%, oklch(0.42 0.14 ${(hue + 40) % 360}) 100%)`;
}
