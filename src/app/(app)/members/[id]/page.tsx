import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadPrescription } from "@/components/UploadPrescription";
import { PrescriptionListItem } from "@/components/Prescription";
import { formatMemberSubtitle } from "@/lib/utils";
import { DeleteMemberButton } from "@/components/DeleteMemberButton";

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const member = await prisma.familyMember.findFirst({
    where: { id, familyId: session.user.familyId },
    include: {
      prescriptions: {
        include: { medicines: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!member) notFound();

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-2xl font-bold text-white">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{member.name}</h1>
              <p className="text-slate-500">
                {formatMemberSubtitle(
                  member.relationship,
                  member.dateOfBirth?.toISOString()
                )}{" "}
                · {member.prescriptions.length} prescriptions
              </p>
            </div>
          </div>
          {session.user.isPrimary && (
            <DeleteMemberButton
              memberId={member.id}
              memberName={member.name}
              variant="button"
            />
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Prescriptions
          </h2>
          {member.prescriptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              No prescriptions uploaded yet.
            </div>
          ) : (
            member.prescriptions.map((rx) => (
              <PrescriptionListItem
                key={rx.id}
                id={rx.id}
                imageUrl={rx.imageUrl}
                doctorName={rx.doctorName}
                clinicName={rx.clinicName}
                prescriptionDate={rx.prescriptionDate?.toISOString()}
                scanStatus={rx.scanStatus}
                memberName={member.name}
                medicines={rx.medicines.map((med) => ({
                  id: med.id,
                  name: med.name,
                }))}
              />
            ))
          )}
        </div>

        <UploadPrescription
          members={[{ id: member.id, name: member.name }]}
          defaultMemberId={member.id}
        />
      </div>
    </div>
  );
}
