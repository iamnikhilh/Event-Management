import { Link } from "@tanstack/react-router";
import { PublicAmbientBackground, PublicMotionStyles } from "@/components/public/public-motion";

export function AuthLayout({
  children,
  quote,
  attribution,
}: {
  children: React.ReactNode;
  quote: string;
  attribution?: string;
}) {
  return (
    <div className="relative grid min-h-screen md:grid-cols-2">
      <PublicMotionStyles />
      <PublicAmbientBackground />

      <div className="relative hidden flex-col justify-between overflow-hidden border-r bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-12 text-primary-foreground md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)",
          }}
        />
        <Link to="/" className="relative flex items-center gap-3">
          <img src="/logo.svg" alt="EventMatrix" className="h-12 w-12 object-contain invert" />
          <div>
            <span className="text-lg font-bold">EventMatrix</span>
            <p className="text-xs opacity-80">Plan • Manage • Succeed</p>
          </div>
        </Link>
        <blockquote className="relative max-w-md">
          <p className="text-2xl font-semibold leading-snug md:text-3xl">&ldquo;{quote}&rdquo;</p>
          {attribution && (
            <footer className="mt-4 text-sm opacity-80">— {attribution}</footer>
          )}
        </blockquote>
        <p className="relative text-xs opacity-60">© {new Date().getFullYear()} EventMatrix</p>
      </div>

      <div className="relative flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <img src="/logo.svg" alt="EventMatrix" className="h-10 w-10 object-contain" />
            <span className="font-semibold">EventMatrix</span>
          </div>
          <div className="rounded-2xl border bg-card/90 p-8 shadow-xl shadow-primary/5 backdrop-blur-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
