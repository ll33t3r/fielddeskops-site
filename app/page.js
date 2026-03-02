import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
