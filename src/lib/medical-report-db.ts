import type {
  DoctorUrgency,
  MedicalReportType,
  ReportSeverity,
} from "@/generated/prisma/client";
import type { MedicalReportScanResult } from "@/lib/ai/medical-report-parse";
import { serializeList } from "@/lib/ai/medical-report-parse";

const REPORT_TYPES: MedicalReportType[] = [
  "LAB",
  "XRAY",
  "MRI",
  "ULTRASOUND",
  "CT_SCAN",
  "OTHER",
];

export function mapReportType(value?: string): MedicalReportType {
  const normalized = (value ?? "OTHER").trim().toUpperCase().replace(/[\s-]+/g, "_");
  return REPORT_TYPES.includes(normalized as MedicalReportType)
    ? (normalized as MedicalReportType)
    : "OTHER";
}

export function mapSeverity(value: MedicalReportScanResult["severity"]): ReportSeverity {
  return value;
}

export function mapUrgency(value: MedicalReportScanResult["urgency"]): DoctorUrgency {
  return value;
}

export function medicalReportScanToDbFields(scan: MedicalReportScanResult) {
  return {
    title: scan.reportTitle ?? null,
    reportType: mapReportType(scan.reportType),
    reportDate: scan.reportDate ? new Date(scan.reportDate) : null,
    summary: scan.summary,
    findings: serializeList(scan.findings),
    severity: mapSeverity(scan.severity),
    urgency: mapUrgency(scan.urgency),
    doctorVisitRecommended: scan.doctorVisitRecommended,
    doctorVisitReason: scan.doctorVisitReason ?? null,
    dietarySuggestions: serializeList(scan.foodHabitChanges),
    lifestyleSuggestions: serializeList(scan.lifestyleSuggestions),
    rawAiResponse: JSON.stringify(scan),
    scanStatus: "COMPLETED" as const,
  };
}
