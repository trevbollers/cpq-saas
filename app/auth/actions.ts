// app/auth/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";

export async function logoutUser() {
  const supabase = await createSupabaseSSRClient();
  await supabase.auth.signOut();
  redirect("/login");
}
