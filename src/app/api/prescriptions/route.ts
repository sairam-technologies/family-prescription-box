import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import {
  buildPrescriptionKey,
  getFromR2,
  uploadToR2,
} from "@/lib/r2";
import { scanPrescriptionImage } from "@/lib/ai";

export async function GET(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  const prescriptions = await prisma.prescription.findMany({
    where: {
      familyMember: {
        familyId: user.familyId,
        ...(memberId ? { id: memberId } : {}),
      },
    },
    include: {
      medicines: true,
      familyMember: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prescriptions);
}

export async function POST(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const memberId = formData.get("memberId") as string | null;

    if (!file || !memberId) {
      return NextResponse.json(
        { error: "File and member ID are required" },
        { status: 400 }
      );
    }

    const member = await prisma.familyMember.findFirst({
      where: { id: memberId, familyId: user.familyId },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = buildPrescriptionKey(
      user.familyId,
      memberId,
      file.name
    );
    const { url: imageUrl } = await uploadToR2(
      storageKey,
      buffer,
      file.type || "image/jpeg"
    );

    const prescription = await prisma.prescription.create({
      data: {
        familyMemberId: memberId,
        imageUrl,
        imageName: file.name,
        storageKey,
        scanStatus: "PROCESSING",
      },
    });

    try {
      const dataUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      const scanned = await scanPrescriptionImage(dataUrl);

      const updated = await prisma.prescription.update({
        where: { id: prescription.id },
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

      return NextResponse.json(updated, { status: 201 });
    } catch (scanError) {
      console.error("AI scan error:", scanError);
      const failed = await prisma.prescription.update({
        where: { id: prescription.id },
        data: { scanStatus: "FAILED" },
        include: {
          medicines: true,
          familyMember: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json(failed, { status: 201 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload prescription" },
      { status: 500 }
    );
  }
}
