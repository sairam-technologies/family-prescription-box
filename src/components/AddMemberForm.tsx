"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";

export function AddMemberForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    relationship: "",
    dateOfBirth: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add member");
      }

      setForm({ name: "", relationship: "", dateOfBirth: "" });
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="secondary">
        <UserPlus className="h-4 w-4" />
        Add Family Member
      </Button>
    );
  }

  return (
    <Card className="relative">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Add Family Member
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Priya Sharma"
            required
          />
        </div>
        <div>
          <Label htmlFor="relationship">Relationship</Label>
          <Input
            id="relationship"
            value={form.relationship}
            onChange={(e) =>
              setForm({ ...form, relationship: e.target.value })
            }
            placeholder="e.g. Mother, Father, Child"
          />
        </div>
        <div>
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) =>
              setForm({ ...form, dateOfBirth: e.target.value })
            }
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Adding..." : "Add Member"}
        </Button>
      </form>
    </Card>
  );
}
