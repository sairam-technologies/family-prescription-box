import type { ScannedMedicine, ScannedPrescription } from "@/types";

export interface ScanResult extends ScannedPrescription {
  medicineTranscription?: string;
  medicineValidations?: MedicineValidation[];
  familyMatches?: FamilyMedicineMatch[];
}

export type MedicineValidationStatus =
  | "verified"
  | "likely_correct"
  | "uncertain"
  | "possible_ocr_error"
  | "unusual_for_diagnosis";

export interface MedicineValidation {
  name: string;
  status: MedicineValidationStatus;
  confidence: number;
  knownBrand?: string;
  genericName?: string;
  suggestedName?: string;
  fitsDiagnosis?: boolean | null;
  note?: string;
}

export interface FamilyMedicineMatch {
  medicineName: string;
  diagnosis?: string | null;
  memberName: string;
  prescriptionId: string;
  prescriptionDate?: string | null;
  sameDiagnosisContext: boolean;
}

export interface TranscriptionResult {
  doctorName?: string | null;
  clinicName?: string | null;
  prescriptionDate?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  medicineTranscription?: string | null;
}

export interface FullExtractResult extends TranscriptionResult {
  medicines?: ScannedMedicine[];
}

export function parseImageInput(imageUrl: string): {
  mimeType: string;
  base64Data: string;
  dataUrl: string;
} {
  const dataUrlMatch = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      base64Data: dataUrlMatch[2],
      dataUrl: imageUrl,
    };
  }

  throw new Error("Unsupported image format for AI scanning");
}

export function parseJsonResponse<T>(content: string): T {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText) as T;
}

/** Gemini and other models sometimes return medicineTranscription as an array. */
export function normalizeTranscription(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item : item != null ? String(item) : ""
      )
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return String(value).trim();
}

function fixCommonOcrInName(name: string): string {
  return name
    .replace(/\blohion\b/gi, "Lotion")
    .replace(/\blotion\b/gi, "Lotion")
    .replace(/\bcream\b/gi, "Cream")
    .replace(/\boinment\b/gi, "Ointment")
    .replace(/\btablet\b/gi, "Tablet")
    .replace(/\bsyrup\b/gi, "Syrup");
}

function normalizeMedicine(med: ScannedMedicine): ScannedMedicine | null {
  const name = fixCommonOcrInName(med.name?.trim() ?? "");
  if (!name || name === "[unclear]" || name.length < 2) return null;
  if (/^(rx|medications?|drugs?)$/i.test(name)) return null;

  return {
    name,
    dosage: med.dosage?.trim() || undefined,
    frequency: med.frequency?.trim() || undefined,
    duration: med.duration?.trim() || undefined,
    instructions: med.instructions?.trim() || undefined,
  };
}

export function dedupeMedicines(medicines: ScannedMedicine[]): ScannedMedicine[] {
  const seen = new Set<string>();
  const result: ScannedMedicine[] = [];

  for (const med of medicines) {
    const normalized = normalizeMedicine(med);
    if (!normalized) continue;

    const key = normalized.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export function toScanResult(
  data: FullExtractResult,
  medicineTranscription: string,
  medicines: ScannedMedicine[],
  extras?: Pick<ScanResult, "medicineValidations" | "familyMatches">
): ScanResult {
  return {
    doctorName: data.doctorName ?? undefined,
    clinicName: data.clinicName ?? undefined,
    prescriptionDate: data.prescriptionDate ?? undefined,
    diagnosis: data.diagnosis ?? undefined,
    notes: data.notes ?? undefined,
    medicineTranscription,
    medicines,
    ...extras,
  };
}
