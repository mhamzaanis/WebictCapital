import Decimal from 'decimal.js'
import { projectDecimal } from './json'
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

function validClose(quote: TickerQuoteDto): quote is TickerQuoteDto & { close: Decimal } {
  return quote.close != null && quote.close.isPositive()
}

function returns(quotes: TickerQuoteDto[]): Decimal[] {
  const values: Decimal[] = []
  for (let index = 1; index < quotes.length; index += 1) {
    const previous = quotes[index - 1].close
    const current = quotes[index].close
    if (previous?.isPositive() && current?.isPositive()) values.push(current.div(previous).minus(1))
  }
  return values
}

function sampleStd(values: Decimal[]): Decimal | null {
  if (values.length < 2) return null
  const mean = Decimal.sum(...values).div(values.length)
  const variance = Decimal.sum(...values.map((value) => value.minus(mean).pow(2))).div(values.length - 1)
  return variance.sqrt()
}

export function periodReturnPct(quotes: TickerQuoteDto[]): number | null {
  const valid = quotes.filter(validClose)
  if (valid.length < MIN_RETURN_OBSERVATIONS) return null
  return projectDecimal(valid[valid.length - 1].close.div(valid[0].close).minus(1).mul(100), 'period return')
}

export function annualizedVolatilityPct(quotes: TickerQuoteDto[]): number | null {
  const daily = returns(quotes)
  if (daily.length < MIN_VOL_OBSERVATIONS - 1) return null
  const std = sampleStd(daily)
  return std == null ? null : projectDecimal(std.mul(new Decimal(252).sqrt()).mul(100), 'volatility')
}

export function maxDrawdownPct(quotes: TickerQuoteDto[]): number | null {
  const valid = quotes.filter(validClose)
  if (valid.length < MIN_RETURN_OBSERVATIONS) return null
  let peak = valid[0].close
  let drawdown = new Decimal(0)
  for (const quote of valid) {
    if (quote.close.gt(peak)) peak = quote.close
    const current = quote.close.div(peak).minus(1).mul(100)
    if (current.lt(drawdown)) drawdown = current
  }
  return projectDecimal(drawdown, 'maximum drawdown')
}

export function snapshotAnalytics(quotes: TickerQuoteDto[]): SnapshotAnalytics {
  const validTurnover = quotes.flatMap((quote) => quote.turnover != null && quote.turnover > 0n ? [quote.turnover] : [])
  const averageSharesTraded = validTurnover.length
    ? projectDecimal(
        new Decimal(validTurnover.reduce((sum, value) => sum + value, 0n).toString()).div(validTurnover.length),
        'average turnover',
      )
    : null
  const estimated = quotes.flatMap((quote) =>
    quote.close?.isPositive() && quote.turnover != null && quote.turnover > 0n
      ? [quote.close.mul(new Decimal(quote.turnover.toString()))]
      : [],
  )
  const estimatedAverageTradedValue = estimated.length
    ? projectDecimal(Decimal.sum(...estimated).div(estimated.length), 'average traded value')
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
  return valid.map((quote) => ({
    date: quote.tradeDate,
    value: projectDecimal(quote.close.div(first).mul(100), 'normalized close'),
  }))
}

function commonQuotes(a: TickerQuoteDto[], b: TickerQuoteDto[]) {
  const byDate = new Map(a.filter(validClose).map((quote) => [quote.tradeDate, quote]))
  return b.filter(validClose).flatMap((quoteB) => {
    const quoteA = byDate.get(quoteB.tradeDate)
    return quoteA ? [{ quoteA, quoteB }] : []
  })
}

function pearson(a: Decimal[], b: Decimal[]): number | null {
  if (a.length !== b.length || a.length < MIN_CORRELATION_RETURNS) return null
  const meanA = Decimal.sum(...a).div(a.length)
  const meanB = Decimal.sum(...b).div(b.length)
  let numerator = new Decimal(0)
  let denomA = new Decimal(0)
  let denomB = new Decimal(0)
  a.forEach((valueA, index) => {
    const da = valueA.minus(meanA)
    const db = b[index].minus(meanB)
    numerator = numerator.plus(da.mul(db))
    denomA = denomA.plus(da.pow(2))
    denomB = denomB.plus(db.pow(2))
  })
  const denominator = denomA.mul(denomB).sqrt()
  return denominator.isZero() ? null : projectDecimal(numerator.div(denominator), 'correlation')
}

export function comparisonAnalytics(a: TickerQuoteDto[], b: TickerQuoteDto[]): ComparisonAnalytics {
  const common = commonQuotes(a, b)
  const sharedA = common.map((item) => item.quoteA)
  const sharedB = common.map((item) => item.quoteB)
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
    correlation: pearson(returns(sharedA), returns(sharedB)),
    relativePerformancePct: returnA != null && returnB != null ? returnA - returnB : null,
  }
}
