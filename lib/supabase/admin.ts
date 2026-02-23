// lib/supabase/admin.ts
// ---------------------------------------------------------------------------
// Admin Supabase client
// - Uses SERVICE ROLE key
// - Must ONLY be imported in server-side code ("use server" files, route handlers)
// - Never bundle or expose this client to the browser.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Types: widen as needed or create a dedicated type file later
//type SupabaseAdminClient = ReturnType<typeof createClient>;

// Strongly-typed admin client
type SupabaseAdminClient = SupabaseClient<Database>;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

// Create a single admin client instance for backend-only usage
export function createSupabaseAdminClient(): SupabaseAdminClient {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // SERVICE ROLE key
    {
      auth: {
        // For backend-only operations, we do not persist sessions
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Helper: update user metadata claims for RLS
// - This ensures auth.jwt()->>'tenant_id' and auth.jwt()->>'role'
//   are populated correctly for RLS policies.
// - Call after tenant creation / role changes.
// ---------------------------------------------------------------------------

export async function updateUserClaims(
  userId: string,
  options: {
    tenantId?: string | null;
    role?: "user" | "admin" | "super_admin";
  },
) {
  const supabaseAdmin = createSupabaseAdminClient();

  const userMetadataUpdate: Record<string, unknown> = {};

  if (typeof options.tenantId !== "undefined") {
    userMetadataUpdate.tenant_id = options.tenantId;
  }

  if (typeof options.role !== "undefined") {
    userMetadataUpdate.role = options.role;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      user_metadata: userMetadataUpdate,
    },
  );

  if (error) {
    console.error("Failed to update user claims", { userId, error });
    throw error;
  }

  return data.user;
}
