import { Resend } from "resend";

type WelcomeEmailInput = {
  to: string;
};

function buildWelcomeEmailHtml(recipientEmail: string): string {
  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #f3f4f6; background:#0f1115; padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#161a22;border:1px solid #2b313d;border-radius:14px;padding:24px;">
        <p style="margin:0 0 10px 0;font-size:12px;letter-spacing:.15em;color:#FF6700;font-weight:700;">FIELDDESKOPS</p>
        <h1 style="margin:0 0 12px 0;font-size:28px;line-height:1.1;color:#ffffff;">Welcome to FieldDeskOps</h1>
        <p style="margin:0 0 14px 0;color:#b9c0cc;font-size:15px;line-height:1.5;">
          Your account is ready. You can now run your field workflow across ProfitLock, LoadOut, SiteSnap, and SignOff.
        </p>
        <p style="margin:0 0 14px 0;color:#b9c0cc;font-size:15px;line-height:1.5;">
          Signed up as: <strong style="color:#ffffff;">${recipientEmail}</strong>
        </p>
        <p style="margin:0;color:#8f98a8;font-size:13px;">
          Need help? Reply to this email or contact fielddeskops@gmail.com.
        </p>
      </div>
    </div>
  `;
}

export async function sendWelcomeEmail({ to }: WelcomeEmailInput): Promise<{ sent: boolean; skipped: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, skipped: true };
  }

  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  await resend.emails.send({
    from: `FieldDeskOps <${fromAddress}>`,
    to: [to],
    subject: "Welcome to FieldDeskOps",
    html: buildWelcomeEmailHtml(to),
  });

  return { sent: true, skipped: false };
}
