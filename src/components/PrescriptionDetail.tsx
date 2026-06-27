"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MedicineList, PrescriptionMeta } from "@/components/Prescription";
import { PrescriptionImage } from "@/components/PrescriptionImage";

interface PrescriptionDetailProps {
  prescription: {
    id: string;
    imageUrl: string;
    doctorName?: string | null;
    clinicName?: string | null;
    prescriptionDate?: string | null;
    diagnosis?: string | null;
    notes?: string | null;
    scanStatus: string;
    familyMember: {
      id: string;
      name: string;
      relationship?: string | null;
    };
    medicines: Array<{
      id: string;
      name: string;
      dosage?: string | null;
      frequency?: string | null;
      duration?: string | null;
      instructions?: string | null;
    }>;
  };
}

export function PrescriptionDetail({ prescription }: PrescriptionDetailProps) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function rescan() {
    setScanning(true);
    try {
      await fetch(`/api/prescriptions/${prescription.id}`, { method: "POST" });
      router.refresh();
    } finally {
      setScanning(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this prescription? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/prescriptions/${prescription.id}`, {
        method: "DELETE",
      });
      router.push(`/members/${prescription.familyMember.id}`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <Link
        href={`/members/${prescription.familyMember.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {prescription.familyMember.name}
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Prescription Details
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={rescan}
            disabled={scanning}
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-scan with AI
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[3/4] w-full bg-slate-100">
              <PrescriptionImage
                src={prescription.imageUrl}
                alt="Prescription"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <PrescriptionMeta
            doctorName={prescription.doctorName}
            clinicName={prescription.clinicName}
            prescriptionDate={prescription.prescriptionDate}
            diagnosis={prescription.diagnosis}
            memberName={prescription.familyMember.name}
          />

          {prescription.notes && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium uppercase text-slate-500">
                Notes
              </p>
              <p className="mt-1 text-slate-700">{prescription.notes}</p>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Medicines ({prescription.medicines.length})
            </h2>
            <MedicineList medicines={prescription.medicines} />
          </div>
        </div>
      </div>
    </div>
  );
}
