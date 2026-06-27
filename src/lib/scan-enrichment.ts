import type { ScanResult } from "@/lib/ai/parse";
import { findFamilyMedicineMatches } from "@/lib/medicine/family-matches";

export async function attachFamilyMatches(
  scanned: ScanResult,
  familyId: string,
  excludePrescriptionId?: string
): Promise<ScanResult> {
  const familyMatches = await findFamilyMedicineMatches(
    familyId,
    scanned.medicines,
    scanned.diagnosis,
    excludePrescriptionId
  );

  return { ...scanned, familyMatches };
}
