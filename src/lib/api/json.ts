import Decimal from 'decimal.js'
import { isLosslessNumber, LosslessNumber, parse, stringify } from 'lossless-json'
import type { IsoDate, IsoInstant, JsonValue, Uuid } from './types'

const INT64_MIN = -9_223_372_036_854_775_808n
const INT64_MAX = 9_223_372_036_854_775_807n
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const INTEGER_PATTERN = /^-?(?:0|[1-9]\d*)$/

export class DtoValidationError extends Error {
  readonly path: string

  constructor(message: string, path = '$') {
    super(`${path}: ${message}`)
    this.name = 'DtoValidationError'
    this.path = path
  }
}

export function parseLosslessJson(text: string): unknown {
  try {
    return parse(text)
  } catch (error) {
    throw new DtoValidationError(
      error instanceof Error ? `invalid JSON (${error.message})` : 'invalid JSON',
    )
  }
}

function toWire(value: unknown): unknown {
  if (Decimal.isDecimal(value)) return new LosslessNumber(value.toString())
  if (typeof value === 'bigint') return new LosslessNumber(value.toString())
  if (Array.isArray(value)) return value.map(toWire)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toWire(item)]))
  }
  return value
}

export function stringifyLosslessJson(value: unknown): string {
  const result = stringify(toWire(value))
  if (result === undefined) throw new DtoValidationError('value cannot be serialized')
  return result
}

export function expectObject(value: unknown, path = '$'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || isLosslessNumber(value) || Decimal.isDecimal(value)) {
    throw new DtoValidationError('expected object', path)
  }
  return value as Record<string, unknown>
}

export function expectRequired(object: Record<string, unknown>, key: string, path = '$'): unknown {
  if (!Object.prototype.hasOwnProperty.call(object, key)) {
    throw new DtoValidationError('missing required key', `${path}.${key}`)
  }
  return object[key]
}

export function expectString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new DtoValidationError('expected string', path)
  return value
}

export function expectNonBlankString(value: unknown, path: string): string {
  const text = expectString(value, path)
  if (text.trim() === '') throw new DtoValidationError('expected nonblank string', path)
  return text
}

export function expectNullableString(value: unknown, path: string): string | null {
  return value === null ? null : expectString(value, path)
}

export function expectBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new DtoValidationError('expected boolean', path)
  return value
}

export function expectNullableBoolean(value: unknown, path: string): boolean | null {
  return value === null ? null : expectBoolean(value, path)
}

export function expectDecimal(value: unknown, path: string): Decimal {
  if (!isLosslessNumber(value)) throw new DtoValidationError('expected JSON numeric token', path)
  try {
    const decimal = new Decimal(value.value)
    if (!decimal.isFinite()) throw new Error('non-finite')
    return decimal
  } catch {
    throw new DtoValidationError('expected finite decimal', path)
  }
}

export function expectNullableDecimal(value: unknown, path: string): Decimal | null {
  return value === null ? null : expectDecimal(value, path)
}

export function expectInt64(value: unknown, path: string): bigint {
  if (!isLosslessNumber(value) || !INTEGER_PATTERN.test(value.value)) {
    throw new DtoValidationError('expected int64 JSON integer token', path)
  }
  const result = BigInt(value.value)
  if (result < INT64_MIN || result > INT64_MAX) throw new DtoValidationError('int64 out of range', path)
  return result
}

export function expectNullableInt64(value: unknown, path: string): bigint | null {
  return value === null ? null : expectInt64(value, path)
}

export function expectInt32(value: unknown, path: string): number {
  const result = expectInt64(value, path)
  if (result < -2_147_483_648n || result > 2_147_483_647n) {
    throw new DtoValidationError('int32 out of range', path)
  }
  return Number(result)
}

export function expectNullableInt32(value: unknown, path: string): number | null {
  return value === null ? null : expectInt32(value, path)
}

export function expectDate(value: unknown, path: string): IsoDate {
  const text = expectString(value, path)
  if (!DATE_PATTERN.test(text)) throw new DtoValidationError('expected ISO calendar date', path)
  const [yearText, monthText, dayText] = text.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    throw new DtoValidationError('invalid ISO calendar date', path)
  }
  return text as IsoDate
}

export function expectNullableDate(value: unknown, path: string): IsoDate | null {
  return value === null ? null : expectDate(value, path)
}

export function expectInstant(value: unknown, path: string): IsoInstant {
  const text = expectString(value, path)
  if (!INSTANT_PATTERN.test(text)) throw new DtoValidationError('expected ISO instant with offset', path)
  if (!Number.isFinite(Date.parse(text))) throw new DtoValidationError('invalid ISO instant', path)
  return text as IsoInstant
}

export function expectNullableInstant(value: unknown, path: string): IsoInstant | null {
  return value === null ? null : expectInstant(value, path)
}

export function expectUuid(value: unknown, path: string): Uuid {
  const text = expectString(value, path)
  if (!UUID_PATTERN.test(text)) throw new DtoValidationError('expected UUID', path)
  return text as Uuid
}

export function expectArray<T>(value: unknown, decoder: (item: unknown, path: string) => T, path: string): T[] {
  if (!Array.isArray(value)) throw new DtoValidationError('expected array', path)
  return value.map((item, index) => decoder(item, `${path}[${index}]`))
}

export function expectJsonValue(value: unknown, path: string): JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value
  if (isLosslessNumber(value)) return expectDecimal(value, path)
  if (Array.isArray(value)) return value.map((item, index) => expectJsonValue(item, `${path}[${index}]`))
  const object = expectObject(value, path)
  return Object.fromEntries(
    Object.entries(object).map(([key, item]) => [key, expectJsonValue(item, `${path}.${key}`)]),
  )
}

export function projectDecimal(value: Decimal, label = 'chart value'): number {
  const projected = value.toNumber()
  if (!Number.isFinite(projected)) throw new RangeError(`${label} is outside the chart projection range.`)
  return projected
}

export function projectNullableDecimal(value: Decimal | null): number | null {
  return value === null ? null : projectDecimal(value)
}

export function projectInt64(value: bigint, label = 'chart integer'): number {
  const projected = Number(value)
  if (!Number.isSafeInteger(projected)) throw new RangeError(`${label} exceeds safe chart precision.`)
  return projected
}

export function projectNullableInt64(value: bigint | null): number | null {
  return value === null ? null : projectInt64(value)
}
