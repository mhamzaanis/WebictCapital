export type PlatformMode = 'supabase' | 'webict'

export type RuntimeConfig = Readonly<{
  platformMode: PlatformMode
  apiBaseUrl: string
  supabaseUrl?: string
  supabaseAnonKey?: string
}>

type RuntimeEnvironment = Record<string, string | boolean | undefined>

function requiredText(environment: RuntimeEnvironment, key: string): string {
  const value = environment[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required frontend configuration: ${key}.`)
  }
  return value.trim()
}

function validateOrigin(value: string, key: string): string {
  if (/[<>]/.test(value) || value.includes('\\://')) {
    throw new Error(`${key} must be a complete API origin, not a placeholder.`)
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${key} must be an absolute http(s) origin.`)
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(`${key} must be an absolute http(s) origin without credentials, path, query, or fragment.`)
  }
  if (!url.hostname || url.hostname.includes('<') || url.hostname.includes('>')) {
    throw new Error(`${key} must contain a real hostname.`)
  }
  return url.origin
}

function rejectPrivilegedBrowserKey(value: string): string {
  const normalized = value.toLowerCase()
  if (normalized.startsWith('sb_secret_') || normalized.includes('service_role')) {
    throw new Error('VITE_SUPABASE_ANON_KEY must be a public anonymous/publishable key, never a privileged key.')
  }
  const payload = value.split('.')[1]
  if (payload) {
    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
      const decoded = JSON.parse(globalThis.atob(padded)) as { role?: unknown }
      if (decoded.role === 'service_role') {
        throw new Error('privileged')
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'privileged') {
        throw new Error('VITE_SUPABASE_ANON_KEY must be a public anonymous/publishable key, never a service-role key.')
      }
      // Opaque publishable keys do not need to be JWTs.
    }
  }
  return value
}

export function validateRuntimeConfig(environment: RuntimeEnvironment): RuntimeConfig {
  const rawMode = requiredText(environment, 'VITE_PLATFORM_MODE')
  if (rawMode !== 'supabase' && rawMode !== 'webict') {
    throw new Error('VITE_PLATFORM_MODE must be exactly "supabase" or "webict".')
  }

  const apiBaseUrl = validateOrigin(
    requiredText(environment, 'VITE_MARKET_API_BASE_URL'),
    'VITE_MARKET_API_BASE_URL',
  )

  if (rawMode === 'webict') {
    return Object.freeze({ platformMode: rawMode, apiBaseUrl })
  }

  const supabaseUrl = validateOrigin(
    requiredText(environment, 'VITE_SUPABASE_URL'),
    'VITE_SUPABASE_URL',
  )
  const supabaseAnonKey = rejectPrivilegedBrowserKey(
    requiredText(environment, 'VITE_SUPABASE_ANON_KEY'),
  )
  return Object.freeze({ platformMode: rawMode, apiBaseUrl, supabaseUrl, supabaseAnonKey })
}

let runtimeConfig: RuntimeConfig | undefined

export function initializeRuntimeConfig(environment: RuntimeEnvironment = import.meta.env): RuntimeConfig {
  runtimeConfig ??= validateRuntimeConfig(environment)
  return runtimeConfig
}

export function getRuntimeConfig(): RuntimeConfig {
  return runtimeConfig ?? initializeRuntimeConfig()
}

export function resetRuntimeConfigForTests(): void {
  runtimeConfig = undefined
}
