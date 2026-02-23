// lib/supabase/load-tenant.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoadTenantError =
  | "NOT_AUTHENTICATED"
  | "TENANT_NOT_FOUND"
  | "UNAUTHORIZED";

type LoadTenantResult =
  | {
      tenant: {
        id: string;
        slug: string;
        name: string;
        plan_id: string | null;
        status: string;
      };
      user: {
        id: string;
        email?: string;
        [key: string]: any;
      };
      role: string;
    }
  | { error: LoadTenantError };

export async function loadTenant(
  tenantSlug: string,
): Promise<LoadTenantResult> {
  const supabase = await createSupabaseServerClient();

  // 1) Get current user from Supabase session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "NOT_AUTHENTICATED" };
  }

  // 2) Load tenant by slug
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name, plan_id, status")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    return { error: "TENANT_NOT_FOUND" };
  }

  // 3) Verify that the user is a member of this tenant
  const { data: membership, error: membershipError } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return { error: "UNAUTHORIZED" };
  }

  return {
    tenant,
    user,
    role: membership.role,
  };
}
