import { publicApiGet } from './client'
import { decodeKiborResponse, decodeUsdPkrResponse } from './decoders'

export type KiborRatesRequest = {
  startDate: string
  endDate: string
}

export type UsdPkrRatesRequest = {
  startDate: string
  endDate: string
}

export function fetchKiborRates({ startDate, endDate }: KiborRatesRequest, signal?: AbortSignal) {
  return publicApiGet('/api/rates/kibor', decodeKiborResponse, {
    query: { startDate, endDate },
    signal,
    cacheMs: 30 * 60 * 1000,
  })
}

export function fetchUsdPkrRates({ startDate, endDate }: UsdPkrRatesRequest, signal?: AbortSignal) {
  return publicApiGet('/api/rates/usd-pkr', decodeUsdPkrResponse, {
    query: { startDate, endDate },
    signal,
    cacheMs: 30 * 60 * 1000,
  })
}
