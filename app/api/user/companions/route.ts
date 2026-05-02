// app/api/user/companions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientWithAuth } from '@/lib/supabase/server-client'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabaseClientWithAuth()

    const { data, error } = await supabase
      .from('companions')
      .select()
      .eq('author', userId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
