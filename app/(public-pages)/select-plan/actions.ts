// app/(public-pages)/select-plan/actions.ts
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";

const selectPlanSchema = z.object({
  planId: z.string().uuid("Invalid plan selected"),
  tenantName: z.string().min(2, "Company / tenant name is required"),
});

export async function selectPlan(formData: FormData) {
  const supabase = createSupabaseSSRClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register");
  }

  const raw = {
    planId: formData.get("planId"),
    tenantName: formData.get("tenantName"),
  };

  const parsed = selectPlanSchema.safeParse(raw);

  if (!parsed.success) {
    console.error("Select plan validation error:", parsed.error.flatten());
    return;
  }

  const { planId, tenantName } = parsed.data;

  // 1) Verify plan is active
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    console.error("Plan lookup error:", planError);
    return;
  }

  // 2) Create tenant
  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      name: tenantName,
      plan_id: planId,
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (tenantError || !tenantData) {
    console.error("Tenant creation error:", tenantError);
    return;
  }

  const tenantId = tenantData.id as string;

  // 3) Create subscription
  const { error: subError } = await supabase.from("subscriptions").insert({
    tenant_id: tenantId,
    plan_id: planId,
    status: "active",
  });

  if (subError) {
    console.error("Subscription creation error:", subError);
    return;
  }

  // 4) Update profile for the **current user** using session-based auth
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      tenant_id: tenantId,
      role: "admin",
    })
    .eq("user_id", user.id);

  if (profileError) {
    console.error("Profile update error:", profileError);
    return;
  }

  // ✅ 5) Redirect to dashboard (session-based, no query params)
  redirect("/dashboard");
}
