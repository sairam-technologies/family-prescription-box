import { prisma } from "@/lib/prisma";
import { isMissingTableError } from "@/lib/prisma-errors";

/** Verify an R2 storage key belongs to the given family (any record type). */
export async function familyOwnsStorageKey(
  storageKey: string,
  familyId: string
): Promise<boolean> {
  const prescription = await prisma.prescription.findFirst({
    where: { storageKey, familyMember: { familyId } },
    select: { id: true },
  });
  if (prescription) return true;

  try {
    const [document, report] = await Promise.all([
      prisma.memberDocument.findFirst({
        where: { storageKey, familyMember: { familyId } },
        select: { id: true },
      }),
      prisma.medicalReport.findFirst({
        where: { storageKey, familyMember: { familyId } },
        select: { id: true },
      }),
    ]);
    return !!(document || report);
  } catch (error) {
    if (isMissingTableError(error)) return false;
    throw error;
  }
}
