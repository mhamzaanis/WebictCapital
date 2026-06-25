import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sessionRef = useRef<Session | null>(null)
  const userRef = useRef<User | null>(null)

  const updateSessionAndUser = (newSession: Session | null) => {
    const currentSession = sessionRef.current
    const isSameSession =
      currentSession === newSession ||
      (currentSession !== null &&
        newSession !== null &&
        currentSession.access_token === newSession.access_token &&
        currentSession.user?.id === newSession.user?.id &&
        currentSession.user?.email === newSession.user?.email &&
        currentSession.user?.updated_at === newSession.user?.updated_at)

    if (!isSameSession) {
      sessionRef.current = newSession
      userRef.current = newSession?.user ?? null
      setSession(newSession)
      setUser(newSession?.user ?? null)
    }
  }

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted.current) return
      if (error) setError(error.message)
      updateSessionAndUser(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted.current) return
        updateSessionAndUser(session)
        setLoading(false)
        if (session) setError(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])


  const signInWithGoogle = async () => {
    if (!supabase) return
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
        queryParams: { prompt: 'select_account' },
      },
    })

    if (error) setError(error.message)
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (!mounted.current) return
    if (error) { setError(error.message); return }
    updateSessionAndUser(null)
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{ user, session, loading, error, signInWithGoogle, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}