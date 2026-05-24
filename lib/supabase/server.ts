import { createClient } from "@supabase/supabase-js";
import {
  hasPublicSupabaseEnv,
  hasServiceSupabaseEnv,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl
} from "@/lib/supabase/env";

export function getPublicSupabase() {
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function getServiceSupabase() {
  if (!hasServiceSupabaseEnv()) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
