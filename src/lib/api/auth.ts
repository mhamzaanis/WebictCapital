import { privateApiRequest } from './client'
import { decodeAuthMe } from './decoders'
import type { AuthMeResponse } from './types'

export function fetchAuthMe(signal?: AbortSignal): Promise<AuthMeResponse> {
  return privateApiRequest('/api/auth/me', decodeAuthMe, { signal })
}

export function buildGoogleStartUrl(apiBaseUrl: string, currentPageUrl: string): string {
  const current = new URL(currentPageUrl)
  const returnUrl = `${current.origin}${current.pathname}${current.search}${current.hash}`
  const start = new URL('/api/auth/google/start', `${apiBaseUrl}/`)
  start.searchParams.set('returnUrl', returnUrl)
  return start.toString()
}
