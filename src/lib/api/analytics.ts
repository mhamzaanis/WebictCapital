import type { TickerQuoteDto } from './types'

export type SnapshotAnalytics = {
  observationCount: number
  periodReturnPct: number | null
  annualizedVolatilityPct: number | null
  maxDrawdownPct: number | null
  averageSharesTraded: number | null
  estimatedAverageTradedValue: number | null
}

export type ComparisonAnalytics = {
  commonObservationCount: number
  returnA: number | null
  returnB: number | null
  volatilityA: number | null
  volatilityB: number | null
  drawdownA: number | null
  drawdownB: number | null
  correlation: number | null
  relativePerformancePct: number | null
}

const MIN_RETURN_OBSERVATIONS = 2
const MIN_VOL_OBSERVATIONS = 21
const MIN_CORRELATION_RETURNS = 20

function validClose(quote: TickerQuoteDto): quote is TickerQuoteDto & { close: number } {
  return quote.close != null && quote.close > 0
}

function returns(quotes: TickerQuoteDto[]): number[] {
  const values: number[] = []
  for (let index = 1; index < quotes.length; index += 1) {
    const previous = quotes[index - 1]
    const current = quotes[index]
    if (previous.close != null && previous.close > 0 && current.close != null && current.close > 0) {
      values.push((current.close / previous.close) - 1)
    }
  }
  return values
}

function sampleStd(values: number[]): number | null {
  if (values.length < 2) return null
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export function periodReturnPct(quotes: TickerQuoteDto[]): number | null {
  const valid = quotes.filter(validClose)
  if (valid.length < MIN_RETURN_OBSERVATIONS) return null
  return ((valid[valid.length - 1].close / valid[0].close) - 1) * 100
}

export function annualizedVolatilityPct(quotes: TickerQuoteDto[]): number | null {
  const daily = returns(quotes)
  if (daily.length < MIN_VOL_OBSERVATIONS - 1) return null
  const std = sampleStd(daily)
  return std == null ? null : std * Math.sqrt(252) * 100
}

export function maxDrawdownPct(quotes: TickerQuoteDto[]): number | null {
  const valid = quotes.filter(validClose)
  if (valid.length < MIN_RETURN_OBSERVATIONS) return null
  let peak = valid[0].close
  let drawdown = 0
  valid.forEach((quote) => {
    peak = Math.max(peak, quote.close)
    drawdown = Math.min(drawdown, (quote.close / peak - 1) * 100)
  })
  return drawdown
}

export function snapshotAnalytics(quotes: TickerQuoteDto[]): SnapshotAnalytics {
  const validTurnover = quotes.filter((quote) => quote.turnover != null && quote.turnover > 0)
  const averageSharesTraded = validTurnover.length > 0
    ? validTurnover.reduce((sum, quote) => sum + (quote.turnover ?? 0), 0) / validTurnover.length
    : null
  const validEstimated = quotes.filter((quote) => quote.close != null && quote.close > 0 && quote.turnover != null && quote.turnover > 0)
  const estimatedAverageTradedValue = validEstimated.length > 0
    ? validEstimated.reduce((sum, quote) => sum + ((quote.close ?? 0) * (quote.turnover ?? 0)), 0) / validEstimated.length
    : null

  return {
    observationCount: quotes.filter(validClose).length,
    periodReturnPct: periodReturnPct(quotes),
    annualizedVolatilityPct: annualizedVolatilityPct(quotes),
    maxDrawdownPct: maxDrawdownPct(quotes),
    averageSharesTraded,
    estimatedAverageTradedValue,
  }
}

export function normalizedSeries(quotes: TickerQuoteDto[]) {
  const valid = quotes.filter(validClose)
  if (valid.length < 2) return []
  const first = valid[0].close
  return valid.map((quote) => ({ date: quote.tradeDate, value: (quote.close / first) * 100 }))
}

function commonQuotes(a: TickerQuoteDto[], b: TickerQuoteDto[]) {
  const byDate = new Map(a.filter(validClose).map((quote) => [quote.tradeDate, quote]))
  return b.filter(validClose).flatMap((quoteB) => {
    const quoteA = byDate.get(quoteB.tradeDate)
    return quoteA ? [{ quoteA, quoteB }] : []
  })
}

function pearson(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < MIN_CORRELATION_RETURNS) return null
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

export function comparisonAnalytics(a: TickerQuoteDto[], b: TickerQuoteDto[]): ComparisonAnalytics {
  const common = commonQuotes(a, b)
  const sharedA = common.map((item) => item.quoteA)
  const sharedB = common.map((item) => item.quoteB)
  const returnsA = returns(sharedA)
  const returnsB = returns(sharedB)
  const returnA = periodReturnPct(sharedA)
  const returnB = periodReturnPct(sharedB)

  return {
    commonObservationCount: common.length,
    returnA,
    returnB,
    volatilityA: annualizedVolatilityPct(sharedA),
    volatilityB: annualizedVolatilityPct(sharedB),
    drawdownA: maxDrawdownPct(sharedA),
    drawdownB: maxDrawdownPct(sharedB),
    correlation: pearson(returnsA, returnsB),
    relativePerformancePct: returnA != null && returnB != null ? returnA - returnB : null,
  }
}
