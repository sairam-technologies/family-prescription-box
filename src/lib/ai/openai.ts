import OpenAI from "openai";
import { scanWithVision } from "@/lib/ai/vision-scan";

let client: OpenAI | null = null;

function getOpenAI() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured. Get a key from platform.openai.com."
      );
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

function getVisionModel() {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}

function getTextModel() {
  return process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini";
}

export async function scanWithOpenAI(imageUrl: string) {
  return scanWithVision(
    {
      label: "OpenAI",
      getClient: getOpenAI,
      getVisionModel,
      getTextModel,
      useHighDetail: true,
    },
    imageUrl
  );
}
