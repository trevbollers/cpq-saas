// app/auth/callback/route.ts
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/check-email";

  if (code) {
    const supabase = await createSupabaseSSRClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Email verified successfully, redirect to next page
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If error or no code, redirect to error page
  return NextResponse.redirect(
    new URL("/auth/error?message=Email verification failed", requestUrl.origin),
  );
}
