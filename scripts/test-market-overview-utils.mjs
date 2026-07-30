import assert from 'node:assert/strict'
import fs from 'node:fs'
import { describe, it } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function loadTsModule(path, requireStub = () => ({})) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} }
  const context = {
    exports: module.exports,
    module,
    require: requireStub,
    console,
    Date,
    Intl,
    Math,
    Number,
    String,
    Array,
    Object,
    RegExp,
  }
  vm.runInNewContext(compiled, context, { filename: path })
  return module.exports
}

const overview = loadTsModule('../src/lib/marketOverview.ts')

function quote(overrides) {
  return {
    symbol: 'TEST',
    companyName: 'Test Company Limited',
    open: null,
    high: null,
    low: null,
    close: 100,
    turnover: 1000,
    change: 1,
    section: 'COMMERCIAL BANKS',
    ...overrides,
  }
}

function index(overrides) {
  return {
    code: 'KSE100',
    displayName: null,
    prevClose: null,
    open: null,
    high: null,
    low: null,
    close: 176042.98,
    volume: 193070000,
    change: -1580.9,
    changePct: -0.89,
    asOf: '2026-07-29T17:30:00+05:00',
    ...overrides,
  }
}

describe('market overview index model', () => {
  it('selects KSE-100 as the primary index even when it is not first', () => {
    const primary = overview.primaryIndex([index({ code: 'KSE30' }), index({ code: 'KSE100' })])
    assert.equal(primary.code, 'KSE100')
  })

  it('orders secondary indexes and applies human display name fallbacks', () => {
    const rows = overview.secondaryIndices([
      index({ code: 'KMIALLSHR' }),
      index({ code: 'KSE100' }),
      index({ code: 'ALLSHR', displayName: null }),
      index({ code: 'KSE100PR', displayName: null }),
      index({ code: 'KSE30', displayName: 'KSE 30 API' }),
    ])
    assert.deepEqual(JSON.parse(JSON.stringify(rows.map((row) => row.code))), ['KSE30', 'ALLSHR', 'KMIALLSHR', 'KSE100PR'])
    assert.equal(overview.indexDisplayName(rows[0]), 'KSE-30')
    assert.equal(overview.indexDisplayName(rows[1]), 'KSE All Share')
    assert.equal(overview.indexDisplayName(rows[3]), 'KSE-100 Price Return')
  })

  it('classifies positive, negative, and unchanged direction without relying on colour alone', () => {
    assert.equal(overview.toneForValue(1), 'positive')
    assert.equal(overview.toneForValue(-1), 'negative')
    assert.equal(overview.toneForValue(0), 'neutral')
    assert.equal(overview.toneForValue(null), 'neutral')
  })

  it('formats API trade dates without timezone shifts', () => {
    assert.equal(overview.formatTradeDate('2026-07-29'), '29 Jul 2026')
    assert.equal(overview.formatTradeDate('2026-07-29T00:30:00+05:00'), '29 Jul 2026')
  })
})

describe('market overview breadth model', () => {
  it('keeps same-date counts and percentages without null-to-zero substitution', () => {
    const breadth = overview.buildBreadthModel({ advances: 129, declines: 330, unchanged: 36 })
    assert.equal(breadth.total, 495)
    assert.ok(Math.abs(breadth.advancingShare - 26.0606) < 0.001)
    assert.ok(Math.abs(breadth.declineAdvanceRatio - 2.5581) < 0.001)
    assert.deepEqual(JSON.parse(JSON.stringify(breadth.segments.map((segment) => segment.value))), [129, 330, 36])
  })

  it('handles zero-observation breadth distinctly from missing values', () => {
    const zero = overview.buildBreadthModel({ advances: 0, declines: 0, unchanged: 0 })
    assert.equal(zero.total, 0)
    assert.equal(zero.advancingShare, null)
    const missing = overview.buildBreadthModel({ advances: null, declines: 0, unchanged: 0 })
    assert.equal(missing.total, null)
    assert.equal(missing.segments[0].value, null)
  })
})

describe('market overview movers and sectors', () => {
  const ranked = overview.rankTickers([
    quote({ symbol: 'AAA', companyName: 'Alpha Alpha Limited', close: 110, change: 10, turnover: 100 }),
    quote({ symbol: 'BBB', companyName: 'Beta Beta Limited', close: 90, change: -10, turnover: 300 }),
    quote({ symbol: 'CCC', companyName: 'Core Cement Limited', close: 50, change: 0, turnover: 900, section: 'CEMENT' }),
    quote({ symbol: 'DDD', companyName: 'Delta Delta Limited', close: 20, change: 2, turnover: 1000, section: 'CEMENT' }),
  ])

  it('preserves mover ranking and calculated estimated traded value', () => {
    const groups = overview.moverGroups(ranked, 3)
    assert.deepEqual(JSON.parse(JSON.stringify(groups.find((group) => group.id === 'gainers').rows.map((row) => row.symbol))), ['DDD', 'AAA'])
    assert.deepEqual(JSON.parse(JSON.stringify(groups.find((group) => group.id === 'losers').rows.map((row) => row.symbol))), ['BBB'])
    assert.deepEqual(JSON.parse(JSON.stringify(groups.find((group) => group.id === 'active').rows.map((row) => row.symbol))), ['DDD', 'CCC', 'BBB'])
    assert.deepEqual(JSON.parse(JSON.stringify(groups.find((group) => group.id === 'value').rows.map((row) => row.symbol))), ['CCC', 'BBB', 'DDD'])
  })

  it('sorts sector rows by estimated value by default and supports other financial sorts', () => {
    const sectors = overview.sectorRows(ranked)
    const byValue = overview.sortSectors(sectors, 'estimated', 'desc')
    assert.equal(byValue[0].sector, 'Cement')
    const byIssues = overview.sortSectors(sectors, 'issues', 'desc')
    assert.equal(byIssues[0].issues, 2)
    const banks = sectors.find((row) => row.sector === 'Commercial Banks')
    assert.equal(banks.advances, 1)
    assert.equal(banks.declines, 1)
  })

  it('returns N/A formatting for null render values', () => {
    const view = loadTsModule('../src/components/pages/markets-overview/viewFormat.ts')
    assert.equal(view.fmtNumber(null), 'N/A')
    assert.equal(view.fmtPct(undefined), 'N/A')
    assert.equal(view.fmtCompact(Number.NaN), 'N/A')
  })
})

describe('market overview component contracts', () => {
  it('keeps the API endpoint unchanged', () => {
    const source = fs.readFileSync(new URL('../src/lib/api/market.ts', import.meta.url), 'utf8')
    assert.match(source, /apiGet<MarketSummaryTickersResponse>\('\/market-summary'/)
  })

  it('defines correct column meanings for each mover tab', () => {
    const source = fs.readFileSync(new URL('../src/components/pages/markets-overview/MoversTable.tsx', import.meta.url), 'utf8')
    assert.match(source, /gainers: \['Symbol', 'Company', 'Close', 'Change %', 'Volume'\]/)
    assert.match(source, /active: \['Symbol', 'Company', 'Volume', 'Close', 'Change %'\]/)
    assert.match(source, /value: \['Symbol', 'Company', 'Estimated value', 'Volume', 'Change %'\]/)
    assert.match(source, /Estimated value is calculated as close x shares traded/)
  })

  it('labels heatmap metric, legend, and responsive top/all controls', () => {
    const source = fs.readFileSync(new URL('../src/components/pages/markets-overview/MarketOverviewHeatmap.tsx', import.meta.url), 'utf8')
    assert.match(source, /Tile size: shares traded/)
    assert.match(source, /Colour: daily price change/)
    assert.doesNotMatch(source, /Grouped by sector/)
    assert.doesNotMatch(source, /toTitleCase/)
    assert.doesNotMatch(source, /children: sector.children/)
    assert.match(source, /item.value \/ totalValue >= 0.0045/)
    assert.match(source, /-10%/)
    assert.match(source, /\+10%/)
    assert.match(source, /TOP_HEATMAP_LIMIT = 50/)
    assert.match(source, /All securities/)
  })

  it('includes desktop, tablet, mobile layout guards and internal table scrolling', () => {
    const overviewSource = fs.readFileSync(new URL('../src/components/pages/MarketsOverviewPage.tsx', import.meta.url), 'utf8')
    const pageSource = fs.readFileSync(new URL('../src/components/pages/markets-overview/PrimaryMarketClose.tsx', import.meta.url), 'utf8')
    const indexSource = fs.readFileSync(new URL('../src/components/pages/markets-overview/SecondaryIndexTable.tsx', import.meta.url), 'utf8')
    const sectorSource = fs.readFileSync(new URL('../src/components/pages/markets-overview/SectorPerformanceTable.tsx', import.meta.url), 'utf8')
    assert.match(overviewSource, /gridTemplateColumns: \{ xs: '1fr', lg: 'minmax\(0, 2fr\) minmax\(0, 3fr\)' \}/)
    assert.match(pageSource, /gridTemplateColumns: \{ xs: '1fr', lg: '5fr 3fr 4fr' \}/)
    assert.match(indexSource, /overflowX: 'auto'/)
    assert.match(sectorSource, /overflowX: 'auto'/)
    assert.match(sectorSource, /stickyHeader/)
  })
})
