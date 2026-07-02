import { requireFamilySession } from "@/lib/family-session";
import { loadDocumentsPageData } from "@/lib/member-records-page";
import { DocumentListItem } from "@/components/MemberRecords";
import { UploadMemberFile } from "@/components/UploadMemberFile";
import { DbSetupNotice } from "@/components/DbSetupNotice";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/record-labels";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>;
}) {
  const { familyId } = await requireFamilySession();
  const { memberId } = await searchParams;

  const { schemaReady, members, documents } = await loadDocumentsPageData(
    familyId,
    memberId
  );

  const categoryOptions = Object.entries(DOCUMENT_CATEGORY_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Bills & documents</h1>
        <p className="mt-1 text-slate-500">
          Store invoices, bills, receipts, and insurance papers — no AI scanning.
        </p>
      </div>

      {!schemaReady && (
        <div className="mb-6">
          <DbSetupNotice feature="documents and medical reports" />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              No documents uploaded yet.
            </div>
          ) : (
            documents.map((doc) => (
              <DocumentListItem
                key={doc.id}
                id={doc.id}
                title={doc.title}
                category={doc.category}
                fileUrl={doc.fileUrl}
                fileName={doc.fileName}
                mimeType={doc.mimeType}
                memberName={doc.familyMember.name}
                createdAt={doc.createdAt.toISOString()}
              />
            ))
          )}
        </div>

        {members.length > 0 && schemaReady && (
          <UploadMemberFile
            title="Upload document"
            endpoint="/api/documents"
            members={members.map((m) => ({ id: m.id, name: m.name }))}
            defaultMemberId={memberId}
            accept="image/*,application/pdf"
            compressImages
            loadingMessage="Uploading document..."
            redirectBasePath="/documents"
            optionalTitle
            optionalNotes
            extraFields={[
              {
                name: "category",
                label: "Document type",
                options: categoryOptions,
                defaultValue: "BILL",
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
