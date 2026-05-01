// lib/supabase/queries.ts
import { createServerSupabaseClient } from './server'
import { GetAllCompanions } from '@/types'

export async function getCompanionsCached(filters: GetAllCompanions) {
  const supabase = await createServerSupabaseClient()
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10

  let query = supabase
    .from('companions')
    .select()

  // PRESERVE: Existing subject + topic combined logic
  if (filters.subject && filters.topic) {
    query = query
      .ilike('subject', `%${filters.subject}%`)
      .or(`topic.ilike.%${filters.topic}%,name.ilike.%${filters.topic}%`)
  } else if (filters.subject) {
    query = query.ilike('subject', `%${filters.subject}%`)
  } else if (filters.topic) {
    query = query.or(`topic.ilike.%${filters.topic}%,name.ilike.%${filters.topic}%`)
  }

  // PRESERVE: Pagination logic
  query = query.range(
    (page - 1) * limit,
    page * limit - 1
  )

  const { data, error } = await query

  if (error) {
    throw new Error(error.message || 'Failed to fetch companions')
  }

  return data
}

export async function getCompanionCached(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('companions')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message || 'Companion not found')
  }

  return data
}

export async function getRecentSessionsCached(limit: number = 10) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('session_history')
    .select(`companion_id, companions:companion_id(*)`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message || 'Failed to fetch recent sessions')
  }

  // PRESERVE: Existing deduplication logic
  const uniqueCompanions = new Map()
  for (const { companion_id, companions } of data) {
    if (companions && !uniqueCompanions.has(companion_id)) {
      uniqueCompanions.set(companion_id, companions)
    }
  }

  return Array.from(uniqueCompanions.values())
}
