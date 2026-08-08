import { decodeProblemDetails, type Decoder } from './decoders'
import { MarketApiError, type ApiErrorKind } from './errors'
import { parseLosslessJson, stringifyLosslessJson } from './json'
import { clearAllPrivateState, registerPrivateRequest } from '../privateState'
import { getRuntimeConfig } from '../runtimeConfig'

const DEFAULT_PUBLIC_CACHE_MS = 5 * 60 * 1000

type CacheEntry<T> = { data: T; fetchedAt: number }
const publicResponseCache = new Map<string, CacheEntry<unknown>>()
const publicInflight = new Map<string, Promise<unknown>>()

export type ApiQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]

export type PublicApiRequestOptions = {
  query?: Record<string, ApiQueryValue>
  signal?: AbortSignal
  cacheMs?: number
}

export type PrivateApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  query?: Record<string, ApiQueryValue>
  signal?: AbortSignal
  body?: unknown
  headers?: Readonly<Record<string, string>>
}

export function serializeQuery(query: Record<string, ApiQueryValue> = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        const normalized = item.trim()
        if (normalized) params.append(key, normalized)
      }
    } else {
      params.append(key, String(value))
    }
  }
  return params.toString()
}

export function dateOnly(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

export function buildApiUrl(path: string, query: Record<string, ApiQueryValue> = {}): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const serialized = serializeQuery(query)
  return `${getRuntimeConfig().apiBaseUrl}${normalizedPath}${serialized ? `?${serialized}` : ''}`
}

function errorKind(status: number): ApiErrorKind {
  if (status === 400) return 'invalid_request'
  if (status === 401) return 'unauthenticated'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 503) return 'writes_unavailable'
  if (status >= 500) return 'infrastructure'
  return 'unknown'
}

async function toApiError(response: Response, text: string): Promise<MarketApiError> {
  let problem = null
  if (text.trim()) {
    try {
      problem = decodeProblemDetails(parseLosslessJson(text))
    } catch {
      // A valid bare 401/5xx response is still classified by its HTTP status.
    }
  }
  const fallbackDetail = text.trim() && !problem ? text.trim() : null
  const title = problem?.title ?? null
  const detail = problem?.detail ?? fallbackDetail
  return new MarketApiError({
    kind: errorKind(response.status),
    status: response.status,
    title,
    detail,
    problem,
    message: detail ?? title ?? `WebICT API request failed with HTTP ${response.status}.`,
  })
}

async function fetchResponse(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new MarketApiError({
      kind: 'network',
      status: null,
      message: error instanceof Error ? error.message : 'Network request failed.',
    })
  }
}

async function decodeResponse<T>(response: Response, decoder: Decoder<T> | null): Promise<T> {
  const text = response.status === 204 ? '' : await response.text()
  if (!response.ok) throw await toApiError(response, text)
  if (response.status === 204) return undefined as T
  if (!text.trim()) {
    throw new MarketApiError({
      kind: 'infrastructure',
      status: response.status,
      message: 'The WebICT API returned an empty response body.',
    })
  }
  if (!decoder) {
    throw new MarketApiError({
      kind: 'infrastructure',
      status: response.status,
      message: 'No response decoder was configured for a non-empty response.',
    })
  }
  return decoder(parseLosslessJson(text))
}

export async function publicApiGet<T>(
  path: string,
  decoder: Decoder<T>,
  options: PublicApiRequestOptions = {},
): Promise<T> {
  const url = buildApiUrl(path, options.query)
  const cacheKey = `GET ${url}`
  const cacheMs = options.cacheMs ?? DEFAULT_PUBLIC_CACHE_MS
  const cached = publicResponseCache.get(cacheKey) as CacheEntry<T> | undefined
  if (cached && Date.now() - cached.fetchedAt < cacheMs) return cached.data

  const existing = options.signal
    ? undefined
    : publicInflight.get(cacheKey) as Promise<T> | undefined
  if (existing) return existing

  const request = (async () => {
    const response = await fetchResponse(url, {
      method: 'GET',
      credentials: 'omit',
      signal: options.signal,
      headers: { Accept: 'application/json' },
    })
    const data = await decodeResponse(response, decoder)
    publicResponseCache.set(cacheKey, { data, fetchedAt: Date.now() })
    return data
  })()

  if (!options.signal) publicInflight.set(cacheKey, request)
  try {
    return await request
  } finally {
    if (!options.signal) publicInflight.delete(cacheKey)
  }
}

export function clearPublicApiCache(): void {
  publicResponseCache.clear()
  publicInflight.clear()
}

export async function privateApiRequest<T>(
  path: string,
  decoder: Decoder<T> | null,
  options: PrivateApiRequestOptions = {},
): Promise<T> {
  const controller = new AbortController()
  const unregister = registerPrivateRequest(controller)
  const signals = [controller.signal, options.signal].filter(Boolean) as AbortSignal[]
  const signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals)
  const hasBody = options.body !== undefined
  try {
    const response = await fetchResponse(buildApiUrl(path, options.query), {
      method: options.method ?? 'GET',
      credentials: 'include',
      signal,
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: hasBody ? stringifyLosslessJson(options.body) : undefined,
      cache: 'no-store',
    })
    const text = response.status === 204 ? '' : await response.text()
    if (!response.ok) {
      const error = await toApiError(response, text)
      if (response.status === 401) clearAllPrivateState()
      throw error
    }
    if (response.status === 204) return undefined as T
    if (!text.trim() || !decoder) {
      throw new MarketApiError({
        kind: 'infrastructure',
        status: response.status,
        message: !text.trim()
          ? 'The WebICT API returned an empty response body.'
          : 'No response decoder was configured for a non-empty response.',
      })
    }
    return decoder(parseLosslessJson(text))
  } finally {
    unregister()
  }
}
