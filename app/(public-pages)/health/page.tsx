// app/(public-pages)/health/page.tsx
"use client";

export default function HealthCheckPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Database Health Check</h1>
        <p className="text-slate-600">
          Health check monitoring page. More details coming soon.
        </p>
      </div>
    </div>
  );
}
