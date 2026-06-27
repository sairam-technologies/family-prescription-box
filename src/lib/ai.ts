import OpenAI from "openai";
import type { ScannedPrescription } from "@/types";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

const SYSTEM_PROMPT = `You are a medical prescription OCR assistant. Analyze prescription images and extract structured data.

Return ONLY valid JSON with this exact shape:
{
  "doctorName": "string or null",
  "clinicName": "string or null",
  "prescriptionDate": "YYYY-MM-DD or null",
  "diagnosis": "string or null",
  "notes": "string or null",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. twice daily",
      "duration": "e.g. 5 days",
      "instructions": "e.g. after meals"
    }
  ]
}

Rules:
- Extract all medicines listed on the prescription
- Use null for fields you cannot read clearly
- Do not invent information not visible in the image
- prescriptionDate must be ISO format YYYY-MM-DD when possible`;

export async function scanPrescriptionImage(
  imageUrl: string
): Promise<ScannedPrescription> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all prescription details and medicines from this image.",
          },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI scanner");
  }

  const parsed = JSON.parse(content) as ScannedPrescription;
  return {
    doctorName: parsed.doctorName ?? undefined,
    clinicName: parsed.clinicName ?? undefined,
    prescriptionDate: parsed.prescriptionDate ?? undefined,
    diagnosis: parsed.diagnosis ?? undefined,
    notes: parsed.notes ?? undefined,
    medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
  };
}
