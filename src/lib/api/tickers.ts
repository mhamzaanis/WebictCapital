import { dateOnly, publicApiGet } from './client'
import { decodeTickerComparison, decodeTickerDetail } from './decoders'

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
  return publicApiGet(`/api/tickers/${encodeURIComponent(request.symbol.trim().toUpperCase())}`, decodeTickerDetail, {
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
  symbols: readonly string[]
  benchmarks?: readonly string[]
  from?: string
  to?: string
}

export function fetchTickerComparison(request: TickerCompareRequest, signal?: AbortSignal) {
  return publicApiGet('/api/tickers/compare', decodeTickerComparison, {
    signal,
    cacheMs: 10 * 60 * 1000,
    query: {
      symbols: request.symbols.map((symbol) => symbol.trim().toUpperCase()),
      benchmarks: request.benchmarks?.map((benchmark) => benchmark.trim().toUpperCase()),
      from: dateOnly(request.from),
      to: dateOnly(request.to),
    },
  })
}
