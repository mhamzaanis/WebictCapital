import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getRuntimeConfig } from './runtimeConfig'

const config = getRuntimeConfig()
const supabaseUrl = config.platformMode === 'supabase' ? config.supabaseUrl : undefined
const supabaseAnonKey = config.platformMode === 'supabase' ? config.supabaseAnonKey : undefined

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

let _client: SupabaseClient | null = null

export const supabase: SupabaseClient | null = (() => {
  if (!hasSupabaseConfig) return null
  if (!_client) {
    _client = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,   // catches OAuth redirects automatically
      },
    })
  }
  return _client
})()
