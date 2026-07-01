import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import { buildMedicalReportKey, uploadToR2, getFromR2 } from "@/lib/r2";
import { getFamilyMemberOrNull } from "@/lib/member-records";
import { scanMedicalReportImage } from "@/lib/ai/scan-medical-report";
import { medicalReportScanToDbFields } from "@/lib/medical-report-db";
import { formatGeminiError } from "@/lib/ai";
import type { MedicalReportType } from "@/generated/prisma/client";

export const maxDuration = 60;

const REPORT_TYPES: MedicalReportType[] = [
  "LAB",
  "XRAY",
  "MRI",
  "ULTRASOUND",
  "CT_SCAN",
  "OTHER",
];

export async function GET(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  const reports = await prisma.medicalReport.findMany({
    where: {
      familyMember: {
        familyId: user.familyId,
        ...(memberId ? { id: memberId } : {}),
      },
    },
    include: {
      familyMember: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

export async function POST(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const memberId = formData.get("memberId") as string | null;
    const title = (formData.get("title") as string | null)?.trim();
    const reportTypeRaw = (formData.get("reportType") as string | null)?.trim();

    if (!file || !memberId) {
      return NextResponse.json(
        { error: "File and member ID are required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Medical reports must be uploaded as images (photo or scan)" },
        { status: 400 }
      );
    }

    const member = await getFamilyMemberOrNull(memberId, user.familyId);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const reportType = REPORT_TYPES.includes(reportTypeRaw as MedicalReportType)
      ? (reportTypeRaw as MedicalReportType)
      : "OTHER";

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = buildMedicalReportKey(
      user.familyId,
      memberId,
      file.name
    );
    const { url: imageUrl } = await uploadToR2(
      storageKey,
      buffer,
      file.type || "image/jpeg"
    );

    const report = await prisma.medicalReport.create({
      data: {
        familyMemberId: memberId,
        title: title || file.name,
        reportType,
        imageUrl,
        fileName: file.name,
        storageKey,
        scanStatus: "PROCESSING",
      },
    });

    try {
      const dataUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      const scanned = await scanMedicalReportImage(dataUrl);

      const updated = await prisma.medicalReport.update({
        where: { id: report.id },
        data: medicalReportScanToDbFields(scanned),
        include: {
          familyMember: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json(updated, { status: 201 });
    } catch (scanError) {
      console.error("Medical report scan error:", scanError);
      const failed = await prisma.medicalReport.update({
        where: { id: report.id },
        data: {
          scanStatus: "FAILED",
          rawAiResponse: JSON.stringify({
            error: formatGeminiError(scanError),
          }),
        },
        include: {
          familyMember: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json(failed, { status: 201 });
    }
  } catch (error) {
    console.error("Medical report upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload medical report" },
      { status: 500 }
    );
  }
}
