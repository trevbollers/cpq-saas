"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server"; // FIX: SSR → server client
import {
  createSupabaseAdminClient,
  updateUserClaims,
} from "@/lib/supabase/admin";

// Utility — clean slug generator
function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const selectPlanSchema = z.object({
  planId: z.string().uuid("Invalid plan selected"),
  tenantName: z.string().min(2, "Company / tenant name is required"),
});

export async function selectPlan(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Get user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false as const,
      errors: { general: ["You must be logged in to select a plan."] },
    };
  }

  const userId = user.id;

  // 2. Validate form input
  const raw = {
    planId: formData.get("planId"),
    tenantName: formData.get("tenantName"),
  };

  const parsed = selectPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { planId, tenantName } = parsed.data;

  // 3. Ensure plan is active
  const { data: plan, error: planError } = await supabaseAdmin
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

  // 4. Generate a unique tenant slug
  let baseSlug = slugify(tenantName);
  let slug = baseSlug;
  let counter = 1;

  // ensure slug uniqueness
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;

    slug = `${baseSlug}-${counter++}`;
  }

  // 5. Create tenant
  const { data: tenantData, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({
      name: tenantName,
      slug,
      plan_id: planId,
      status: "active",
    })
    .select("id, slug")
    .single();

  if (tenantError || !tenantData) {
    console.error("Tenant creation error:", tenantError);
    return {
      success: false as const,
      errors: { general: ["Failed to create tenant. Please try again."] },
    };
  }

  const tenantId = tenantData.id;

  // 6. Create subscription record
  const { error: subError } = await supabaseAdmin.from("subscriptions").insert({
    tenant_id: tenantId,
    plan_id: planId,
    status: "trialing",
  });

  if (subError) {
    console.error("Subscription creation error:", subError);
    return {
      success: false as const,
      errors: { general: ["Failed to create subscription."] },
    };
  }

  // 7. Update profile tenant + role
  const { error: profileError } = await supabaseAdmin
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

  // 8. Update JWT claims for RLS
  await updateUserClaims(userId, {
    tenantId,
    role: "admin",
  });

  // 9. Redirect into the tenant dashboard
  redirect(`/t/${slug}/dashboard`);
}
