import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MarketApiError } from '../../lib/api/errors'
import { fetchLatestMarketSummary } from '../../lib/api/market'
import { fetchTickerComparison } from '../../lib/api/tickers'
import type { FinancialStatementDto, MarketTickerDto, TickerComparisonItemDto, TickerComparisonResponse, TickerTechnicalPointDto } from '../../lib/api/types'
import {
  COMPARISON_FINANCIAL_YEARS,
  COMPARISON_INCLUDE,
  COMPARISON_MIN_DATE,
  RANGE_PRESETS,
  STOCK_SERIES_COLORS,
  SUPPORTED_BENCHMARKS,
  buildComparisonSearchParams,
  canAddStock,
  canRemoveStock,
  canToggleBenchmark,
  commonRatioNames,
  correlationMatrix,
  formatDateOnly,
  latestAnnualStatement,
  normalizeCode,
  normalizeComparisonSeries,
  rangeForPreset,
  ratioValues,
  seriesAnalytics,
  statementsForEpsMode,
  stockSeriesInputs,
  benchmarkSeriesInputs,
  safeArray,
  technicalPointClose,
  type BenchmarkCode,
  type NormalizedComparison,
  type NormalizedSeries,
  type RangePreset,
} from '../../lib/comparison/stockComparison'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock } from '../markets/StateBlocks'
import { CARD_SX, fmtCompact, fmtNumber, fmtPct } from '../markets/marketUtils'

const BENCHMARK_LABELS: Record<BenchmarkCode, string> = {
  KSE100: 'KSE-100',
  KSE30: 'KSE-30',
  KMI30: 'KMI-30',
  KSEALL: 'KSE All Share',
}
const DEFAULT_SYMBOLS = ['MEBL', 'HBL']
const CHART_OPTS = { renderer: 'canvas' as const, useDirtyRect: true }
const TECHNICAL_CHART_HEIGHT = 220

type MainTab = 'performance' | 'fundamentals' | 'technicals'
type TickerOption = { symbol: string; companyName: string | null }
type AppliedComparison = {
  symbols: string[]
  benchmarks: string[]
  from: string
  to: string
}
type ComparisonState = {
  key: string
  data: TickerComparisonResponse | null
  error: unknown
  loading: boolean
}
type LegendState = Record<string, boolean>

function currentDateOnly(): string {
  return formatDateOnly(new Date())
}

function humanDate(value: string | null | undefined): string {
  if (!value) return 'N/A'
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

function parseHumanDateInput(value: string): string | null {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const match = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(trimmed)
  if (!match) return null
  const day = Number(match[1])
  const month = MONTH_INDEX[match[2].slice(0, 3).toLowerCase()]
  const year = Number(match[3])
  if (!day || !month || !year || day > 31) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function fmtPrice(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? 'N/A' : value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPkrCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'N/A'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000_000) return `PKR ${sign}${(abs / 1_000_000_000_000).toFixed(2)}T`
  if (abs >= 1_000_000_000) return `PKR ${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `PKR ${sign}${(abs / 1_000_000).toFixed(1)}M`
  return `PKR ${value.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

function fmtCount(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? 'N/A' : fmtCompact(value)
}

function fmtRatio(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? 'N/A' : value.toLocaleString('en-PK', { maximumFractionDigits: 2 })
}

function comparisonKey(comparison: AppliedComparison): string {
  return `${comparison.symbols.join(',')}|${comparison.benchmarks.join(',')}|${comparison.from}|${comparison.to}`
}

function readInitialComparison(params: URLSearchParams): AppliedComparison {
  const symbols = params.getAll('symbols').length > 0
    ? params.getAll('symbols')
    : [params.get('a') ?? DEFAULT_SYMBOLS[0], params.get('b') ?? DEFAULT_SYMBOLS[1]]
  const benchmarks = params.getAll('benchmarks').length > 0 ? params.getAll('benchmarks') : params.getAll('benchmark')
  const fallbackRange = rangeForPreset('1Y', currentDateOnly())
  return {
    symbols: normalizeCodesBounded(symbols, 4).slice(0, 4).length >= 2 ? normalizeCodesBounded(symbols, 4).slice(0, 4) : DEFAULT_SYMBOLS,
    benchmarks: normalizeCodesBounded(benchmarks, 1).filter((benchmark): benchmark is BenchmarkCode => SUPPORTED_BENCHMARKS.includes(benchmark as BenchmarkCode)),
    from: (params.get('from') ?? fallbackRange.from) < COMPARISON_MIN_DATE ? COMPARISON_MIN_DATE : params.get('from') ?? fallbackRange.from,
    to: params.get('to') ?? fallbackRange.to,
  }
}

function normalizeCodesBounded(values: readonly string[], max: number): string[] {
  const result: string[] = []
  values.forEach((value) => {
    const normalized = normalizeCode(value)
    if (normalized && !result.includes(normalized) && result.length < max) result.push(normalized)
  })
  return result
}

function useTickerCatalogue() {
  const [tickers, setTickers] = useState<MarketTickerDto[]>([])
  useEffect(() => {
    fetchLatestMarketSummary()
      .then((res) => setTickers(res.tickers))
      .catch(() => { /* autocomplete suggestions degrade gracefully */ })
  }, [])
  return tickers
}

function useComparisonData(initial: AppliedComparison) {
  const [state, setState] = useState<ComparisonState>(() => ({ key: comparisonKey(initial), data: null, error: null, loading: true }))
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback((comparison: AppliedComparison) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    const key = comparisonKey(comparison)
    abortRef.current = controller
    setState({ key, data: null, error: null, loading: true })
    fetchTickerComparison({
      symbols: comparison.symbols,
      benchmarks: comparison.benchmarks,
      from: comparison.from,
      to: comparison.to,
      financialYears: COMPARISON_FINANCIAL_YEARS,
      include: COMPARISON_INCLUDE,
    }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, data, error: null, loading: false })
      })
      .catch((error) => {
        if (!controller.signal.aborted && !(error instanceof DOMException && error.name === 'AbortError')) {
          setState({ key, data: null, error, loading: false })
        }
      })
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => run(initial), 0)
    return () => {
      window.clearTimeout(timeout)
      abortRef.current?.abort()
    }
  }, [initial, run])

  return { state, run }
}

export function StockComparisonPage() {
  const [params, setParams] = useSearchParams()
  const initial = useMemo(() => readInitialComparison(params), [params])
  const [applied, setApplied] = useState<AppliedComparison>(initial)
  const [draftSymbols, setDraftSymbols] = useState(initial.symbols)
  const [draftBenchmarks, setDraftBenchmarks] = useState(initial.benchmarks)
  const [draftFrom, setDraftFrom] = useState(initial.from)
  const [draftTo, setDraftTo] = useState(initial.to)
  const [rangePreset, setRangePreset] = useState<RangePreset>('1Y')
  const [tab, setTab] = useState<MainTab>('performance')
  const tickers = useTickerCatalogue()
  const { state, run } = useComparisonData(applied)

  const controlValidation = useMemo(() => validateDraft(draftSymbols, draftBenchmarks, draftFrom, draftTo), [draftBenchmarks, draftFrom, draftSymbols, draftTo])
  const handleApply = useCallback(() => {
    if (controlValidation) return
    const next = {
      symbols: normalizeCodesBounded(draftSymbols, 4),
      benchmarks: normalizeCodesBounded(draftBenchmarks, 1),
      from: draftFrom < COMPARISON_MIN_DATE ? COMPARISON_MIN_DATE : draftFrom,
      to: draftTo,
    }
    setApplied(next)
    setParams(buildComparisonSearchParams({ ...next, financialYears: COMPARISON_FINANCIAL_YEARS, include: COMPARISON_INCLUDE }), { replace: false })
    run(next)
  }, [controlValidation, draftBenchmarks, draftFrom, draftSymbols, draftTo, run, setParams])
  const handleRetry = useCallback(() => run(applied), [applied, run])

  const normalized = useMemo(() => {
    const data = state.data
    if (!data) return { status: 'empty', reason: 'No comparison response loaded.' } satisfies NormalizedComparison
    return normalizeComparisonSeries([...stockSeriesInputs(safeArray(data.items)), ...benchmarkSeriesInputs(safeArray(data.benchmarks))])
  }, [state.data])

  return (
    <MarketShell title="Stock Comparison" subtitle="Compare up to four PSX stocks against selected market benchmarks.">
      <Stack spacing={2.4}>
        <ComparisonControls
          tickers={tickers}
          symbols={draftSymbols}
          benchmarks={draftBenchmarks}
          from={draftFrom}
          to={draftTo}
          rangePreset={rangePreset}
          validation={controlValidation}
          loading={state.loading}
          onSymbolsChange={setDraftSymbols}
          onBenchmarksChange={setDraftBenchmarks}
          onFromChange={setDraftFrom}
          onToChange={setDraftTo}
          onRangePresetChange={(preset) => {
            setRangePreset(preset)
            if (preset === 'Custom') return
            const range = rangeForPreset(preset, currentDateOnly())
            setDraftFrom(range.from)
            setDraftTo(range.to)
          }}
          onApply={handleApply}
        />

        {state.loading && <ComparisonSkeleton />}
        {Boolean(state.error) && <ComparisonError error={state.error} onRetry={handleRetry} />}
        {!state.loading && !state.error && state.data && (
          <>
            <StockSnapshotTable items={safeArray(state.data.items)} normalized={normalized} />
            <Box sx={{ ...CARD_SX }}>
              <Tabs value={tab} onChange={(_, value: MainTab) => setTab(value)} variant="scrollable" scrollButtons="auto">
                <Tab value="performance" label="Performance" />
                <Tab value="fundamentals" label="Fundamentals" />
                <Tab value="technicals" label="Technicals" />
              </Tabs>
              <Box sx={{ p: { xs: 1.4, md: 2.4 } }}>
                {tab === 'performance' && <PerformanceTab normalized={normalized} />}
                {tab === 'fundamentals' && <FundamentalsTab items={safeArray(state.data.items)} />}
                {tab === 'technicals' && <TechnicalsTab items={safeArray(state.data.items)} />}
              </Box>
            </Box>
          </>
        )}
      </Stack>
    </MarketShell>
  )
}

function validateDraft(symbols: readonly string[], benchmarks: readonly string[], from: string, to: string): string | null {
  const normalizedSymbols = normalizeCodesBounded(symbols, 10)
  const normalizedBenchmarks = normalizeCodesBounded(benchmarks, 10)
  if (normalizedSymbols.length < 2) return 'Select at least two stocks.'
  if (normalizedSymbols.length > 4) return 'Maximum 4 stocks.'
  if (normalizedBenchmarks.length > 1) return 'Maximum 1 benchmark.'
  if (from < COMPARISON_MIN_DATE) return 'Minimum date is 2021-01-01.'
  if (from > to) return 'From date must be before To date.'
  return null
}

const ComparisonControls = memo(function ComparisonControls({
  tickers,
  symbols,
  benchmarks,
  from,
  to,
  rangePreset,
  validation,
  loading,
  onSymbolsChange,
  onBenchmarksChange,
  onFromChange,
  onToChange,
  onRangePresetChange,
  onApply,
}: {
  tickers: readonly MarketTickerDto[]
  symbols: readonly string[]
  benchmarks: readonly string[]
  from: string
  to: string
  rangePreset: RangePreset
  validation: string | null
  loading: boolean
  onSymbolsChange: (symbols: string[]) => void
  onBenchmarksChange: (benchmarks: string[]) => void
  onFromChange: (from: string) => void
  onToChange: (to: string) => void
  onRangePresetChange: (preset: RangePreset) => void
  onApply: () => void
}) {
  return (
    <Box sx={{ ...CARD_SX, p: { xs: 1.6, md: 2.4 } }}>
      <Stack spacing={2}>
        <StockSelector tickers={tickers} symbols={symbols} onChange={onSymbolsChange} />
        <BenchmarkSelector selected={benchmarks} onChange={onBenchmarksChange} />
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.2} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', rowGap: 0.8 }}>
            {RANGE_PRESETS.map((preset) => (
              <Button key={preset} size="small" variant={rangePreset === preset ? 'contained' : 'outlined'} onClick={() => onRangePresetChange(preset)}>
                {preset}
              </Button>
            ))}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: { sm: 'center' } }}>
            <DateTextField key={`from-${from}`} label="From" value={from} onChange={onFromChange} />
            <DateTextField key={`to-${to}`} label="To" value={to} onChange={onToChange} />
            <Button variant="contained" disabled={loading || Boolean(validation)} onClick={onApply} startIcon={<RefreshIcon />} sx={{ minHeight: 40, fontWeight: 850 }}>
              {loading ? 'Updating' : 'Update comparison'}
            </Button>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 0.7, alignItems: 'center' }}>
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>Applied request uses inclusive dates: {humanDate(from)} to {humanDate(to)}</Typography>
          {validation && <Typography sx={{ color: 'var(--wc-error)', fontSize: 12, fontWeight: 800 }}>{validation}</Typography>}
        </Stack>
      </Stack>
    </Box>
  )
})

const DateTextField = memo(function DateTextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(humanDate(value))
  return (
    <TextField
      label={label}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        const parsed = parseHumanDateInput(text)
        if (parsed) onChange(parsed < COMPARISON_MIN_DATE ? COMPARISON_MIN_DATE : parsed)
        else setText(humanDate(value))
      }}
      size="small"
      placeholder="29 Jul 2026"
      helperText="Use DD Mon YYYY"
      sx={{ minWidth: 170 }}
    />
  )
})

const StockSelector = memo(function StockSelector({
  tickers,
  symbols,
  onChange,
}: {
  tickers: readonly MarketTickerDto[]
  symbols: readonly string[]
  onChange: (symbols: string[]) => void
}) {
  const [input, setInput] = useState('')
  const options = useMemo<TickerOption[]>(() => tickers.map((ticker) => ({ symbol: ticker.symbol, companyName: ticker.companyName })), [tickers])
  const addSymbol = useCallback((value: string) => {
    const normalized = normalizeCode(value)
    if (!canAddStock(symbols, normalized)) return
    onChange([...symbols, normalized])
    setInput('')
  }, [onChange, symbols])
  const removeSymbol = useCallback((symbol: string) => {
    if (!canRemoveStock(symbols)) return
    onChange(symbols.filter((item) => item !== symbol))
  }, [onChange, symbols])
  const maxed = symbols.length >= 4

  return (
    <Stack spacing={1}>
      <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Stocks</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {symbols.map((symbol, index) => (
          <Chip
            key={symbol}
            label={symbol}
            onDelete={canRemoveStock(symbols) ? () => removeSymbol(symbol) : undefined}
            sx={{ borderColor: STOCK_SERIES_COLORS[index], borderWidth: 1, borderStyle: 'solid', fontWeight: 850 }}
          />
        ))}
      </Stack>
      <Autocomplete<TickerOption, false, false, true>
        freeSolo
        disabled={maxed}
        options={options}
        inputValue={input}
        value={null}
        getOptionLabel={(option) => typeof option === 'string' ? option : option.symbol}
        filterOptions={(list, state) => {
          const query = state.inputValue.trim().toUpperCase()
          const selected = new Set(symbols.map(normalizeCode))
          return list
            .filter((option) => !selected.has(option.symbol) && (!query || option.symbol.includes(query) || (option.companyName ?? '').toUpperCase().includes(query)))
            .slice(0, 12)
        }}
        onInputChange={(_, value) => setInput(value.toUpperCase())}
        onChange={(_, value) => {
          if (!value) return
          addSymbol(typeof value === 'string' ? value : value.symbol)
        }}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.symbol} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: '8px !important' }}>
            <Typography sx={{ color: 'var(--wc-primary)', fontWeight: 850, fontSize: 13 }}>{option.symbol}</Typography>
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5 }} noWrap>{option.companyName ?? 'Company name unavailable'}</Typography>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={maxed ? 'Maximum 4 stocks' : 'Add stock'}
            placeholder={maxed ? 'Maximum 4 stocks' : 'Search symbol or company'}
            size="small"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && input.trim()) {
                event.preventDefault()
                addSymbol(input)
              }
            }}
          />
        )}
        popupIcon={<AddIcon fontSize="small" />}
      />
    </Stack>
  )
})

const BenchmarkSelector = memo(function BenchmarkSelector({ selected, onChange }: { selected: readonly string[]; onChange: (benchmarks: string[]) => void }) {
  const toggle = useCallback((code: BenchmarkCode) => {
    if (!canToggleBenchmark(selected, code)) return
    onChange(selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code])
  }, [onChange, selected])
  return (
    <Stack spacing={1}>
      <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Benchmarks (optional)</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {SUPPORTED_BENCHMARKS.map((code) => {
          const active = selected.includes(code)
          const disabled = !active && selected.length >= 1
          return (
            <Button key={code} variant={active ? 'contained' : 'outlined'} disabled={disabled} onClick={() => toggle(code)} size="small" sx={{ fontWeight: 850 }}>
              {BENCHMARK_LABELS[code]}
            </Button>
          )
        })}
      </Stack>
      {selected.length >= 1 && <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>Maximum 1 benchmark selected.</Typography>}
    </Stack>
  )
})

const StockSnapshotTable = memo(function StockSnapshotTable({ items, normalized }: { items: readonly TickerComparisonItemDto[]; normalized: NormalizedComparison }) {
  const returns = normalized.status === 'ready' ? new Map(normalized.series.filter((series) => series.kind === 'stock').map((series) => [series.id, series.periodReturnPct])) : new Map<string, number | null>()
  return (
    <Box sx={{ ...CARD_SX, overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid var(--wc-border)' }}>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Stock snapshot comparison</Typography>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
          Valuation dates are shown separately from latest quote dates.
        </Typography>
      </Box>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow>
              {['Stock', 'Last close', 'Period return', 'Latest volume', 'Market cap', 'P/E TTM', 'Annual EPS', 'Free float'].map((header) => <TableCell key={header}>{header}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.symbol}>
                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STOCK_SERIES_COLORS[index] }} />
                    <Box>
                      <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 900 }}>{item.symbol}</Typography>
                      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11 }}>{item.companyName ?? 'Company name unavailable'}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{fmtPrice(item.asOfQuote?.close)}<CellNote>{humanDate(item.asOfQuote?.tradeDate)}</CellNote></TableCell>
                <TableCell>{fmtPct(returns.get(item.symbol))}</TableCell>
                <TableCell>{fmtCount(item.asOfQuote?.turnover)}</TableCell>
                <TableCell>{fmtPkrCompact(item.valuation?.marketCap)}<CellNote>Valuation {humanDate(item.valuation?.asOf)}</CellNote></TableCell>
                <TableCell>{fmtRatio(item.valuation?.peRatioTtm)}</TableCell>
                <TableCell>{formatAnnualEps(item)}</TableCell>
                <TableCell>{fmtPct(item.equity?.freeFloatPct, false)}<CellNote>{fmtCount(item.equity?.freeFloatShares)} shares</CellNote></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
})

function CellNote({ children }: { children: ReactNode }) {
  return <Typography component="div" sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, mt: 0.3 }}>{children}</Typography>
}

function formatAnnualEps(item: TickerComparisonItemDto): string {
  const latest = item.latestAnnualEps ?? latestAnnualStatement(safeArray(item.financialStatements))
  if (!latest?.eps || !latest.fiscalYear) return 'N/A'
  return `${fmtNumber(latest.eps)} · FY${latest.fiscalYear}`
}

const PerformanceTab = memo(function PerformanceTab({ normalized }: { normalized: NormalizedComparison }) {
  const [visible, setVisible] = useState<LegendState>({})
  const [showCorrelation, setShowCorrelation] = useState(false)
  const ready = normalized.status === 'ready' ? normalized : null
  const visibleIds = useMemo(() => {
    if (!ready) return new Set<string>()
    return new Set(ready.series.filter((series) => visible[series.id] !== false).map((series) => series.id))
  }, [ready, visible])
  const analytics = useMemo(() => ready ? ready.series.map(seriesAnalytics) : [], [ready])
  const matrix = useMemo(() => ready ? correlationMatrix(ready.series) : null, [ready])
  const option = useMemo(() => ready ? relativePerformanceOption(ready, visibleIds) : null, [ready, visibleIds])

  if (normalized.status === 'empty') return <EmptyBlock title="No shared comparison range" detail={normalized.reason} />
  if (!ready) return null

  return (
    <Stack spacing={2.2}>
      <Box>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Relative price performance</Typography>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
          Rebased to 100 on the first shared trading date · base {humanDate(ready.baseDate)} · end {humanDate(ready.endDate)} · {ready.commonObservationCount} common observations
        </Typography>
      </Box>
      <CustomLegend series={ready.series} visible={visible} onToggle={(id) => setVisible((current) => ({ ...current, [id]: current[id] === false }))} />
      {option && <ReactECharts option={option} style={{ height: 430, width: '100%' }} opts={CHART_OPTS} notMerge={false} lazyUpdate />}
      <PerformanceAnalyticsTable rows={analytics} />
      {matrix && (
        <Box>
          <Button size="small" onClick={() => setShowCorrelation((current) => !current)}>{showCorrelation ? 'Hide' : 'Show'} stock return correlation</Button>
          <Collapse in={showCorrelation}><CorrelationTable matrix={matrix} /></Collapse>
        </Box>
      )}
    </Stack>
  )
})

function relativePerformanceOption(normalized: Extract<NormalizedComparison, { status: 'ready' }>, visibleIds: Set<string>) {
  return {
    animation: false,
    tooltip: { trigger: 'axis', transitionDuration: 0, axisPointer: { animation: false }, formatter: performanceTooltip },
    axisPointer: { animation: false },
    legend: { show: false },
    grid: { left: 56, right: 24, top: 28, bottom: 62 },
    xAxis: { type: 'category', data: normalized.dates, axisPointer: { animation: false } },
    yAxis: { type: 'value', name: 'Start = 100', scale: true },
    dataZoom: [{ type: 'inside', throttle: 80 }, { type: 'slider', bottom: 10, height: 22 }],
    series: normalized.series.map((series) => ({
      name: series.id,
      type: 'line',
      animation: false,
      sampling: 'lttb',
      showSymbol: false,
      symbol: 'none',
      connectNulls: false,
      data: visibleIds.has(series.id) ? series.points.map((point) => ({ value: point.normalized, close: point.close, date: point.date, returnPct: point.periodReturnPct, seriesLabel: series.label })) : [],
      lineStyle: { width: series.kind === 'benchmark' ? 1.4 : 2.2, color: series.color, type: series.dashed ? 'dashed' : 'solid' },
      itemStyle: { color: series.color },
      emphasis: { disabled: true },
    })),
  }
}

type TooltipParam = { marker?: string; seriesName?: string; data?: { date?: string; close?: number | null; value?: number | null; returnPct?: number | null; seriesLabel?: string } }

function performanceTooltip(params: TooltipParam | TooltipParam[]): string {
  const list = Array.isArray(params) ? params : [params]
  const date = list.find((param) => param.data?.date)?.data?.date
  const rows = list.filter((param) => param.data && param.data.value != null).map((param) => (
    `<div style="margin-top:6px">${param.marker ?? ''}<strong>${param.data?.seriesLabel ?? param.seriesName}</strong><br/>Close: ${fmtPrice(param.data?.close)}<br/>Normalized: ${fmtNumber(param.data?.value ?? null)}<br/>Return: ${fmtPct(param.data?.returnPct)}</div>`
  ))
  return [`<strong>${humanDate(date)}</strong>`, ...rows].join('')
}

const CustomLegend = memo(function CustomLegend({ series, visible, onToggle }: { series: readonly NormalizedSeries[]; visible: LegendState; onToggle: (id: string) => void }) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
      {series.map((item) => {
        const active = visible[item.id] !== false
        return (
          <Button key={item.id} variant={active ? 'outlined' : 'text'} onClick={() => onToggle(item.id)} sx={{ opacity: active ? 1 : 0.52, borderColor: active ? 'var(--wc-border)' : 'transparent', textTransform: 'none' }}>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 22, borderTop: `2px ${item.dashed ? 'dashed' : 'solid'} ${item.color}` }} />
              <Typography sx={{ fontSize: 12, fontWeight: 850 }}>{item.id}</Typography>
              <Typography sx={{ fontSize: 12, color: 'var(--wc-text-secondary)' }}>{fmtPct(item.periodReturnPct)}</Typography>
              <Typography sx={{ fontSize: 11, color: 'var(--wc-text-muted)' }}>{active ? 'Visible' : 'Hidden'}</Typography>
            </Stack>
          </Button>
        )
      })}
    </Stack>
  )
})

function PerformanceAnalyticsTable({ rows }: { rows: ReturnType<typeof seriesAnalytics>[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead><TableRow>{['Series', 'Return', 'Annualized volatility', 'Maximum drawdown', 'Observations'].map((header) => <TableCell key={header}>{header}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.label}</TableCell>
              <TableCell>{fmtPct(row.returnPct)}</TableCell>
              <TableCell>{fmtPct(row.annualizedVolatilityPct, false)}</TableCell>
              <TableCell>{fmtPct(row.maxDrawdownPct)}</TableCell>
              <TableCell>{row.observations}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function CorrelationTable({ matrix }: { matrix: NonNullable<ReturnType<typeof correlationMatrix>> }) {
  const byKey = new Map(matrix.cells.map((cell) => [`${cell.rowId}|${cell.columnId}`, cell.value]))
  return (
    <TableContainer sx={{ mt: 1 }}>
      <Table size="small">
        <TableHead><TableRow><TableCell>Stock</TableCell>{matrix.series.map((series) => <TableCell key={series.id}>{series.label}</TableCell>)}</TableRow></TableHead>
        <TableBody>{matrix.series.map((row) => <TableRow key={row.id}><TableCell>{row.label}</TableCell>{matrix.series.map((column) => <TableCell key={column.id}>{fmtRatio(byKey.get(`${row.id}|${column.id}`))}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </TableContainer>
  )
}

const FundamentalsTab = memo(function FundamentalsTab({ items }: { items: readonly TickerComparisonItemDto[] }) {
  const [epsMode, setEpsMode] = useState<'Annual' | 'Quarterly'>('Annual')
  const ratioNames = useMemo(() => commonRatioNames(items), [items])
  const [ratioName, setRatioName] = useState('')
  const selectedRatio = ratioName || ratioNames[0] || ''
  const epsOption = useMemo(() => epsComparisonOption(items, epsMode), [epsMode, items])
  const patOption = useMemo(() => annualMetricOption(items, 'profitAfterTax', 'Profit after tax'), [items])
  const ratioOption = useMemo(() => selectedRatio ? ratioComparisonOption(items, selectedRatio) : null, [items, selectedRatio])

  return (
    <Stack spacing={2.2}>
      <FundamentalsTable items={items} />
      <Box sx={{ ...CARD_SX, p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1, mb: 1 }}>
          <Box>
            <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>EPS history</Typography>
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>Annual and quarterly periods are not mixed.</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {(['Annual', 'Quarterly'] as const).map((mode) => <Button key={mode} size="small" variant={epsMode === mode ? 'contained' : 'outlined'} onClick={() => setEpsMode(mode)}>{mode}</Button>)}
          </Stack>
        </Stack>
        <ReactECharts option={epsOption} style={{ height: 320, width: '100%' }} opts={CHART_OPTS} notMerge={false} lazyUpdate />
      </Box>
      {patOption && <ChartPanel title="Annual profit after tax" option={patOption} />}
      {ratioNames.length > 0 ? (
        <Box sx={{ ...CARD_SX, p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Common ratios</Typography>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Ratio</InputLabel>
              <Select label="Ratio" value={selectedRatio} onChange={(event) => setRatioName(event.target.value)}>
                {ratioNames.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          {ratioOption && <ReactECharts option={ratioOption} style={{ height: 320, width: '100%' }} opts={CHART_OPTS} notMerge={false} lazyUpdate />}
        </Box>
      ) : <PerStockRatios items={items} />}
    </Stack>
  )
})

function FundamentalsTable({ items }: { items: readonly TickerComparisonItemDto[] }) {
  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 880 }}>
        <TableHead><TableRow>{['Stock', 'Market cap', 'P/E TTM', 'Annual EPS', 'Shares', 'Free float shares', 'Free float %', 'Sector'].map((header) => <TableCell key={header}>{header}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.symbol}>
              <TableCell>{item.symbol}</TableCell>
              <TableCell>{fmtPkrCompact(item.valuation?.marketCap)}<CellNote>{humanDate(item.valuation?.asOf)}</CellNote></TableCell>
              <TableCell>{fmtRatio(item.valuation?.peRatioTtm)}</TableCell>
              <TableCell>{formatAnnualEps(item)}</TableCell>
              <TableCell>{fmtCount(item.equity?.shares)}</TableCell>
              <TableCell>{fmtCount(item.equity?.freeFloatShares)}</TableCell>
              <TableCell>{fmtPct(item.equity?.freeFloatPct, false)}</TableCell>
              <TableCell>{item.profile?.sector ?? 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function baseChartOption(categories: string[], series: Record<string, unknown>[], valueLabel: string) {
  return {
    animation: false,
    tooltip: { trigger: 'axis', transitionDuration: 0 },
    legend: { show: false },
    grid: { left: 58, right: 20, top: 24, bottom: 42 },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value', name: valueLabel, scale: true },
    series,
  }
}

function epsComparisonOption(items: readonly TickerComparisonItemDto[], mode: 'Annual' | 'Quarterly') {
  const rows = items.flatMap((item) => statementsForEpsMode(safeArray(item.financialStatements), mode)
    .map((statement) => ({ item, statement, key: mode === 'Annual' ? String(statement.fiscalYear) : `FY${statement.fiscalYear} ${statement.period}` })))
  const categories = Array.from(new Set(rows.map((row) => row.key))).sort()
  const series = items.map((item, index) => ({
    name: item.symbol,
    type: 'line',
    showSymbol: true,
    connectNulls: false,
    data: categories.map((key) => rows.find((row) => row.item.symbol === item.symbol && row.key === key)?.statement.eps ?? null),
    lineStyle: { color: STOCK_SERIES_COLORS[index] },
    itemStyle: { color: STOCK_SERIES_COLORS[index] },
  }))
  return baseChartOption(categories, series, 'EPS')
}

function annualMetricOption(items: readonly TickerComparisonItemDto[], metric: keyof Pick<FinancialStatementDto, 'profitAfterTax' | 'sales'>, label: string) {
  const annual = items.flatMap((item) => safeArray(item.financialStatements).filter((statement) => statement.period === 'Annual').map((statement) => ({ item, statement })))
  if (annual.every((row) => row.statement[metric] == null)) return null
  const categories = Array.from(new Set(annual.map((row) => String(row.statement.fiscalYear)))).sort()
  const series = items.map((item, index) => ({
    name: item.symbol,
    type: 'bar',
    data: categories.map((year) => annual.find((row) => row.item.symbol === item.symbol && String(row.statement.fiscalYear) === year)?.statement[metric] ?? null),
    itemStyle: { color: STOCK_SERIES_COLORS[index] },
  }))
  return baseChartOption(categories, series, label)
}

function ratioComparisonOption(items: readonly TickerComparisonItemDto[], ratioName: string) {
  const years = Array.from(new Set(items.flatMap((item) => safeArray(item.ratios).map((ratio) => String(ratio.fiscalYear))))).sort()
  const series = items.map((item, index) => ({
    name: item.symbol,
    type: 'line',
    showSymbol: true,
    connectNulls: false,
    data: years.map((year) => ratioValues(safeArray(item.ratios).find((ratio) => String(ratio.fiscalYear) === year) ?? { fiscalYear: Number(year), values: {} })[ratioName] ?? null),
    lineStyle: { color: STOCK_SERIES_COLORS[index] },
    itemStyle: { color: STOCK_SERIES_COLORS[index] },
  }))
  return baseChartOption(years, series, ratioName)
}

function ChartPanel({ title, option }: { title: string; option: Record<string, unknown> }) {
  return <Box sx={{ ...CARD_SX, p: 2 }}><Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850, mb: 1 }}>{title}</Typography><ReactECharts option={option} style={{ height: 320, width: '100%' }} opts={CHART_OPTS} notMerge={false} lazyUpdate /></Box>
}

function PerStockRatios({ items }: { items: readonly TickerComparisonItemDto[] }) {
  return (
    <Box sx={{ ...CARD_SX, p: 2 }}>
      <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Ratios</Typography>
      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12, mb: 1 }}>No common ratio names were available across all selected stocks.</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.4}>
        {items.map((item) => <Box key={item.symbol} sx={{ flex: 1 }}><Typography sx={{ fontWeight: 850 }}>{item.symbol}</Typography><Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>{Object.keys(ratioValues(safeArray(item.ratios)[0] ?? { fiscalYear: 0, values: {} })).slice(0, 8).join(', ') || 'N/A'}</Typography></Box>)}
      </Stack>
    </Box>
  )
}

const TechnicalsTab = memo(function TechnicalsTab({ items }: { items: readonly TickerComparisonItemDto[] }) {
  const [selectedSymbol, setSelectedSymbol] = useState(items[0]?.symbol ?? '')
  const selected = items.find((item) => item.symbol === selectedSymbol) ?? items[0]
  return (
    <Stack spacing={2.2}>
      <TechnicalSnapshotTable items={items} />
      {selected && (
        <Box sx={{ ...CARD_SX, p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Detailed technical charts</Typography>
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>Raw price indicators · {selected.technicals?.calculationVersion ?? 'ta_raw_v1'} · As of {humanDate(selected.technicals?.asOf?.tradeDate)}</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Stock</InputLabel>
              <Select label="Stock" value={selected.symbol} onChange={(event) => setSelectedSymbol(event.target.value)}>
                {items.map((item) => <MenuItem key={item.symbol} value={item.symbol}>{item.symbol}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <TechnicalCharts item={selected} />
        </Box>
      )}
    </Stack>
  )
})

function TechnicalSnapshotTable({ items }: { items: readonly TickerComparisonItemDto[] }) {
  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 960 }}>
        <TableHead><TableRow>{['Stock', '1D', '5D', '20D', 'RSI 14', 'MACD', 'SMA20', 'SMA50', 'SMA200', 'ATR 14', 'Volume vs 20D'].map((header) => <TableCell key={header}>{header}</TableCell>)}</TableRow></TableHead>
        <TableBody>{items.map((item) => {
          const asOf = item.technicals?.asOf
          const close = asOf ? technicalPointClose(item, asOf.tradeDate) : null
          return (
            <TableRow key={item.symbol}>
              <TableCell>{item.symbol}<CellNote>{humanDate(asOf?.tradeDate)}</CellNote></TableCell>
              <TableCell>{fmtPct(asOf?.return1dPct)}</TableCell>
              <TableCell>{fmtPct(asOf?.return5dPct)}</TableCell>
              <TableCell>{fmtPct(asOf?.return20dPct)}</TableCell>
              <TableCell>{asOf?.rsi14 == null ? 'N/A' : `RSI ${fmtNumber(asOf.rsi14)}`}</TableCell>
              <TableCell>{macdLabel(asOf)}</TableCell>
              <TableCell>{smaLabel(close, asOf?.sma20, 'SMA20')}</TableCell>
              <TableCell>{smaLabel(close, asOf?.sma50, 'SMA50')}</TableCell>
              <TableCell>{smaLabel(close, asOf?.sma200, 'SMA200')}</TableCell>
              <TableCell>{fmtPrice(asOf?.atr14)}</TableCell>
              <TableCell>{volumeVsSmaLabel(item.asOfQuote?.turnover, asOf?.volumeSma20)}</TableCell>
            </TableRow>
          )
        })}</TableBody>
      </Table>
    </TableContainer>
  )
}

function macdLabel(point: TickerTechnicalPointDto | null | undefined): string {
  if (point?.macd == null || point.macdSignal == null) return 'N/A'
  return point.macd >= point.macdSignal ? 'MACD above signal' : 'MACD below signal'
}

function smaLabel(close: number | null | undefined, average: number | null | undefined, label: string): string {
  if (close == null || average == null) return 'N/A'
  return close >= average ? `Above ${label}` : `Below ${label}`
}

function volumeVsSmaLabel(volume: number | null | undefined, volumeSma20: number | null | undefined): string {
  if (volume == null || volumeSma20 == null || volumeSma20 <= 0) return 'N/A'
  return `Volume ${(volume / volumeSma20).toFixed(2)}× 20D average`
}

function TechnicalCharts({ item }: { item: TickerComparisonItemDto }) {
  const technicals = item.technicals?.points ?? []
  if (technicals.length === 0) return <EmptyBlock title="Technicals unavailable" detail="The comparison response did not include raw technical points for this stock." />
  return (
    <Stack spacing={1.4}>
      <ReactECharts option={technicalPriceOption(item)} style={{ height: TECHNICAL_CHART_HEIGHT + 80, width: '100%' }} opts={CHART_OPTS} notMerge={false} lazyUpdate />
      <ReactECharts option={singleMetricOption(item, 'rsi14', 'RSI 14', [{ yAxis: 30 }, { yAxis: 70 }])} style={{ height: TECHNICAL_CHART_HEIGHT, width: '100%' }} opts={CHART_OPTS} notMerge={false} lazyUpdate />
      <ReactECharts option={macdOption(item)} style={{ height: TECHNICAL_CHART_HEIGHT, width: '100%' }} opts={CHART_OPTS} notMerge={false} lazyUpdate />
      <ReactECharts option={volumeOption(item)} style={{ height: TECHNICAL_CHART_HEIGHT, width: '100%' }} opts={CHART_OPTS} notMerge={false} lazyUpdate />
    </Stack>
  )
}

function technicalDates(item: TickerComparisonItemDto): string[] {
  return (item.technicals?.points ?? []).map((point) => point.tradeDate)
}

function technicalPriceOption(item: TickerComparisonItemDto) {
  const dates = technicalDates(item)
  const quoteByDate = new Map(safeArray(item.quotes).map((quote) => [quote.tradeDate, quote]))
  const points = item.technicals?.points ?? []
  return baseChartOption(dates, [
    { name: 'Close', type: 'line', showSymbol: false, connectNulls: false, data: dates.map((date) => quoteByDate.get(date)?.close ?? null), lineStyle: { color: STOCK_SERIES_COLORS[0], width: 2 } },
    { name: 'SMA20', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.sma20), lineStyle: { color: '#16a34a' } },
    { name: 'SMA50', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.sma50), lineStyle: { color: '#ea580c' } },
    { name: 'SMA200', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.sma200), lineStyle: { color: '#6f42c1' } },
    { name: 'Bollinger upper', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.bollingerUpper), lineStyle: { color: '#94a3b8', type: 'dashed' } },
    { name: 'Bollinger middle', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.bollingerMiddle), lineStyle: { color: '#64748b', type: 'dotted' } },
    { name: 'Bollinger lower', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.bollingerLower), lineStyle: { color: '#94a3b8', type: 'dashed' } },
  ], 'Price')
}

function singleMetricOption(item: TickerComparisonItemDto, key: keyof TickerTechnicalPointDto, label: string, markLineData: Record<string, number>[]) {
  const points = item.technicals?.points ?? []
  return {
    ...baseChartOption(technicalDates(item), [{ name: label, type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => typeof point[key] === 'number' ? point[key] : null), lineStyle: { color: STOCK_SERIES_COLORS[0] }, markLine: { symbol: 'none', data: markLineData, lineStyle: { color: '#94a3b8', type: 'dashed' } } }], label),
    yAxis: { type: 'value', min: 0, max: 100 },
  }
}

function macdOption(item: TickerComparisonItemDto) {
  const points = item.technicals?.points ?? []
  return baseChartOption(technicalDates(item), [
    { name: 'MACD', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.macd), lineStyle: { color: STOCK_SERIES_COLORS[0] } },
    { name: 'Signal', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.macdSignal), lineStyle: { color: '#ea580c' } },
    { name: 'Histogram', type: 'bar', data: points.map((point) => point.macdHistogram), itemStyle: { color: '#94a3b8' } },
  ], 'MACD')
}

function volumeOption(item: TickerComparisonItemDto) {
  const quoteByDate = new Map(safeArray(item.quotes).map((quote) => [quote.tradeDate, quote]))
  const points = item.technicals?.points ?? []
  const dates = technicalDates(item)
  return baseChartOption(dates, [
    { name: 'Volume', type: 'bar', data: dates.map((date) => quoteByDate.get(date)?.turnover ?? null), itemStyle: { color: '#94a3b8' } },
    { name: 'Volume SMA20', type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.volumeSma20), lineStyle: { color: STOCK_SERIES_COLORS[0] } },
  ], 'Volume')
}

function ComparisonError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const title = error instanceof MarketApiError && error.status === 404
    ? 'Unknown stock or benchmark'
    : error instanceof MarketApiError && error.status === 400
      ? 'Invalid comparison request'
      : 'Comparison request failed'
  const detail = error instanceof MarketApiError ? error.detail ?? error.message : error instanceof Error ? error.message : 'Unexpected market API error.'
  return (
    <Box sx={{ ...CARD_SX, p: 2.4, borderColor: 'rgba(197,51,70,0.35)' }}>
      <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>{title}</Typography>
      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, mt: 0.6 }}>{detail}</Typography>
      <Button onClick={onRetry} size="small" sx={{ mt: 1.2 }}>Retry</Button>
    </Box>
  )
}

function ComparisonSkeleton() {
  return (
    <Stack spacing={2}>
      <Box sx={{ ...CARD_SX, p: 2 }}><Skeleton height={26} width={260} /><Skeleton height={180} /></Box>
      <Box sx={{ ...CARD_SX, p: 2 }}><Skeleton height={26} width={300} /><Skeleton variant="rounded" height={430} /></Box>
    </Stack>
  )
}
