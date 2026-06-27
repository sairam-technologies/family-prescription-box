/**
 * Environment variables required by the app.
 * Used for documentation and optional runtime validation.
 */
export const env = {
  databaseUrl: process.env.DATABASE_URL,
  authSecret: process.env.AUTH_SECRET,
  authUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
  aiProvider: process.env.AI_PROVIDER ?? "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel:
    process.env.OPENROUTER_MODEL ?? "qwen/qwen3-vl-235b-a22b-instruct",
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel:
    process.env.GROQ_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct",
  groqTextModel: process.env.GROQ_TEXT_MODEL ?? "llama-3.3-70b-versatile",
  r2: {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME ?? "rxbox-prescriptions",
    publicUrl: process.env.R2_PUBLIC_URL,
  },
} as const;

/** Variable names to configure in Vercel (see scripts/sync-vercel-env.sh) */
export const VERCEL_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXTAUTH_URL",
  "AUTH_TRUST_HOST",
  "AI_PROVIDER",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "GROQ_API_KEY",
  "GROQ_MODEL",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;
