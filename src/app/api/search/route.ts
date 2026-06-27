import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import type { SearchResult } from "@/types";

export async function GET(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const familyId = user.familyId;
  const query = q.toLowerCase();

  const [medicines, prescriptions, members] = await Promise.all([
    prisma.medicine.findMany({
      where: {
        prescription: {
          familyMember: { familyId },
        },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { dosage: { contains: q, mode: "insensitive" } },
          { instructions: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        prescription: {
          include: {
            familyMember: { select: { id: true, name: true } },
          },
        },
      },
      take: 20,
    }),
    prisma.prescription.findMany({
      where: {
        familyMember: { familyId },
        OR: [
          { doctorName: { contains: q, mode: "insensitive" } },
          { clinicName: { contains: q, mode: "insensitive" } },
          { diagnosis: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        familyMember: { select: { id: true, name: true } },
        medicines: { take: 3 },
      },
      take: 20,
    }),
    prisma.familyMember.findMany({
      where: {
        familyId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { relationship: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
  ]);

  const results: SearchResult[] = [];

  for (const med of medicines) {
    results.push({
      type: "medicine",
      id: med.id,
      title: med.name,
      subtitle: [med.dosage, med.frequency, med.duration]
        .filter(Boolean)
        .join(" · "),
      memberName: med.prescription.familyMember.name,
      date: med.prescription.prescriptionDate?.toISOString(),
      prescriptionId: med.prescriptionId,
      memberId: med.prescription.familyMember.id,
    });
  }

  for (const rx of prescriptions) {
    const medNames = rx.medicines.map((m) => m.name).join(", ");
    results.push({
      type: "prescription",
      id: rx.id,
      title: rx.doctorName || "Prescription",
      subtitle: [rx.clinicName, rx.diagnosis, medNames]
        .filter(Boolean)
        .join(" · "),
      memberName: rx.familyMember.name,
      date: rx.prescriptionDate?.toISOString(),
      prescriptionId: rx.id,
      memberId: rx.familyMember.id,
    });
  }

  for (const member of members) {
    if (!results.some((r) => r.memberId === member.id && r.type === "member")) {
      results.push({
        type: "member",
        id: member.id,
        title: member.name,
        subtitle: member.relationship || "Family member",
        memberName: member.name,
        memberId: member.id,
      });
    }
  }

  const unique = results.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (t) => t.type === item.type && t.id === item.id
      )
  );

  return NextResponse.json(
    unique.sort((a, b) => {
      const aMatch = a.title.toLowerCase().includes(query) ? 0 : 1;
      const bMatch = b.title.toLowerCase().includes(query) ? 0 : 1;
      return aMatch - bMatch;
    })
  );
}
