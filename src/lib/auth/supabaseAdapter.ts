import type { User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '../supabase'
import type { AuthAdapter, AuthUser } from './types'

function normalizeUser(user: User | null): AuthUser | null {
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    displayName: typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null,
    avatarUrl: typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : null,
  }
}

function client() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error('Supabase mode is selected but its browser adapter is not configured.')
  }
  return supabase
}

export const supabaseAuthAdapter: AuthAdapter = {
  async bootstrap() {
    const { data, error } = await client().auth.getSession()
    if (error) throw error
    return normalizeUser(data.session?.user ?? null)
  },
  subscribe(listener) {
    const { data } = client().auth.onAuthStateChange((_event, session) => {
      listener(normalizeUser(session?.user ?? null))
    })
    return () => data.subscription.unsubscribe()
  },
  async signInWithGoogle() {
    const { error } = await client().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  },
  async signOut() {
    const { error } = await client().auth.signOut()
    if (error) throw error
  },
}
