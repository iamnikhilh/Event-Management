import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Home,
  LogOut,
  Mic,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/auth-slice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname.startsWith(to);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <img src="/logo.svg" alt="EventMatrix" className="h-10 w-10 object-contain" />
          <span className="font-semibold tracking-tight">EventMatrix</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.to, item.exact)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {user?.firstName || user?.email}
              </div>
              <div className="truncate text-xs text-muted-foreground">{user?.role}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
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
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <img src="/logo.svg" alt="EventMatrix" className="h-10 w-10 object-contain" />
            <span className="font-semibold">EventMatrix</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/events">View public site</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/dashboard/notifications">
                <Ticket className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 grid grid-cols-5 border-t bg-card md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs",
                isActive(item.to, item.exact) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
