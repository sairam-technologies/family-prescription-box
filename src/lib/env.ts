/**
 * Environment variables required by the app.
 * Used for documentation and optional runtime validation.
 */
export const env = {
  databaseUrl: process.env.DATABASE_URL,
  authSecret: process.env.AUTH_SECRET,
  authUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
  openaiApiKey: process.env.OPENAI_API_KEY,
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
  "OPENAI_API_KEY",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;
