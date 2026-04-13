import { getSupabaseBrowserClient } from "./supabase-browser";

export interface CreateUserDirectInput {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "employee";
  branchId: string;
}

/**
 * Create user directly via Supabase Auth
 * This bypasses the backend API and relies on the database trigger
 * to create the user record in public.users table
 */
export async function createUserDirectSupabase(
  input: CreateUserDirectInput
) {
  const supabase = getSupabaseBrowserClient();
  
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  console.log("[createUserDirectSupabase] Creating user:", {
    email: input.email,
    fullName: input.fullName,
    role: input.role,
    branchId: input.branchId,
  });

  // Create auth user with metadata
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
    },
    app_metadata: {
      role: input.role,
      branch_id: input.branchId,
    },
  });

  if (error) {
    console.error("[createUserDirectSupabase] Error:", error);
    throw new Error(error.message || "Failed to create user in authentication");
  }

  if (!data.user) {
    throw new Error("User created but no user data returned");
  }

  console.log("[createUserDirectSupabase] User created successfully:", {
    authId: data.user.id,
    email: data.user.email,
  });

  // Wait a moment for the trigger to create the user record
  await new Promise(resolve => setTimeout(resolve, 500));

  // Fetch the created user from the public.users table
  const { data: userRecord, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", data.user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[createUserDirectSupabase] Fetch error:", fetchError);
    throw new Error("User created but could not fetch details");
  }

  if (!userRecord) {
    throw new Error("User created but not found in database (trigger may not have run)");
  }

  return {
    id: userRecord.id,
    full_name: userRecord.full_name,
    email: userRecord.email,
    role: userRecord.role,
    branch_id: userRecord.branch_id,
    auth_id: userRecord.auth_id,
    created_at: userRecord.created_at,
  };
}
