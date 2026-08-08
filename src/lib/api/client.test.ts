import Decimal from 'decimal.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeRuntimeConfig, resetRuntimeConfigForTests } from '../runtimeConfig'
import { buildGoogleStartUrl, fetchAuthMe } from './auth'
import { clearPublicApiCache } from './client'
import { logoutWebict } from './csrf'
import { MarketApiError } from './errors'
import { fetchLatestMarketSummary } from './market'
import { fetchMarketIndexHistory } from './marketIndexes'
import {
  buy,
  correctLot,
  deleteWatchlistItem,
  fetchPortfolioActivity,
  fetchPortfolioHoldings,
  fetchPortfolioLots,
  fetchPortfolioSummary,
  fetchPortfolioWatchlist,
  putWatchlistItem,
  removePosition,
  sell,
} from './portfolio'
import { fetchKiborRates, fetchUsdPkrRates } from './rates'

const marketBody = JSON.stringify({
  tradeDate: '2026-08-01',
  summary: { tradeDate: '2026-08-01', prevVolume: 1, currVolume: 2, advances: 1, declines: 1, unchanged: 0, fluNo: null },
  tickers: [], aiSummary: null, indexSnapshot: null,
})

function json(body: string, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } })
}

describe('canonical API clients', () => {
  beforeEach(() => {
    resetRuntimeConfigForTests()
    initializeRuntimeConfig({ VITE_PLATFORM_MODE: 'webict', VITE_MARKET_API_BASE_URL: 'https://api.test.invalid' })
    clearPublicApiCache()
  })

  it('pins market and rate requests to canonical routes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(marketBody))
      .mockResolvedValueOnce(json('{"asOfDate":null,"tenorOrder":[],"latestCurve":[],"points":[]}'))
      .mockResolvedValueOnce(json('{"pair":"USD/PKR","rateType":"M2M","tenor":"Ready","label":"USD/PKR","unit":"PKR","asOf":null,"points":[]}'))
    vi.stubGlobal('fetch', fetchMock)
    await fetchLatestMarketSummary()
    await fetchKiborRates({ startDate: '2026-01-01', endDate: '2026-08-01' })
    await fetchUsdPkrRates({ startDate: '2026-01-01', endDate: '2026-08-01' })
    expect(fetchMock.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
      '/api/market-summary/latest/tickers', '/api/rates/kibor', '/api/rates/usd-pkr',
    ])
  })

  it('uses the canonical market-index history route and explicit ranges', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json('{"code":"KSEALL","displayName":"KSE All Share","availableRange":{"from":"2021-01-01","to":"2026-08-01"},"requestedRange":{"from":"2021-01-01","to":"2026-08-01"},"appliedRange":{"from":"2021-01-01","to":"2026-08-01"},"asOf":null,"points":[]}')))
    await fetchMarketIndexHistory('KSEALL', { from: '2021-01-01', to: '2026-08-01' })
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.invalid/api/market-indexes/KSEALL/history?from=2021-01-01&to=2026-08-01',
      expect.anything(),
    )
  })

  it('handles /me 200 and bare or ProblemDetails 401 without response.json', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(json('{"id":"11111111-1111-4111-8111-111111111111","email":"a@example.com","emailVerified":true,"displayName":null,"avatarUrl":null}'))
      .mockResolvedValueOnce(new Response('', { status: 401 })))
    await expect(fetchAuthMe()).resolves.toMatchObject({ email: 'a@example.com' })
    await expect(fetchAuthMe()).rejects.toMatchObject({ status: 401, kind: 'unauthenticated' } satisfies Partial<MarketApiError>)
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://api.test.invalid/api/auth/me', expect.objectContaining({ credentials: 'include', cache: 'no-store' }))
  })

  it('constructs same-origin Google start navigation', () => {
    expect(buildGoogleStartUrl('https://api.test.invalid', 'https://staging.webict.test/portfolio?tab=lots#x')).toBe(
      'https://api.test.invalid/api/auth/google/start?returnUrl=https%3A%2F%2Fstaging.webict.test%2Fportfolio%3Ftab%3Dlots%23x',
    )
  })

  it('fetches fresh CSRF and sends the exact logout header', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json('{"headerName":"X-CSRF-TOKEN","token":"do-not-log"}'))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await logoutWebict()
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test.invalid/api/auth/csrf')
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.test.invalid/api/auth/logout')
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'POST', credentials: 'include', headers: expect.objectContaining({ 'X-CSRF-TOKEN': 'do-not-log' }) }))
  })

  it('rejects an unexpected CSRF header name before mutation transport', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json('{"headerName":"X-WRONG","token":"token"}')))
    await expect(logoutWebict()).rejects.toThrow(/X-CSRF-TOKEN/)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('covers every portfolio read route', async () => {
    const summary = '{"id":"11111111-1111-4111-8111-111111111111","name":"Default","baseCurrency":"PKR","status":"active","isDefault":true,"version":1,"holdingsMarketValue":0,"unpricedHoldingCount":0,"createdAt":"2026-08-01T00:00:00Z","updatedAt":"2026-08-01T00:00:00Z"}'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(summary))
      .mockResolvedValueOnce(json('[]'))
      .mockResolvedValueOnce(json('[]'))
      .mockResolvedValueOnce(json('[]'))
      .mockResolvedValueOnce(json('[]'))
    vi.stubGlobal('fetch', fetchMock)
    await Promise.all([fetchPortfolioSummary(), fetchPortfolioLots(), fetchPortfolioHoldings(), fetchPortfolioActivity(), fetchPortfolioWatchlist()])
    expect(fetchMock.mock.calls.map(([url]) => new URL(url).pathname).sort()).toEqual([
      '/api/portfolio', '/api/portfolio/activity', '/api/portfolio/holdings', '/api/portfolio/lots', '/api/portfolio/watchlist',
    ])
    expect(fetchMock.mock.calls.every(([, init]) => init.credentials === 'include' && init.cache === 'no-store')).toBe(true)
  })

  it('covers buy/sell/correction/removal and idempotent watchlist routes with fresh CSRF', async () => {
    const mutation = '{"activityId":"22222222-2222-4222-8222-222222222222","portfolioVersion":2}'
    const correction = '{"activityId":"22222222-2222-4222-8222-222222222222","portfolioVersion":2,"lotVersion":3}'
    const watch = '{"securityId":9007199254740993,"symbol":"HBL","companyName":null,"latestPrice":null,"latestPriceDate":null,"createdAt":"2026-08-01T00:00:00Z","updatedAt":"2026-08-01T00:00:00Z"}'
    const responses = [mutation, mutation, correction, mutation, watch, null]
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      void init
      if (new URL(url).pathname === '/api/auth/csrf') return json('{"headerName":"X-CSRF-TOKEN","token":"token"}')
      const body = responses.shift()
      return body == null ? new Response(null, { status: 204 }) : json(body)
    })
    vi.stubGlobal('fetch', fetchMock)
    const base = { mutationId: '33333333-3333-4333-8333-333333333333' as never, symbol: 'HBL', quantity: 9_007_199_254_740_993n, unitPrice: new Decimal('12.345678'), tradeDate: '2026-08-01' as never, expectedPortfolioVersion: 1n }
    await buy(base); await sell(base)
    await correctLot('44444444-4444-4444-8444-444444444444', { mutationId: base.mutationId, quantity: 1n, unitCost: new Decimal('1.01'), acquisitionDate: base.tradeDate, correctionDate: base.tradeDate, expectedLotVersion: 1n, expectedPortfolioVersion: 1n, reason: 'Correction evidence' })
    await removePosition('HBL', { mutationId: base.mutationId, effectiveDate: base.tradeDate, expectedPortfolioVersion: 1n, reason: 'Remove position' })
    await putWatchlistItem('HBL'); await deleteWatchlistItem('HBL')
    const mutationCalls = fetchMock.mock.calls.filter(([url]) => new URL(url).pathname !== '/api/auth/csrf')
    expect(mutationCalls.map(([url]) => new URL(url).pathname)).toEqual([
      '/api/portfolio/buys', '/api/portfolio/sells',
      '/api/portfolio/lots/44444444-4444-4444-8444-444444444444/corrections',
      '/api/portfolio/positions/HBL/remove', '/api/portfolio/watchlist/HBL', '/api/portfolio/watchlist/HBL',
    ])
    expect(mutationCalls[0][1].body).toContain('"quantity":9007199254740993')
    expect(mutationCalls[0][1].body).toContain('"unitPrice":12.345678')
    expect(mutationCalls.every(([, init]) => (init.headers as Record<string, string>)['X-CSRF-TOKEN'] === 'token')).toBe(true)
  })
})
