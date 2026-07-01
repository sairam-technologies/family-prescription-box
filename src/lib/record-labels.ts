export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  INVOICE: "Invoice",
  BILL: "Bill",
  RECEIPT: "Receipt",
  INSURANCE: "Insurance",
  OTHER: "Other",
};

export const MEDICAL_REPORT_TYPE_LABELS: Record<string, string> = {
  LAB: "Lab report",
  XRAY: "X-ray",
  MRI: "MRI",
  ULTRASOUND: "Ultrasound",
  CT_SCAN: "CT scan",
  OTHER: "Other report",
};

export const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Low concern",
  MODERATE: "Moderate concern",
  HIGH: "High concern",
  CRITICAL: "Critical",
  UNKNOWN: "Unknown",
};

export const URGENCY_LABELS: Record<string, string> = {
  ROUTINE: "Routine follow-up",
  SOON: "See doctor soon",
  URGENT: "Urgent visit",
  EMERGENCY: "Emergency — seek care now",
  UNKNOWN: "Unknown",
};

export const SEVERITY_STYLES: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MODERATE: "bg-amber-100 text-amber-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
  UNKNOWN: "bg-slate-100 text-slate-700",
};

export const URGENCY_STYLES: Record<string, string> = {
  ROUTINE: "bg-slate-100 text-slate-700",
  SOON: "bg-amber-100 text-amber-800",
  URGENT: "bg-orange-100 text-orange-800",
  EMERGENCY: "bg-red-100 text-red-800",
  UNKNOWN: "bg-slate-100 text-slate-700",
};
