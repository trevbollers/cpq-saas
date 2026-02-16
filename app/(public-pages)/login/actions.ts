// app/(public-pages)/login/actions.ts
"use server";

import { z } from "zod";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function signInUser(formData: FormData) {
  const supabaseSSR = await createSupabaseSSRClient();

  const raw = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const parsed = signInSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  const { data, error } = await supabaseSSR.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session) {
    console.error("Sign-in error:", error);
    return {
      success: false as const,
      errors: {
        general: [
          error?.message || "Failed to sign in. Check email and password.",
        ],
      },
    };
  }

  return {
    success: true as const,
  };
}
