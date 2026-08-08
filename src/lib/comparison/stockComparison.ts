import Decimal from 'decimal.js'
import { projectDecimal } from '../api/json'
import type { BenchmarkComparisonItemDto, BenchmarkPointDto, FinancialRatioDto, FinancialStatementDto, TickerComparisonItemDto, TickerQuoteDto } from '../api/types'

export const COMPARISON_MIN_DATE = '2021-01-01'
export const SUPPORTED_BENCHMARKS = ['KSE100', 'KSE30', 'KMI30', 'KSEALL'] as const
export const STOCK_SERIES_COLORS = ['#0a4fb3', '#087f8c', '#c96b15', '#6f42c1'] as const
export const BENCHMARK_SERIES_COLORS = ['#64748b', '#dc2626'] as const
export const RANGE_PRESETS = ['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', 'Custom'] as const

export type BenchmarkCode = typeof SUPPORTED_BENCHMARKS[number]
export type RangePreset = typeof RANGE_PRESETS[number]
export type PriceLikePoint = {
  tradeDate: string
  close: number | Decimal | null
}
export type ComparisonSeriesInput = {
  id: string
  label: string
  kind: 'stock' | 'benchmark'
  color: string
  dashed: boolean
  points?: readonly PriceLikePoint[] | null
}
export type NormalizedPoint = {
  date: string
  close: number | null
  normalized: number | null
  periodReturnPct: number | null
}
export type NormalizedSeries = Omit<ComparisonSeriesInput, 'points'> & {
  points: NormalizedPoint[]
  baseClose: number
  endClose: number
  periodReturnPct: number | null
}
export type NormalizedComparison = {
  status: 'ready'
  baseDate: string
  endDate: string
  commonObservationCount: number
  dates: string[]
  series: NormalizedSeries[]
} | {
  status: 'empty'
  reason: string
}
export type SeriesAnalytics = {
  id: string
  label: string
  kind: 'stock' | 'benchmark'
  returnPct: number | null
  annualizedVolatilityPct: number | null
  maxDrawdownPct: number | null
  observations: number
}
export type CorrelationCell = {
  rowId: string
  columnId: string
  value: number | null
}
export type CorrelationMatrix = {
  series: { id: string; label: string }[]
  cells: CorrelationCell[]
}

export function normalizeCode(value: string): string {
  return value.trim().toUpperCase()
}

export function uniqueUppercase(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  values.forEach((value) => {
    const normalized = normalizeCode(value)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    result.push(normalized)
  })
  return result
}

export function canAddStock(current: readonly string[], candidate: string): boolean {
  const normalized = normalizeCode(candidate)
  return Boolean(normalized) && current.map(normalizeCode).indexOf(normalized) === -1 && current.length < 4
}

export function canRemoveStock(current: readonly string[]): boolean {
  return current.length > 2
}

export function canToggleBenchmark(current: readonly string[], candidate: string): boolean {
  const normalized = normalizeCode(candidate)
  if (!isBenchmarkCode(normalized)) return false
  return current.includes(normalized) || current.length < 2
}

export function isBenchmarkCode(value: string): value is BenchmarkCode {
  return (SUPPORTED_BENCHMARKS as readonly string[]).includes(value)
}

export function clampDateOnly(value: string): string {
  return value < COMPARISON_MIN_DATE ? COMPARISON_MIN_DATE : value
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export function rangeForPreset(preset: RangePreset, today = formatDateOnly(new Date())): { from: string; to: string } {
  if (preset === 'Custom') return { from: clampDateOnly(formatDateOnly(addMonths(parseDateOnly(today), -12))), to: today }
  if (preset === 'YTD') return { from: clampDateOnly(`${today.slice(0, 4)}-01-01`), to: today }
  const months = preset === '1M' ? -1 : preset === '3M' ? -3 : preset === '6M' ? -6 : preset === '1Y' ? -12 : preset === '3Y' ? -36 : -60
  return { from: clampDateOnly(formatDateOnly(addMonths(parseDateOnly(today), months))), to: today }
}

export function buildComparisonSearchParams({
  symbols,
  benchmarks,
  from,
  to,
}: {
  symbols: readonly string[]
  benchmarks: readonly string[]
  from: string
  to: string
}): URLSearchParams {
  const params = new URLSearchParams()
  uniqueUppercase(symbols).forEach((symbol) => params.append('symbols', symbol))
  uniqueUppercase(benchmarks).forEach((benchmark) => params.append('benchmarks', benchmark))
  params.set('from', clampDateOnly(from))
  params.set('to', to)
  return params
}

function projectClose(value: number | Decimal | null | undefined): number | null {
  if (Decimal.isDecimal(value)) {
    if (!value.isFinite() || !value.isPositive()) return null
    return projectDecimal(value, 'comparison close')
  }
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function isValidClose(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function safeArray<T>(value: readonly T[] | null | undefined): readonly T[] {
  return Array.isArray(value) ? value : []
}

export function dateCloseMap(points: readonly PriceLikePoint[] | null | undefined): Map<string, number> {
  const map = new Map<string, number>()
  safeArray(points).forEach((point) => {
    const close = projectClose(point.close)
    if (point.tradeDate && close != null) map.set(point.tradeDate, close)
  })
  return map
}

function sortedIntersection(maps: readonly Map<string, number>[]): string[] {
  if (maps.length === 0) return []
  const [first, ...rest] = maps
  return Array.from(first.keys()).filter((date) => rest.every((map) => map.has(date))).sort()
}

export function normalizeComparisonSeries(inputs: readonly ComparisonSeriesInput[]): NormalizedComparison {
  if (inputs.length < 2) return { status: 'empty', reason: 'Select at least two series.' }
  const maps = inputs.map((series) => dateCloseMap(series.points))
  const sharedDates = sortedIntersection(maps)
  if (sharedDates.length < 2) return { status: 'empty', reason: 'Fewer than two shared trading dates are available for the selected comparison.' }

  const baseDate = sharedDates[0]
  const endDate = sharedDates[sharedDates.length - 1]
  const dateSet = new Set<string>()
  inputs.forEach((series) => {
    safeArray(series.points).forEach((point) => {
      if (point.tradeDate >= baseDate && point.tradeDate <= endDate) dateSet.add(point.tradeDate)
    })
  })
  const dates = Array.from(dateSet).sort()
  const normalizedSeries = inputs.map((series, index) => {
    const map = maps[index]
    const baseClose = map.get(baseDate)
    const endClose = map.get(endDate)
    if (!isValidClose(baseClose) || !isValidClose(endClose)) {
      throw new Error(`Missing base or end close for ${series.id}.`)
    }
    const points = dates.map((date) => {
      const close = map.get(date) ?? null
      return {
        date,
        close,
        normalized: close == null ? null : (close / baseClose) * 100,
        periodReturnPct: close == null ? null : ((close / baseClose) - 1) * 100,
      }
    })
    return {
      ...series,
      points,
      baseClose,
      endClose,
      periodReturnPct: ((endClose / baseClose) - 1) * 100,
    }
  })

  return {
    status: 'ready',
    baseDate,
    endDate,
    commonObservationCount: sharedDates.length,
    dates,
    series: normalizedSeries,
  }
}

function sampleStandardDeviation(values: readonly number[]): number | null {
  if (values.length < 2) return null
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export function alignedDailyReturns(points: readonly NormalizedPoint[]): number[] {
  const returns: number[] = []
  let previous: number | null = null
  points.forEach((point) => {
    if (point.close == null || point.close <= 0) {
      previous = null
      return
    }
    if (previous != null && previous > 0) returns.push((point.close / previous) - 1)
    previous = point.close
  })
  return returns
}

export function seriesAnalytics(series: NormalizedSeries): SeriesAnalytics {
  const closes = series.points.map((point) => point.close).filter(isValidClose)
  const dailyReturns = alignedDailyReturns(series.points)
  const std = dailyReturns.length >= 2 ? sampleStandardDeviation(dailyReturns) : null
  let maxDrawdownPct: number | null = null
  if (closes.length >= 2) {
    let runningMax = closes[0]
    let maxDrawdown = 0
    closes.forEach((close) => {
      runningMax = Math.max(runningMax, close)
      maxDrawdown = Math.min(maxDrawdown, (close / runningMax) - 1)
    })
    maxDrawdownPct = maxDrawdown * 100
  }
  return {
    id: series.id,
    label: series.label,
    kind: series.kind,
    returnPct: series.periodReturnPct,
    annualizedVolatilityPct: std == null || dailyReturns.length < 2 ? null : std * Math.sqrt(252) * 100,
    maxDrawdownPct,
    observations: closes.length,
  }
}

function pearson(a: readonly number[], b: readonly number[]): number | null {
  if (a.length !== b.length || a.length < 2) return null
  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length
  let numerator = 0
  let denomA = 0
  let denomB = 0
  a.forEach((valueA, index) => {
    const da = valueA - meanA
    const db = b[index] - meanB
    numerator += da * db
    denomA += da * da
    denomB += db * db
  })
  const denominator = Math.sqrt(denomA * denomB)
  return denominator === 0 ? null : numerator / denominator
}

export function correlationMatrix(series: readonly NormalizedSeries[]): CorrelationMatrix | null {
  const stockSeries = series.filter((item) => item.kind === 'stock')
  if (stockSeries.length < 2) return null
  const returnsById = new Map(stockSeries.map((item) => [item.id, alignedDailyReturns(item.points)]))
  const cells: CorrelationCell[] = []
  stockSeries.forEach((row) => {
    stockSeries.forEach((column) => {
      const rowReturns = returnsById.get(row.id) ?? []
      const columnReturns = returnsById.get(column.id) ?? []
      const length = Math.min(rowReturns.length, columnReturns.length)
      cells.push({
        rowId: row.id,
        columnId: column.id,
        value: row.id === column.id ? 1 : pearson(rowReturns.slice(-length), columnReturns.slice(-length)),
      })
    })
  })
  return { series: stockSeries.map((item) => ({ id: item.id, label: item.label })), cells }
}

export function latestAnnualStatement(statements: readonly FinancialStatementDto[]): FinancialStatementDto | null {
  return statements
    .filter((statement) => statement.period === 'Annual')
    .sort((a, b) => b.fiscalYear - a.fiscalYear)[0] ?? null
}

export function statementsForEpsMode(statements: readonly FinancialStatementDto[], mode: 'Annual' | 'Quarterly'): FinancialStatementDto[] {
  return statements.filter((statement) => (
    mode === 'Annual'
      ? statement.period === 'Annual'
      : ['Q1', 'Q2', 'Q3', 'Q4'].includes(statement.period)
  ))
}

export function ratioValues(row: FinancialRatioDto): Record<string, number | null> {
  if (!row.values || typeof row.values !== 'object' || Array.isArray(row.values)) return {}
  const values: Record<string, number | null> = {}
  Object.entries(row.values as Record<string, unknown>).forEach(([key, value]) => {
    values[key] = Decimal.isDecimal(value) ? projectDecimal(value, `ratio ${key}`) : null
  })
  return values
}

export function commonRatioNames(items: readonly TickerComparisonItemDto[]): string[] {
  if (items.length === 0) return []
  const sets = items.map((item) => new Set(safeArray(item.ratios).flatMap((ratio) => Object.keys(ratioValues(ratio)))))
  return Array.from(sets[0]).filter((name) => sets.every((set) => set.has(name))).sort()
}

export function stockSeriesInputs(items: readonly TickerComparisonItemDto[]): ComparisonSeriesInput[] {
  return items.map((item, index) => ({
    id: item.symbol,
    label: item.symbol,
    kind: 'stock',
    color: STOCK_SERIES_COLORS[index] ?? STOCK_SERIES_COLORS[0],
    dashed: false,
    points: safeArray(item.quotes),
  }))
}

export function benchmarkSeriesInputs(benchmarks: readonly BenchmarkComparisonItemDto[]): ComparisonSeriesInput[] {
  return benchmarks.map((benchmark, index) => ({
    id: benchmark.code,
    label: benchmark.displayName ?? benchmark.code,
    kind: 'benchmark',
    color: BENCHMARK_SERIES_COLORS[index] ?? BENCHMARK_SERIES_COLORS[0],
    dashed: true,
    points: benchmarkQuotes(benchmark),
  }))
}

export function benchmarkQuotes(benchmark: BenchmarkComparisonItemDto): readonly BenchmarkPointDto[] {
  return safeArray(benchmark.points)
}

export function quoteFromTechnical(item: TickerComparisonItemDto, tradeDate: string): TickerQuoteDto | null {
  return safeArray(item.quotes).find((quote) => quote.tradeDate === tradeDate) ?? null
}

export function technicalPointClose(item: TickerComparisonItemDto, tradeDate: string): number | null {
  return projectClose(quoteFromTechnical(item, tradeDate)?.close)
}

export function benchmarkQuotesFromUnknown(points: readonly BenchmarkPointDto[]): PriceLikePoint[] {
  return points.map((point) => ({ tradeDate: point.tradeDate, close: point.close }))
}
