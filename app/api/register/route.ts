// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import {
  createSupabaseAdminClient,
  updateUserClaims,
} from "@/lib/supabase/admin";

// Validation schema
const registrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Name is required"),
});

export async function POST(req: NextRequest) {
  // 1) Parse JSON body
  const json = await req.json().catch(() => null);

  const parsed = registrationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false as const,
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, password, displayName } = parsed.data;

  // 2) Anon Supabase client for auth.signUp (this sends the email)
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      // This URL *must* be allowed in Supabase Auth → URL config
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (signUpError || !signUpData?.user) {
    console.error("Supabase signUp error:", signUpError);
    return NextResponse.json(
      {
        success: false as const,
        errors: {
          email: [
            signUpError?.message ??
              "Failed to create user account. Please try again.",
          ],
        },
      },
      { status: 400 },
    );
  }

  const user = signUpData.user;
  const userId = user.id;

  // 3) Use ADMIN client (service role) for profiles + claims
  const supabaseAdmin = createSupabaseAdminClient();

  // 3a) Insert profile row
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    user_id: userId,
    tenant_id: null,
    role: "user",
    display_name: displayName,
  });

  if (profileError) {
    console.error("Profile insert error:", profileError);
    return NextResponse.json(
      {
        success: false as const,
        errors: {
          general: [
            "Account created, but failed to create profile. Please contact support.",
          ],
        },
      },
      { status: 500 },
    );
  }

  // 3b) Set initial claims
  await updateUserClaims(userId, {
    tenantId: null,
    role: "user",
  });

  // 4) Respond
  return NextResponse.json(
    {
      success: true as const,
      userId,
    },
    { status: 200 },
  );
}
