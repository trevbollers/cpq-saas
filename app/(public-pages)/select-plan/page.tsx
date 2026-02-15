// app/(public-pages)/select-plan/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";
import { selectPlan } from "./actions";
import type { Plan } from "@/lib/types/plans";

export default async function SelectPlanPage() {
  const supabase = await createSupabaseSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // no authenticated user → go back to register or login
    redirect("/register");
  }

  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly_cents", { ascending: true });

  if (error) {
    console.error("Error loading plans:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-semibold mb-2">Error loading plans</h1>
          <p className="text-sm text-slate-600">
            Please try again later. If this persists, contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-3">Choose your plan</h1>
        <p className="text-slate-600 mb-8">
          Select the package that best fits your manufacturing organization.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {plans?.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const price =
    plan.price_monthly_cents && plan.price_monthly_cents > 0
      ? `$${(plan.price_monthly_cents / 100).toFixed(0)}/mo`
      : "Free";

  return (
    <form
      action={selectPlan}
      className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm p-4"
    >
      <input type="hidden" name="planId" value={plan.id} />

      <h2 className="text-xl font-semibold mb-1">{plan.name}</h2>
      <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
      <p className="text-2xl font-bold mb-4">{price}</p>

      <label
        className="text-xs font-medium mb-1"
        htmlFor={`tenantName-${plan.id}`}
      >
        Company / Tenant name
      </label>
      <input
        id={`tenantName-${plan.id}`}
        name="tenantName"
        type="text"
        required
        className="border border-slate-300 rounded px-2 py-1 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Acme Manufacturing"
      />

      <button
        type="submit"
        className="mt-auto w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded hover:bg-blue-700"
      >
        Choose {plan.name}
      </button>
    </form>
  );
}
