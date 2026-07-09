import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface PublicHeaderProps {
  backTo?: { label: string; to: string };
}

export function PublicHeader({ backTo }: PublicHeaderProps) {
  return (
    <header className="relative z-10 border-b border-border/60 bg-card/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="group flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="EventMatrix"
            className="h-11 w-11 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">EventMatrix</span>
            <span className="text-[11px] text-muted-foreground">Plan • Manage • Succeed</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {backTo ? (
            <Button asChild size="sm" variant="ghost">
              <Link to={backTo.to}>{backTo.label}</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link to="/">Home</Link>
            </Button>
          )}
          <Button asChild size="sm" className="shadow-sm shadow-primary/20">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
