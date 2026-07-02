import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import { buildMemberDocumentKey, uploadToR2 } from "@/lib/r2";
import { getFamilyMemberOrNull } from "@/lib/member-records";
import { resolveUploadContentType } from "@/lib/file-types";
import type { DocumentCategory } from "@/generated/prisma/client";

export const maxDuration = 60;

const CATEGORIES: DocumentCategory[] = [
  "INVOICE",
  "BILL",
  "RECEIPT",
  "INSURANCE",
  "OTHER",
];

function isAllowedFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  if (file.type === "application/pdf") return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|pdf)$/i.test(file.name);
}

export async function GET(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  const documents = await prisma.memberDocument.findMany({
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

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const memberId = formData.get("memberId") as string | null;
    const title = (formData.get("title") as string | null)?.trim();
    const categoryRaw = (formData.get("category") as string | null)?.trim();
    const notes = (formData.get("notes") as string | null)?.trim();

    if (!file || !memberId) {
      return NextResponse.json(
        { error: "File and member ID are required" },
        { status: 400 }
      );
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json(
        { error: "Please upload an image or PDF file" },
        { status: 400 }
      );
    }

    const member = await getFamilyMemberOrNull(memberId, user.familyId);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const category = CATEGORIES.includes(categoryRaw as DocumentCategory)
      ? (categoryRaw as DocumentCategory)
      : "OTHER";

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = resolveUploadContentType(file);
    const storageKey = buildMemberDocumentKey(
      user.familyId,
      memberId,
      file.name
    );
    const { url: fileUrl } = await uploadToR2(storageKey, buffer, contentType);

    const document = await prisma.memberDocument.create({
      data: {
        familyMemberId: memberId,
        title: title || file.name,
        category,
        fileUrl,
        fileName: file.name,
        storageKey,
        mimeType: contentType,
        notes: notes || null,
      },
      include: {
        familyMember: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
