import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized, forbidden } from "@/lib/session";
import { deletePrescriptionFilesFromR2 } from "@/lib/r2";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { id } = await params;

  const member = await prisma.familyMember.findFirst({
    where: { id, familyId: user.familyId },
    include: {
      prescriptions: {
        include: { medicines: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  if (!user.isPrimary) {
    return forbidden("Only the primary family account can delete members");
  }

  const { id } = await params;

  const member = await prisma.familyMember.findFirst({
    where: { id, familyId: user.familyId },
    include: {
      prescriptions: { select: { storageKey: true } },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await deletePrescriptionFilesFromR2(member.prescriptions);
  await prisma.familyMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
