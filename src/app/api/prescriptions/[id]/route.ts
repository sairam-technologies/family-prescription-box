import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import { getFromR2 } from "@/lib/r2";
import { scanPrescriptionImage } from "@/lib/ai";

export async function GET(
  _request: Request,
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
    include: {
      medicines: true,
      familyMember: { select: { id: true, name: true, relationship: true } },
    },
  });

  if (!prescription) {
    return NextResponse.json(
      { error: "Prescription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(prescription);
}

export async function POST(
  _request: Request,
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

  await prisma.prescription.update({
    where: { id },
    data: { scanStatus: "PROCESSING" },
  });

  try {
    let scanUrl = prescription.imageUrl;
    if (prescription.storageKey) {
      const { body, contentType } = await getFromR2(prescription.storageKey);
      scanUrl = `data:${contentType};base64,${body.toString("base64")}`;
    }

    const scanned = await scanPrescriptionImage(scanUrl);

    await prisma.medicine.deleteMany({ where: { prescriptionId: id } });

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        doctorName: scanned.doctorName ?? null,
        clinicName: scanned.clinicName ?? null,
        prescriptionDate: scanned.prescriptionDate
          ? new Date(scanned.prescriptionDate)
          : null,
        diagnosis: scanned.diagnosis ?? null,
        notes: scanned.notes ?? null,
        rawAiResponse: JSON.stringify(scanned),
        scanStatus: "COMPLETED",
        medicines: {
          create: scanned.medicines.map((med) => ({
            name: med.name,
            dosage: med.dosage ?? null,
            frequency: med.frequency ?? null,
            duration: med.duration ?? null,
            instructions: med.instructions ?? null,
          })),
        },
      },
      include: {
        medicines: true,
        familyMember: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Rescan error:", error);
    await prisma.prescription.update({
      where: { id },
      data: { scanStatus: "FAILED" },
    });
    return NextResponse.json(
      { error: "Failed to scan prescription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
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

  await prisma.prescription.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
