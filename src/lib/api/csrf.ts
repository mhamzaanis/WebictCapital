import { privateApiRequest } from './client'
import { decodeCsrf } from './decoders'

export async function withFreshCsrf<T>(
  operation: (header: Readonly<Record<'X-CSRF-TOKEN', string>>) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const csrf = await privateApiRequest('/api/auth/csrf', decodeCsrf, { signal })
  return operation({ 'X-CSRF-TOKEN': csrf.token })
}

export function logoutWebict(signal?: AbortSignal): Promise<void> {
  return withFreshCsrf(
    (headers) => privateApiRequest<void>('/api/auth/logout', null, {
      method: 'POST',
      headers,
      signal,
    }),
    signal,
  )
}
