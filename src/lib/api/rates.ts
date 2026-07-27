import { apiGet, dateOnly } from './client'
import type { KiborResponseDto, UsdPkrResponseDto } from './types'

export type RatesRequest = {
  from?: string
  to?: string
}

export function fetchKiborRates(request: RatesRequest & { tenors?: string[] } = {}, signal?: AbortSignal) {
  return apiGet<KiborResponseDto>('/api/rates/kibor', {
    signal,
    cacheMs: 30 * 60 * 1000,
    query: {
      from: dateOnly(request.from),
      to: dateOnly(request.to),
      tenors: request.tenors?.join(','),
    },
  })
}

export function fetchUsdPkrRates(request: RatesRequest = {}, signal?: AbortSignal) {
  return apiGet<UsdPkrResponseDto>('/api/rates/usd-pkr', {
    signal,
    cacheMs: 30 * 60 * 1000,
    query: {
      from: dateOnly(request.from),
      to: dateOnly(request.to),
    },
  })
}
