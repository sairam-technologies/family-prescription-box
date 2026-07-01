import { prisma } from "@/lib/prisma";
import { isMissingTableError } from "@/lib/prisma-errors";

export async function countFamilyDocuments(familyId: string): Promise<number> {
  try {
    return await prisma.memberDocument.count({
      where: { familyMember: { familyId } },
    });
  } catch (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
}

export async function countFamilyMedicalReports(familyId: string): Promise<number> {
  try {
    return await prisma.medicalReport.count({
      where: { familyMember: { familyId } },
    });
  } catch (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
}

export async function loadDocumentsPageData(
  familyId: string,
  memberId?: string
) {
  try {
    const [members, documents] = await Promise.all([
      prisma.familyMember.findMany({
        where: { familyId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.memberDocument.findMany({
        where: {
          familyMember: {
            familyId,
            ...(memberId ? { id: memberId } : {}),
          },
        },
        include: { familyMember: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { schemaReady: true as const, members, documents };
  } catch (error) {
    if (isMissingTableError(error)) {
      const members = await prisma.familyMember.findMany({
        where: { familyId },
        orderBy: { createdAt: "asc" },
      });
      return { schemaReady: false as const, members, documents: [] };
    }
    throw error;
  }
}

export async function loadMedicalReportsPageData(
  familyId: string,
  memberId?: string
) {
  try {
    const [members, reports] = await Promise.all([
      prisma.familyMember.findMany({
        where: { familyId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.medicalReport.findMany({
        where: {
          familyMember: {
            familyId,
            ...(memberId ? { id: memberId } : {}),
          },
        },
        include: { familyMember: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { schemaReady: true as const, members, reports };
  } catch (error) {
    if (isMissingTableError(error)) {
      const members = await prisma.familyMember.findMany({
        where: { familyId },
        orderBy: { createdAt: "asc" },
      });
      return { schemaReady: false as const, members, reports: [] };
    }
    throw error;
  }
}
