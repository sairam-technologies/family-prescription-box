import { prisma } from "@/lib/prisma";

export async function getFamilyMemberOrNull(
  memberId: string,
  familyId: string
) {
  return prisma.familyMember.findFirst({
    where: { id: memberId, familyId },
  });
}

export async function getMemberDocumentForFamily(
  documentId: string,
  familyId: string
) {
  return prisma.memberDocument.findFirst({
    where: {
      id: documentId,
      familyMember: { familyId },
    },
    include: {
      familyMember: { select: { id: true, name: true } },
    },
  });
}

export async function getMedicalReportForFamily(
  reportId: string,
  familyId: string
) {
  return prisma.medicalReport.findFirst({
    where: {
      id: reportId,
      familyMember: { familyId },
    },
    include: {
      familyMember: { select: { id: true, name: true } },
    },
  });
}
