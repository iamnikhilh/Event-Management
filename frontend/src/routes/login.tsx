import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login } from "@/store/auth-slice";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);
  const authed = useAppSelector((s) => s.auth.status === "authenticated");

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (authed) navigate({ to: redirect || "/dashboard", replace: true });
  }, [authed, redirect, navigate]);

  const onSubmit = async (values: LoginForm) => {
    const res = await dispatch(login(values));
    if (login.rejected.match(res)) {
      toast.error(res.payload || "Login failed");
    } else {
      toast.success("Welcome back");
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-primary via-primary/90 to-accent p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary-foreground text-primary font-semibold">
            E
          </div>
          <span className="font-semibold">Eventide</span>
        </Link>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight">
            "Eventide replaced four tools and a shared spreadsheet."
          </h2>
          <p className="mt-4 text-sm opacity-80">
            — Priya S., Head of Community
          </p>
        </div>
        <div className="text-xs opacity-70">© Eventide</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-semibold">
              E
            </div>
            <span className="font-semibold">Eventide</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your organizer account to continue.
          </p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            {error && status === "error" && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <div className="mt-6 space-y-3 text-center text-xs text-muted-foreground">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
            <p>
              Public event?{" "}
              <Link to="/events" className="text-primary hover:underline">
                Browse without signing in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
