// This is the registration page for the CPQ SaaS application. It includes a form for users to create an account by providing their name, email, and password. The form submission is handled by the `onSubmit` function, which calls the `registerUser` action to create the account. If registration is successful, the user is redirected to the plan selection page with their user ID as a query parameter. Validation errors are displayed below each input field if there are any issues with the submitted data.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "./actions";

type RegistrationState = {
  success?: boolean;
  errors?: Record<string, string[]>;
};

export default function RegisterPage() {
  const [state, setState] = useState<RegistrationState>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Handle form submission
  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    const result = await registerUser(formData);
    setState(result);
    setSubmitting(false);

    if (result.success) {
      // Redirect to plan selection with user ID as query param
      router.push(`/select-plan?userId=${result.userId}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">
          Create your CPQ SaaS account
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Start configuring products for your manufacturing org.
        </p>

        <form action={onSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="displayName"
            >
              Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state.errors?.displayName && (
              <p className="text-xs text-red-600 mt-1">
                {state.errors.displayName[0]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state.errors?.email && (
              <p className="text-xs text-red-600 mt-1">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state.errors?.password && (
              <p className="text-xs text-red-600 mt-1">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          {state.errors?.general && (
            <p className="text-xs text-red-600">{state.errors.general[0]}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white text-sm font-semibold py-2 rounded hover:bg-blue-700 disabled:opacity-70"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
