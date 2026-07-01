import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromR2Safe } from "@/lib/r2";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import { getMemberDocumentForFamily } from "@/lib/member-records";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { id } = await params;
  const document = await getMemberDocumentForFamily(id, user.familyId);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { id } = await params;
  const document = await getMemberDocumentForFamily(id, user.familyId);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteFromR2Safe(document.storageKey);
  await prisma.memberDocument.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
