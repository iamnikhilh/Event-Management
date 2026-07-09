import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { publicApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui-blocks";
import { EventCard } from "@/components/public/event-card";
import { PublicHeader } from "@/components/public/public-header";
import { PublicAmbientBackground, PublicMotionStyles } from "@/components/public/public-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Sparkles, Ticket } from "lucide-react";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Browse events — EventMatrix" },
      { name: "description", content: "Discover upcoming conferences, meetups, and festivals." },
      { property: "og:title", content: "Browse events — EventMatrix" },
      { property: "og:description", content: "Find and register for upcoming events." },
    ],
  }),
  component: PublicEvents,
});

function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function PublicEvents() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const q = useQuery({
    queryKey: ["public", "events", { page, search: debouncedSearch }],
    queryFn: () =>
      publicApi.events({ page, limit: 12, search: debouncedSearch || undefined }),
  });

  const totalItems = q.data?.pagination.totalItems ?? 0;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <PublicMotionStyles />
      <PublicAmbientBackground />
      <PublicHeader showBrowseEvents />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        {/* Hero */}
        <section className="em-in py-12 md:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {q.isLoading ? "Loading events…" : `${totalItems} event${totalItems === 1 ? "" : "s"} to explore`}
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Discover events
              <span className="block text-primary">worth showing up for</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Conferences, festivals, meetups — find your next experience and register in seconds.
            </p>
          </div>

          <div className="em-in relative mx-auto mt-8 max-w-xl" style={{ animationDelay: "100ms" }}>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 rounded-full border-border/80 bg-card/80 pl-11 pr-4 text-base shadow-sm backdrop-blur-sm transition-shadow focus-visible:shadow-md focus-visible:shadow-primary/10"
              placeholder="Search by title, venue, or city…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </section>

        {/* Grid */}
        {q.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {q.data && q.data.items.length === 0 && (
          <EmptyState
            title="No events found"
            description={
              debouncedSearch
                ? `Nothing matched "${debouncedSearch}". Try a different search.`
                : "Check back soon — new events are added regularly."
            }
          />
        )}

        {q.data && q.data.items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {q.data.items.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {q.data && q.data.pagination.totalPages > 1 && (
          <div className="em-in mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Page {q.data.pagination.page} of {q.data.pagination.totalPages}
              <span className="mx-2 text-border">·</span>
              {q.data.pagination.totalItems} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page >= q.data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Bottom CTA strip */}
        <section
          className="em-in relative mt-16 overflow-hidden rounded-2xl border bg-card/80 p-8 text-center backdrop-blur-sm md:p-10"
          style={{ animationDelay: "200ms" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(500px circle at 50% 0%, color-mix(in oklch, var(--primary) 15%, transparent), transparent 60%)",
            }}
          />
          <Ticket className="relative mx-auto h-8 w-8 text-primary" />
          <h2 className="relative mt-4 text-xl font-semibold md:text-2xl">
            Running your own event?
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create, sell tickets, and manage attendees from one dashboard.
          </p>
          <Button asChild className="relative mt-6 rounded-full shadow-sm shadow-primary/20">
            <Link to="/login">Get started free</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
