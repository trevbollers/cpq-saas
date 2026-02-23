// app/t/[tenantSlug]/dashboard/page.tsx
import { loadTenant } from "@/lib/supabase/load-tenant";

interface TenantPageParams {
  tenantSlug: string;
}

export default async function TenantDashboard({
  params,
}: {
  params: TenantPageParams;
}) {
  const { tenantSlug } = params;

  const result = await loadTenant(tenantSlug);

  if ("error" in result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white border border-red-200 text-red-700 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-2">Access Issue</h2>
          {result.error === "NOT_AUTHENTICATED" && <p>Please log in.</p>}
          {result.error === "TENANT_NOT_FOUND" && <p>Tenant not found.</p>}
          {result.error === "UNAUTHORIZED" && (
            <p>You do not have access to this tenant.</p>
          )}
        </div>
      </div>
    );
  }

  const { tenant, user, role } = result;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{tenant.name}</h1>
            <p className="text-sm text-gray-500">
              Tenant Dashboard • Role:{" "}
              <span className="font-medium">{role}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-700 font-medium">{user.email}</p>
            <p className="text-xs text-gray-500">Logged In</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="col-span-2 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 classpointName="text-xl font-semibold text-gray-800 mb-3">
              Welcome, {user.email}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              You're inside the tenant workspace for{" "}
              <span className="font-medium">{tenant.name}</span>. Use the
              navigation to access products, recipes, quotes, and configuration
              tools.
            </p>

            <div className="mt-6 flex gap-4">
              <a
                href={`/t/${tenantSlug}/products`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                View Products
              </a>
              <a
                href={`/t/${tenantSlug}/recipes`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Build Recipes
              </a>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Stats
            </h3>

            <ul className="space-y-3 text-gray-700 text-sm">
              <li className="flex justify-between">
                <span>Tenant Slug:</span>
                <span className="font-medium">{tenant.slug}</span>
              </li>
              <li className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">
                  {tenant.plan_id ?? "No plan"}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Status:</span>
                <span
                  className={`font-medium ${
                    tenant.status === "active"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {tenant.status}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <a
            href={`/t/${tenantSlug}/products`}
            className="block bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h4 className="text-lg font-semibold text-gray-800">Products</h4>
            <p className="text-sm text-gray-600 mt-2">
              Manage configurable products, parameters, options, and BOM
              structures.
            </p>
          </a>

          <a
            href={`/t/${tenantSlug}/recipes`}
            className="block bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h4 className="text-lg font-semibold text-gray-800">
              Recipe Builder
            </h4>
            <p className="text-sm text-gray-600 mt-2">
              Create configuration rules, build recipes, and generate CPQ logic.
            </p>
          </a>

          <a
            href={`/t/${tenantSlug}/quotes`}
            className="block bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h4 className="text-lg font-semibold text-gray-800">Quotes</h4>
            <p className="text-sm text-gray-600 mt-2">
              Manage customer quotes, pricing, approvals, and workflows.
            </p>
          </a>
        </div>
      </main>
    </div>
  );
}
