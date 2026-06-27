export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error: unknown): number | null {
  if (!(error instanceof Error)) return null;

  const status = (error as Error & { status?: number }).status;
  if (status) return status;

  const match = error.message.match(/\[(\d{3})\s*\]/);
  return match ? Number(match[1]) : null;
}

function getRetryDelayMs(error: unknown, attempt: number): number | null {
  if (!(error instanceof Error)) return null;

  const retryMatch = error.message.match(/retry in ([\d.]+)s/i);
  if (retryMatch) {
    return Math.ceil(Number(retryMatch[1]) * 1000);
  }

  const status = getErrorStatus(error);
  if (status === 429) return 3000 + attempt * 1000;
  if (status === 503) return 2000 + attempt * 1500;
  if (status === 502 || status === 504) return 2000 + attempt * 1000;

  if (isTransientError(error)) {
    return 1500 + attempt * 1000;
  }

  return null;
}

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const status = getErrorStatus(error);
  if (status && [500, 502, 503, 504, 429].includes(status)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("unavailable") ||
    message.includes("try again later") ||
    message.includes("rate limit")
  );
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("exceeded")
  );
}

export function formatAiScanError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "AI scan failed";
  }

  const message = error.message;

  if (
    message.includes("OPENAI_API_KEY") ||
    message.includes("GROQ_API_KEY") ||
    message.includes("OPENROUTER_API_KEY") ||
    message.includes("GEMINI_API_KEY")
  ) {
    return message;
  }

  if (message.includes("limit: 0")) {
    return "Gemini free-tier quota is not active. Create a key at aistudio.google.com/apikey or enable billing on Google Cloud.";
  }

  if (message.includes("model_not_found") || message.includes("does not exist")) {
    return "AI model not found. For Gemini use GEMINI_MODEL=gemini-2.5-flash.";
  }

  if (message.includes("[503]") || message.toLowerCase().includes("unavailable")) {
    return "AI service is temporarily busy. Wait a moment and tap Re-scan.";
  }

  if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
    return "AI rate limit reached. Wait a minute and use Re-scan.";
  }

  return `AI scan failed: ${message.split("\n")[0]}`;
}

/** @deprecated Use formatAiScanError */
export const formatGeminiError = formatAiScanError;

const MAX_ATTEMPTS = 3;

export async function runWithRetry<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const canRetry = isTransientError(error) || isQuotaError(error);
      const retryDelay = getRetryDelayMs(error, attempt);

      if (canRetry && attempt < MAX_ATTEMPTS - 1) {
        console.warn(`${label} retry ${attempt + 1}/${MAX_ATTEMPTS}`);
        await sleep(retryDelay ?? 1500 * (attempt + 1));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
