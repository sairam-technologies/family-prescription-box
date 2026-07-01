import { notFound } from "next/navigation";
import { requireFamilySession } from "@/lib/family-session";
import { getMemberDocumentForFamily } from "@/lib/member-records";
import { DocumentDetail } from "@/components/DocumentDetail";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { familyId } = await requireFamilySession();
  const { id } = await params;

  const document = await getMemberDocumentForFamily(id, familyId);

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
