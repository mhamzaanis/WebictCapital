import { apiGet, dateOnly } from './client'
import type { TickerComparisonResponse, TickerDetailResponse } from './types'

export type TickerDetailRequest = {
  symbol: string
  from?: string
  to?: string
  include?: string[]
  financialYears?: number
  eventLimit?: number
  includeRestatements?: boolean
}

export function fetchTickerDetail(request: TickerDetailRequest, signal?: AbortSignal) {
  return apiGet<TickerDetailResponse>(`/api/tickers/${encodeURIComponent(request.symbol.trim().toUpperCase())}`, {
    signal,
    cacheMs: 10 * 60 * 1000,
    query: {
      from: dateOnly(request.from),
      to: dateOnly(request.to),
      include: request.include?.join(','),
      financialYears: request.financialYears,
      eventLimit: request.eventLimit,
      includeRestatements: request.includeRestatements,
    },
  })
}

export type TickerCompareRequest = {
  symbols: [string, string]
  from?: string
  to?: string
  financialYears?: number
}

export function fetchTickerComparison(request: TickerCompareRequest, signal?: AbortSignal) {
  return apiGet<TickerComparisonResponse>('/api/tickers/compare', {
    signal,
    cacheMs: 10 * 60 * 1000,
    query: {
      symbols: request.symbols.map((symbol) => symbol.trim().toUpperCase()),
      from: dateOnly(request.from),
      to: dateOnly(request.to),
      financialYears: request.financialYears,
    },
  })
}
