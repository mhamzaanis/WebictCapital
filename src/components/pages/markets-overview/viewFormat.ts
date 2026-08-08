import type { Tone } from '../../../lib/marketOverview'
import { formatNumeric, formatSignedNumeric, projectNumeric, type PresentableNumeric } from '../../../lib/numericPresentation'

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

export function fmtNumber(value: PresentableNumeric | null | undefined, digits = 2): string {
  return formatNumeric(value, digits, 'N/A')
}

export function fmtSigned(value: PresentableNumeric | null | undefined, digits = 2): string {
  return value == null ? 'N/A' : formatSignedNumeric(value, digits)
}

export function fmtPct(value: PresentableNumeric | null | undefined, signed = true): string {
  if (value == null) return 'N/A'
  return `${signed ? formatSignedNumeric(value, 2) : formatNumeric(value, 2, 'N/A')}%`
}

export function fmtCompact(value: PresentableNumeric | null | undefined): string {
  if (value == null || (typeof value === 'number' && !Number.isFinite(value))) return 'N/A'
  const projected = projectNumeric(value, 'compact market display')
  const abs = Math.abs(projected)
  const sign = projected < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return projected.toLocaleString('en-PK')
}
