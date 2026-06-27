import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";

async function getMedicineForFamily(medicineId: string, familyId: string) {
  return prisma.medicine.findFirst({
    where: {
      id: medicineId,
      prescription: { familyMember: { familyId } },
    },
    include: {
      prescription: { select: { id: true } },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { id } = await params;
  const medicine = await getMedicineForFamily(id, user.familyId);

  if (!medicine) {
    return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Medicine name is required" },
      { status: 400 }
    );
  }

  const updated = await prisma.medicine.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { id } = await params;
  const medicine = await getMedicineForFamily(id, user.familyId);

  if (!medicine) {
    return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  }

  await prisma.medicine.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
