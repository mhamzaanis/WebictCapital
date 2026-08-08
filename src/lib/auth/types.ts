export type AuthUser = {
  id: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  avatarUrl: string | null
}

export type AuthAdapter = {
  bootstrap(signal?: AbortSignal): Promise<AuthUser | null>
  subscribe(listener: (user: AuthUser | null) => void): () => void
  signInWithGoogle(): Promise<void>
  signOut(signal?: AbortSignal): Promise<void>
}
