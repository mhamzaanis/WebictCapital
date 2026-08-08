import type { AuthAdapter } from './types'
import type { PlatformMode } from '../runtimeConfig'

export async function loadAuthAdapter(mode: PlatformMode): Promise<AuthAdapter> {
  if (mode === 'webict') {
    return (await import('./webictAdapter')).webictAuthAdapter
  }
  return (await import('./supabaseAdapter')).supabaseAuthAdapter
}
