# Performance & Architecture Refactoring Design

**Date:** 2026-05-01
**Project:** Echo Learn
**Scope:** Next.js App Router + Supabase + Clerk performance optimization

## Overview

Refactor the Echo Learn codebase to improve performance, security, and scalability by addressing server action overuse, implementing proper caching strategies, and establishing clear client/server separation.

## Current Problems

1. **Server actions for reads** - All data fetching uses server actions, causing repeated DB connections
2. **No caching strategy** - No Next.js fetch caching or React Query implementation (package installed but unused)
3. **Single client pattern** - Only browser client in `lib/supabase.ts`, no separate server client
4. **Sequential waterfalls** - Pages make sequential async calls instead of parallel
5. **Poor separation** - Server components call server actions instead of querying directly

## Goals

- Reduce page load latency and navigation lag
- Implement comprehensive caching (Next.js + React Query)
- Establish proper client/server architecture
- Preserve all existing functionality and filtering logic
- Keep existing RLS policies unchanged

---

## Architecture: Incremental Hybrid Approach

### Strategy

- **Public/Semi-Public Data** → Server Components + Next.js fetch caching
- **User-Specific Data** → Client Components + React Query
- **Mutations** → Server Actions with cache revalidation

This approach provides:
- SEO-friendly public pages
- Responsive authenticated sections
- Scalable architecture for growth
- Gradual migration path

---

## Folder Structure

```
lib/
├── supabase/
│   ├── client.ts        # Browser client (createBrowserClient)
│   ├── server.ts        # Server client (createServerClient) - NEW
│   └── queries.ts       # Centralized query functions - NEW
├── hooks/
│   └── use-companions.ts # React Query hooks - NEW
└── actions/
    └── companion.actions.ts # Keep for mutations only (modified)

app/
├── providers.tsx        # React Query provider - NEW
├── layout.tsx           # Add Providers wrapper (modified)
├── page.tsx             # Server component, parallel queries (modified)
├── companions/
│   ├── page.tsx         # Server component + caching tags (modified)
│   └── [id]/
│       └── page.tsx     # Server component + error handling (modified)
└── my-journey/
    └── page.tsx         # Client component with React Query (modified)
```

---

## Supabase Client Architecture

### Server Client (`lib/supabase/server.ts`) - NEW

```typescript
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

### Browser Client (`lib/supabase/client.ts`) - MINOR CHANGES

Keep existing pattern with `createBrowserClient` and `auth().getToken()` callback. May need minor tweaks for consistency.

---

## Data Fetching & Caching Strategy

### Query Functions (`lib/supabase/queries.ts`) - NEW

Centralized query functions with preserved filtering logic:

```typescript
export async function getCompanionsCached(filters: GetAllCompanions) {
  const supabase = createServerSupabaseClient()
  let query = supabase.from("companions").select()

  // PRESERVE: Existing subject + topic combined logic
  if (filters.subject && filters.topic) {
    query = query
      .ilike("subject", `%${filters.subject}%`)
      .or(`topic.ilike.%${filters.topic}%,name.ilike.%${filters.topic}%`)
  } else if (filters.subject) {
    query = query.ilike("subject", `%${filters.subject}%`)
  } else if (filters.topic) {
    query = query.or(`topic.ilike.%${filters.topic}%,name.ilike.%${filters.topic}%`)
  }

  // PRESERVE: Pagination logic
  query = query.range(
    (filters.page - 1) * filters.limit,
    filters.page * filters.limit - 1
  )

  return query.throwOnError()
}
```

**All existing filtering logic is preserved exactly.**

### Caching Strategy

| Data Type | Strategy | Cache Duration | Invalidation |
|-----------|----------|----------------|--------------|
| Companions list | Next.js fetch cache | 5 minutes | Tag revalidation |
| Single companion | Next.js fetch cache | 1 hour | On update |
| User sessions | React Query | 5 min (stale) | Auto-refetch |
| User companions | React Query | 5 min (stale) | Auto-refetch |

### Cache Tags

- `companions` - Invalidates all companion lists
- `companion:${id}` - Invalidates specific companion

---

## React Query Setup

### Provider (`app/providers.tsx`) - NEW

```typescript
"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let queryClient: QueryClient

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
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

### Custom Hooks (`lib/hooks/use-companions.ts`) - NEW

```typescript
import { useQuery } from '@tanstack/react-query'

export function useUserSessions(userId: string) {
  return useQuery({
    queryKey: ['user-sessions', userId],
    queryFn: () => fetchUserSessions(userId),
    enabled: !!userId,
  })
}

export function useUserCompanions(userId: string) {
  return useQuery({
    queryKey: ['user-companions', userId],
    queryFn: () => fetchUserCompanions(userId),
    enabled: !!userId,
  })
}
```

---

## Server Actions (Mutations Only)

Modify `lib/actions/companion.actions.ts` to:

1. Keep only mutation functions (`createCompanion`, `addToSessionHistory`)
2. Remove read operations (moved to queries/hooks)
3. Add cache revalidation after mutations

```typescript
export async function createCompanion(data: CreateCompanion) {
  const supabase = createServerSupabaseClient()
  const { userId } = await auth()

  const { data } = await supabase
    .from('companions')
    .insert({ ...data, author: userId })
    .select()
    .single()

  revalidateTag('companions')
  return data
}
```

---

## Page Modifications

### Home Page (`app/page.tsx`)

**Changes:**
- Use parallel queries with `Promise.all()`
- Use cached query functions
- Add error handling

```typescript
const [companions, sessions] = await Promise.all([
  getCompanionsCached({ limit: 3 }),
  getRecentSessionsCached(10)
])
```

### Companions Library (`app/companions/page.tsx`)

**Changes:**
- Use cached query function
- Add caching tags for revalidation

### Companion Detail (`app/companions/[id]/page.tsx`)

**Changes:**
- Use cached query function
- Add error handling with redirect
- Keep as server component for SEO

### My Journey (`app/my-journey/page.tsx`)

**Changes:**
- Convert to client component ("use client")
- Use React Query hooks for user data
- Add loading/skeleton states

---

## Performance Optimizations

### Parallel Queries

Eliminate sequential waterfalls:

```typescript
// Before (sequential):
const companions = await getAllCompanions()
const sessions = await getRecentSessions()

// After (parallel):
const [companions, sessions] = await Promise.all([
  getCompanionsCached({ limit: 3 }),
  getRecentSessionsCached(10)
])
```

### Streaming with Suspense

Use React Suspense for progressive loading:

```typescript
<Suspense fallback={<ProfileSkeleton />}>
  <ProfileContent />
</Suspense>
```

### Connection Pooling

- Verify Supabase connection pooling (Supavisor) is enabled
- No code changes needed

---

## Error Handling

### Server Components

```typescript
try {
  const companion = await getCompanionCached(params.id)
  if (!companion) notFound()
  return <CompanionView companion={companion} />
} catch (error) {
  console.error('Failed to load companion:', error)
  redirect('/companions?error=load_failed')
}
```

### Client Components

```typescript
const { data, isLoading, error } = useUserSessions(userId)

if (isLoading) return <SessionsSkeleton />
if (error) return <ErrorMessage />
```

---

## Security & Auth

### What We Preserve

- Existing Clerk integration (unchanged)
- Existing RLS policies (unchanged)
- Current auth flow (unchanged)

### What We Change

- Separate server/client Supabase clients
- Proper auth context in server components
- Consistent token handling

### Out of Scope

- RLS policy modifications
- Auth flow changes
- Permission system changes

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_clerk_secret
CLERK_PUBLISHABLE_KEY=your_clerk_publishable
```

---

## Testing & Verification

After implementation, verify:

1. **Performance:** Measure TTFB improvement with Lighthouse
2. **Caching:** Check Network tab for cached responses (304 status)
3. **Functionality:** Ensure search/filter works identically
4. **Auth flows:** Verify user-specific data is isolated
5. **Load testing:** Test navigation speed between pages

---

## Success Criteria

- [ ] Reduced TTFB on all pages
- [ ] Cached responses visible in Network tab
- [ ] All filtering functionality preserved
- [ ] No breaking changes to existing features
- [ ] React Query working for user-specific data
- [ ] Server components using cached queries for public data
- [ ] Parallel queries eliminating waterfalls

---

## Files Summary

**New Files (4):**
- `lib/supabase/server.ts`
- `lib/supabase/queries.ts`
- `lib/hooks/use-companions.ts`
- `app/providers.tsx`

**Modified Files (7):**
- `lib/supabase/client.ts` (minor)
- `lib/actions/companion.actions.ts` (remove reads, add revalidation)
- `app/layout.tsx` (add Providers wrapper)
- `app/page.tsx` (parallel queries)
- `app/companions/page.tsx` (caching)
- `app/companions/[id]/page.tsx` (error handling)
- `app/my-journey/page.tsx` (convert to client)

**Unchanged:**
- All UI components
- All types
- RLS policies
- Auth configuration
