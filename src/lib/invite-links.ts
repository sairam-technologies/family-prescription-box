export function buildFamilyInviteUrl(
  baseUrl: string,
  inviteCode: string
): string {
  const url = new URL("/register", baseUrl.replace(/\/$/, ""));
  url.searchParams.set("code", inviteCode.toUpperCase());
  return url.toString();
}

export function buildFamilyInviteMessage(
  baseUrl: string,
  familyName: string,
  inviteCode: string
): string {
  const inviteUrl = buildFamilyInviteUrl(baseUrl, inviteCode);
  return `Join ${familyName} on RxBox (Family Prescription Manager).\n\nCreate your account here:\n${inviteUrl}`;
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Digits only, with optional auto-prefix for 10-digit Indian numbers. */
export function normalizeWhatsAppPhoneNumber(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

export function buildWhatsAppDirectUrl(
  phoneNumber: string,
  message: string
): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export function buildFamilyInviteWhatsAppUrl(
  baseUrl: string,
  familyName: string,
  inviteCode: string
): string {
  return buildWhatsAppShareUrl(
    buildFamilyInviteMessage(baseUrl, familyName, inviteCode)
  );
}

export function buildFamilyInviteWhatsAppUrlForPhone(
  phoneNumber: string,
  baseUrl: string,
  familyName: string,
  inviteCode: string
): string | null {
  const normalized = normalizeWhatsAppPhoneNumber(phoneNumber);
  if (!normalized) return null;

  return buildWhatsAppDirectUrl(
    normalized,
    buildFamilyInviteMessage(baseUrl, familyName, inviteCode)
  );
}
