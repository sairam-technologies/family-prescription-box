import OpenAI from "openai";
import { scanWithVision } from "@/lib/ai/vision-scan";

/** Best OpenRouter vision models for prescription OCR / handwriting (newest first). */
export const OPENROUTER_VISION_MODELS = [
  "qwen/qwen3-vl-235b-a22b-instruct",
  "qwen/qwen3-vl-32b-instruct",
  "qwen/qwen2.5-vl-72b-instruct",
] as const;

const DEFAULT_VISION_MODEL = OPENROUTER_VISION_MODELS[0];

let client: OpenAI | null = null;

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Get a key from openrouter.ai/keys."
    );
  }
  return apiKey;
}

function getClient() {
  if (!client) {
    const headers: Record<string, string> = {};
    const referer = process.env.OPENROUTER_SITE_URL?.trim();
    const title = process.env.OPENROUTER_APP_NAME?.trim() ?? "RxBox";

    if (referer) headers["HTTP-Referer"] = referer;
    if (title) headers["X-OpenRouter-Title"] = title;

    client = new OpenAI({
      apiKey: getOpenRouterApiKey(),
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: headers,
    });
  }
  return client;
}

function getModelCandidates(): string[] {
  const preferred = process.env.OPENROUTER_MODEL?.trim();
  const models = preferred
    ? [preferred, ...OPENROUTER_VISION_MODELS.filter((m) => m !== preferred)]
    : [...OPENROUTER_VISION_MODELS];
  return [...new Set(models)];
}

function getTextModel(model: string) {
  return process.env.OPENROUTER_TEXT_MODEL?.trim() ?? model;
}

async function scanWithModel(
  model: string,
  imageUrl: string
) {
  return scanWithVision(
    {
      label: "OpenRouter",
      getClient,
      getVisionModel: () => model,
      getTextModel: () => getTextModel(model),
      useHighDetail: false,
    },
    imageUrl
  );
}

export async function scanWithOpenRouter(imageUrl: string) {
  const models = getModelCandidates();
  let lastError: unknown;

  for (const model of models) {
    try {
      return await scanWithModel(model, imageUrl);
    } catch (error) {
      lastError = error;
      console.warn(`OpenRouter model ${model} failed, trying next...`, error);
    }
  }

  throw lastError;
}

export function getDefaultOpenRouterModel() {
  return DEFAULT_VISION_MODEL;
}
