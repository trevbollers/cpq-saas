// app/auth/error/page.tsx
import { Suspense } from "react";
import { ErrorContent } from "./error-content";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
