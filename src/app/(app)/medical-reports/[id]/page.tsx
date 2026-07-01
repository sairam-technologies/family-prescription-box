import { notFound } from "next/navigation";
import { requireFamilySession } from "@/lib/family-session";
import { getMedicalReportForFamily } from "@/lib/member-records";
import { MedicalReportDetail } from "@/components/MedicalReportDetail";

export default async function MedicalReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { familyId } = await requireFamilySession();
  const { id } = await params;

  const report = await getMedicalReportForFamily(id, familyId);

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
