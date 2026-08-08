import type { MarketTickerDto } from '../../lib/api/types'
import Decimal from 'decimal.js'
import { formatNumeric, formatSignedNumeric, numericSign, projectNumeric, type PresentableNumeric } from '../../lib/numericPresentation'

export const CARD_SX = {
  bgcolor: 'var(--wc-surface)',
  border: '1px solid var(--wc-border)',
  borderRadius: 2,
  boxShadow: 'var(--wc-shadow-card)',
} as const

export const DATA_FONT = 'var(--wc-font-data)'
export const BODY_FONT = 'var(--wc-font-body)'
export const DISPLAY_FONT = 'var(--wc-font-display)'

export function fmtNumber(value: PresentableNumeric | null | undefined, digits = 2): string {
  return formatNumeric(value, digits)
}

export function fmtSigned(value: PresentableNumeric | null | undefined, digits = 2): string {
  return formatSignedNumeric(value, digits)
}

export function fmtPct(value: PresentableNumeric | null | undefined, signed = true): string {
  if (value == null) return '-'
  return `${signed ? formatSignedNumeric(value, 2) : formatNumeric(value, 2)}%`
}

export function fmtCompact(value: PresentableNumeric | null | undefined): string {
  if (value == null || (typeof value === 'number' && !Number.isFinite(value))) return '-'
  const projected = projectNumeric(value, 'compact display value')
  const abs = Math.abs(projected)
  const sign = projected < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return projected.toLocaleString('en-PK')
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

export function toneColor(value: PresentableNumeric | null | undefined): string {
  if (value == null || numericSign(value) === 0) return 'var(--wc-text-secondary)'
  return numericSign(value) > 0 ? 'var(--wc-success)' : 'var(--wc-error)'
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

export function jsonStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}
