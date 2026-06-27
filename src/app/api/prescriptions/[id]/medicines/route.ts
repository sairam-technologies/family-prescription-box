import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { id } = await params;

  const prescription = await prisma.prescription.findFirst({
    where: {
      id,
      familyMember: { familyId: user.familyId },
    },
  });

  if (!prescription) {
    return NextResponse.json(
      { error: "Prescription not found" },
      { status: 404 }
    );
  }

  let body: {
    name?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  };
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

  const medicine = await prisma.medicine.create({
    data: {
      prescriptionId: id,
      name,
      dosage: body.dosage?.trim() || null,
      frequency: body.frequency?.trim() || null,
      duration: body.duration?.trim() || null,
      instructions: body.instructions?.trim() || null,
    },
  });

  return NextResponse.json(medicine, { status: 201 });
}
