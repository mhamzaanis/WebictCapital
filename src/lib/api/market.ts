import { apiGet } from './client'
import type { MarketSummaryTickersResponse } from './types'

export function fetchLatestMarketSummary(signal?: AbortSignal) {
  return apiGet<MarketSummaryTickersResponse>('/market-summary', {
    signal,
    cacheMs: 3 * 60 * 1000,
  })
}
