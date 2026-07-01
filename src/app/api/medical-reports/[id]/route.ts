import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromR2Safe, getFromR2 } from "@/lib/r2";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import { getMedicalReportForFamily } from "@/lib/member-records";
import { scanMedicalReportImage } from "@/lib/ai/scan-medical-report";
import { medicalReportScanToDbFields } from "@/lib/medical-report-db";
import { formatGeminiError } from "@/lib/ai";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { id } = await params;
  const report = await getMedicalReportForFamily(id, user.familyId);

  if (!report) {
    return NextResponse.json({ error: "Medical report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { id } = await params;
  const report = await getMedicalReportForFamily(id, user.familyId);

  if (!report) {
    return NextResponse.json({ error: "Medical report not found" }, { status: 404 });
  }

  await prisma.medicalReport.update({
    where: { id },
    data: { scanStatus: "PROCESSING" },
  });

  try {
    let scanUrl = report.imageUrl;
    if (report.storageKey) {
      const { body, contentType } = await getFromR2(report.storageKey);
      scanUrl = `data:${contentType};base64,${body.toString("base64")}`;
    }

    const scanned = await scanMedicalReportImage(scanUrl);
    const updated = await prisma.medicalReport.update({
      where: { id },
      data: medicalReportScanToDbFields(scanned),
      include: {
        familyMember: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Medical report rescan error:", error);
    await prisma.medicalReport.update({
      where: { id },
      data: {
        scanStatus: "FAILED",
        rawAiResponse: JSON.stringify({ error: formatGeminiError(error) }),
      },
    });
    return NextResponse.json(
      { error: formatGeminiError(error) },
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
  const report = await getMedicalReportForFamily(id, user.familyId);

  if (!report) {
    return NextResponse.json({ error: "Medical report not found" }, { status: 404 });
  }

  await deleteFromR2Safe(report.storageKey);
  await prisma.medicalReport.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
