"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Pill } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("code")?.trim().toUpperCase() ?? "";

  const [mode, setMode] = useState<"create" | "join">(
    inviteFromUrl ? "join" : "create"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    familyName: "",
    inviteCode: inviteFromUrl,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          familyName: mode === "create" ? form.familyName : undefined,
          inviteCode: mode === "join" ? form.inviteCode : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.push(
        `/login?registered=1${mode === "create" && data.inviteCode ? `&inviteCode=${encodeURIComponent(data.inviteCode)}` : ""}`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
            mode === "create"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
          )}
        >
          New family
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
            mode === "join"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
          )}
        >
          Join family
        </button>
      </div>

      {inviteFromUrl && mode === "join" && (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
          You&apos;ve been invited to join a family. The invite code is pre-filled
          below.
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              minLength={6}
              required
            />
          </div>

          {mode === "create" ? (
            <div>
              <Label htmlFor="familyName">Family name</Label>
              <Input
                id="familyName"
                value={form.familyName}
                onChange={(e) =>
                  setForm({ ...form, familyName: e.target.value })
                }
                placeholder="e.g. Sharma Family"
                required
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="inviteCode">Family invite code</Label>
              <Input
                id="inviteCode"
                value={form.inviteCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inviteCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g. ABC12XYZ"
                className="font-mono uppercase"
                required
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-2xl bg-teal-600 p-3">
            <Pill className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="mt-2 text-slate-600">
            Start a new family or join with an invite link
          </p>
        </div>

        <Suspense fallback={<Card className="h-96 animate-pulse bg-slate-50" />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
