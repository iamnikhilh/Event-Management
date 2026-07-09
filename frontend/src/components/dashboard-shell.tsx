import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ExternalLink,
  Home,
  LogOut,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/auth-slice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PublicAmbientBackground, PublicMotionStyles } from "@/components/public/public-motion";

const nav = [
  { to: "/dashboard", label: "Overview", icon: Home, exact: true },
  { to: "/dashboard/events", label: "Events", icon: CalendarDays },
  { to: "/dashboard/speakers", label: "Speakers", icon: Mic },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const initials = (user?.firstName?.[0] || user?.email?.[0] || "?").toUpperCase();
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email;

  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname.startsWith(to);

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <PublicMotionStyles />
      <PublicAmbientBackground />

      <aside className="relative z-10 hidden w-64 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5">
          <img src="/logo.svg" alt="EventMatrix" className="h-9 w-9 object-contain" />
          <div>
            <span className="font-semibold tracking-tight">EventMatrix</span>
            <p className="text-[10px] text-muted-foreground">Organizer dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{displayName}</div>
              <div className="truncate text-xs capitalize text-muted-foreground">
                {user?.role}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={async () => {
                await dispatch(logout());
                navigate({ to: "/login" });
              }}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card/70 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <img src="/logo.svg" alt="EventMatrix" className="h-8 w-8 object-contain" />
            <span className="font-semibold">EventMatrix</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/events">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Public site
              </Link>
            </Button>
            <Button asChild size="icon" variant="ghost" className="rounded-full">
              <Link to="/dashboard/notifications">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>

        <nav className="sticky bottom-0 grid grid-cols-5 border-t border-border/60 bg-card/90 backdrop-blur-xl md:hidden">
          {nav.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
