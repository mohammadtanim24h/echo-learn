// lib/api/companions.ts

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
