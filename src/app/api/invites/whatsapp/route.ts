import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { buildFamilyInviteUrl, normalizeWhatsAppPhoneNumber } from "@/lib/invite-links";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppInviteMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  let body: { phoneNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phoneNumber = body.phoneNumber?.trim();
  if (!phoneNumber) {
    return NextResponse.json(
      { error: "Mobile number is required" },
      { status: 400 }
    );
  }

  if (!normalizeWhatsAppPhoneNumber(phoneNumber)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit mobile number after +91" },
      { status: 400 }
    );
  }

  const family = await prisma.family.findUnique({
    where: { id: user.familyId },
    select: { name: true, inviteCode: true },
  });

  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  try {
    const appBaseUrl = await getAppBaseUrl();
    const inviteUrl = buildFamilyInviteUrl(appBaseUrl, family.inviteCode);

    await sendWhatsAppInviteMessage({
      phoneNumber,
      familyName: family.name,
      inviteUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp invite error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send WhatsApp invite";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
