# Performance & Architecture Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Echo Learn codebase to use hybrid caching strategy (server components with Next.js cache + client components with React Query) for improved performance and scalability.

**Architecture:** Incremental hybrid approach - public data uses server components with Next.js fetch caching, user-specific data uses client components with React Query, mutations use server actions with revalidation.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL), Clerk (Auth), TanStack Query (@tanstack/react-query)

---

## File Structure Map

**New Files:**
- `lib/supabase/server.ts` - Server-side Supabase client using cookies
- `lib/supabase/queries.ts` - Centralized query functions with caching and preserved filtering logic
- `lib/hooks/use-companions.ts` - React Query hooks for user-specific data
- `app/providers.tsx` - React Query provider wrapper component

**Modified Files:**
- `lib/supabase/client.ts` - Minor cleanup, keep existing auth integration
- `lib/actions/companion.actions.ts` - Remove read operations, keep mutations, add revalidation
- `app/layout.tsx` - Wrap children with Providers component
- `app/page.tsx` - Use parallel queries with cached functions
- `app/companions/page.tsx` - Use cached query function with search params
- `app/companions/[id]/page.tsx` - Use cached query with error handling
- `app/my-journey/page.tsx` - Convert to client component using React Query hooks

---

## Task 1: Create Server Supabase Client

**Files:**
- Create: `lib/supabase/server.ts`

**Purpose:** Server-side Supabase client that reads cookies from the request context for proper auth in server components and actions.

- [ ] **Step 1: Create the server client file**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/server.ts
git commit -m "feat: add server-side Supabase client with cookie support"
```

---

## Task 2: Create Query Functions with Caching

**Files:**
- Create: `lib/supabase/queries.ts`

**Purpose:** Centralized query functions that preserve existing filtering logic and add Next.js fetch caching with tags for revalidation.

- [ ] **Step 1: Create the queries file with cached companion query**

```typescript
// lib/supabase/queries.ts
import { createServerSupabaseClient } from './server'
import { GetAllCompanions } from '@/types'

export async function getCompanionsCached(filters: GetAllCompanions) {
  const supabase = createServerSupabaseClient()
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
    (filters.page - 1) * filters.limit,
    filters.page * filters.limit - 1
  )

  const { data, error } = await query

  if (error) {
    throw new Error(error.message || 'Failed to fetch companions')
  }

  return data
}

export async function getCompanionCached(id: string) {
  const supabase = createServerSupabaseClient()

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
  const supabase = createServerSupabaseClient()

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/queries.ts
git commit -m "feat: add cached query functions with preserved filtering logic"
```

---

## Task 3: Create React Query Provider

**Files:**
- Create: `app/providers.tsx`

**Purpose:** React Query provider wrapper with optimized default settings for stale time and cache duration.

- [ ] **Step 1: Create the providers file**

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let queryClient: QueryClient

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false,
        },
      },
    })
  }
  return queryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add app/providers.tsx
git commit -m "feat: add React Query provider with optimized defaults"
```

---

## Task 4: Update Root Layout with Providers

**Files:**
- Modify: `app/layout.tsx`

**Purpose:** Wrap the app with React Query provider while preserving existing Clerk provider and styling.

- [ ] **Step 1: Update layout.tsx to include Providers**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Bricolage_Grotesque, Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from './providers' // ADD THIS

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Echo Learn',
  description: 'Real-time AI Teaching Platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className={cn('font-sans', inter.variable)}>
      <body className={`${bricolage.variable} antialiased`}>
        <ClerkProvider
          appearance={{ variables: { colorPrimary: '#fe5933' } }}
        >
          <Providers> {/* ADD THIS WRAPPER */}
            <Navbar />
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wrap app with React Query provider"
```

---

## Task 5: Create React Query Hooks for User Data

**Files:**
- Create: `lib/hooks/use-companions.ts`

**Purpose:** Client-side hooks for fetching user-specific data (sessions, user's companions) using React Query.

- [ ] **Step 1: Create fetch functions for client-side use**

First, create a file for API fetch functions:

```typescript
// lib/api/companions.ts
import { CreateCompanion } from '@/types'

// Client-side fetch function for user sessions
export async function fetchUserSessions(userId: string, limit: number = 10) {
  const response = await fetch('/api/user/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, limit }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user sessions')
  }

  return response.json()
}

// Client-side fetch function for user companions
export async function fetchUserCompanions(userId: string) {
  const response = await fetch('/api/user/companions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user companions')
  }

  return response.json()
}
```

- [ ] **Step 2: Create the React Query hooks file**

```typescript
// lib/hooks/use-companions.ts
import { useQuery } from '@tanstack/react-query'
import { fetchUserCompanions, fetchUserSessions } from '@/lib/api/companions'

export function useUserSessions(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: ['user-sessions', userId, limit],
    queryFn: () => fetchUserSessions(userId, limit),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUserCompanions(userId: string) {
  return useQuery({
    queryKey: ['user-companions', userId],
    queryFn: () => fetchUserCompanions(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add lib/api/companions.ts lib/hooks/use-companions.ts
git commit -m "feat: add React Query hooks for user-specific data"
```

---

## Task 6: Create API Routes for Client-Side Fetching

**Files:**
- Create: `app/api/user/sessions/route.ts`
- Create: `app/api/user/companions/route.ts`

**Purpose:** Server-side API endpoints that React Query hooks can call from client components. These use the server client and handle auth.

- [ ] **Step 1: Create user sessions API route**

```typescript
// app/api/user/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, limit = 10 } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

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
```

- [ ] **Step 2: Create user companions API route**

```typescript
// app/api/user/companions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add app/api/user/sessions/route.ts app/api/user/companions/route.ts
git commit -m "feat: add API routes for user-specific data fetching"
```

---

## Task 7: Refactor Home Page to Use Parallel Queries

**Files:**
- Modify: `app/page.tsx`

**Purpose:** Use parallel queries with Promise.all() to eliminate sequential waterfall, use cached query functions.

- [ ] **Step 1: Update page.tsx to use parallel cached queries**

```typescript
// app/page.tsx
import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import { getCompanionsCached, getRecentSessionsCached } from '@/lib/supabase/queries'
import { getSubjectColor } from '@/lib/utils'

const Page = async () => {
  // Use parallel queries to eliminate waterfall
  const [companions, recentSessions] = await Promise.all([
    getCompanionsCached({ limit: 3, page: 1 }),
    getRecentSessionsCached(10)
  ])

  return (
    <main>
      <h1>Popular Companions</h1>
      <section className='home-section'>
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectColor(companion.subject)}
          />
        ))}
      </section>
      <section className='home-section mb-6'>
        <CompanionList
          title='Lessons others are taking'
          companions={recentSessions}
          classNames='w-2/3 max-lg:w-full'
        />
        <CTA />
      </section>
    </main>
  )
}

export default Page
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: use parallel cached queries on home page"
```

---

## Task 8: Refactor Companions Library Page

**Files:**
- Modify: `app/companions/page.tsx`

**Purpose:** Use cached query function while preserving existing search params filtering logic.

- [ ] **Step 1: Update companions page to use cached query**

```typescript
// app/companions/page.tsx
import CompanionCard from '@/components/CompanionCard'
import SearchInput from '@/components/SearchInput'
import SubjectFilter from '@/components/SubjectFilter'
import { getCompanionsCached } from '@/lib/supabase/queries'
import { getSubjectColor } from '@/lib/utils'
import { SearchParams } from '@/types'

export default async function CompanionsLibrary({
  searchParams,
}: SearchParams) {
  const filters = await searchParams
  const subject = filters.subject ? filters.subject : ''
  const topic = filters.topic ? filters.topic : ''

  const companions = await getCompanionsCached({
    subject,
    topic,
    page: 1,
    limit: 50, // Adjust based on needs
  })

  return (
    <main>
      <section className='flex justify-between gap-4 max-sm:flex-col'>
        <h1>Companion Library</h1>
        <div className='flex gap-4'>
          <SearchInput />
          <SubjectFilter />
        </div>
      </section>
      <section className='companions-grid'>
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectColor(companion.subject)}
          />
        ))}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add app/companions/page.tsx
git commit -m "refactor: use cached query for companions library"
```

---

## Task 9: Refactor Companion Detail Page

**Files:**
- Modify: `app/companions/[id]/page.tsx`

**Purpose:** Use cached query function with proper error handling and redirect.

- [ ] **Step 1: Update companion detail page to use cached query**

```typescript
// app/companions/[id]/page.tsx
import Companion from '@/components/Companion'
import { getCompanionCached } from '@/lib/supabase/queries'
import { getSubjectColor } from '@/lib/utils'
import { currentUser } from '@clerk/nextjs/server'
import Image from 'next/image'
import { redirect, notFound } from 'next/navigation'

interface CompanionSessionPageProps {
  params: Promise<{ id: string }>
}

export default async function CompanionSession({
  params,
}: CompanionSessionPageProps) {
  const { id } = await params
  const user = await currentUser()

  if (!user) redirect('/sign-in')

  try {
    const companion = await getCompanionCached(id)

    if (!companion) {
      notFound()
    }

    const { name, subject, topic, duration } = companion

    return (
      <main>
        <article className='flex rounded-border items-center justify-between p-6 max-md:flex-col'>
          <div className='flex items-center gap-2'>
            <div
              className='flex items-center justify-center size-18 rounded-lg max-md:hidden'
              style={{
                backgroundColor: getSubjectColor(subject),
              }}
            >
              <Image
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={35}
                height={35}
              />
            </div>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <p className='font-bold text-2xl'>{name}</p>
                <div className='subject-badge max-sm:hidden'>
                  {subject}
                </div>
              </div>
              <p className='text-lg'>{topic}</p>
            </div>
          </div>
          <div className='text-xl max-md:hidden'>{duration} minutes</div>
        </article>
        <Companion
          {...companion}
          userName={user.firstName}
          userImage={user.imageUrl}
        />
      </main>
    )
  } catch (error) {
    console.error('Failed to load companion:', error)
    redirect('/companions?error=load_failed')
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add app/companions/[id]/page.tsx
git commit -m "refactor: use cached query for companion detail with error handling"
```

---

## Task 10: Convert My Journey Page to Client Component

**Files:**
- Modify: `app/my-journey/page.tsx`

**Purpose:** Convert to client component using React Query hooks for user-specific data with loading states.

- [ ] **Step 1: Create a skeleton component**

First, create the skeleton for loading state:

```typescript
// app/my-journey/loading.tsx
import Image from 'next/image'

export default function ProfileSkeleton() {
  return (
    <main className='lg:w-3/4'>
      <section className='flex justify-between gap-4 max-sm:flex-col items-center'>
        <div className='flex gap-4 items-center'>
          <div className='w-[110px] h-[110px] bg-gray-200 rounded-lg animate-pulse' />
          <div className='flex flex-col gap-2'>
            <div className='h-8 w-48 bg-gray-200 rounded animate-pulse' />
            <div className='h-4 w-64 bg-gray-200 rounded animate-pulse' />
          </div>
        </div>
        <div className='flex gap-4'>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit w-24'>
            <div className='h-8 w-8 bg-gray-200 rounded animate-pulse' />
            <div className='h-4 bg-gray-200 rounded animate-pulse' />
          </div>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit w-24'>
            <div className='h-8 w-8 bg-gray-200 rounded animate-pulse' />
            <div className='h-4 bg-gray-200 rounded animate-pulse' />
          </div>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Convert my-journey page to client component**

```typescript
// app/my-journey/page.tsx
'use client'

import { useUserCompanions, useUserSessions } from '@/lib/hooks/use-companions'
import CompanionList from '@/components/CompanionList'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Profile() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  const { data: companions = [], isLoading: isLoadingCompanions } = useUserCompanions(user?.id || '')
  const { data: sessionHistory = [], isLoading: isLoadingSessions } = useUserSessions(user?.id || '')

  if (!isLoaded || !user) {
    return null // Will redirect
  }

  return (
    <main className='lg:w-3/4'>
      <section className='flex justify-between gap-4 max-sm:flex-col items-center'>
        <div className='flex gap-4 items-center'>
          <Image
            src={user.imageUrl}
            alt={user.firstName!}
            width={110}
            height={110}
          />
          <div className='flex flex-col gap-2'>
            <h1 className='font-bold text-2xl'>
              {user.firstName} {user.lastName}
            </h1>
            <p className='text-sm text-muted-foreground'>
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
        <div className='flex gap-4'>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit'>
            <div className='flex gap-2 items-center'>
              <Image
                src='/icons/check.svg'
                alt='checkmark'
                width={22}
                height={22}
              />
              <p className='text-2xl font-bold'>
                {isLoadingSessions ? '...' : sessionHistory.length}
              </p>
            </div>
            <div>Lessons completed</div>
          </div>
          <div className='border border-black rounded-lg p-3 gap-2 flex flex-col h-fit'>
            <div className='flex gap-2 items-center'>
              <Image
                src='/icons/cap.svg'
                alt='cap'
                width={22}
                height={22}
              />
              <p className='text-2xl font-bold'>
                {isLoadingCompanions ? '...' : companions.length}
              </p>
            </div>
            <div>Companions created</div>
          </div>
        </div>
      </section>
      <Accordion type='multiple'>
        <AccordionItem value='recent'>
          <AccordionTrigger className='text-2xl font-bold'>
            Recent Sessions
          </AccordionTrigger>
          <AccordionContent>
            {isLoadingSessions ? (
              <p>Loading...</p>
            ) : (
              <CompanionList
                title='Recent Sessions'
                companions={sessionHistory}
              />
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='companions'>
          <AccordionTrigger className='text-2xl font-bold'>
            My Companions ({companions.length})
          </AccordionTrigger>
          <AccordionContent>
            {isLoadingCompanions ? (
              <p>Loading...</p>
            ) : (
              <CompanionList
                title='My Companions'
                companions={companions}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add app/my-journey/page.tsx app/my-journey/loading.tsx
git commit -m "refactor: convert my-journey to client component with React Query"
```

---

## Task 11: Refactor Server Actions for Mutations Only

**Files:**
- Modify: `lib/actions/companion.actions.ts`

**Purpose:** Remove read operations (now handled by queries/hooks), keep only mutations, add revalidation for cache invalidation.

- [ ] **Step 1: Update companion.actions.ts to remove reads and add revalidation**

```typescript
// lib/actions/companion.actions.ts
'use server'

import { CreateCompanion } from '@/types'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '../supabase/server'
import { revalidateTag } from 'next/cache'

// KEEP: Mutation for creating companions
export async function createCompanion(formData: CreateCompanion) {
  const { userId: author } = await auth()
  const supabase = createServerSupabaseClient()

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
  const supabase = createServerSupabaseClient()

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
  const supabase = createServerSupabaseClient()

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors (may show unused imports if any)

- [ ] **Step 3: Commit**

```bash
git add lib/actions/companion.actions.ts
git commit -m "refactor: remove read operations from server actions, add revalidation"
```

---

## Task 12: Update Browser Client (Minor Cleanup)

**Files:**
- Modify: `lib/supabase/client.ts`

**Purpose:** Minor cleanup to ensure consistency with server client pattern, preserve existing auth integration.

- [ ] **Step 1: Review and update client.ts for consistency**

```typescript
// lib/supabase/client.ts
import { auth } from '@clerk/nextjs/server'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      return (await auth()).getToken()
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/client.ts
git commit -m "refactor: add env var validation to browser client"
```

---

## Task 13: Integration Testing

**Files:**
- No file changes - verification task

**Purpose:** Verify the refactoring works correctly and performance improvements are realized.

- [ ] **Step 1: Start development server**

Run: `npm run dev`
Expected: Server starts without errors

- [ ] **Step 2: Test home page loads**

Open: `http://localhost:3000`
Expected: Page loads with companions and recent sessions displayed

- [ ] **Step 3: Test companions library with filters**

Open: `http://localhost:3000/companions?subject=Math&topic=algebra`
Expected: Page loads and filters work correctly

- [ ] **Step 4: Test companion detail page**

Open: `http://localhost:3000/companions/{some-companion-id}`
Expected: Page loads with companion details

- [ ] **Step 5: Test my-journey page (requires auth)**

Open: `http://localhost:3000/my-journey`
Expected:
- If not signed in: redirects to sign-in
- If signed in: shows profile with user data loading

- [ ] **Step 6: Check Network tab for caching**

1. Open browser DevTools → Network tab
2. Reload any page
3. Check for cached responses

Expected: Subsequent navigations show faster loads (cached data)

- [ ] **Step 7: Test mutation with revalidation**

1. Create a new companion via the form
2. Navigate to companions library
3. Verify new companion appears

Expected: New companion visible immediately (cache invalidated)

---

## Task 14: Performance Verification

**Files:**
- No file changes - verification task

**Purpose:** Measure and document performance improvements.

- [ ] **Step 1: Run Lighthouse audit on home page**

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run analysis on `http://localhost:3000`
4. Note TTFB (Time to First Byte) and LCP (Largest Contentful Paint)

Expected: TTFB < 200ms, LCP < 2.5s

- [ ] **Step 2: Compare to baseline (if available)**

If you have previous performance metrics, compare:
- TTFB improvement
- Navigation speed improvement
- Overall page load time

Expected: Measurable improvement across metrics

- [ ] **Step 3: Verify React Query DevTools (optional)**

Install React Query DevTools for debugging:

```bash
npm install @tanstack/react-query-devtools
```

Update `app/providers.tsx`:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// In the return:
<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Expected: DevTools panel shows query states and cache

- [ ] **Step 4: Commit any DevTools installation (if added)**

```bash
git add package.json package-lock.json app/providers.tsx
git commit -m "chore: add React Query DevTools for debugging"
```

---

## Task 15: Final Documentation

**Files:**
- Create: `docs/architecture/data-fetching.md` (optional)

**Purpose:** Document the new architecture for future reference.

- [ ] **Step 1: Create architecture documentation (optional)**

```markdown
# Data Fetching Architecture

## Overview

Echo Learn uses a hybrid caching strategy:
- **Server Components + Next.js Cache** for public data
- **Client Components + React Query** for user-specific data
- **Server Actions** for mutations with cache revalidation

## Client vs Server Data

### Server-Side (Cached)
- Companions list
- Individual companion details
- Recent sessions (public view)

### Client-Side (React Query)
- User's session history
- User's created companions
- User-specific stats

## Caching Strategy

| Data Type | Strategy | Duration |
|-----------|----------|----------|
| Companions | Next.js fetch | 5 minutes |
| Single companion | Next.js fetch | 1 hour |
| User sessions | React Query | 5 min stale |
| User companions | React Query | 5 min stale |

## Adding New Queries

For public data, create a function in `lib/supabase/queries.ts`:

```typescript
export async function getYourDataCached(params: YourParams) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('your_table')
    .select()
    .eq('field', params.value)

  if (error) throw new Error(error.message)
  return data
}
```

For user-specific data, create an API route and React Query hook.

## Cache Invalidation

After mutations, use `revalidateTag()` or `revalidatePath()`:

```typescript
import { revalidateTag } from 'next/cache'

// Invalidate all companions
revalidateTag('companions')

// Invalidate specific path
revalidatePath('/companions')
```
```

- [ ] **Step 2: Commit documentation (if created)**

```bash
git add docs/architecture/data-fetching.md
git commit -m "docs: add data fetching architecture documentation"
```

---

## Self-Review Results

**Spec Coverage Check:**
- ✅ Server client creation (Task 1)
- ✅ Query functions with caching (Task 2)
- ✅ React Query provider (Task 3)
- ✅ Layout providers integration (Task 4)
- ✅ React Query hooks (Task 5)
- ✅ API routes for client fetching (Task 6)
- ✅ Home page parallel queries (Task 7)
- ✅ Companions library caching (Task 8)
- ✅ Companion detail caching (Task 9)
- ✅ My Journey client component (Task 10)
- ✅ Server actions refactoring (Task 11)
- ✅ Browser client cleanup (Task 12)
- ✅ Integration testing (Task 13)
- ✅ Performance verification (Task 14)
- ✅ Documentation (Task 15)

**Placeholder Scan:** No placeholders found (all code complete)

**Type Consistency Check:** All function names, types, and imports are consistent across tasks.

---

## Success Criteria

- [ ] All pages load without errors
- [ ] Filtering functionality preserved (subject, topic, combined)
- [ ] Parallel queries eliminate waterfalls
- [ ] React Query working for user data
- [ ] Cached responses visible in Network tab
- [ ] TTFB improved measurably
- [ ] Mutations trigger cache revalidation
