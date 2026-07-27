import type { MarketTickerDto } from '../../lib/api/types'

export const CARD_SX = {
  bgcolor: 'var(--wc-surface)',
  border: '1px solid var(--wc-border)',
  borderRadius: 2,
  boxShadow: 'var(--wc-shadow-card)',
} as const

export const DATA_FONT = 'var(--wc-font-data)'
export const BODY_FONT = 'var(--wc-font-body)'
export const DISPLAY_FONT = 'var(--wc-font-display)'

export function fmtNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '-'
  return value.toLocaleString('en-PK', { maximumFractionDigits: digits })
}

export function fmtSigned(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '-'
  if (value === 0) return '0'
  return `${value > 0 ? '+' : '-'}${Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: digits })}`
}

export function fmtPct(value: number | null | undefined, signed = true): string {
  if (value == null || !Number.isFinite(value)) return '-'
  const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: 2 })
  if (!signed || value === 0) return `${formatted}%`
  return `${value > 0 ? '+' : '-'}${formatted}%`
}

export function fmtCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return value.toLocaleString('en-PK')
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return '-'
  return value
}

export function fmtInstant(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toneColor(value: number | null | undefined): string {
  if (value == null || value === 0) return 'var(--wc-text-secondary)'
  return value > 0 ? 'var(--wc-success)' : 'var(--wc-error)'
}

export function changePctFromQuote(ticker: Pick<MarketTickerDto, 'close' | 'change'>): number | null {
  if (ticker.close == null || ticker.change == null) return null
  const previous = ticker.close - ticker.change
  if (previous <= 0) return null
  return (ticker.change / previous) * 100
}

export function estimatedValue(ticker: Pick<MarketTickerDto, 'close' | 'turnover'>): number | null {
  if (ticker.close == null || ticker.close <= 0 || ticker.turnover == null || ticker.turnover <= 0) return null
  return ticker.close * ticker.turnover
}

export function jsonStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}
