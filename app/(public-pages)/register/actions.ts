// TODO: registerUser server action (SuperTask 3.1)
"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const registrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Name is required"),
});

export async function registerUser(formData: FormData) {
  const supabase = createSupabaseServerClient();

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

  // 1) Create user in Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData?.user) {
    console.error("Supabase Auth error:", authError);
    return {
      success: false as const,
      errors: {
        email: ["Failed to create user account. Please try again."],
      },
    };
  }

  const userId = authData.user.id;

  // 2) Insert into profiles
  const { error: profileError } = await supabase.from("profiles").insert({
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
    userId,
  };
}
