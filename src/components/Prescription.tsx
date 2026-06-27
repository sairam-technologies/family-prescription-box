"use client";

import Link from "next/link";
import { Calendar, Stethoscope, Building2, AlertCircle } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { PrescriptionImage } from "@/components/PrescriptionImage";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PrescriptionListItemProps {
  id: string;
  imageUrl: string;
  doctorName?: string | null;
  clinicName?: string | null;
  prescriptionDate?: string | null;
  scanStatus: string;
  memberName: string;
  medicineCount: number;
}

export function PrescriptionListItem({
  id,
  imageUrl,
  doctorName,
  clinicName,
  prescriptionDate,
  scanStatus,
  memberName,
  medicineCount,
}: PrescriptionListItemProps) {
  const statusColors = {
    COMPLETED: "bg-green-100 text-green-700",
    PROCESSING: "bg-amber-100 text-amber-700",
    PENDING: "bg-slate-100 text-slate-600",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <Link href={`/prescriptions/${id}`}>
      <Card className="group flex gap-4 transition-all hover:border-teal-200 hover:shadow-md">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <PrescriptionImage
            src={imageUrl}
            alt="Prescription"
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="group-hover:text-teal-700">
                {doctorName || "Unknown Doctor"}
              </CardTitle>
              <p className="text-sm text-teal-600">{memberName}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                statusColors[scanStatus as keyof typeof statusColors] ||
                  statusColors.PENDING
              )}
            >
              {scanStatus.toLowerCase()}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            {clinicName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {clinicName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(prescriptionDate)}
            </span>
            <span>{medicineCount} medicines</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface MedicineListProps {
  medicines: Array<{
    id: string;
    name: string;
    dosage?: string | null;
    frequency?: string | null;
    duration?: string | null;
    instructions?: string | null;
  }>;
}

export function MedicineList({ medicines }: MedicineListProps) {
  if (medicines.length === 0) {
    return (
      <Card className="flex items-center gap-3 text-slate-500">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">No medicines extracted yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {medicines.map((med, i) => (
        <Card key={med.id} className="flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-700">
            {i + 1}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{med.name}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {med.dosage && <span>Dosage: {med.dosage}</span>}
              {med.frequency && <span>Frequency: {med.frequency}</span>}
              {med.duration && <span>Duration: {med.duration}</span>}
            </div>
            {med.instructions && (
              <p className="mt-1 text-sm text-slate-500">{med.instructions}</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function PrescriptionMeta({
  doctorName,
  clinicName,
  prescriptionDate,
  diagnosis,
  memberName,
}: {
  doctorName?: string | null;
  clinicName?: string | null;
  prescriptionDate?: string | null;
  diagnosis?: string | null;
  memberName: string;
}) {
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <Stethoscope className="mt-0.5 h-5 w-5 text-teal-600" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">
              Doctor
            </p>
            <p className="font-medium text-slate-900">
              {doctorName || "Not detected"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 text-teal-600" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">
              Clinic
            </p>
            <p className="font-medium text-slate-900">
              {clinicName || "Not detected"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 text-teal-600" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Date</p>
            <p className="font-medium text-slate-900">
              {formatDate(prescriptionDate)}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            Patient
          </p>
          <p className="font-medium text-slate-900">{memberName}</p>
        </div>
      </div>
      {diagnosis && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase text-slate-500">
            Diagnosis
          </p>
          <p className="mt-1 text-slate-700">{diagnosis}</p>
        </div>
      )}
    </Card>
  );
}
