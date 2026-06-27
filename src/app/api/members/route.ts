import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";

export async function GET() {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const members = await prisma.familyMember.findMany({
    where: { familyId: user.familyId },
    include: {
      _count: { select: { prescriptions: true } },
      prescriptions: {
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          medicines: { take: 3 },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const body = await request.json();
  const { name, relationship, dateOfBirth } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const member = await prisma.familyMember.create({
    data: {
      name: name.trim(),
      relationship: relationship?.trim() || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      familyId: user.familyId,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
