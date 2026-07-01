import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireFamilySession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.familyId) {
    redirect("/login");
  }

  return {
    userId: session.user.id,
    familyId: session.user.familyId,
    userName: session.user.name,
    isPrimary: session.user.isPrimary,
  };
}
