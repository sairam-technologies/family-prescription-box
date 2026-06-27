import { prisma } from "@/lib/prisma";
import type { FamilyMedicineMatch } from "@/lib/ai/parse";

function normalizeMedicineName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function medicineNamesMatch(a: string, b: string): boolean {
  const na = normalizeMedicineName(a);
  const nb = normalizeMedicineName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const tokensA = na.split(/\s+/).filter((token) => token.length >= 3);
  const tokensB = new Set(nb.split(/\s+/).filter((token) => token.length >= 3));
  const sharedTokens = tokensA.filter((token) => tokensB.has(token));
  if (sharedTokens.length >= 2) return true;

  if (na.length >= 4 && nb.includes(na)) return true;
  if (nb.length >= 4 && na.includes(nb)) return true;

  return false;
}

function diagnosesShareContext(
  current?: string | null,
  historical?: string | null
): boolean {
  if (!current || !historical) return false;

  const wordsA = current
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3);
  const wordsB = new Set(
    historical
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)
  );

  return wordsA.some((word) => wordsB.has(word));
}

export async function findFamilyMedicineMatches(
  familyId: string,
  medicines: Array<{ name: string }>,
  diagnosis: string | null | undefined,
  excludePrescriptionId?: string
): Promise<FamilyMedicineMatch[]> {
  if (!medicines.length) return [];

  const history = await prisma.medicine.findMany({
    where: {
      prescription: {
        familyMember: { familyId },
        ...(excludePrescriptionId
          ? { id: { not: excludePrescriptionId } }
          : {}),
      },
    },
    select: {
      name: true,
      prescription: {
        select: {
          id: true,
          diagnosis: true,
          prescriptionDate: true,
          familyMember: { select: { name: true } },
        },
      },
    },
    orderBy: { prescription: { prescriptionDate: "desc" } },
    take: 200,
  });

  const matches: FamilyMedicineMatch[] = [];
  const seen = new Set<string>();

  for (const medicine of medicines) {
    for (const row of history) {
      if (!medicineNamesMatch(medicine.name, row.name)) continue;

      const sameDiagnosisContext = diagnosesShareContext(
        diagnosis,
        row.prescription.diagnosis
      );
      const key = [
        medicine.name.toLowerCase(),
        row.prescription.id,
        row.name.toLowerCase(),
      ].join("|");

      if (seen.has(key)) continue;
      seen.add(key);

      matches.push({
        medicineName: row.name,
        diagnosis: row.prescription.diagnosis,
        memberName: row.prescription.familyMember.name,
        prescriptionId: row.prescription.id,
        prescriptionDate: row.prescription.prescriptionDate?.toISOString() ?? null,
        sameDiagnosisContext,
      });
    }
  }

  return matches.sort((a, b) => {
    if (a.sameDiagnosisContext !== b.sameDiagnosisContext) {
      return a.sameDiagnosisContext ? -1 : 1;
    }
    return (b.prescriptionDate ?? "").localeCompare(a.prescriptionDate ?? "");
  });
}

export function groupFamilyMatchesByMedicine(
  medicines: Array<{ name: string }>,
  matches: FamilyMedicineMatch[]
): Record<string, FamilyMedicineMatch[]> {
  const grouped: Record<string, FamilyMedicineMatch[]> = {};

  for (const medicine of medicines) {
    grouped[medicine.name] = matches.filter((match) =>
      medicineNamesMatch(medicine.name, match.medicineName)
    );
  }

  return grouped;
}
