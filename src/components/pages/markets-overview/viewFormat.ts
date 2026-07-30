import type { Tone } from '../../../lib/marketOverview'

export const SURFACE_SX = {
  bgcolor: 'var(--wc-surface)',
  border: '1px solid var(--wc-border)',
  borderRadius: '6px',
  boxShadow: 'none',
} as const

export const sectionTitleSx = {
  color: 'var(--wc-text-primary)',
  fontFamily: 'var(--wc-font-body)',
  fontSize: { xs: 18, md: 19 },
  fontWeight: 800,
  letterSpacing: 0,
} as const

export const metadataSx = {
  color: 'var(--wc-text-secondary)',
  fontSize: 12,
  lineHeight: 1.5,
} as const

export function toneColor(tone: Tone): string {
  if (tone === 'positive') return 'var(--wc-success)'
  if (tone === 'negative') return 'var(--wc-error)'
  return 'var(--wc-text-secondary)'
}

export function fmtNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return 'N/A'
  return value.toLocaleString('en-PK', { maximumFractionDigits: digits })
}

export function fmtSigned(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return 'N/A'
  if (value === 0) return '0'
  return `${value > 0 ? '+' : '-'}${Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: digits })}`
}

export function fmtPct(value: number | null | undefined, signed = true): string {
  if (value == null || !Number.isFinite(value)) return 'N/A'
  const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: 2 })
  if (!signed || value === 0) return `${formatted}%`
  return `${value > 0 ? '+' : '-'}${formatted}%`
}

export function fmtCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'N/A'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return value.toLocaleString('en-PK')
}
