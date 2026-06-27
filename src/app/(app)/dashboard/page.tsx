import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardHeader, MemberCard } from "@/components/Dashboard";
import { AddMemberForm } from "@/components/AddMemberForm";
import { UploadPrescription } from "@/components/UploadPrescription";
import { PrescriptionListItem } from "@/components/Prescription";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
    include: {
      members: {
        include: {
          _count: { select: { prescriptions: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!family) redirect("/login");

  const prescriptions = await prisma.prescription.findMany({
    where: {
      familyMember: { familyId: session.user.familyId },
    },
    include: {
      medicines: true,
      familyMember: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const medicineCount = await prisma.medicine.count({
    where: {
      prescription: {
        familyMember: { familyId: session.user.familyId },
      },
    },
  });

  return (
    <div>
      <DashboardHeader
        familyName={family.name}
        inviteCode={family.inviteCode}
        userName={session.user.name}
        isPrimary={session.user.isPrimary}
        stats={{
          members: family.members.length,
          prescriptions: await prisma.prescription.count({
            where: {
              familyMember: { familyId: session.user.familyId },
            },
          }),
          medicines: medicineCount,
        }}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Family Members
            </h2>
            <AddMemberForm />
          </div>

          {family.members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              <p>No family members yet. Add your first member to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {family.members.map((member) => (
                <MemberCard
                  key={member.id}
                  id={member.id}
                  name={member.name}
                  relationship={member.relationship}
                  dateOfBirth={member.dateOfBirth?.toISOString()}
                  prescriptionCount={member._count.prescriptions}
                  canDelete={session.user.isPrimary}
                />
              ))}
            </div>
          )}

          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Recent Prescriptions
            </h2>
            {prescriptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                <p>Upload your first prescription to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <PrescriptionListItem
                    key={rx.id}
                    id={rx.id}
                    imageUrl={rx.imageUrl}
                    doctorName={rx.doctorName}
                    clinicName={rx.clinicName}
                    prescriptionDate={rx.prescriptionDate?.toISOString()}
                    scanStatus={rx.scanStatus}
                    memberName={rx.familyMember.name}
                    medicines={rx.medicines.map((med) => ({
                      id: med.id,
                      name: med.name,
                    }))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {family.members.length > 0 && (
            <UploadPrescription
              members={family.members.map((m) => ({
                id: m.id,
                name: m.name,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
