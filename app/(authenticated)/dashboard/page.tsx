// app/(authenticated)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";

export default async function DashboardPage() {
  const supabase = createSupabaseSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register"); // or /login once you have it
  }

  // 1) Load profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, display_name, role, tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Profile error:", profileError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-semibold mb-2">Profile not found</h1>
          <p className="text-sm text-slate-600">
            We couldn&apos;t find your profile. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!profile.tenant_id) {
    redirect("/select-plan");
  }

  // 2) Load tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, plan_id, status, created_at")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  if (tenantError || !tenant) {
    console.error("Tenant error:", tenantError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-semibold mb-2">Tenant not found</h1>
          <p className="text-sm text-slate-600">
            We were unable to load your tenant. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // 3) Load plan
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("code, name, price_monthly_cents, features")
    .eq("id", tenant.plan_id)
    .maybeSingle();

  if (planError || !plan) {
    console.error("Plan error:", planError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-semibold mb-2">Plan not found</h1>
          <p className="text-sm text-slate-600">
            We were unable to load your current plan. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  const price =
    plan.price_monthly_cents && plan.price_monthly_cents > 0
      ? `$${(plan.price_monthly_cents / 100).toFixed(0)}/mo`
      : "Free";

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome{profile.display_name ? `, ${profile.display_name}` : ""}{" "}
              👋
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Tenant: <span className="font-semibold">{tenant.name}</span> ·
              Role: <span className="font-semibold">{profile.role}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-slate-500 mb-1">
              Current Plan
            </p>
            <p className="text-sm font-semibold">
              {plan.name}{" "}
              <span className="text-slate-500 text-xs">({plan.code})</span>
            </p>
            <p className="text-sm text-slate-600">{price}</p>
          </div>
        </header>

        {/* TODO: Add CPQ widgets, product stats, etc. */}
      </div>
    </div>
  );
}
