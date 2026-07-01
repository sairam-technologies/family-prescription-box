"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Stethoscope,
  Building2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { PrescriptionImage } from "@/components/PrescriptionImage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  FamilyMedicineMatch,
  MedicineValidation,
} from "@/lib/ai/parse";

interface PrescriptionListItemProps {
  id: string;
  imageUrl: string;
  doctorName?: string | null;
  clinicName?: string | null;
  prescriptionDate?: string | null;
  scanStatus: string;
  memberName: string;
  medicines: Array<{ id?: string; name: string }>;
}

export function PrescriptionListItem({
  id,
  imageUrl,
  doctorName,
  clinicName,
  prescriptionDate,
  scanStatus,
  memberName,
  medicines,
}: PrescriptionListItemProps) {
  const statusColors = {
    COMPLETED: "bg-green-100 text-green-700",
    PROCESSING: "bg-amber-100 text-amber-700",
    PENDING: "bg-slate-100 text-slate-600",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <Link href={`/prescriptions/${id}`} className="block min-w-0">
      <Card className="group flex min-w-0 gap-3 transition-all hover:border-teal-200 hover:shadow-md sm:gap-4">
        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-20 sm:w-16">
          <PrescriptionImage
            src={imageUrl}
            alt="Prescription"
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <div className="min-w-0">
              <CardTitle className="line-clamp-2 group-hover:text-teal-700">
                {doctorName || "Unknown Doctor"}
              </CardTitle>
              <p className="truncate text-sm text-teal-600">{memberName}</p>
            </div>
            <span
              className={cn(
                "w-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                statusColors[scanStatus as keyof typeof statusColors] ||
                  statusColors.PENDING
              )}
            >
              {scanStatus.toLowerCase()}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            {clinicName && (
              <span className="flex min-w-0 max-w-full items-start gap-1 break-words">
                <Building2 className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="min-w-0 break-words">{clinicName}</span>
              </span>
            )}
            <span className="flex shrink-0 items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(prescriptionDate)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {medicines.length > 0 ? (
              medicines.map((med, index) => (
                <span
                  key={med.id ?? `${med.name}-${index}`}
                  className="max-w-full break-words rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700"
                >
                  {med.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No medicines extracted</span>
            )}
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
  validations?: MedicineValidation[];
  familyMatches?: FamilyMedicineMatch[];
  prescriptionId?: string;
  editable?: boolean;
}

const validationStyles = {
  verified: {
    badge: "bg-green-100 text-green-800",
    icon: CheckCircle2,
    label: "Verified",
  },
  likely_correct: {
    badge: "bg-teal-100 text-teal-800",
    icon: CheckCircle2,
    label: "Likely correct",
  },
  uncertain: {
    badge: "bg-amber-100 text-amber-800",
    icon: HelpCircle,
    label: "Uncertain",
  },
  possible_ocr_error: {
    badge: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    label: "Possible misread",
  },
  unusual_for_diagnosis: {
    badge: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
    label: "Unusual for diagnosis",
  },
} as const;

function findValidation(
  validations: MedicineValidation[] | undefined,
  medicineName: string
) {
  if (!validations?.length) return undefined;
  const exact = validations.find(
    (validation) =>
      validation.name.toLowerCase() === medicineName.toLowerCase()
  );
  if (exact) return exact;

  return validations.find((validation) => {
    const a = validation.name.toLowerCase();
    const b = medicineName.toLowerCase();
    return a.includes(b) || b.includes(a);
  });
}

function findFamilyMatches(
  matches: FamilyMedicineMatch[] | undefined,
  medicineName: string
) {
  if (!matches?.length) return [];

  return matches.filter((match) => {
    const a = match.medicineName.toLowerCase();
    const b = medicineName.toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
  });
}

export function MedicineList({
  medicines,
  validations,
  familyMatches,
  prescriptionId,
  editable = false,
}: MedicineListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const canEdit = editable && !!prescriptionId;

  async function saveMedicineName(medicineId: string, name: string) {
    if (!prescriptionId) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setSaveError("Medicine name cannot be empty");
      return;
    }

    setSavingId(medicineId);
    setSaveError("");
    try {
      const res = await fetch(`/api/medicines/${medicineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to save medicine name");
        return;
      }
      setEditingId(null);
      setEditName("");
      router.refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function addMedicine() {
    if (!prescriptionId) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      setSaveError("Medicine name cannot be empty");
      return;
    }

    setAdding(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}/medicines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to add medicine");
        return;
      }
      setNewName("");
      setShowAddForm(false);
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  function startEditing(medicineId: string, currentName: string) {
    setEditingId(medicineId);
    setEditName(currentName);
    setSaveError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setSaveError("");
  }

  const addMedicineForm = canEdit && (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      {showAddForm || medicines.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {medicines.length === 0
              ? "No medicines detected — enter manually"
              : "Add another medicine"}
          </p>
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Medicine name, e.g. Kenz-Sal Lotion"
            onKeyDown={(event) => {
              if (event.key === "Enter") void addMedicine();
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void addMedicine()} disabled={adding}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add medicine
            </Button>
            {medicines.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setSaveError("");
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setShowAddForm(true);
            setSaveError("");
          }}
        >
          <Plus className="h-4 w-4" />
          Add medicine manually
        </Button>
      )}
    </div>
  );

  if (medicines.length === 0) {
    return (
      <div className="space-y-3">
        <Card className="flex items-center gap-3 text-slate-500">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">No medicines extracted yet</p>
        </Card>
        {addMedicineForm}
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {saveError && editingId === null && !showAddForm && (
        <p className="text-sm text-red-600">{saveError}</p>
      )}
      {medicines.map((med, i) => {
        const validation = findValidation(validations, med.name);
        const matches = findFamilyMatches(familyMatches, med.name);
        const style = validation
          ? validationStyles[validation.status]
          : null;
        const StatusIcon = style?.icon;
        const isEditing = editingId === med.id;
        const isSaving = savingId === med.id;

        return (
          <Card key={med.id} className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-700">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    placeholder="Correct medicine name"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void saveMedicineName(med.id, editName);
                      }
                      if (event.key === "Escape") cancelEditing();
                    }}
                  />
                  {saveError && (
                    <p className="text-sm text-red-600">{saveError}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void saveMedicineName(med.id, editName)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words font-semibold text-slate-900">{med.name}</p>
                    {validation && style && StatusIcon && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          style.badge
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {style.label}
                      </span>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => startEditing(med.id, med.name)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit name
                      </button>
                    )}
                  </div>

                  {validation && (
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      {validation.knownBrand &&
                        validation.knownBrand.toLowerCase() !==
                          med.name.toLowerCase() && (
                          <p>
                            Known as:{" "}
                            <span className="font-medium text-slate-800">
                              {validation.knownBrand}
                            </span>
                          </p>
                        )}
                      {validation.genericName && (
                        <p>
                          Generic:{" "}
                          <span className="font-medium text-slate-800">
                            {validation.genericName}
                          </span>
                        </p>
                      )}
                      {validation.suggestedName && (
                        <div className="flex flex-wrap items-center gap-2 text-red-700">
                          <span>
                            Did you mean{" "}
                            <span className="font-medium">
                              {validation.suggestedName}
                            </span>
                            ?
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                void saveMedicineName(
                                  med.id,
                                  validation.suggestedName!
                                )
                              }
                              disabled={isSaving}
                              className="rounded-lg bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 hover:bg-red-200"
                            >
                              Use this name
                            </button>
                          )}
                        </div>
                      )}
                      {validation.note && (
                        <p className="text-slate-500">{validation.note}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    {med.dosage && <span>Dosage: {med.dosage}</span>}
                    {med.frequency && <span>Frequency: {med.frequency}</span>}
                    {med.duration && <span>Duration: {med.duration}</span>}
                  </div>
                  {med.instructions && (
                    <p className="mt-1 text-sm text-slate-500">
                      {med.instructions}
                    </p>
                  )}

                  {matches.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Family history
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-600">
                        {matches.slice(0, 3).map((match) => (
                          <li
                            key={`${match.prescriptionId}-${match.medicineName}`}
                          >
                            <Link
                              href={`/prescriptions/${match.prescriptionId}`}
                              className="text-teal-700 hover:underline"
                            >
                              {match.medicineName}
                            </Link>{" "}
                            prescribed for {match.memberName}
                            {match.diagnosis ? ` (${match.diagnosis})` : ""}
                            {match.prescriptionDate
                              ? ` · ${formatDate(match.prescriptionDate)}`
                              : ""}
                            {match.sameDiagnosisContext && (
                              <span className="ml-1 text-xs text-teal-700">
                                · same condition
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        );
      })}
      {addMedicineForm}
      {saveError && (showAddForm || medicines.length === 0) && (
        <p className="text-sm text-red-600">{saveError}</p>
      )}
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
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-slate-500">
              Doctor
            </p>
            <p className="font-medium break-words text-slate-900">
              {doctorName || "Not detected"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 text-teal-600" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-slate-500">
              Clinic
            </p>
            <p className="font-medium break-words text-slate-900">
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
          <p className="mt-1 break-words text-slate-700">{diagnosis}</p>
        </div>
      )}
    </Card>
  );
}
