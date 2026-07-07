import { type ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAppSelector } from "@/store/hooks";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, hydrated } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (hydrated && status === "unauthenticated") {
      navigate({
        to: "/login",
        search: { redirect: loc.pathname + loc.searchStr },
        replace: true,
      });
    }
  }, [hydrated, status, navigate, loc.pathname, loc.searchStr]);

  if (!hydrated || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (status !== "authenticated") return null;
  return <>{children}</>;
}
