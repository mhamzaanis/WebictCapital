import { describe, expect, it } from 'vitest'
import { validateRuntimeConfig } from './runtimeConfig'

describe('runtime configuration', () => {
  it('fails closed for missing or invalid platform modes and API origins', () => {
    expect(() => validateRuntimeConfig({ VITE_MARKET_API_BASE_URL: 'https://api.test' })).toThrow(/VITE_PLATFORM_MODE/)
    expect(() => validateRuntimeConfig({ VITE_PLATFORM_MODE: 'auto', VITE_MARKET_API_BASE_URL: 'https://api.test' })).toThrow(/exactly/)
    expect(() => validateRuntimeConfig({ VITE_PLATFORM_MODE: 'webict' })).toThrow(/VITE_MARKET_API_BASE_URL/)
    expect(() => validateRuntimeConfig({ VITE_PLATFORM_MODE: 'webict', VITE_MARKET_API_BASE_URL: 'https://api.test/path' })).toThrow(/origin/)
  })

  it('selects WebICT without browser Supabase configuration or fallback', () => {
    expect(validateRuntimeConfig({ VITE_PLATFORM_MODE: 'webict', VITE_MARKET_API_BASE_URL: 'https://api.test' })).toEqual({ platformMode: 'webict', apiBaseUrl: 'https://api.test' })
  })

  it('requires only a public anonymous key in explicit Supabase mode', () => {
    expect(() => validateRuntimeConfig({ VITE_PLATFORM_MODE: 'supabase', VITE_MARKET_API_BASE_URL: 'https://api.test' })).toThrow(/VITE_SUPABASE_URL/)
    expect(validateRuntimeConfig({ VITE_PLATFORM_MODE: 'supabase', VITE_MARKET_API_BASE_URL: 'https://api.test', VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_ANON_KEY: 'public-anon-placeholder' }).platformMode).toBe('supabase')
    expect(() => validateRuntimeConfig({ VITE_PLATFORM_MODE: 'supabase', VITE_MARKET_API_BASE_URL: 'https://api.test', VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_secret_placeholder' })).toThrow(/never a privileged key/)
  })
})
