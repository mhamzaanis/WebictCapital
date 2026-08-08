import type { MarketAiSummaryDto, MarketIndexDto, MarketSummaryTickersResponse, MarketTickerDto } from './api/types'
import Decimal from 'decimal.js'
import { numericSign, projectNumeric, type PresentableNumeric } from './numericPresentation'

export const PRIMARY_INDEX_CODE = 'KSE100'

export const INDEX_ORDER = ['KSE100', 'KSE30', 'ALLSHR', 'KMI30', 'KMIALLSHR', 'KSE100PR'] as const

export const INDEX_DISPLAY_NAMES: Record<string, string> = {
  KSE100: 'KSE-100',
  KSE30: 'KSE-30',
  ALLSHR: 'KSE All Share',
  KMI30: 'KMI-30',
  KMIALLSHR: 'KMI All Share',
  KSE100PR: 'KSE-100 Price Return',
}

export type Tone = 'positive' | 'negative' | 'neutral'

export type RankedTicker = MarketTickerDto & {
  changePct: number | null
  estimatedTradedValue: number | null
}

export type BreadthDatum = {
  label: 'Advancing' | 'Declining' | 'Unchanged'
  value: number | null
  pct: number | null
  tone: Tone
}

export type BreadthModel = {
  segments: BreadthDatum[]
  total: number | null
  advancingShare: number | null
  declineAdvanceRatio: number | null
}

export type MoverTab = 'gainers' | 'losers' | 'active' | 'value'

export type MoverGroup = {
  id: MoverTab
  label: string
  rows: RankedTicker[]
}

export type SectorRow = {
  sector: string
  issues: number
  advances: number
  declines: number
  unchanged: number
  shares: number
  estimated: number
  estimatedObservationCount: number
}

export type SectorSortKey = 'estimated' | 'issues' | 'shares' | 'declines'

export function toneForValue(value: PresentableNumeric | null | undefined): Tone {
  if (value == null || numericSign(value) === 0) return 'neutral'
  return numericSign(value) > 0 ? 'positive' : 'negative'
}

export function changePctFromQuote(ticker: Pick<MarketTickerDto, 'close' | 'change'>): number | null {
  if (ticker.close == null || ticker.change == null) return null
  const previous = ticker.close.minus(ticker.change)
  if (!previous.isPositive()) return null
  return projectNumeric(ticker.change.div(previous).mul(100), 'ticker change percentage')
}

export function estimatedValue(ticker: Pick<MarketTickerDto, 'close' | 'turnover'>): number | null {
  if (ticker.close == null || !ticker.close.isPositive() || ticker.turnover == null || ticker.turnover <= 0n) return null
  return projectNumeric(ticker.close.mul(new Decimal(ticker.turnover.toString())), 'estimated traded value')
}

export function rankTickers(tickers: MarketTickerDto[]): RankedTicker[] {
  return tickers.map((ticker) => ({
    ...ticker,
    changePct: changePctFromQuote(ticker),
    estimatedTradedValue: estimatedValue(ticker),
  }))
}

export function indexDisplayName(index: Pick<MarketIndexDto, 'code' | 'displayName'>): string {
  if (INDEX_DISPLAY_NAMES[index.code]) return INDEX_DISPLAY_NAMES[index.code]
  const displayName = index.displayName?.trim()
  return displayName || index.code
}

function indexOrder(code: string): number {
  const order = INDEX_ORDER.indexOf(code as (typeof INDEX_ORDER)[number])
  return order === -1 ? Number.MAX_SAFE_INTEGER : order
}

export function sortedIndices(indices: MarketIndexDto[]): MarketIndexDto[] {
  return [...indices].sort((a, b) => {
    const orderDelta = indexOrder(a.code) - indexOrder(b.code)
    return orderDelta || a.code.localeCompare(b.code)
  })
}

export function primaryIndex(indices: MarketIndexDto[]): MarketIndexDto | null {
  return indices.find((index) => index.code === PRIMARY_INDEX_CODE) ?? indices[0] ?? null
}

export function secondaryIndices(indices: MarketIndexDto[]): MarketIndexDto[] {
  return sortedIndices(indices).filter((index) => index.code !== PRIMARY_INDEX_CODE)
}

export function formatTradeDate(value: string | null | undefined): string {
  if (!value) return 'N/A'
  const datePart = value.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (!match) return value
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).replace(/^0/, '')
}

export function latestIndexTimestamp(indices: MarketIndexDto[]): string | null {
  const timestamps = indices
    .map((index) => index.asOf)
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((item) => Number.isFinite(item.time))
  if (timestamps.length === 0) return null
  return timestamps.reduce((latest, item) => (item.time > latest.time ? item : latest)).value
}

export function formatPktTime(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.toLocaleTimeString('en-PK', {
    timeZone: 'Asia/Karachi',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })} PKT`
}

export function buildBreadthModel(summary: MarketSummaryTickersResponse['summary']): BreadthModel {
  const values = [summary.advances, summary.declines, summary.unchanged]
  const complete = values.every((value) => value != null && Number.isFinite(value))
  const total = complete ? (summary.advances ?? 0) + (summary.declines ?? 0) + (summary.unchanged ?? 0) : null

  const pct = (value: number | null): number | null => {
    if (value == null || total == null || total <= 0) return null
    return (value / total) * 100
  }

  const advances = summary.advances ?? null
  const declines = summary.declines ?? null
  const unchanged = summary.unchanged ?? null

  return {
    segments: [
      { label: 'Advancing', value: advances, pct: pct(advances), tone: 'positive' },
      { label: 'Declining', value: declines, pct: pct(declines), tone: 'negative' },
      { label: 'Unchanged', value: unchanged, pct: pct(unchanged), tone: 'neutral' },
    ],
    total,
    advancingShare: pct(advances),
    declineAdvanceRatio:
      advances != null && declines != null && advances > 0 ? declines / advances : null,
  }
}

export function moverGroups(ranked: RankedTicker[], limit = 8): MoverGroup[] {
  return [
    {
      id: 'gainers',
      label: 'Gainers',
      rows: ranked
        .filter((ticker) => ticker.changePct != null && ticker.changePct > 0)
        .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))
        .slice(0, limit),
    },
    {
      id: 'losers',
      label: 'Losers',
      rows: ranked
        .filter((ticker) => ticker.changePct != null && ticker.changePct < 0)
        .sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))
        .slice(0, limit),
    },
    {
      id: 'active',
      label: 'Most active',
      rows: ranked
        .filter((ticker) => ticker.turnover != null)
        .sort((a, b) => {
          const left = a.turnover ?? 0n
          const right = b.turnover ?? 0n
          return right > left ? 1 : right < left ? -1 : 0
        })
        .slice(0, limit),
    },
    {
      id: 'value',
      label: 'Traded value',
      rows: ranked
        .filter((ticker) => ticker.estimatedTradedValue != null)
        .sort((a, b) => (b.estimatedTradedValue ?? 0) - (a.estimatedTradedValue ?? 0))
        .slice(0, limit),
    },
  ]
}

export function sectorRows(ranked: RankedTicker[]): SectorRow[] {
  return Object.values(
    ranked.reduce<Record<string, SectorRow>>((acc, ticker) => {
      const sector = toTitleCase(ticker.section?.trim() || 'Unclassified')
      acc[sector] ??= {
        sector,
        issues: 0,
        advances: 0,
        declines: 0,
        unchanged: 0,
        shares: 0,
        estimated: 0,
        estimatedObservationCount: 0,
      }
      acc[sector].issues += 1
      if (ticker.change == null || ticker.change.isZero()) acc[sector].unchanged += 1
      else if (ticker.change.isPositive()) acc[sector].advances += 1
      else acc[sector].declines += 1
      if (ticker.turnover != null) acc[sector].shares += projectNumeric(ticker.turnover, 'sector turnover')
      if (ticker.estimatedTradedValue != null && Number.isFinite(ticker.estimatedTradedValue)) {
        acc[sector].estimated += ticker.estimatedTradedValue
        acc[sector].estimatedObservationCount += 1
      }
      return acc
    }, {}),
  )
}

export function sortSectors(rows: SectorRow[], sortKey: SectorSortKey, direction: 'asc' | 'desc'): SectorRow[] {
  const multiplier = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const delta = (a[sortKey] - b[sortKey]) * multiplier
    return delta || a.sector.localeCompare(b.sector)
  })
}

export function commentaryKeyPoints(summary: MarketAiSummaryDto | null | undefined): string[] {
  if (!Array.isArray(summary?.keyPoints)) return []
  return summary.keyPoints
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 3)
}

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/(\s+|\/|-|&)/)
    .map((part) => {
      if (/^\s+$|^\/$|^-$|^&$/.test(part)) return part
      if (part.length <= 3 && /^[a-z]+$/.test(part)) return part.toUpperCase()
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join('')
}
