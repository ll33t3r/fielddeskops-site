import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logError } from "../../../utils/logger";

const FEEDBACK_TO = "fielddeskops@gmail.com";
const RESEND_API_URL = "https://api.resend.com/emails";

export async function POST(request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json(
        { error: "Please enter your feedback or problem description." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logError("Feedback API missing RESEND_API_KEY", null);
      return NextResponse.json(
        { error: "Feedback is not configured. Please try again later or email us directly." },
        { status: 503 }
      );
    }

    let userEmail = null;
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) userEmail = user.email;
    } catch {
      // optional: continue without user email
    }

    const fromName = "FieldDeskOps Feedback";
    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const from = `${fromName} <${fromAddress}>`;
    const subject = `[Report a problem] ${userEmail ? `From ${userEmail}` : "Anonymous"}`;
    const text = [
      userEmail ? `From: ${userEmail}` : "From: (not signed in)",
      "",
      "Message:",
      message,
    ].join("\n");
    const html = `<p><strong>From:</strong> ${userEmail || "(not signed in)"}</p><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(message)}</pre>`;

    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [FEEDBACK_TO],
        subject,
        text,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      logError("Feedback send failed", null, { status: res.status, data });
      return NextResponse.json(
        { error: data?.message || "Failed to send feedback. Please try again or email us directly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("Feedback API error", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email fielddeskops@gmail.com." },
      { status: 500 }
    );
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
