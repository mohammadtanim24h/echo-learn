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
