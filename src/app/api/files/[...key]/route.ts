import { NextResponse } from "next/server";
import { getFromR2 } from "@/lib/r2";
import { getSessionFamilyId, unauthorized } from "@/lib/session";
import { familyOwnsStorageKey } from "@/lib/family-file-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const user = await getSessionFamilyId();
  if (!user) return unauthorized();

  const { key: keyParts } = await params;
  const storageKey = decodeURIComponent(keyParts.join("/"));

  const allowed = await familyOwnsStorageKey(storageKey, user.familyId);
  if (!allowed) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const { body, contentType } = await getFromR2(storageKey);

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("R2 fetch error:", error);
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
  }
}
