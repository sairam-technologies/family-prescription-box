import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from "groq-sdk";
import { VALIDATE_MEDICINES_PROMPT } from "@/lib/ai/prompts";
import {
  parseJsonResponse,
  type MedicineValidation,
  type MedicineValidationStatus,
  type ScanResult,
} from "@/lib/ai/parse";

const VALID_STATUSES: MedicineValidationStatus[] = [
  "verified",
  "likely_correct",
  "uncertain",
  "possible_ocr_error",
  "unusual_for_diagnosis",
];

function buildValidationPrompt(
  scan: Pick<ScanResult, "diagnosis" | "medicines" | "medicineTranscription">
): string {
  const payload = {
    diagnosis: scan.diagnosis ?? null,
    medicineTranscription: scan.medicineTranscription ?? null,
    medicines: scan.medicines.map((med) => ({
      name: med.name,
      dosage: med.dosage ?? null,
      frequency: med.frequency ?? null,
    })),
  };

  return `${VALIDATE_MEDICINES_PROMPT}\n\nExtracted data:\n${JSON.stringify(payload, null, 2)}`;
}

function normalizeValidation(raw: MedicineValidation): MedicineValidation {
  const status = VALID_STATUSES.includes(raw.status)
    ? raw.status
    : "uncertain";
  const confidence = Math.min(
    100,
    Math.max(0, Math.round(Number(raw.confidence) || 0))
  );

  return {
    name: raw.name?.trim() ?? "",
    status,
    confidence,
    knownBrand: raw.knownBrand?.trim() || undefined,
    genericName: raw.genericName?.trim() || undefined,
    suggestedName: raw.suggestedName?.trim() || undefined,
    fitsDiagnosis:
      raw.fitsDiagnosis === true || raw.fitsDiagnosis === false
        ? raw.fitsDiagnosis
        : null,
    note: raw.note?.trim() || undefined,
  };
}

async function validateWithGemini(prompt: string): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 2048,
      temperature: 0,
    },
  });

  const result = await model.generateContent([{ text: prompt }]);
  const content = result.response.text();
  if (!content) {
    throw new Error("No validation response from Gemini");
  }
  return content;
}

async function validateWithOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini",
    temperature: 0,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No validation response from OpenAI");
  }
  return content;
}

async function validateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const client = new Groq({ apiKey });
  const response = await client.chat.completions.create({
    model: process.env.GROQ_TEXT_MODEL ?? "llama-3.3-70b-versatile",
    temperature: 0,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No validation response from Groq");
  }
  return content;
}

async function validateWithOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const response = await client.chat.completions.create({
    model: process.env.OPENROUTER_TEXT_MODEL ?? "google/gemini-2.5-flash",
    temperature: 0,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No validation response from OpenRouter");
  }
  return content;
}

async function runValidationPrompt(prompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() ?? "gemini";

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return validateWithOpenAI(prompt);
  }
  if (provider === "groq" && process.env.GROQ_API_KEY) {
    return validateWithGroq(prompt);
  }
  if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
    return validateWithOpenRouter(prompt);
  }
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
    return validateWithGemini(prompt);
  }
  if (process.env.OPENAI_API_KEY) return validateWithOpenAI(prompt);
  if (process.env.OPENROUTER_API_KEY) return validateWithOpenRouter(prompt);
  if (process.env.GROQ_API_KEY) return validateWithGroq(prompt);

  throw new Error("No AI provider configured for medicine validation");
}

export async function validateExtractedMedicines(
  scan: Pick<ScanResult, "diagnosis" | "medicines" | "medicineTranscription">
): Promise<MedicineValidation[]> {
  if (!scan.medicines.length) return [];

  const prompt = buildValidationPrompt(scan);
  const content = await runValidationPrompt(prompt);
  const parsed = parseJsonResponse<{ validations?: MedicineValidation[] }>(
    content
  );

  const validations = Array.isArray(parsed.validations)
    ? parsed.validations.map(normalizeValidation).filter((v) => v.name)
    : [];

  if (validations.length === scan.medicines.length) {
    return validations;
  }

  const byName = new Map(
    validations.map((validation) => [
      validation.name.toLowerCase(),
      validation,
    ])
  );

  return scan.medicines.map((med) => {
    const match = byName.get(med.name.toLowerCase());
    return (
      match ?? {
        name: med.name,
        status: "uncertain" as const,
        confidence: 0,
        note: "Could not validate this medicine automatically.",
      }
    );
  });
}
