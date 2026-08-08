import { describe, expect, it, vi } from 'vitest'
import { GENERIC_AUTH_FAILURE_MESSAGE, hasGenericAuthFailure } from './AuthContext'

vi.mock('../lib/auth/supabaseAdapter', () => ({ supabaseAuthAdapter: {} }))
vi.mock('../lib/auth/webictAdapter', () => ({ webictAuthAdapter: {} }))

describe('server redirect auth failure', () => {
  it('uses a generic message and does not expose an internal scheme', () => {
    expect(hasGenericAuthFailure('?auth=failed&provider=google')).toBe(true)
    expect(GENERIC_AUTH_FAILURE_MESSAGE).toBe('Sign-in could not be completed. Please try again.')
    expect(GENERIC_AUTH_FAILURE_MESSAGE).not.toMatch(/WebICTApplication|cookie|scheme/i)
  })
})
