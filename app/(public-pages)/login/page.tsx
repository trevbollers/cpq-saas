// app/(public-pages)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInUser } from "./actions";

type LoginState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export default function LoginPage() {
  const [state, setState] = useState<LoginState>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    const result = await signInUser(formData);
    setState(result);
    setSubmitting(false);

    if (result.success) {
      router.push("/select-plan");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
          <p className="text-gray-600 mb-8">
            Access your CPQ SaaS account to manage configurations.
          </p>

          <form action={onSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@company.com"
              />
              {state.errors?.email && (
                <p className="text-xs text-red-600 mt-1">
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {state.errors?.password && (
                <p className="text-xs text-red-600 mt-1">
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            {/* General error */}
            {state.errors?.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  {state.errors.general[0]}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
