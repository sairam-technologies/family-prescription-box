import Groq from "groq-sdk";
import {
  PARSE_MEDICINES_PROMPT,
  TRANSCRIBE_PROMPT,
  VERIFY_MEDICINES_PROMPT,
} from "@/lib/ai/prompts";
import {
  dedupeMedicines,
  normalizeTranscription,
  parseImageInput,
  parseJsonResponse,
  toScanResult,
  type ScanResult,
  type TranscriptionResult,
} from "@/lib/ai/parse";
import { formatAiScanError, runWithRetry } from "@/lib/ai/errors";

const VISION_MODELS = ["meta-llama/llama-4-scout-17b-16e-instruct"] as const;
const TEXT_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] as const;

function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured. Get a key from console.groq.com/keys."
    );
  }
  return apiKey;
}

function getVisionModelCandidates(): string[] {
  const preferred = process.env.GROQ_MODEL?.trim();
  const models = preferred
    ? [preferred, ...VISION_MODELS.filter((m) => m !== preferred)]
    : [...VISION_MODELS];
  return [...new Set(models)];
}

function getTextModelCandidates(): string[] {
  const preferred = process.env.GROQ_TEXT_MODEL?.trim();
  const models = preferred
    ? [preferred, ...TEXT_MODELS.filter((m) => m !== preferred)]
    : [...TEXT_MODELS];
  return [...new Set(models)];
}

let groqClient: Groq | null = null;

function getClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: getGroqApiKey() });
  }
  return groqClient;
}

async function chatWithModel(
  modelName: string,
  messages: Groq.Chat.ChatCompletionMessageParam[],
  jsonMode = true
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: modelName,
    messages,
    temperature: 0,
    max_tokens: 4096,
    response_format: jsonMode ? { type: "json_object" } : undefined,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI scanner");
  }
  return content;
}

async function runWithModelFallback<T>(
  models: string[],
  run: (modelName: string) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (const modelName of models) {
    try {
      return await runWithRetry(() => run(modelName), `Groq ${modelName}`);
    } catch (error) {
      lastError = error;
      console.error(`Groq model ${modelName} failed, trying next...`, error);
    }
  }

  throw new Error(formatAiScanError(lastError));
}

async function generateVision(
  modelName: string,
  textPrompt: string,
  dataUrl: string
): Promise<string> {
  return chatWithModel(modelName, [
    {
      role: "user",
      content: [
        { type: "text", text: textPrompt },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ]);
}

async function generateText(modelName: string, textPrompt: string): Promise<string> {
  return chatWithModel(modelName, [{ role: "user", content: textPrompt }]);
}

export async function scanWithGroq(imageUrl: string): Promise<ScanResult> {
  const { dataUrl } = parseImageInput(imageUrl);

  const transcription = await runWithModelFallback(
    getVisionModelCandidates(),
    async (modelName) => {
      const content = await generateVision(modelName, TRANSCRIBE_PROMPT, dataUrl);
      return parseJsonResponse<TranscriptionResult>(content);
    }
  );

  let medicineTranscription = normalizeTranscription(
    transcription.medicineTranscription
  );
  let medicines = await runWithModelFallback(
    getTextModelCandidates(),
    async (modelName) => {
      if (!medicineTranscription) return [];
      const content = await generateText(
        modelName,
        `${PARSE_MEDICINES_PROMPT}\n\nTranscription:\n"""\n${medicineTranscription}\n"""`
      );
      const parsed = parseJsonResponse<{ medicines?: ScanResult["medicines"] }>(
        content
      );
      return dedupeMedicines(Array.isArray(parsed.medicines) ? parsed.medicines : []);
    }
  );

  try {
    const draftSummary = JSON.stringify(
      { medicineTranscription, medicines },
      null,
      2
    );
    const verified = await runWithModelFallback(
      getVisionModelCandidates(),
      async (modelName) => {
        const content = await generateVision(
          modelName,
          `${VERIFY_MEDICINES_PROMPT}\n\nDraft extraction (may be wrong):\n${draftSummary}`,
          dataUrl
        );
        return parseJsonResponse<{
          medicineTranscription?: string;
          medicines?: ScanResult["medicines"];
        }>(content);
      }
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
    console.warn("Groq verification skipped:", verifyError);
  }

  return toScanResult(transcription, medicineTranscription, medicines);
}
