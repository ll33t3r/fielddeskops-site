import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = createClient();
  let session = null;
  try {
    const {
      data: { session: activeSession },
      error,
    } = await supabase.auth.getSession();
    session = error ? null : activeSession;
  } catch {
    session = null;
  }

  if (session) {
    redirect("/dashboard");
  }
  redirect("/welcome");
}
