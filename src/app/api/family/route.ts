import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";

export async function GET() {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const family = await prisma.family.findUnique({
    where: { id: user.familyId },
    include: {
      members: {
        include: {
          _count: { select: { prescriptions: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      users: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  return NextResponse.json(family);
}
