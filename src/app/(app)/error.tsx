"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDb =
    error.message.includes("does not exist") ||
    error.message.includes("P2021") ||
    error.message.includes("MemberDocument") ||
    error.message.includes("MedicalReport");

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900">
          {isDb ? "Database setup required" : "Something went wrong"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {isDb
            ? "New document and report tables need to be added to your database. Run npx prisma db push against your Neon database, then refresh."
            : "This page failed to load. Please try again."}
        </p>
        {!isDb && process.env.NODE_ENV === "development" && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-red-700">
            {error.message}
          </pre>
        )}
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
