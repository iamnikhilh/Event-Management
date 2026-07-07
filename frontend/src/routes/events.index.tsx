import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { publicApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingBlock, EmptyState } from "@/components/ui-blocks";
import { Calendar, MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Browse events — Eventide" },
      { name: "description", content: "Discover upcoming conferences, meetups, and festivals." },
      { property: "og:title", content: "Browse events — Eventide" },
      { property: "og:description", content: "Find and register for upcoming events." },
    ],
  }),
  component: PublicEvents,
});

function PublicEvents() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["public", "events", { page, search }],
    queryFn: () => publicApi.events({ page, limit: 12, search: search || undefined }),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-semibold">
              E
            </div>
            <span className="font-semibold tracking-tight">Eventide</span>
          </Link>
          <Button asChild size="sm" variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Upcoming events</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Register in seconds. Get in the room.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search events…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
        </div>

        {q.isLoading && <LoadingBlock />}
        {q.data && q.data.items.length === 0 && (
          <EmptyState title="No events found" description="Try a different search." />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.items.map((e) => (
            <Link
              key={e.id}
              to="/events/$slug"
              params={{ slug: e.slug }}
              className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <Badge variant="secondary" className="mb-2">{e.status}</Badge>
              <h3 className="text-lg font-semibold group-hover:text-primary">{e.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {e.description || "No description yet."}
              </p>
              <div className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {new Date(e.eventDate).toLocaleString()}
                </span>
                {e.venue && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {e.venue}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {q.data && q.data.pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {q.data.pagination.page} of {q.data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= q.data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
