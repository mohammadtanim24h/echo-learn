// lib/supabase/client.ts
import { auth } from '@clerk/nextjs/server'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseKey!, {
    async accessToken() {
      return (await auth()).getToken() ?? undefined
    },
  })
}
