import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { MedicalReportDetail } from "@/components/MedicalReportDetail";

export default async function MedicalReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const report = await prisma.medicalReport.findFirst({
    where: {
      id,
      familyMember: { familyId: session.user.familyId },
    },
    include: {
      familyMember: { select: { id: true, name: true } },
    },
  });

  if (!report) notFound();

  return (
    <MedicalReportDetail
      report={{
        ...report,
        reportDate: report.reportDate?.toISOString() ?? null,
        createdAt: report.createdAt.toISOString(),
      }}
    />
  );
}
