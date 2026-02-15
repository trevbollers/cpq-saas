// TODO: selectPlan server action (SuperTask 3.2)
// app/(public-pages)/select-plan/actions.ts
"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const selectPlanSchema = z.object({
  planId: z.string().uuid("Invalid plan selected"),
  tenantName: z.string().min(2, "Company / tenant name is required"),
  userId: z.string().uuid("Invalid user"),
});

export async function selectPlan(formData: FormData) {
  const supabase = createSupabaseServerClient();

  const raw = {
    planId: formData.get("planId"),
    tenantName: formData.get("tenantName"),
    userId: formData.get("userId"),
  };

  const parsed = selectPlanSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { planId, tenantName, userId } = parsed.data;

  // 1) Ensure plan exists and is active
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    console.error("Plan lookup error:", planError);
    return {
      success: false as const,
      errors: { planId: ["Selected plan is not available."] },
    };
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
    return {
      success: false as const,
      errors: { general: ["Failed to create tenant. Please try again."] },
    };
  }

  const tenantId = tenantData.id as string;

  // 3) Create subscription (initial "active" or "trialing")
  const { error: subError } = await supabase.from("subscriptions").insert({
    tenant_id: tenantId,
    plan_id: planId,
    status: "active", // or 'trialing' if you want a trial period
  });

  if (subError) {
    console.error("Subscription creation error:", subError);
    return {
      success: false as const,
      errors: { general: ["Failed to create subscription."] },
    };
  }

  // 4) Update user profile → link to tenant and make admin
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      tenant_id: tenantId,
      role: "admin",
    })
    .eq("user_id", userId);

  if (profileError) {
    console.error("Profile update error:", profileError);
    return {
      success: false as const,
      errors: { general: ["Failed to link user to tenant."] },
    };
  }

  return {
    success: true as const,
    tenantId,
    planId,
  };
}
