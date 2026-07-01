import { normalizeWhatsAppPhoneNumber } from "@/lib/invite-links";

function getWhatsAppConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName =
    process.env.WHATSAPP_INVITE_TEMPLATE ?? "family_invite";
  const templateLanguage =
    process.env.WHATSAPP_INVITE_TEMPLATE_LANGUAGE ?? "en";

  return { accessToken, phoneNumberId, templateName, templateLanguage };
}

export function isWhatsAppConfigured(): boolean {
  const { accessToken, phoneNumberId } = getWhatsAppConfig();
  return Boolean(accessToken && phoneNumberId);
}

function formatWhatsAppError(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Failed to send WhatsApp invite";
  }

  const error = (payload as { error?: { message?: string; error_user_msg?: string } })
    .error;
  return (
    error?.error_user_msg ||
    error?.message ||
    "Failed to send WhatsApp invite"
  );
}

export async function sendWhatsAppInviteMessage(params: {
  phoneNumber: string;
  familyName: string;
  inviteUrl: string;
}): Promise<void> {
  const { accessToken, phoneNumberId, templateName, templateLanguage } =
    getWhatsAppConfig();

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      "WhatsApp Business API is not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
    );
  }

  const to = normalizeWhatsAppPhoneNumber(params.phoneNumber);
  if (!to) {
    throw new Error("Enter a valid 10-digit mobile number after +91");
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";
  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: params.familyName },
                { type: "text", text: params.inviteUrl },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(formatWhatsAppError(payload));
  }
}
