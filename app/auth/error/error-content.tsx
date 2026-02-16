// app/auth/error/error-content.tsx
"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "Authentication failed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Failed
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">{message}</p>

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Back to Sign In
            </Link>
            <Link
              href="/register"
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
