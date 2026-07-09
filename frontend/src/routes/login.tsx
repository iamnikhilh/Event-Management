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
import { AuthLayout } from "@/components/auth/auth-layout";
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
    <AuthLayout
      quote="EventMatrix replaced four tools and a shared spreadsheet."
      attribution="Nikhil S H, Head of Community"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to your organizer dashboard.
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="h-11 rounded-xl"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-11 rounded-xl"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        {error && status === "error" && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        <Button
          type="submit"
          className="h-11 w-full rounded-full"
          disabled={status === "loading"}
        >
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
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
        <p>
          Just browsing?{" "}
          <Link to="/events" className="font-medium text-primary hover:underline">
            Explore public events
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
