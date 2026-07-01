"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PrescriptionImage } from "@/components/PrescriptionImage";
import { formatDate } from "@/lib/utils";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/record-labels";

interface DocumentDetailProps {
  document: {
    id: string;
    title?: string | null;
    category: string;
    fileUrl: string;
    fileName?: string | null;
    mimeType?: string | null;
    notes?: string | null;
    createdAt?: string | null;
    familyMember: { id: string; name: string };
  };
}

export function DocumentDetail({ document }: DocumentDetailProps) {
  const router = useRouter();
  const isPdf =
    document.mimeType === "application/pdf" ||
    document.fileUrl.endsWith(".pdf");

  async function handleDelete() {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
    router.push(`/documents?memberId=${document.familyMember.id}`);
    router.refresh();
  }

  return (
    <div>
      <Link
        href={`/documents?memberId=${document.familyMember.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to documents
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {document.title || "Document"}
          </h1>
          <p className="mt-1 text-slate-500">
            {document.familyMember.name} ·{" "}
            {DOCUMENT_CATEGORY_LABELS[document.category] ?? document.category} ·{" "}
            {formatDate(document.createdAt)}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          {isPdf ? (
            <iframe
              src={document.fileUrl}
              title={document.title || "Document"}
              className="h-[70vh] w-full"
            />
          ) : (
            <div className="relative aspect-[3/4] w-full bg-slate-100">
              <PrescriptionImage
                src={document.fileUrl}
                alt={document.title || "Document"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {document.fileName && (
            <Card>
              <p className="text-xs font-medium uppercase text-slate-500">File</p>
              <p className="mt-1 text-slate-700">{document.fileName}</p>
            </Card>
          )}
          {document.notes && (
            <Card>
              <p className="text-xs font-medium uppercase text-slate-500">Notes</p>
              <p className="mt-1 text-slate-700">{document.notes}</p>
            </Card>
          )}
          <Card className="bg-slate-50">
            <p className="text-sm text-slate-600">
              Stored as a family document only — no AI processing is applied to
              bills, invoices, or other non-prescription files.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
