import { buildGoogleStartUrl, fetchAuthMe } from '../api/auth'
import { logoutWebict } from '../api/csrf'
import { MarketApiError } from '../api/errors'
import { getRuntimeConfig } from '../runtimeConfig'
import type { AuthAdapter } from './types'

export const webictAuthAdapter: AuthAdapter = {
  async bootstrap(signal) {
    try {
      return await fetchAuthMe(signal)
    } catch (error) {
      if (error instanceof MarketApiError && error.status === 401) return null
      throw error
    }
  },
  subscribe() {
    return () => undefined
  },
  async signInWithGoogle() {
    window.location.assign(
      buildGoogleStartUrl(getRuntimeConfig().apiBaseUrl, window.location.href),
    )
  },
  signOut(signal) {
    return logoutWebict(signal)
  },
}
