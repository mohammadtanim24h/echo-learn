// app/api/user/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientWithAuth } from '@/lib/supabase/server-client'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { limit = 10 } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseClientWithAuth()

    const { data, error } = await supabase
      .from('session_history')
      .select(`companion_id, companions:companion_id(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // PRESERVE: Existing deduplication logic
    const uniqueCompanions = new Map()
    for (const { companion_id, companions } of data) {
      if (companions && !uniqueCompanions.has(companion_id)) {
        uniqueCompanions.set(companion_id, companions)
      }
    }

    return NextResponse.json(Array.from(uniqueCompanions.values()))
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
