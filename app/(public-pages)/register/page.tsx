// app/(public-pages)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "./actions";
// @ts-ignore: no types for zxcvbn in this workspace
import zxcvbn from "zxcvbn";

type RegistrationState = {
  success?: boolean;
  authenticated?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export default function RegisterPage() {
  const [state, setState] = useState<RegistrationState>({});
  const [submitting, setSubmitting] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordScore, setPasswordScore] = useState<number | null>(null);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    const result = await registerUser(formData);
    setState(result);
    setSubmitting(false);

    if (result.success) {
      router.push("/check-email");
    }
  }

  function onPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setPasswordValue(v);
    try {
      const r = zxcvbn(v);
      setPasswordScore(r.score);
    } catch (err) {
      setPasswordScore(null);
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
          {/* Name */}
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

          {/* Email */}
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

          {/* Password */}
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
              value={passwordValue}
              onChange={onPasswordChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2">
              <div className="h-2 w-full bg-slate-200 rounded overflow-hidden">
                <div
                  style={{ width: `${((passwordScore ?? 0) + 1) * 20}%` }}
                  className={`h-full transition-all duration-200 ${
                    passwordScore === null
                      ? "bg-slate-300"
                      : passwordScore <= 1
                        ? "bg-red-500"
                        : passwordScore === 2
                          ? "bg-yellow-500"
                          : "bg-green-500"
                  }`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {passwordScore === null
                  ? "Enter a password to see strength"
                  : passwordScore <= 1
                    ? "Weak — try longer password with mixed characters"
                    : passwordScore === 2
                      ? "Okay — add more length or a symbol"
                      : "Strong password"}
              </p>
            </div>
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
