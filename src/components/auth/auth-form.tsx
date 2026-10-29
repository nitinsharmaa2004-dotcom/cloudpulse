"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { apiFetch, ClientApiError } from "@/lib/client";
import { loginSchema, signupSchema } from "@/lib/validation";

type Mode = "login" | "signup";
type Errors = Partial<Record<"name" | "email" | "password" | "company" | "form", string>>;

const DEMO = { email: "demo@cloudpulse.dev", password: "Demo@1234" };

function safeNext(next: string | null) {
  return next && next.startsWith("/dashboard") && !next.startsWith("//") ? next : "/dashboard";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const [values, setValues] = useState({
    name: "",
    company: "",
    email: mode === "login" && isDemo ? DEMO.email : "",
    password: mode === "login" && isDemo ? DEMO.password : "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key as keyof Errors]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function submit(payload: typeof values) {
    const schema = mode === "login" ? loginSchema : signupSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await apiFetch(`/api/auth/${mode}`, { method: "POST", json: parsed.data });
      toast.success(mode === "login" ? "Welcome back!" : "Workspace created — your demo AWS account is ready.");
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch (error) {
      const message = error instanceof ClientApiError ? error.message : "Something went wrong";
      if (error instanceof ClientApiError && error.code === "EMAIL_TAKEN") setErrors({ email: message });
      else setErrors({ form: message });
      setLoading(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit(values);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{mode === "login" ? "Welcome back" : "Create your workspace"}</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {mode === "login" ? "Sign in to monitor and optimize your cloud spend." : "Start your 14-day Pro trial. No credit card required."}
      </p>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => {
            const demo = { ...values, ...DEMO };
            setValues(demo);
            void submit(demo);
          }}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/60 px-4 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/[0.06] dark:text-brand-300 dark:hover:bg-brand-500/10"
        >
          <Sparkles className="h-4 w-4" /> Continue with demo account
        </button>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {errors.form && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {errors.form}
          </div>
        )}
        {mode === "signup" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" autoComplete="name" value={values.name} onChange={update("name")} invalid={!!errors.name} placeholder="Jane Cooper" />
              <FieldError message={errors.name} />
            </div>
            <div>
              <Label htmlFor="company">Company <span className="text-zinc-400">(optional)</span></Label>
              <Input id="company" autoComplete="organization" value={values.company} onChange={update("company")} placeholder="Acme Inc." />
            </div>
          </div>
        )}
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" autoComplete="email" value={values.email} onChange={update("email")} invalid={!!errors.email} placeholder="you@company.com" />
          <FieldError message={errors.email} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <button type="button" onClick={() => toast.info("Password reset emails are disabled in demo mode.")} className="mb-1.5 text-xs text-brand-600 hover:underline dark:text-brand-400">
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={values.password}
              onChange={update("password")}
              invalid={!!errors.password}
              placeholder={mode === "signup" ? "8+ chars, upper, lower & number" : "••••••••"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {mode === "login" ? (
          <>
            New to CloudPulse?{" "}
            <Link href="/signup" className="font-medium text-zinc-900 hover:underline dark:text-white">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-white">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
