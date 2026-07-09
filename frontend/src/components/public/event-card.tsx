import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EventItem } from "@/lib/types";
import {
  eventGradient,
  formatEventDate,
  formatEventTime,
  statusLabel,
  STATUS_STYLES,
} from "./event-utils";

type PublicEventCard = EventItem & {
  bannerImage?: string | null;
  category?: { id: string; name: string };
  capacity?: number;
};

export function EventCard({ event, index = 0 }: { event: PublicEventCard; index?: number }) {
  const spotsLeft =
    event.capacity != null ? `${event.capacity} capacity` : null;

  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="em-in group relative flex flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: eventGradient(event.slug) }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {event.category && (
            <Badge className="border-0 bg-white/20 text-white backdrop-blur-md">
              {event.category.name}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`border backdrop-blur-md ${STATUS_STYLES[event.status] ?? STATUS_STYLES.upcoming}`}
          >
            {statusLabel(event.status)}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-semibold leading-tight text-white drop-shadow-sm">
            {event.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {event.description || "Join us for an unforgettable experience."}
        </p>

        <div className="mt-4 space-y-2 border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {formatEventDate(event.eventDate)}
              <span className="text-muted-foreground/70"> · {formatEventTime(event.eventDate)}</span>
            </span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
          {spotsLeft && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <span>{spotsLeft}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm font-medium text-primary">
          <span>View details</span>
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}
