import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { ACCESS_DENIED_ERROR_CODE } from "@/lib/auth-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signout?callbackUrl=${encodeURIComponent("/login")}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isApproved: true, family: { select: { name: true } } },
  });

  if (!user?.isApproved) {
    const callbackUrl = `/login?error=${ACCESS_DENIED_ERROR_CODE}`;
    redirect(
      `/api/auth/signout?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  }

  return (
    <AppShell familyName={user.family.name}>
      {children}
    </AppShell>
  );
}
