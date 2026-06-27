export interface ScannedMedicine {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface ScannedPrescription {
  doctorName?: string;
  clinicName?: string;
  prescriptionDate?: string;
  diagnosis?: string;
  notes?: string;
  medicines: ScannedMedicine[];
}

export interface SearchResult {
  type: "medicine" | "prescription" | "member";
  id: string;
  title: string;
  subtitle: string;
  memberName: string;
  date?: string;
  prescriptionId?: string;
  memberId?: string;
}
