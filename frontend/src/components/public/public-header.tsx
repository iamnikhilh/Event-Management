import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  backTo?: { label: string; to: string };
  showBrowseEvents?: boolean;
  large?: boolean;
  hideOnScroll?: boolean;
}

export function PublicHeader({
  backTo,
  showBrowseEvents = false,
  large = false,
  hideOnScroll = false,
}: PublicHeaderProps) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!hideOnScroll) return;

    const onScroll = () => {
      const y = window.scrollY;
      if (y < 64) {
        setVisible(true);
      } else if (y > lastScrollY.current + 8) {
        setVisible(false);
      } else if (y < lastScrollY.current - 8) {
        setVisible(true);
      }
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnScroll]);

  return (
    <header
      style={
        hideOnScroll
          ? {
              transition:
                "transform 0.75s cubic-bezier(0.4, 0, 0.2, 1), opacity 1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.75s ease",
            }
          : undefined
      }
      className={cn(
        "sticky top-0 z-50 border-b border-border/60",
        "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
        "shadow-sm shadow-black/5",
        hideOnScroll && "will-change-[transform,opacity]",
        hideOnScroll && !visible && "-translate-y-full opacity-0 pointer-events-none",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="EventMatrix"
            className={cn(
              "object-contain transition-transform duration-300 group-hover:scale-105",
              large ? "h-14 w-14 md:h-16 md:w-16" : "h-11 w-11",
            )}
          />
          <div className="flex flex-col">
            <span
              className={cn(
                "font-bold tracking-tight",
                large ? "text-xl" : "text-lg",
              )}
            >
              EventMatrix
            </span>
            <span className="text-[11px] text-muted-foreground">
              Plan • Manage • Succeed
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {showBrowseEvents && (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/events">Browse events</Link>
            </Button>
          )}
          {backTo ? (
            <Button asChild size="sm" variant="ghost" className="rounded-full">
              <Link to={backTo.to}>{backTo.label}</Link>
            </Button>
          ) : !showBrowseEvents ? (
            <Button asChild size="sm" variant="ghost" className="rounded-full">
              <Link to="/">Home</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" className="rounded-full shadow-sm shadow-primary/20">
            <Link to="/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
