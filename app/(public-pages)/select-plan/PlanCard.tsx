// app/(public-pages)/select-plan/PlanCard.tsx
"use client";

import { useState } from "react";
import { selectPlan } from "./actions";
import type { Plan } from "@/lib/types/plans";

export function PlanCard({ plan }: { plan: Plan }) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const price =
    plan.price_monthly_cents && plan.price_monthly_cents > 0
      ? `$${(plan.price_monthly_cents / 100).toFixed(0)}/mo`
      : "Free";

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setErrors({});
    const result = await selectPlan(formData);
    setSubmitting(false);
    if (!result.success) {
      setErrors(result.errors);
    }
  }

  return (
    <form
      action={handleSubmit}
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

      {errors.general && (
        <p className="text-red-600 text-sm mb-2">{errors.general[0]}</p>
      )}
      {errors.tenantName && (
        <p className="text-red-600 text-sm mb-2">{errors.tenantName[0]}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-auto w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Creating..." : `Choose ${plan.name}`}
      </button>
    </form>
  );
}
