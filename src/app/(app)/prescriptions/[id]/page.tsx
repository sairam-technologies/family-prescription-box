import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PrescriptionDetail } from "@/components/PrescriptionDetail";

export default async function PrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const prescription = await prisma.prescription.findFirst({
    where: {
      id,
      familyMember: { familyId: session.user.familyId },
    },
    include: {
      medicines: true,
      familyMember: {
        select: { id: true, name: true, relationship: true },
      },
    },
  });

  if (!prescription) notFound();

  return (
    <PrescriptionDetail
      prescription={{
        ...prescription,
        prescriptionDate: prescription.prescriptionDate?.toISOString() ?? null,
      }}
    />
  );
}
