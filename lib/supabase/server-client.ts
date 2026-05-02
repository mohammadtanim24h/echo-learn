// lib/supabase/server-client.ts
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Creates a Supabase client for server-side use with Clerk's native Supabase integration.
 *
 * IMPORTANT: This uses the native Clerk-Supabase integration, which adds the required
 * "role": "authenticated" claim to Clerk session tokens. No JWT template needed.
 *
 * The Clerk token is passed via Authorization header, making auth.uid() work in RLS policies.
 *
 * @returns SupabaseClient configured for server-side use with Clerk authentication
 */
export async function createServerSupabaseClientWithAuth() {
  const { getToken } = await auth()

  // Get the Clerk session token (with native Supabase integration claims)
  const token = await getToken()

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: async (url, options = {}) => {
        // Inject Clerk token into Authorization header
        const headers = new Headers(options?.headers)
        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }

        return fetch(url, {
          ...options,
          headers,
        })
      },
    },
  })
}
