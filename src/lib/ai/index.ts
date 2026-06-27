import { scanWithGemini } from "@/lib/ai/gemini";
import { scanWithGroq } from "@/lib/ai/groq";
import { scanWithOpenAI } from "@/lib/ai/openai";
import { scanWithOpenRouter } from "@/lib/ai/openrouter";
import { validateExtractedMedicines } from "@/lib/ai/validate-medicines";
import type { ScanResult } from "@/lib/ai/parse";

export type {
  ScanResult,
  MedicineValidation,
  MedicineValidationStatus,
  FamilyMedicineMatch,
} from "@/lib/ai/parse";
export { formatAiScanError, formatGeminiError } from "@/lib/ai/errors";

export type AiProvider = "gemini" | "openrouter" | "openai" | "groq";

function resolveProvider(): AiProvider {
  const configured = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (
    configured === "gemini" ||
    configured === "openrouter" ||
    configured === "openai" ||
    configured === "groq"
  ) {
    return configured;
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
    return "gemini";
  }
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GROQ_API_KEY) return "groq";

  return "gemini";
}

async function enrichScanResult(result: ScanResult): Promise<ScanResult> {
  if (process.env.AI_VALIDATE_MEDICINES === "false") {
    return result;
  }

  try {
    const medicineValidations = await validateExtractedMedicines(result);
    return { ...result, medicineValidations };
  } catch (error) {
    console.warn("Medicine validation skipped:", error);
    return result;
  }
}

export async function scanPrescriptionImage(
  imageUrl: string
): Promise<ScanResult> {
  const provider = resolveProvider();
  let result: ScanResult;

  switch (provider) {
    case "groq":
      result = await scanWithGroq(imageUrl);
      break;
    case "openai":
      result = await scanWithOpenAI(imageUrl);
      break;
    case "openrouter":
      result = await scanWithOpenRouter(imageUrl);
      break;
    case "gemini":
    default:
      result = await scanWithGemini(imageUrl);
      break;
  }

  return enrichScanResult(result);
}
