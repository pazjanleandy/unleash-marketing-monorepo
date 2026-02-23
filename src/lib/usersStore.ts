export type UserRole = 'customer' | string

export type UserRecord = {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole | null
  metadata: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
  password: string
}

const USERS_STORAGE_KEY = 'public.users'

function safeParseUsers(raw: string | null): UserRecord[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as UserRecord[]) : []
  } catch {
    return []
  }
}

export function getUsers(): UserRecord[] {
  return safeParseUsers(window.localStorage.getItem(USERS_STORAGE_KEY))
}

function saveUsers(users: UserRecord[]) {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const normalizedEmail = email.trim().toLowerCase()
  return getUsers().find((user) => (user.email ?? '').toLowerCase() === normalizedEmail)
}

export function createUser(params: { email: string; fullName: string; password: string; agreeUpdates: boolean }) {
  const nowIso = new Date().toISOString()
  const nextUser: UserRecord = {
    id: crypto.randomUUID(),
    email: params.email.trim().toLowerCase(),
    full_name: params.fullName.trim() || null,
    role: 'customer',
    metadata: {
      email_confirmed: false,
      agree_updates: params.agreeUpdates,
    },
    created_at: nowIso,
    updated_at: nowIso,
    password: params.password,
  }

  const users = getUsers()
  users.push(nextUser)
  saveUsers(users)

  return nextUser
}

export function isEmailConfirmed(user: UserRecord): boolean {
  const metadata = user.metadata
  if (!metadata || typeof metadata !== 'object') {
    return false
  }

  return Boolean((metadata as Record<string, unknown>).email_confirmed)
}
