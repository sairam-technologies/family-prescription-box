import { headers } from "next/headers";

/** NextAuth expects the app origin only — no path (e.g. no /login). */
export function normalizeAppBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.split("/login")[0]?.replace(/\/$/, "") || trimmed;
  }
}

export function getConfiguredAppBaseUrl(): string | undefined {
  const fromEnv = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  return fromEnv ? normalizeAppBaseUrl(fromEnv) : undefined;
}

/** Ensure NextAuth env vars use origin only (fixes misconfigured /login suffix). */
export function syncAuthEnvUrls(): void {
  const base = getConfiguredAppBaseUrl();
  if (!base) return;
  process.env.AUTH_URL = base;
  process.env.NEXTAUTH_URL = base;
}

export async function getAppBaseUrl(): Promise<string> {
  const fromEnv = getConfiguredAppBaseUrl();
  if (fromEnv) {
    return fromEnv;
  }

  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}
