import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from "groq-sdk";
import { MEDICAL_REPORT_SCAN_PROMPT } from "@/lib/ai/medical-report-prompts";
import {
  parseMedicalReportScan,
  type MedicalReportScanResult,
} from "@/lib/ai/medical-report-parse";
import { parseImageInput } from "@/lib/ai/parse";
import { formatAiScanError, runWithRetry } from "@/lib/ai/errors";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

function resolveProvider() {
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

async function scanWithGemini(
  mimeType: string,
  base64Data: string
): Promise<MedicalReportScanResult> {
  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const preferred = process.env.GEMINI_MODEL?.trim();
  const models = preferred
    ? [preferred, ...GEMINI_MODELS.filter((m) => m !== preferred)]
    : [...GEMINI_MODELS];

  let lastError: unknown;
  for (const modelName of models) {
    try {
      const content = await runWithRetry(async () => {
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 4096,
            temperature: 0,
          },
        });
        const result = await model.generateContent([
          { text: MEDICAL_REPORT_SCAN_PROMPT },
          { inlineData: { mimeType, data: base64Data } },
        ]);
        const text = result.response.text();
        if (!text) throw new Error("No response from medical report scanner");
        return text;
      }, `Gemini medical report ${modelName}`);

      return parseMedicalReportScan(content);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(formatAiScanError(lastError));
}

async function scanWithOpenAICompatible(
  dataUrl: string,
  getClient: () => OpenAI,
  getModel: () => string,
  label: string
): Promise<MedicalReportScanResult> {
  const content = await runWithRetry(async () => {
    const response = await getClient().chat.completions.create({
      model: getModel(),
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: MEDICAL_REPORT_SCAN_PROMPT },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
    });
    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("No response from medical report scanner");
    return text;
  }, label);

  return parseMedicalReportScan(content);
}

export async function scanMedicalReportImage(
  imageUrl: string
): Promise<MedicalReportScanResult> {
  const { mimeType, base64Data, dataUrl } = parseImageInput(imageUrl);
  const provider = resolveProvider();

  switch (provider) {
    case "openai": {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      return scanWithOpenAICompatible(
        dataUrl,
        () => client,
        () => process.env.OPENAI_MODEL ?? "gpt-4o",
        "OpenAI medical report"
      );
    }
    case "openrouter": {
      const client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseURL: "https://openrouter.ai/api/v1",
      });
      return scanWithOpenAICompatible(
        dataUrl,
        () => client,
        () =>
          process.env.OPENROUTER_MODEL ?? "qwen/qwen3-vl-235b-a22b-instruct",
        "OpenRouter medical report"
      );
    }
    case "groq": {
      const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
      return scanWithOpenAICompatible(
        dataUrl,
        () => client as unknown as OpenAI,
        () =>
          process.env.GROQ_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct",
        "Groq medical report"
      );
    }
    case "gemini":
    default:
      return scanWithGemini(mimeType, base64Data);
  }
}
