"use client";

import Link from "next/link";
import { FileText, Calendar, Activity } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { PrescriptionImage } from "@/components/PrescriptionImage";
import { formatDate, cn } from "@/lib/utils";
import {
  DOCUMENT_CATEGORY_LABELS,
  MEDICAL_REPORT_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  URGENCY_LABELS,
  URGENCY_STYLES,
} from "@/lib/record-labels";

interface DocumentListItemProps {
  id: string;
  title?: string | null;
  category: string;
  fileUrl: string;
  mimeType?: string | null;
  memberName: string;
  createdAt?: string | null;
}

export function DocumentListItem({
  id,
  title,
  category,
  fileUrl,
  mimeType,
  memberName,
  createdAt,
}: DocumentListItemProps) {
  const isPdf = mimeType === "application/pdf" || fileUrl.endsWith(".pdf");
  const label = DOCUMENT_CATEGORY_LABELS[category] ?? category;

  return (
    <Link href={`/documents/${id}`} className="block min-w-0">
      <Card className="group flex min-w-0 gap-3 transition-all hover:border-teal-200 hover:shadow-md sm:gap-4">
        <div className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          {isPdf ? (
            <FileText className="h-8 w-8 text-slate-500" />
          ) : (
            <PrescriptionImage
              src={fileUrl}
              alt={title || "Document"}
              fill
              className="object-cover"
              sizes="64px"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-2 group-hover:text-teal-700">
            {title || "Untitled document"}
          </CardTitle>
          <p className="truncate text-sm text-teal-600">{memberName}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {label}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(createdAt)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface MedicalReportListItemProps {
  id: string;
  title?: string | null;
  reportType: string;
  imageUrl: string;
  scanStatus: string;
  severity?: string | null;
  urgency?: string | null;
  summary?: string | null;
  memberName: string;
  createdAt?: string | null;
}

export function MedicalReportListItem({
  id,
  title,
  reportType,
  imageUrl,
  scanStatus,
  severity,
  urgency,
  summary,
  memberName,
  createdAt,
}: MedicalReportListItemProps) {
  const typeLabel = MEDICAL_REPORT_TYPE_LABELS[reportType] ?? reportType;
  const statusColors = {
    COMPLETED: "bg-green-100 text-green-700",
    PROCESSING: "bg-amber-100 text-amber-700",
    PENDING: "bg-slate-100 text-slate-600",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <Link href={`/medical-reports/${id}`} className="block min-w-0">
      <Card className="group flex min-w-0 gap-3 transition-all hover:border-teal-200 hover:shadow-md sm:gap-4">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <PrescriptionImage
            src={imageUrl}
            alt={title || "Medical report"}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <div className="min-w-0">
              <CardTitle className="line-clamp-2 group-hover:text-teal-700">
                {title || "Medical report"}
              </CardTitle>
              <p className="truncate text-sm text-teal-600">{memberName}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                statusColors[scanStatus as keyof typeof statusColors] ||
                  statusColors.PENDING
              )}
            >
              {scanStatus.toLowerCase()}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
              {typeLabel}
            </span>
            {severity && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium",
                  SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.UNKNOWN
                )}
              >
                {SEVERITY_LABELS[severity] ?? severity}
              </span>
            )}
            {urgency && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium",
                  URGENCY_STYLES[urgency] ?? URGENCY_STYLES.UNKNOWN
                )}
              >
                {URGENCY_LABELS[urgency] ?? urgency}
              </span>
            )}
          </div>
          {summary && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{summary}</p>
          )}
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            {formatDate(createdAt)}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export function RecordSectionLinks({
  memberId,
  documentCount,
  reportCount,
}: {
  memberId: string;
  documentCount: number;
  reportCount: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href={`/documents?memberId=${memberId}`}
        className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-slate-600" />
          <div className="min-w-0">
            <p className="font-medium text-slate-900">Bills & documents</p>
            <p className="text-sm text-slate-500">{documentCount} stored</p>
          </div>
        </div>
      </Link>
      <Link
        href={`/medical-reports?memberId=${memberId}`}
        className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Activity className="h-5 w-5 shrink-0 text-slate-600" />
          <div className="min-w-0">
            <p className="font-medium text-slate-900">Medical reports</p>
            <p className="truncate text-sm text-slate-500">
              {reportCount} with AI insights
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
