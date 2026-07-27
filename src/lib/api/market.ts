import { apiGet } from './client'
import type { MarketSummaryTickersResponse } from './types'

export function fetchLatestMarketSummary(signal?: AbortSignal) {
  return apiGet<MarketSummaryTickersResponse>('/api/market-summary/latest/tickers', {
    signal,
    cacheMs: 3 * 60 * 1000,
  })
}
