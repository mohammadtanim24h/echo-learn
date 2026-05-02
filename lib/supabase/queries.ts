// lib/supabase/queries.ts
import { GetAllCompanions } from '@/types'
import { createClient } from '@supabase/supabase-js'

// Public Supabase client for non-authenticated data (enables Next.js caching)
// Uses the publishable key which is safe for public data queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

// Create separate clients with different cache tags for proper invalidation
const createCompanionsClient = (cacheTags: string[]) =>
  createClient(supabaseUrl, supabasePublishableKey, {
    db: { schema: 'public' },
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          // Enable Next.js caching with 5-minute revalidation
          next: { revalidate: 300, tags: cacheTags }
        })
      }
    }
  })

// Companions queries use 'companions' tag for cache invalidation
export async function getCompanionsCached(filters: GetAllCompanions) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10

  // Build cache tags based on filters for granular invalidation
  const cacheTags = ['companions']
  if (filters.subject && filters.subject !== '') cacheTags.push(`subject-${filters.subject}`)
  if (filters.topic && filters.topic !== '') cacheTags.push(`topic-${filters.topic}`)

  const supabase = createCompanionsClient(cacheTags)
  let query = supabase.from('companions').select()

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
  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, error } = await query

  if (error) {
    throw new Error(error.message || 'Failed to fetch companions')
  }

  return data
}

export async function getCompanionCached(id: string) {
  const supabase = createCompanionsClient([`companion-${id}`, 'companions'])

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

// Recent sessions (public view of trending companions) uses separate tag
export async function getRecentSessionsCached(limit: number = 10) {
  const supabase = createCompanionsClient(['recent-sessions', 'sessions'])

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
