import { MarketApiError } from './errors'

const DEFAULT_BASE_URL = 'https://api.webictcapital.com'
const DEFAULT_CACHE_MS = 5 * 60 * 1000

type CacheEntry<T> = {
  data: T
  fetchedAt: number
}

const responseCache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export type ApiQueryValue = string | number | boolean | null | undefined | string[]

export type ApiRequestOptions = {
  query?: Record<string, ApiQueryValue>
  signal?: AbortSignal
  cacheMs?: number
}

function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_MARKET_API_BASE_URL as string | undefined
  return (configured?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

export function serializeQuery(query: Record<string, ApiQueryValue> = {}): string {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item.trim()) params.append(key, item.trim())
      })
      return
    }
    params.set(key, String(value))
  })
  return params.toString()
}

export function dateOnly(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

async function toApiError(response: Response): Promise<MarketApiError> {
  let title: string | null = null
  let detail: string | null = null
  try {
    const body = await response.clone().json() as { title?: string; detail?: string; message?: string }
    title = body.title ?? null
    detail = body.detail ?? body.message ?? null
  } catch {
    detail = await response.text().catch(() => null)
  }

  const kind = response.status === 400
    ? 'invalid_request'
    : response.status === 404
      ? 'not_found'
      : response.status >= 500
        ? 'infrastructure'
        : 'unknown'

  return new MarketApiError({
    kind,
    status: response.status,
    title,
    detail,
    message: detail ?? title ?? `Market API request failed with HTTP ${response.status}.`,
  })
}

export async function apiGet<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const query = serializeQuery(options.query)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${apiBaseUrl()}${normalizedPath}${query ? `?${query}` : ''}`
  const cacheKey = `GET ${url}`
  const cacheMs = options.cacheMs ?? DEFAULT_CACHE_MS
  const cached = responseCache.get(cacheKey) as CacheEntry<T> | undefined

  if (cached && Date.now() - cached.fetchedAt < cacheMs) return cached.data

  const existing = options.signal ? undefined : inflight.get(cacheKey) as Promise<T> | undefined
  if (existing) return existing

  const request = (async () => {
    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        signal: options.signal,
        headers: { Accept: 'application/json' },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new MarketApiError({
        kind: 'network',
        status: null,
        message: error instanceof Error ? error.message : 'Network request failed.',
      })
    }

    if (!response.ok) throw await toApiError(response)

    const data = await response.json() as T
    responseCache.set(cacheKey, { data, fetchedAt: Date.now() })
    return data
  })()

  if (!options.signal) inflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    if (!options.signal) inflight.delete(cacheKey)
  }
}
