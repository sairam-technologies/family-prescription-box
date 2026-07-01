import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MedicalReportListItem } from "@/components/MemberRecords";
import { UploadMemberFile } from "@/components/UploadMemberFile";
import { MEDICAL_REPORT_TYPE_LABELS } from "@/lib/record-labels";

export default async function MedicalReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { memberId } = await searchParams;

  const [members, reports] = await Promise.all([
    prisma.familyMember.findMany({
      where: { familyId: session.user.familyId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.medicalReport.findMany({
      where: {
        familyMember: {
          familyId: session.user.familyId,
          ...(memberId ? { id: memberId } : {}),
        },
      },
      include: { familyMember: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const reportTypeOptions = Object.entries(MEDICAL_REPORT_TYPE_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Medical reports</h1>
        <p className="mt-1 text-slate-500">
          Lab results, X-rays, and scans — AI summarizes findings, severity, and
          whether a doctor visit is needed.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              No medical reports uploaded yet.
            </div>
          ) : (
            reports.map((report) => (
              <MedicalReportListItem
                key={report.id}
                id={report.id}
                title={report.title}
                reportType={report.reportType}
                imageUrl={report.imageUrl}
                scanStatus={report.scanStatus}
                severity={report.severity}
                urgency={report.urgency}
                summary={report.summary}
                memberName={report.familyMember.name}
                createdAt={report.createdAt.toISOString()}
              />
            ))
          )}
        </div>

        {members.length > 0 && (
          <UploadMemberFile
            title="Upload medical report"
            endpoint="/api/medical-reports"
            members={members.map((m) => ({ id: m.id, name: m.name }))}
            defaultMemberId={memberId}
            accept="image/*"
            compressImages
            loadingMessage="Uploading & analyzing with AI..."
            loadingHint="Checking findings, severity, and doctor visit urgency"
            redirectPath={(result) => `/medical-reports/${result.id}`}
            optionalTitle
            extraFields={[
              {
                name: "reportType",
                label: "Report type",
                options: reportTypeOptions,
                defaultValue: "LAB",
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
