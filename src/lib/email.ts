interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  userName: string;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
}: SendPasswordResetEmailParams): Promise<{ sent: boolean; devLink?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "RxBox <onboarding@resend.dev>";

  const subject = "Reset your RxBox password";
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f766e;">Reset your password</h2>
      <p>Hi ${escapeHtml(userName)},</p>
      <p>We received a request to reset your RxBox password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      <p style="margin: 32px 0;">
        <a href="${resetUrl}" style="background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
          Reset password
        </a>
      </p>
      <p style="color: #64748b; font-size: 14px;">
        If you did not request this, you can safely ignore this email.
      </p>
      <p style="color: #64748b; font-size: 12px; word-break: break-all;">
        Or copy this link: ${resetUrl}
      </p>
    </div>
  `.trim();

  if (!apiKey) {
    console.info("[password-reset] RESEND_API_KEY not set. Reset link:", resetUrl);
    return { sent: false, devLink: resetUrl };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[password-reset] Resend error:", res.status, body);
    throw new Error("Failed to send reset email");
  }

  return { sent: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
