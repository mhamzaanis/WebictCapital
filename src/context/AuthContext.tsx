/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getErrorMessage } from '../lib/api/errors'
import type { AuthAdapter, AuthUser } from '../lib/auth/types'
import { loadAuthAdapter } from '../lib/auth/adapterLoader'
import { clearAllPrivateState, registerPrivateStateReset } from '../lib/privateState'
import { getRuntimeConfig } from '../lib/runtimeConfig'

export type AuthState = {
  user: AuthUser | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export const GENERIC_AUTH_FAILURE_MESSAGE = 'Sign-in could not be completed. Please try again.'

export function hasGenericAuthFailure(search: string): boolean {
  return new URLSearchParams(search).get('auth') === 'failed'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const adapterPromise = useMemo(
    () => loadAuthAdapter(getRuntimeConfig().platformMode),
    [],
  )
  const adapterRef = useRef<AuthAdapter | null>(null)
  const initialAuthFailure = useMemo(() => hasGenericAuthFailure(window.location.search), [])
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(
    initialAuthFailure ? GENERIC_AUTH_FAILURE_MESSAGE : null,
  )
  const userId = useRef<string | null>(null)

  const transitionUser = useCallback((next: AuthUser | null) => {
    const nextId = next?.id ?? null
    if (nextId !== userId.current) clearAllPrivateState()
    userId.current = nextId
    setUser(next)
  }, [])

  useEffect(() => registerPrivateStateReset(() => {
    userId.current = null
    setUser(null)
  }), [])

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true
    let unsubscribe: () => void = () => undefined
    const params = new URLSearchParams(window.location.search)
    if (hasGenericAuthFailure(window.location.search)) {
      params.delete('auth')
      const query = params.toString()
      window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
    }

    void (async () => {
      try {
        const adapter = await adapterPromise
        if (!mounted) return
        adapterRef.current = adapter
        unsubscribe = adapter.subscribe((next) => {
          if (!mounted) return
          transitionUser(next)
          setLoading(false)
          if (next) setError(null)
        })
        const next = await adapter.bootstrap(controller.signal)
        if (!mounted) return
        transitionUser(next)
        setLoading(false)
      } catch (reason) {
        if (!mounted || controller.signal.aborted) return
        transitionUser(null)
        setError(getErrorMessage(reason))
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
      controller.abort()
      unsubscribe()
    }
  }, [adapterPromise, transitionUser])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    try {
      const adapter = adapterRef.current ?? await adapterPromise
      await adapter.signInWithGoogle()
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }, [adapterPromise])

  const signOut = useCallback(async () => {
    setError(null)
    transitionUser(null)
    try {
      const adapter = adapterRef.current ?? await adapterPromise
      await adapter.signOut()
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }, [adapterPromise, transitionUser])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
