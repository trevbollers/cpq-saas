// app/(public-pages)/register/actions.ts
"use server";

import { z } from "zod";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const PASSWORD_REGEX = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;

const registrationSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must include uppercase, lowercase, number, and symbol",
    ),
  displayName: z.string().min(2, "Name is required"),
});

export async function registerUser(formData: FormData) {
  const supabaseSSR = await createSupabaseSSRClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const raw = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    displayName: formData.get("displayName")?.toString() ?? "",
  };

  const parsed = registrationSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, displayName } = parsed.data;

  // 1) Use standard Supabase signUp (sends verification email)
  const { data: signUpData, error: signUpError } =
    await supabaseSSR.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

  if (signUpError || !signUpData?.user) {
    console.error("Supabase signUp error:", signUpError);
    return {
      success: false as const,
      errors: {
        email: [signUpError?.message || "Failed to create user account"],
      },
    };
  }

  const userId = signUpData.user.id;

  // 2) Insert into profiles using admin client (bypasses RLS)
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    user_id: userId,
    tenant_id: null,
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

export async function resendConfirmation(formData: FormData) {
  const email = formData.get("email")?.toString();
  if (!email) {
    return { success: false as const, message: "Email is required" };
  }
  // Temporarily disable sending emails. Queue the request locally for later processing.
  try {
    const fs = await import("fs/promises");
    const path = "supabase/pending_email_sends.log";
    const entry = JSON.stringify({ email, queuedAt: new Date().toISOString() });
    await fs.appendFile(path, entry + "\n");
    // Return success so UI flows proceed; actual sending will be implemented later.
    return {
      success: true as const,
      message:
        "Confirmation request queued — email sending is disabled in this environment.",
    };
  } catch (err) {
    console.error("Failed to queue confirmation request:", err);
    return {
      success: false as const,
      message: "Failed to queue confirmation.",
    };
  }
}
