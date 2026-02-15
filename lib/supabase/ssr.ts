// lib/supabase/ssr.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function createSupabaseSSRClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // set/remove will be used by Supabase Auth to manage the session cookie
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Handle SSG context where cookies can't be set
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete(name);
          } catch (error) {
            // Handle SSG context where cookies can't be deleted
          }
        },
      },
    },
  );
}
