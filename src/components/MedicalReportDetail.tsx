"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PrescriptionImage } from "@/components/PrescriptionImage";
import { formatDate, cn } from "@/lib/utils";
import { parseStoredList } from "@/lib/ai/medical-report-parse";
import {
  MEDICAL_REPORT_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  URGENCY_LABELS,
  URGENCY_STYLES,
} from "@/lib/record-labels";

interface MedicalReportDetailProps {
  report: {
    id: string;
    title?: string | null;
    reportType: string;
    imageUrl: string;
    scanStatus: string;
    summary?: string | null;
    findings?: string | null;
    severity?: string | null;
    urgency?: string | null;
    doctorVisitRecommended?: boolean | null;
    doctorVisitReason?: string | null;
    dietarySuggestions?: string | null;
    lifestyleSuggestions?: string | null;
    rawAiResponse?: string | null;
    reportDate?: string | null;
    createdAt?: string | null;
    familyMember: { id: string; name: string };
  };
}

export function MedicalReportDetail({ report }: MedicalReportDetailProps) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const findings = parseStoredList(report.findings);
  const dietary = parseStoredList(report.dietarySuggestions);
  const lifestyle = parseStoredList(report.lifestyleSuggestions);

  const issues = (() => {
    if (!report.rawAiResponse) return [];
    try {
      const parsed = JSON.parse(report.rawAiResponse) as {
        issues?: Array<{ name: string; explanation: string }>;
      };
      return Array.isArray(parsed.issues) ? parsed.issues : [];
    } catch {
      return [];
    }
  })();

  const savedScanError = (() => {
    if (!report.rawAiResponse) return null;
    try {
      const parsed = JSON.parse(report.rawAiResponse) as { error?: string };
      return parsed.error ?? null;
    } catch {
      return null;
    }
  })();

  async function rescan() {
    setScanning(true);
    setScanError("");
    try {
      const res = await fetch(`/api/medical-reports/${report.id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScanError(data.error || "Re-scan failed");
        return;
      }
      router.refresh();
    } finally {
      setScanning(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this medical report? This cannot be undone.")) return;
    await fetch(`/api/medical-reports/${report.id}`, { method: "DELETE" });
    router.push(`/medical-reports?memberId=${report.familyMember.id}`);
    router.refresh();
  }

  return (
    <div>
      <Link
        href={`/medical-reports?memberId=${report.familyMember.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to medical reports
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {report.title || "Medical report"}
          </h1>
          <p className="mt-1 text-slate-500">
            {report.familyMember.name} ·{" "}
            {MEDICAL_REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => void rescan()} disabled={scanning}>
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-analyze
          </Button>
          <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[3/4] w-full bg-slate-100">
            <PrescriptionImage
              src={report.imageUrl}
              alt={report.title || "Medical report"}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </Card>

        <div className="space-y-4">
          {(report.scanStatus === "FAILED" || scanError || savedScanError) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-800">AI analysis failed</p>
              <p className="mt-1 text-sm text-red-700">
                {scanError || savedScanError || "Could not analyze this report."}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {report.severity && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  SEVERITY_STYLES[report.severity] ?? SEVERITY_STYLES.UNKNOWN
                )}
              >
                {SEVERITY_LABELS[report.severity]}
              </span>
            )}
            {report.urgency && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  URGENCY_STYLES[report.urgency] ?? URGENCY_STYLES.UNKNOWN
                )}
              >
                {URGENCY_LABELS[report.urgency]}
              </span>
            )}
          </div>

          {report.summary && (
            <Card>
              <p className="text-xs font-medium uppercase text-slate-500">Summary</p>
              <p className="mt-2 text-slate-700">{report.summary}</p>
            </Card>
          )}

          {issues.length > 0 && (
            <Card>
              <p className="text-xs font-medium uppercase text-slate-500">
                Issues identified
              </p>
              <ul className="mt-3 space-y-3">
                {issues.map((issue) => (
                  <li key={issue.name}>
                    <p className="font-medium text-slate-900">{issue.name}</p>
                    <p className="text-sm text-slate-600">{issue.explanation}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {findings.length > 0 && (
            <Card>
              <p className="text-xs font-medium uppercase text-slate-500">Key findings</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {findings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <p className="text-xs font-medium uppercase text-slate-500">
              Doctor visit
            </p>
            <p className="mt-2 font-medium text-slate-900">
              {report.doctorVisitRecommended
                ? "Recommended — please consult a doctor"
                : "Routine monitoring may be sufficient"}
            </p>
            {report.doctorVisitReason && (
              <p className="mt-1 text-sm text-slate-600">{report.doctorVisitReason}</p>
            )}
          </Card>

          {dietary.length > 0 && (
            <Card>
              <p className="text-xs font-medium uppercase text-slate-500">
                Suggested food habit changes
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {dietary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          )}

          {lifestyle.length > 0 && (
            <Card>
              <p className="text-xs font-medium uppercase text-slate-500">
                Lifestyle suggestions
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {lifestyle.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-900">
              This AI analysis is for information only and is not medical advice.
              Always consult a qualified doctor before making health decisions.
            </p>
          </Card>

          <Card>
            <p className="text-xs font-medium uppercase text-slate-500">Report date</p>
            <p className="mt-1 text-slate-700">
              {formatDate(report.reportDate || report.createdAt)}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
