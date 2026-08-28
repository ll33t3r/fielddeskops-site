import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  robots: { index: true, follow: true },
}

/**
 * Guest traffic is rewritten to /welcome by middleware (URL stays /).
 * This page only runs if middleware is bypassed; send logged-in users
 * to the dashboard and guests to the marketing page.
 */
export default async function RootPage() {
  const supabase = createClient();
  let user = null;
  try {
    const {
      data: { user: activeUser },
      error,
    } = await supabase.auth.getUser();
    user = error ? null : activeUser;
  } catch {
    user = null;
  }

  if (user) {
    redirect("/dashboard");
  }
  redirect("/welcome");
}
