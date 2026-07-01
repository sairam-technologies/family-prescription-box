import { parseJsonResponse } from "@/lib/ai/parse";

export type MedicalReportSeverity =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL"
  | "UNKNOWN";

export type MedicalReportUrgency =
  | "ROUTINE"
  | "SOON"
  | "URGENT"
  | "EMERGENCY"
  | "UNKNOWN";

export interface MedicalReportIssue {
  name: string;
  explanation: string;
}

export interface MedicalReportScanResult {
  reportTitle?: string;
  reportType?: string;
  reportDate?: string;
  summary: string;
  findings: string[];
  issues: MedicalReportIssue[];
  severity: MedicalReportSeverity;
  urgency: MedicalReportUrgency;
  doctorVisitRecommended: boolean;
  doctorVisitReason?: string;
  foodHabitChanges: string[];
  lifestyleSuggestions: string[];
  disclaimer: string;
}

const SEVERITIES: MedicalReportSeverity[] = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
  "UNKNOWN",
];

const URGENCIES: MedicalReportUrgency[] = [
  "ROUTINE",
  "SOON",
  "URGENT",
  "EMERGENCY",
  "UNKNOWN",
];

function normalizeEnum<T extends string>(
  value: unknown,
  allowed: T[],
  fallback: T
): T {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return allowed.includes(normalized as T) ? (normalized as T) : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item)))
    .filter(Boolean);
}

export function parseMedicalReportScan(content: string): MedicalReportScanResult {
  const raw = parseJsonResponse<MedicalReportScanResult>(content);

  return {
    reportTitle: raw.reportTitle?.trim() || undefined,
    reportType: raw.reportType?.trim() || undefined,
    reportDate: raw.reportDate?.trim() || undefined,
    summary: raw.summary?.trim() || "Could not summarize this report.",
    findings: normalizeStringArray(raw.findings),
    issues: Array.isArray(raw.issues)
      ? raw.issues
          .map((issue) => ({
            name: issue.name?.trim() ?? "",
            explanation: issue.explanation?.trim() ?? "",
          }))
          .filter((issue) => issue.name)
      : [],
    severity: normalizeEnum(raw.severity, SEVERITIES, "UNKNOWN"),
    urgency: normalizeEnum(raw.urgency, URGENCIES, "UNKNOWN"),
    doctorVisitRecommended: Boolean(raw.doctorVisitRecommended),
    doctorVisitReason: raw.doctorVisitReason?.trim() || undefined,
    foodHabitChanges: normalizeStringArray(raw.foodHabitChanges),
    lifestyleSuggestions: normalizeStringArray(raw.lifestyleSuggestions),
    disclaimer:
      raw.disclaimer?.trim() ||
      "This analysis is for information only. Always consult a qualified doctor.",
  };
}

export function serializeList(items: string[]): string | null {
  if (!items.length) return null;
  return JSON.stringify(items);
}

export function parseStoredList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return normalizeStringArray(parsed);
  } catch {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
}
