// app/(public-pages)/select-plan/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseSSRClient } from "@/lib/supabase/ssr";
import { selectPlan } from "./actions";
import type { Plan } from "@/lib/types/plans";
import { PlanCard } from "./PlanCard";

export default async function SelectPlanPage() {
  const supabase = await createSupabaseSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // no authenticated user → go back to register or login
    redirect("/register");
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    // Email not verified yet, send them to check-email page
    redirect("/check-email");
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
