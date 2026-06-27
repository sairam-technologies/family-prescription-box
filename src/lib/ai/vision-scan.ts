import type OpenAI from "openai";
import {
  FULL_EXTRACT_PROMPT,
  PARSE_MEDICINES_PROMPT,
  VERIFY_MEDICINES_PROMPT,
} from "@/lib/ai/prompts";
import {
  dedupeMedicines,
  normalizeTranscription,
  parseJsonResponse,
  toScanResult,
  type FullExtractResult,
  type ScanResult,
} from "@/lib/ai/parse";
import { runWithRetry } from "@/lib/ai/errors";

export interface VisionScanConfig {
  label: string;
  getClient: () => OpenAI;
  getVisionModel: () => string;
  getTextModel: () => string;
  useHighDetail?: boolean;
}

async function visionExtract(
  config: VisionScanConfig,
  dataUrl: string,
  prompt: string
): Promise<string> {
  return runWithRetry(async () => {
    const imageUrl = config.useHighDetail
      ? { url: dataUrl, detail: "high" as const }
      : { url: dataUrl };

    const response = await config.getClient().chat.completions.create({
      model: config.getVisionModel(),
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: imageUrl },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI scanner");
    }
    return content;
  }, `${config.label} ${config.getVisionModel()}`);
}

async function parseMedicinesText(
  config: VisionScanConfig,
  transcription: string
): Promise<ScanResult["medicines"]> {
  const response = await config.getClient().chat.completions.create({
    model: config.getTextModel(),
    temperature: 0,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `${PARSE_MEDICINES_PROMPT}\n\nTranscription:\n"""\n${transcription}\n"""`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = parseJsonResponse<{ medicines?: ScanResult["medicines"] }>(
    content
  );
  return dedupeMedicines(Array.isArray(parsed.medicines) ? parsed.medicines : []);
}

export async function scanWithVision(
  config: VisionScanConfig,
  imageUrl: string
): Promise<ScanResult> {
  const extracted = parseJsonResponse<FullExtractResult>(
    await visionExtract(config, imageUrl, FULL_EXTRACT_PROMPT)
  );

  let medicineTranscription = normalizeTranscription(
    extracted.medicineTranscription
  );
  let medicines = dedupeMedicines(
    Array.isArray(extracted.medicines) ? extracted.medicines : []
  );

  if (!medicines.length && medicineTranscription) {
    medicines = await parseMedicinesText(config, medicineTranscription);
  }

  try {
    const draftSummary = JSON.stringify(
      { medicineTranscription, medicines },
      null,
      2
    );
    const verified = parseJsonResponse<FullExtractResult>(
      await visionExtract(
        config,
        imageUrl,
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
    console.warn(`${config.label} verification skipped:`, verifyError);
  }

  return toScanResult(extracted, medicineTranscription, medicines);
}
