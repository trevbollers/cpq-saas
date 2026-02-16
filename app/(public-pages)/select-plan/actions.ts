"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const selectPlanSchema = z.object({
  planId: z.string().min(1, "Invalid plan selected"),
  tenantName: z.string().min(2, "Company / tenant name is required"),
});

export async function selectPlan(formData: FormData) {
  const supabase = await createSupabaseSSRClient();
  const supabaseAdmin = createSupabaseAdminClient();

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
    redirect("/select-plan");
  }

  const { planId, tenantName } = parsed.data;

  // Verify plan exists and is active (using admin client)
  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    console.error("Plan lookup error:", planError);
    redirect("/select-plan");
  }

  // Create tenant (admin client)
  const { data: tenantData, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({ name: tenantName, plan_id: planId, status: "active" })
    .select("id")
    .maybeSingle();

  if (tenantError || !tenantData) {
    console.error("Tenant creation error:", tenantError);
    redirect("/select-plan");
  }

  const tenantId = tenantData.id as string;

  // Create subscription record
  const { error: subError } = await supabaseAdmin.from("subscriptions").insert({
    tenant_id: tenantId,
    plan_id: planId,
    status: "active",
  });

  if (subError) {
    console.error("Subscription creation error:", subError);
    // attempt cleanup
    await supabaseAdmin.from("tenants").delete().eq("id", tenantId);
    redirect("/select-plan");
  }

  // Update user's profile to set tenant and admin role
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ tenant_id: tenantId, role: "admin" })
    .eq("user_id", user.id);

  if (profileError) {
    console.error("Profile update error:", profileError);
    // cleanup
    await supabaseAdmin
      .from("subscriptions")
      .delete()
      .eq("tenant_id", tenantId);
    await supabaseAdmin.from("tenants").delete().eq("id", tenantId);
    redirect("/select-plan");
  }

  // Success — go to dashboard
  redirect("/dashboard");
}
