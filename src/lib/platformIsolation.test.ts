import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  initializeRuntimeConfig,
  resetRuntimeConfigForTests,
} from './runtimeConfig'

const supabaseProbe = vi.hoisted(() => ({
  moduleLoads: 0,
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOAuth: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  })),
}))

vi.mock('@supabase/supabase-js', () => {
  supabaseProbe.moduleLoads += 1
  return { createClient: supabaseProbe.createClient }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetRuntimeConfigForTests()
})

describe('platform module and network isolation', () => {
  it('does not load or initialize Supabase through any WebICT entry boundary', async () => {
    initializeRuntimeConfig({
      VITE_PLATFORM_MODE: 'webict',
      VITE_MARKET_API_BASE_URL: 'https://staging-api.invalid',
    })
    const fetchSpy = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response('', { status: 401 }),
    )
    const webSocketSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubGlobal('WebSocket', webSocketSpy)

    const { loadAuthAdapter } = await import('./auth/adapterLoader')
    const auth = await loadAuthAdapter('webict')
    await expect(auth.bootstrap()).resolves.toBeNull()

    const { loadPortfolioModule } = await import('../components/pages/portfolioPageLoader')
    const portfolio = await loadPortfolioModule('webict')
    await import('../App')
    await import('../context/AuthContext')
    await import('../components/WatchlistModal')
    await import('../components/MarketSummaryModal')
    await import('./platformWatchlist')

    expect(portfolio.PortfolioComponent.name).toBe('WebictPortfolioPage')
    expect(supabaseProbe.moduleLoads).toBe(0)
    expect(supabaseProbe.createClient).not.toHaveBeenCalled()
    expect(webSocketSpy).not.toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('https://staging-api.invalid/api/auth/me')
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' })
    expect(fetchSpy.mock.calls.every(([input]) => !String(input).includes('supabase'))).toBe(true)
  }, 60_000)

  it('loads the transitional adapters only when Supabase mode is explicit', async () => {
    initializeRuntimeConfig({
      VITE_PLATFORM_MODE: 'supabase',
      VITE_MARKET_API_BASE_URL: 'https://api.example.invalid',
      VITE_SUPABASE_URL: 'https://project-ref.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'public-anon-placeholder',
    })

    const { loadAuthAdapter } = await import('./auth/adapterLoader')
    const auth = await loadAuthAdapter('supabase')
    const { loadPortfolioModule } = await import('../components/pages/portfolioPageLoader')
    const portfolio = await loadPortfolioModule('supabase')

    expect(auth).toBeDefined()
    expect(portfolio.PortfolioComponent.name).toBe('SupabasePortfolioPage')
    expect(supabaseProbe.moduleLoads).toBe(1)
    expect(supabaseProbe.createClient).toHaveBeenCalledOnce()
  }, 60_000)
})
