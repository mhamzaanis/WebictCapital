import { dateOnly, publicApiGet } from './client'
import { decodeMarketIndexHistory } from './decoders'
import type { BenchmarkPointDto, MarketIndexHistoryResponseDto } from './types'

export const MARKET_INDEX_CODES = ['KSE100', 'KSE30', 'KMI30', 'KSEALL'] as const
export type MarketIndexCode = typeof MARKET_INDEX_CODES[number]

export function fetchMarketIndexHistory(
  code: MarketIndexCode,
  range: { from?: string; to?: string },
  signal?: AbortSignal,
): Promise<MarketIndexHistoryResponseDto> {
  return publicApiGet(
    `/api/market-indexes/${encodeURIComponent(code)}/history`,
    decodeMarketIndexHistory,
    {
      query: { from: dateOnly(range.from), to: dateOnly(range.to) },
      signal,
      cacheMs: 30 * 60 * 1000,
    },
  )
}

export function latestActualObservations(
  response: MarketIndexHistoryResponseDto,
  limit = 252,
): BenchmarkPointDto[] {
  if (!Number.isSafeInteger(limit) || limit < 0) throw new RangeError('Observation limit must be a non-negative safe integer.')
  for (let index = 1; index < response.points.length; index += 1) {
    if (response.points[index - 1].tradeDate > response.points[index].tradeDate) {
      throw new RangeError('Market index history points must arrive in ascending order.')
    }
  }
  return response.points.slice(Math.max(0, response.points.length - limit))
}
