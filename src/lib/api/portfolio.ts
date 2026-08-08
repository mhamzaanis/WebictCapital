import { privateApiRequest } from './client'
import { withFreshCsrf } from './csrf'
import {
  decodeHoldings,
  decodeLotCorrection,
  decodePortfolioActivities,
  decodePortfolioMutation,
  decodePortfolioSummary,
  decodePositionLots,
  decodeWatchlist,
  decodeWatchlistItem,
} from './decoders'
import type {
  HoldingResponse,
  LotCorrectionRequest,
  LotCorrectionResponse,
  NativeTradeRequest,
  PortfolioActivityResponse,
  PortfolioMutationResponse,
  PortfolioSummaryResponse,
  PositionLotResponse,
  PositionRemovalRequest,
  WatchlistItemResponse,
} from './types'

export type PortfolioSnapshot = {
  summary: PortfolioSummaryResponse
  lots: PositionLotResponse[]
  holdings: HoldingResponse[]
  activity: PortfolioActivityResponse[]
  watchlist: WatchlistItemResponse[]
}

export const fetchPortfolioSummary = (signal?: AbortSignal) =>
  privateApiRequest('/api/portfolio', decodePortfolioSummary, { signal })
export const fetchPortfolioLots = (signal?: AbortSignal) =>
  privateApiRequest('/api/portfolio/lots', decodePositionLots, { signal })
export const fetchPortfolioHoldings = (signal?: AbortSignal) =>
  privateApiRequest('/api/portfolio/holdings', decodeHoldings, { signal })
export const fetchPortfolioActivity = (signal?: AbortSignal) =>
  privateApiRequest('/api/portfolio/activity', decodePortfolioActivities, { signal })
export const fetchPortfolioWatchlist = (signal?: AbortSignal) =>
  privateApiRequest('/api/portfolio/watchlist', decodeWatchlist, { signal })

export async function fetchPortfolioSnapshot(signal?: AbortSignal): Promise<PortfolioSnapshot> {
  const [summary, lots, holdings, activity, watchlist] = await Promise.all([
    fetchPortfolioSummary(signal),
    fetchPortfolioLots(signal),
    fetchPortfolioHoldings(signal),
    fetchPortfolioActivity(signal),
    fetchPortfolioWatchlist(signal),
  ])
  return { summary, lots, holdings, activity, watchlist }
}

function mutation<T>(
  path: string,
  body: unknown,
  decoder: (value: unknown, path?: string) => T,
  signal?: AbortSignal,
): Promise<T> {
  return withFreshCsrf(
    (headers) => privateApiRequest(path, decoder, {
      method: 'POST',
      body,
      headers,
      signal,
    }),
    signal,
  )
}

export const buy = (request: NativeTradeRequest, signal?: AbortSignal): Promise<PortfolioMutationResponse> =>
  mutation('/api/portfolio/buys', request, decodePortfolioMutation, signal)
export const sell = (request: NativeTradeRequest, signal?: AbortSignal): Promise<PortfolioMutationResponse> =>
  mutation('/api/portfolio/sells', request, decodePortfolioMutation, signal)
export const correctLot = (
  lotId: string,
  request: LotCorrectionRequest,
  signal?: AbortSignal,
): Promise<LotCorrectionResponse> =>
  mutation(`/api/portfolio/lots/${encodeURIComponent(lotId)}/corrections`, request, decodeLotCorrection, signal)
export const removePosition = (
  symbol: string,
  request: PositionRemovalRequest,
  signal?: AbortSignal,
): Promise<PortfolioMutationResponse> =>
  mutation(`/api/portfolio/positions/${encodeURIComponent(symbol)}/remove`, request, decodePortfolioMutation, signal)

export const putWatchlistItem = (symbol: string, signal?: AbortSignal): Promise<WatchlistItemResponse> =>
  withFreshCsrf(
    (headers) => privateApiRequest(
      `/api/portfolio/watchlist/${encodeURIComponent(symbol)}`,
      decodeWatchlistItem,
      { method: 'PUT', headers, signal },
    ),
    signal,
  )

export const deleteWatchlistItem = (symbol: string, signal?: AbortSignal): Promise<void> =>
  withFreshCsrf(
    (headers) => privateApiRequest<void>(
      `/api/portfolio/watchlist/${encodeURIComponent(symbol)}`,
      null,
      { method: 'DELETE', headers, signal },
    ),
    signal,
  )
