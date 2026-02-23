// lib/supabase/ssr.ts
// ---------------------------------------------------------------------------
// SSR Supabase client
// - Uses ANON key + cookies()
// - This is what you use in server components and server actions that run
//   under RLS (dashboard, normal queries).
// ---------------------------------------------------------------------------

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

export async function createSupabaseSSRClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Can't set cookies in some static contexts; ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete(name);
          } catch {
            // Can't delete cookies in some static contexts; ignore
          }
        },
      },
    },
  );
}
