"use client";

import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            We've sent a verification link to your email address. Click the link
            to verify your account and proceed to plan selection.
          </p>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
            <p className="mb-2">
              <strong>Didn't receive the email?</strong>
            </p>
            <ul className="text-left space-y-1 text-xs">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Try registering again if needed</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Back to Register <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Already verified? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
