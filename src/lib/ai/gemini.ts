import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  FULL_EXTRACT_PROMPT,
  PARSE_MEDICINES_PROMPT,
  VERIFY_MEDICINES_PROMPT,
} from "@/lib/ai/prompts";
import {
  dedupeMedicines,
  normalizeTranscription,
  parseImageInput,
  parseJsonResponse,
  toScanResult,
  type FullExtractResult,
  type ScanResult,
} from "@/lib/ai/parse";
import { formatAiScanError, runWithRetry } from "@/lib/ai/errors";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

function getGeminiApiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Get a key from aistudio.google.com/apikey."
    );
  }
  return apiKey;
}

function getModelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const models = preferred
    ? [preferred, ...GEMINI_MODELS.filter((m) => m !== preferred)]
    : [...GEMINI_MODELS];
  return [...new Set(models)];
}

function getClient() {
  return new GoogleGenerativeAI(getGeminiApiKey());
}

async function generateVision(
  modelName: string,
  mimeType: string,
  base64Data: string,
  prompt: string
): Promise<string> {
  return runWithRetry(async () => {
    const model = getClient().getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        temperature: 0,
      },
    });

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data: base64Data } },
    ]);

    const content = result.response.text();
    if (!content) {
      throw new Error("No response from AI scanner");
    }
    return content;
  }, `Gemini ${modelName}`);
}

async function generateText(
  modelName: string,
  prompt: string
): Promise<string> {
  const model = getClient().getGenerativeModel({
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
    throw new Error("No response from AI scanner");
  }
  return content;
}

async function scanWithModel(
  modelName: string,
  dataUrl: string,
  mimeType: string,
  base64Data: string
): Promise<ScanResult> {
  const extracted = parseJsonResponse<FullExtractResult>(
    await generateVision(modelName, mimeType, base64Data, FULL_EXTRACT_PROMPT)
  );

  let medicineTranscription = normalizeTranscription(
    extracted.medicineTranscription
  );
  let medicines = dedupeMedicines(
    Array.isArray(extracted.medicines) ? extracted.medicines : []
  );

  if (!medicines.length && medicineTranscription) {
    const parsed = parseJsonResponse<{ medicines?: ScanResult["medicines"] }>(
      await generateText(
        modelName,
        `${PARSE_MEDICINES_PROMPT}\n\nTranscription:\n"""\n${medicineTranscription}\n"""`
      )
    );
    medicines = dedupeMedicines(
      Array.isArray(parsed.medicines) ? parsed.medicines : []
    );
  }

  try {
    const draftSummary = JSON.stringify(
      { medicineTranscription, medicines },
      null,
      2
    );
    const verified = parseJsonResponse<FullExtractResult>(
      await generateVision(
        modelName,
        mimeType,
        base64Data,
        `${VERIFY_MEDICINES_PROMPT}\n\nDraft extraction (may be wrong):\n${draftSummary}`
      )
    );

    const verifiedTranscription = normalizeTranscription(
      verified.medicineTranscription
    );
    if (verifiedTranscription) {
      medicineTranscription = verifiedTranscription;
    }
    if (Array.isArray(verified.medicines) && verified.medicines.length > 0) {
      medicines = dedupeMedicines(verified.medicines);
    }
  } catch (verifyError) {
    console.warn("Gemini verification skipped:", verifyError);
  }

  return toScanResult(extracted, medicineTranscription, medicines);
}

export async function scanWithGemini(imageUrl: string): Promise<ScanResult> {
  const { mimeType, base64Data, dataUrl } = parseImageInput(imageUrl);
  const models = getModelCandidates();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      return await scanWithModel(modelName, dataUrl, mimeType, base64Data);
    } catch (error) {
      lastError = error;
      console.warn(`Gemini model ${modelName} failed, trying next...`, error);
    }
  }

  throw new Error(formatAiScanError(lastError));
}
