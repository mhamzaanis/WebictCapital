import { publicApiGet } from './client'
import { decodeMarketSummaryTickers } from './decoders'

export function fetchLatestMarketSummary(signal?: AbortSignal) {
  return publicApiGet('/api/market-summary/latest/tickers', decodeMarketSummaryTickers, {
    signal,
    cacheMs: 3 * 60 * 1000,
  })
}
