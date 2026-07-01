import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { DocumentDetail } from "@/components/DocumentDetail";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const document = await prisma.memberDocument.findFirst({
    where: {
      id,
      familyMember: { familyId: session.user.familyId },
    },
    include: {
      familyMember: { select: { id: true, name: true } },
    },
  });

  if (!document) notFound();

  return (
    <DocumentDetail
      document={{
        ...document,
        createdAt: document.createdAt.toISOString(),
      }}
    />
  );
}
