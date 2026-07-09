import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppProviders } from "../lib/providers";
import { Toaster } from "@/components/ui/sonner";


function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background to-secondary/30 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-secondary/40 blur-3xl" />
      </div>
      <div className="relative max-w-md text-center">
        <p className="text-8xl font-bold tracking-tighter text-primary/20">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Browse events
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-background to-secondary/30 px-4">
      <div className="relative max-w-md text-center">
        <p className="text-6xl font-bold text-destructive/20">!</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          This page didn&apos;t load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EventMatrix — Event Management Dashboard" },
      {
        name: "description",
        content:
          "Plan, publish, and run events end-to-end — sessions, speakers, sponsors, tickets, and attendee check-in.",
      },
      { name: "author", content: "EventMatrix" },
      { property: "og:title", content: "EventMatrix — Event Management Dashboard" },
      {
        property: "og:description",
        content: "The modern control room for conferences, meetups, and festivals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },

    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster richColors position="top-right" />
      </AppProviders>
    </QueryClientProvider>
  );
}

