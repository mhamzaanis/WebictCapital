import { apiGet } from './client'
import type { KiborResponseDto, UsdPkrResponseDto } from './types'

export type KiborRatesRequest = {
  startDate: string
  endDate: string
}

export type UsdPkrRatesRequest = {
  startDate: string
  endDate: string
}

export function fetchKiborRates({ startDate, endDate }: KiborRatesRequest, signal?: AbortSignal) {
  return apiGet<KiborResponseDto>('/rates/kibor', {
    query: { startDate, endDate },
    signal,
    cacheMs: 30 * 60 * 1000,
  })
}

export function fetchUsdPkrRates({ startDate, endDate }: UsdPkrRatesRequest, signal?: AbortSignal) {
  return apiGet<UsdPkrResponseDto>('/rates/usd-pkr', {
    query: { startDate, endDate },
    signal,
    cacheMs: 30 * 60 * 1000,
  })
}
