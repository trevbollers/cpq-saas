// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6 py-12">
      <div className="text-center max-w-2xl">
        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white">
          The Best CPQ Software Ever Built
        </h1>

        {/* Supporting Text */}
        <p className="mt-4 text-lg md:text-xl text-slate-300">
          Configure, Price, and Quote faster than ever. Designed for modern
          manufacturers building configurable products.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold text-lg hover:bg-blue-700 transition"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg border border-white px-6 py-3 text-white font-semibold text-lg hover:bg-white hover:text-slate-900 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
