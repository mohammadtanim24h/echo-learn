// lib/actions/companion.actions.ts
'use server'

import { CreateCompanion } from '@/types'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '../supabase/server'
import { revalidateTag } from 'next/cache'

// KEEP: Mutation for creating companions
export async function createCompanion(formData: CreateCompanion) {
  const { userId: author } = await auth()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('companions')
    .insert({ ...formData, author })
    .select()
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create companion')
  }

  // ADD: Revalidate companions cache
  revalidateTag('companions')

  return data
}

// KEEP: Mutation for adding to session history
export async function addToSessionHistory(companionId: string) {
  const { userId } = await auth()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('session_history')
    .insert({ companion_id: companionId, user_id: userId })
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to insert session history')
  }

  // ADD: Revalidate sessions cache
  revalidateTag('sessions')

  return data
}

// KEEP: Permission check for new companion creation
export async function newCompanionPermissions() {
  const { userId, has } = await auth()
  const supabase = await createServerSupabaseClient()

  let limit = 0
  if (has({ plan: 'pro' })) {
    return true
  } else if (has({ feature: '3_active_companions' })) {
    limit = 3
  } else if (has({ feature: '10_active_companions' })) {
    limit = 10
  }

  const { data, error } = await supabase
    .from('companions')
    .select('id', { count: 'exact', head: false })
    .eq('author', userId)

  if (error) {
    throw new Error(
      error.message || 'Failed to get companion count for user'
    )
  }

  const companionCount = data?.length || 0
  if (companionCount >= limit) {
    return false
  }
  return true
}

// REMOVE: getAllCompanions (now in queries.ts)
// REMOVE: getCompanion (now in queries.ts)
// REMOVE: getRecentSessions (now in queries.ts)
// REMOVE: getUserSessions (now handled by API route + React Query)
// REMOVE: getUserCompanions (now handled by API route + React Query)
