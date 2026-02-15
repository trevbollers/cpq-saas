// app/(public-pages)/register/actions.ts
"use server";

import { z } from "zod";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const registrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Name is required"),
});

export async function registerUser(formData: FormData) {
  const supabaseSSR = createSupabaseSSRClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  };

  const parsed = registrationSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, displayName } = parsed.data;

  // 1) Sign up using SSR client (sets auth cookies)
  const { data: signUpData, error: signUpError } =
    await supabaseSSR.auth.signUp({
      email,
      password,
    });

  if (signUpError || !signUpData?.user) {
    console.error("Supabase signUp error:", signUpError);
    return {
      success: false as const,
      errors: {
        email: ["Failed to create user account. Please try again."],
      },
    };
  }

  const userId = signUpData.user.id;

  // 2) Insert into profiles using admin client (bypasses RLS for now)
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    user_id: userId,
    tenant_id: null, // will be set after plan selection / tenant creation
    role: "user",
    display_name: displayName,
  });

  if (profileError) {
    console.error("Profile insert error:", profileError);
    return {
      success: false as const,
      errors: {
        general: [
          "Account created, but failed to create profile. Please contact support.",
        ],
      },
    };
  }

  return {
    success: true as const,
  };
}
