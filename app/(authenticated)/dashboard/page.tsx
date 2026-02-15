// TODO: Dashboard page (SuperTask 3.3)
// app/(authenticated)/dashboard/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams: { userId?: string };
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const userId = searchParams.userId;

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-semibold mb-2">Missing user context</h1>
          <p className="text-sm text-slate-600">
            We couldn&apos;t identify your user. In a production setup, this
            page will use your authenticated session instead of a URL parameter.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();

  // 1) Load profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, display_name, role, tenant_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Profile error:", profileError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-semibold mb-2">Profile not found</h1>
          <p className="text-sm text-slate-600">
            We couldn&apos;t find a profile for this user. Please register again
            or contact support.
          </p>
        </div>
      </div>
    );
  }

  // If no tenant yet, prompt them to select a plan
  if (!profile.tenant_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-semibold mb-2">No tenant assigned</h1>
          <p className="text-sm text-slate-600 mb-4">
            Your account is created, but you haven&apos;t selected a plan yet.
          </p>
          <a
            href={`/select-plan?userId=${profile.user_id}`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Choose a plan
          </a>
        </div>
      </div>
    );
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

        <main className="grid gap-6 md:grid-cols-3">
          <section className="bg-white rounded-lg shadow p-4 md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Next steps</h2>
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              <li>
                Connect your product catalog (MongoDB per-tenant collections).
              </li>
              <li>Configure your first product family and recipe.</li>
              <li>Invite team members to collaborate on configurations.</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Account summary</h2>
            <dl className="text-sm text-slate-700 space-y-1">
              <div>
                <dt className="font-medium">Tenant ID</dt>
                <dd className="font-mono text-xs">{tenant.id}</dd>
              </div>
              <div>
                <dt className="font-medium">Status</dt>
                <dd>{tenant.status}</dd>
              </div>
            </dl>
          </section>
        </main>
      </div>
    </div>
  );
}
