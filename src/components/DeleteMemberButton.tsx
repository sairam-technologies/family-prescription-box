"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DeleteMemberButtonProps {
  memberId: string;
  memberName: string;
  variant?: "icon" | "button";
  redirectTo?: string;
}

export function DeleteMemberButton({
  memberId,
  memberName,
  variant = "icon",
  redirectTo = "/dashboard",
}: DeleteMemberButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();

    const confirmed = confirm(
      `Delete ${memberName}? All their prescriptions will be permanently removed.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete member");
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete member");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "button") {
    return (
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Delete member
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      aria-label={`Delete ${memberName}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
