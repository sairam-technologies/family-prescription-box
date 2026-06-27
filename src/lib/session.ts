import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getSessionFamilyId() {
  const session = await auth();
  if (!session?.user?.familyId) {
    return null;
  }
  return session.user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(message = "You do not have permission to perform this action") {
  return NextResponse.json({ error: message }, { status: 403 });
}
