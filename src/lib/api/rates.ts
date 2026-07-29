import { apiGet } from './client'
import type { KiborResponseDto, UsdPkrResponseDto } from './types'

export function fetchKiborRates(signal?: AbortSignal) {
  return apiGet<KiborResponseDto>('/api/rates/kibor', {
    signal,
    cacheMs: 30 * 60 * 1000,
  })
}

export function fetchUsdPkrRates(signal?: AbortSignal) {
  return apiGet<UsdPkrResponseDto>('/api/rates/usd-pkr', {
    signal,
    cacheMs: 30 * 60 * 1000,
  })
}
