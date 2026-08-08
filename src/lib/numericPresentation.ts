import Decimal from 'decimal.js'
import { projectDecimal, projectInt64 } from './api/json'

export type PresentableNumeric = Decimal | bigint | number

export function projectNumeric(value: PresentableNumeric, label = 'UI projection'): number {
  if (Decimal.isDecimal(value)) return projectDecimal(value, label)
  if (typeof value === 'bigint') return projectInt64(value, label)
  if (!Number.isFinite(value)) throw new RangeError(`${label} is not finite.`)
  return value
}

function groupInteger(value: string): string {
  const sign = value.startsWith('-') ? '-' : ''
  const unsigned = sign ? value.slice(1) : value
  return `${sign}${unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function formatNumeric(
  value: PresentableNumeric | null | undefined,
  maximumFractionDigits = 2,
  fallback = '-',
): string {
  if (value == null) return fallback
  if (typeof value === 'bigint') return groupInteger(value.toString())
  if (Decimal.isDecimal(value)) {
    if (!value.isFinite()) return fallback
    const fixed = value.toDecimalPlaces(maximumFractionDigits).toFixed()
    const [integer, fraction] = fixed.split('.')
    return `${groupInteger(integer)}${fraction ? `.${fraction}` : ''}`
  }
  if (!Number.isFinite(value)) return fallback
  return value.toLocaleString('en-PK', { maximumFractionDigits })
}

export function numericSign(value: PresentableNumeric): -1 | 0 | 1 {
  if (Decimal.isDecimal(value)) return value.isZero() ? 0 : value.isPositive() ? 1 : -1
  if (typeof value === 'bigint') return value === 0n ? 0 : value > 0n ? 1 : -1
  return value === 0 ? 0 : value > 0 ? 1 : -1
}

export function formatSignedNumeric(
  value: PresentableNumeric | null | undefined,
  digits = 2,
): string {
  if (value == null) return '-'
  const sign = numericSign(value)
  const absolute = Decimal.isDecimal(value)
    ? value.abs()
    : typeof value === 'bigint'
      ? value < 0n ? -value : value
      : Math.abs(value)
  return `${sign > 0 ? '+' : sign < 0 ? '-' : ''}${formatNumeric(absolute, digits)}`
}
