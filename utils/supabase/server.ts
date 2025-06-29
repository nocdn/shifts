import { createServerClient } from "@supabase/ssr"

export function createServerClient() {
  return createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
