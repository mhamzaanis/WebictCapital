function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function origin(name) {
  const value = required(name)
  if (/[<>]/.test(value) || value.includes('\\://')) {
    throw new Error(`${name} must be a complete API origin, not a placeholder.`)
  }

  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) origin.`)
  }

  if (
    !['http:', 'https:'].includes(url.protocol)
    || url.username
    || url.password
    || url.pathname !== '/'
    || url.search
    || url.hash
  ) {
    throw new Error(`${name} must contain only an HTTP(S) origin.`)
  }
}

function publicSupabaseKey() {
  const key = required('VITE_SUPABASE_ANON_KEY')
  const normalized = key.toLowerCase()
  if (normalized.startsWith('sb_secret_') || normalized.includes('service_role')) {
    throw new Error('VITE_SUPABASE_ANON_KEY must never contain a privileged key.')
  }

  const payload = key.split('.')[1]
  if (!payload) return
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (claims?.role === 'service_role') {
      throw new Error('VITE_SUPABASE_ANON_KEY must never contain a service-role key.')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('must never')) throw error
    // Opaque public/publishable keys are valid and need not be JWTs.
  }
}

const mode = required('VITE_PLATFORM_MODE')
if (mode !== 'webict' && mode !== 'supabase') {
  throw new Error('VITE_PLATFORM_MODE must be exactly webict or supabase.')
}

origin('VITE_MARKET_API_BASE_URL')

if (mode === 'supabase') {
  origin('VITE_SUPABASE_URL')
  publicSupabaseKey()
}
