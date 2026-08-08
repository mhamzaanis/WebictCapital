import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import Decimal from 'decimal.js'

function loadUtilityModule() {
  const source = fs.readFileSync(new URL('../src/lib/comparison/stockComparison.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} }
  const context = {
    exports: module.exports,
    module,
    require: (specifier) => {
      if (specifier === 'decimal.js') return { __esModule: true, default: Decimal }
      if (specifier.endsWith('/api/json')) return { projectDecimal: (value) => value.toNumber() }
      return {}
    },
    URLSearchParams,
    console,
    Set,
    Map,
    Date,
    Math,
    Number,
    String,
    Array,
    Object,
    Error,
  }
  vm.runInNewContext(compiled, context, { filename: 'stockComparison.cjs' })
  return module.exports
}

const utils = loadUtilityModule()

function makeSeries(id, closesByDate) {
  return {
    id,
    label: id,
    kind: 'stock',
    color: '#0a4fb3',
    dashed: false,
    points: Object.entries(closesByDate).map(([tradeDate, close]) => ({ tradeDate, close })),
  }
}

describe('stock comparison selection rules', () => {
  it('allows two, three, and four stocks but prevents a fifth', () => {
    assert.equal(utils.canAddStock(['MEBL'], 'HBL'), true)
    assert.equal(utils.canAddStock(['MEBL', 'HBL'], 'FABL'), true)
    assert.equal(utils.canAddStock(['MEBL', 'HBL', 'FABL'], 'UBL'), true)
    assert.equal(utils.canAddStock(['MEBL', 'HBL', 'FABL', 'UBL'], 'BAFL'), false)
  })

  it('prevents duplicate stocks after uppercase normalization', () => {
    assert.equal(utils.canAddStock(['MEBL', 'HBL'], 'mebl'), false)
    assert.deepEqual(Array.from(utils.uniqueUppercase(['mebl', 'MEBL', ' hbl '])), ['MEBL', 'HBL'])
  })

  it('allows zero, one, and two benchmarks but prevents a third', () => {
    assert.equal(utils.canToggleBenchmark([], 'KSE100'), true)
    assert.equal(utils.canToggleBenchmark(['KSE100'], 'KMI30'), true)
    assert.equal(utils.canToggleBenchmark(['KSE100', 'KMI30'], 'KSE30'), false)
    assert.equal(utils.canToggleBenchmark(['KSE100'], 'KSE100'), true)
  })

  it('prevents unsupported or duplicate benchmark values through normalization helpers', () => {
    assert.equal(utils.canToggleBenchmark([], 'BAD'), false)
    assert.deepEqual(Array.from(utils.uniqueUppercase(['kse100', 'KSE100', ' kmi30 '])), ['KSE100', 'KMI30'])
  })
})

describe('stock comparison request parameters', () => {
  it('preserves repeated symbol and benchmark parameter order', () => {
    const params = utils.buildComparisonSearchParams({
      symbols: ['MEBL', 'FABL', 'HBL'],
      benchmarks: ['KSEALL', 'KSE100'],
      from: '2025-07-29',
      to: '2026-07-29',
    })
    assert.deepEqual(params.getAll('symbols'), ['MEBL', 'FABL', 'HBL'])
    assert.deepEqual(params.getAll('benchmarks'), ['KSEALL', 'KSE100'])
    assert.equal(params.get('financialYears'), null)
    assert.equal(params.get('include'), null)
  })

  it('clamps dates before 2021-01-01', () => {
    const params = utils.buildComparisonSearchParams({
      symbols: ['MEBL', 'HBL'],
      benchmarks: [],
      from: '2020-01-01',
      to: '2026-07-29',
    })
    assert.equal(params.get('from'), '2021-01-01')
    assert.equal(utils.rangeForPreset('5Y', '2022-01-15').from, '2021-01-01')
  })
})

describe('stock comparison normalization and analytics', () => {
  it('normalizes on the first shared date and preserves later gaps as null', () => {
    const comparison = utils.normalizeComparisonSeries([
      makeSeries('MEBL', {
        '2025-07-29': 353.64,
        '2025-07-30': 360,
        '2026-07-29': 555.82,
      }),
      makeSeries('HBL', {
        '2025-07-29': 200,
        '2026-07-29': 260,
      }),
    ])
    assert.equal(comparison.status, 'ready')
    assert.equal(comparison.baseDate, '2025-07-29')
    assert.equal(comparison.endDate, '2026-07-29')
    assert.equal(comparison.commonObservationCount, 2)
    const mebl = comparison.series.find((series) => series.id === 'MEBL')
    const hbl = comparison.series.find((series) => series.id === 'HBL')
    assert.ok(mebl)
    assert.ok(hbl)
    assert.equal(mebl.points[0].normalized, 100)
    assert.equal(hbl.points[1].normalized, null)
    assert.equal(hbl.points[1].close, null)
  })

  it('rebases the MEBL example and calculates the period return', () => {
    const comparison = utils.normalizeComparisonSeries([
      makeSeries('MEBL', { '2025-07-29': 353.64, '2026-07-29': 555.82 }),
      makeSeries('FABL', { '2025-07-29': 80, '2026-07-29': 100 }),
    ])
    assert.equal(comparison.status, 'ready')
    const mebl = comparison.series.find((series) => series.id === 'MEBL')
    assert.ok(mebl)
    assert.equal(mebl.points[0].normalized, 100)
    assert.ok(Math.abs(mebl.points[1].normalized - 157.171) < 0.001)
    assert.ok(Math.abs(mebl.periodReturnPct - 57.171) < 0.001)
  })

  it('returns an empty state when fewer than two shared observations exist', () => {
    const comparison = utils.normalizeComparisonSeries([
      makeSeries('MEBL', { '2025-07-29': 353.64, '2025-07-30': 360 }),
      makeSeries('FABL', { '2025-07-29': 80, '2025-08-01': 100 }),
    ])
    assert.equal(comparison.status, 'empty')
  })

  it('uses benchmark points from the expanded comparison response', () => {
    const [benchmark] = utils.benchmarkSeriesInputs([{
      code: 'KSE100',
      displayName: 'KSE 100',
      availableRange: { from: '2025-07-29', to: '2026-07-29' },
      asOf: { tradeDate: '2026-07-29', close: 176042.98 },
      points: [
        { tradeDate: '2025-07-29', close: 138412.25 },
        { tradeDate: '2026-07-29', close: 176042.98 },
      ],
    }])
    assert.equal(benchmark.id, 'KSE100')
    assert.deepEqual(Array.from(benchmark.points).map((point) => point.close), [138412.25, 176042.98])
  })

  it('calculates volatility, drawdown, and correlations from daily returns', () => {
    const comparison = utils.normalizeComparisonSeries([
      makeSeries('MEBL', { '2025-01-01': 100, '2025-01-02': 110, '2025-01-03': 99, '2025-01-04': 120 }),
      makeSeries('HBL', { '2025-01-01': 200, '2025-01-02': 210, '2025-01-03': 205, '2025-01-04': 215 }),
    ])
    assert.equal(comparison.status, 'ready')
    const analytics = utils.seriesAnalytics(comparison.series[0])
    assert.equal(analytics.observations, 4)
    assert.ok(analytics.annualizedVolatilityPct > 0)
    assert.ok(analytics.maxDrawdownPct < 0)
    const matrix = utils.correlationMatrix(comparison.series)
    assert.ok(matrix)
    assert.equal(matrix.cells.find((cell) => cell.rowId === 'MEBL' && cell.columnId === 'MEBL').value, 1)
  })
})

describe('stock comparison fundamentals and technical utility rules', () => {
  it('keeps annual EPS fiscal year and does not mix annual and quarterly periods', () => {
    const statements = [
      { fiscalYear: 2025, period: 'Annual', eps: 49.54, sales: null, profitAfterTax: null, lineItems: {} },
      { fiscalYear: 2025, period: 'Q1', eps: 10, sales: null, profitAfterTax: null, lineItems: {} },
      { fiscalYear: 2025, period: 'Q2', eps: 11, sales: null, profitAfterTax: null, lineItems: {} },
    ]
    assert.equal(utils.latestAnnualStatement(statements).fiscalYear, 2025)
    assert.equal(utils.latestAnnualStatement(statements).eps, 49.54)
    assert.deepEqual(utils.statementsForEpsMode(statements, 'Annual').map((row) => row.period), ['Annual'])
    assert.deepEqual(utils.statementsForEpsMode(statements, 'Quarterly').map((row) => row.period), ['Q1', 'Q2'])
  })

  it('preserves raw technical values and warm-up nulls', () => {
    const technicals = [{ tradeDate: '2025-01-01', rsi14: null }, { tradeDate: '2025-01-02', rsi14: 59.1 }]
    assert.equal(technicals[0].rsi14, null)
    assert.equal(technicals[1].rsi14, 59.1)
  })
})
