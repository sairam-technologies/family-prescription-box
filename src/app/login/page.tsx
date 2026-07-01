"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Pill } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import {
  ACCESS_DENIED_ERROR_CODE,
  ACCESS_DENIED_MESSAGE,
} from "@/lib/auth-access";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const urlError =
    searchParams.get("error") === ACCESS_DENIED_ERROR_CODE
      ? ACCESS_DENIED_MESSAGE
      : "";
  const error = submitError || urlError;
  const registered = searchParams.get("registered") === "1";
  const passwordReset = searchParams.get("reset") === "1";
  const inviteCode = searchParams.get("inviteCode");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      if (
        result.error === ACCESS_DENIED_ERROR_CODE ||
        result.error === ACCESS_DENIED_MESSAGE
      ) {
        setSubmitError(ACCESS_DENIED_MESSAGE);
      } else {
        setSubmitError("Invalid email or password");
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      {registered && (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
          <p className="font-medium">Account created</p>
          <p className="mt-1">
            {ACCESS_DENIED_MESSAGE} before you can sign in.
          </p>
          {inviteCode && (
            <p className="mt-3">
              Family invite code:{" "}
              <span className="font-mono text-base font-bold">{inviteCode}</span>
            </p>
          )}
        </div>
      )}
      {passwordReset && (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
          <p className="font-medium">Password updated</p>
          <p className="mt-1">Sign in with your new password.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-teal-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-teal-600 hover:underline">
          Create one
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-teal-600 p-3">
            <Pill className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-600">
            Sign in to your family prescription dashboard
          </p>
        </div>

        <Suspense fallback={<Card className="h-64 animate-pulse bg-slate-50" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
