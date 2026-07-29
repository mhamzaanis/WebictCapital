import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import SyncAltIcon from '@mui/icons-material/SyncAlt'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { comparisonAnalytics, normalizedSeries } from '../../lib/api/analytics'
import { fetchLatestMarketSummary } from '../../lib/api/market'
import { fetchTickerComparison } from '../../lib/api/tickers'
import type { MarketTickerDto, TickerComparisonResponse } from '../../lib/api/types'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock, ErrorBlock } from '../markets/StateBlocks'
import { CARD_SX, DATA_FONT, fmtCompact, fmtDate, fmtNumber, fmtPct } from '../markets/marketUtils'

// ─── Ticker catalogue (for autocomplete suggestions) ──────────────────────────

function useTickerCatalogue() {
  const [tickers, setTickers] = useState<MarketTickerDto[]>([])
  useEffect(() => {
    fetchLatestMarketSummary()
      .then((res) => setTickers(res.tickers))
      .catch(() => { /* suggestions degrade gracefully */ })
  }, [])
  return tickers
}

// ─── Comparison fetch (manual trigger) ────────────────────────────────────────

function useComparison(a: string, b: string, from: string, to: string) {
  const [data, setData] = useState<TickerComparisonResponse | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  function run(symbols: [string, string], dateFrom: string, dateTo: string) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    setData(null)
    fetchTickerComparison({ symbols, from: dateFrom, to: dateTo, financialYears: 5 }, controller.signal)
      .then(setData)
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught)
      })
      .finally(() => setLoading(false))
  }

  // Run on mount with URL params
  const didMount = useRef(false)
  useEffect(() => {
    if (didMount.current) return
    didMount.current = true
    run([a, b], from, to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => { abortRef.current?.abort() }, [])

  return { data, error, loading, run }
}

function todayMinusMonths(months: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString().slice(0, 10)
}

// ─── Symbol Autocomplete ───────────────────────────────────────────────────────

type TickerOption = { symbol: string; companyName: string | null }

function SymbolSearch({
  label,
  value,
  tickers,
  onChange,
}: {
  label: string
  value: string
  tickers: MarketTickerDto[]
  onChange: (v: string) => void
}) {
  const options: TickerOption[] = useMemo(
    () => tickers.map((t) => ({ symbol: t.symbol, companyName: t.companyName })),
    [tickers],
  )

  const selected = options.find((o) => o.symbol === value) ?? { symbol: value, companyName: null }

  return (
    <Autocomplete<TickerOption, false, false, true>
      freeSolo
      options={options}
      value={selected}
      getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.symbol)}
      filterOptions={(opts, state) => {
        const q = state.inputValue.trim().toUpperCase()
        if (!q) return opts.slice(0, 12)
        return opts
          .filter(
            (o) =>
              o.symbol.includes(q) ||
              (o.companyName ?? '').toUpperCase().includes(q),
          )
          .slice(0, 10)
      }}
      onChange={(_, newValue) => {
        if (!newValue) return
        onChange(typeof newValue === 'string' ? newValue.toUpperCase() : newValue.symbol)
      }}
      onInputChange={(_, inputValue, reason) => {
        if (reason === 'input') onChange(inputValue.toUpperCase())
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.symbol} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: '8px !important' }}>
          <Typography sx={{ fontWeight: 800, color: 'var(--wc-primary)', fontSize: 13 }}>
            {option.symbol}
          </Typography>
          {option.companyName && (
            <Typography sx={{ fontSize: 11.5, color: 'var(--wc-text-secondary)' }} noWrap>
              {option.companyName}
            </Typography>
          )}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Type symbol or company…"
          size="medium"
        />
      )}
      popupIcon={null}
      sx={{ minWidth: 180 }}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function StockComparisonPage() {
  const [params, setParams] = useSearchParams()

  // Committed state (URL-backed) — used as initial draft
  const committedA = (params.get('a') ?? 'MEBL').toUpperCase()
  const committedB = (params.get('b') ?? 'HBL').toUpperCase()
  const committedFrom = params.get('from') ?? todayMinusMonths(12)
  const committedTo = params.get('to') ?? new Date().toISOString().slice(0, 10)

  // Draft state — updated while user is typing/selecting
  const [draftA, setDraftA] = useState(committedA)
  const [draftB, setDraftB] = useState(committedB)
  const [draftFrom, setDraftFrom] = useState(committedFrom)
  const [draftTo, setDraftTo] = useState(committedTo)

  const tickers = useTickerCatalogue()
  const { data, error, loading, run } = useComparison(committedA, committedB, committedFrom, committedTo)

  function handleCompare() {
    const safeA = draftA.trim().toUpperCase() || 'MEBL'
    const safeB = draftB.trim().toUpperCase() || 'HBL'
    setParams({ a: safeA, b: safeB, from: draftFrom, to: draftTo }, { replace: true })
    run([safeA, safeB], draftFrom, draftTo)
  }

  function handleSwap() {
    setDraftA(draftB)
    setDraftB(draftA)
  }

  const first = data?.items[0] ?? null
  const second = data?.items[1] ?? null
  const analytics = useMemo(
    () => (first && second ? comparisonAnalytics(first.quotes, second.quotes) : null),
    [first, second],
  )
  const normalized = useMemo(
    () => (first && second ? [normalizedSeries(first.quotes), normalizedSeries(second.quotes)] : [[], []]),
    [first, second],
  )

  const option = {
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 54, right: 24, top: 44, bottom: 64 },
    xAxis: { type: 'category', data: normalized[0].map((point) => point.date) },
    yAxis: { type: 'value', name: 'Start = 100' },
    dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 8 }],
    series: [
      { name: first?.symbol ?? draftA, type: 'line', showSymbol: false, connectNulls: false, data: normalized[0].map((point) => point.value) },
      { name: second?.symbol ?? draftB, type: 'line', showSymbol: false, connectNulls: false, data: normalized[1].map((point) => point.value) },
    ],
  }

  return (
    <MarketShell title="Stock Comparison">
      <Stack spacing={2.4}>

        {/* ── Control bar ── */}
        <Box sx={{ ...CARD_SX, p: 2.4 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.4}
            sx={{ alignItems: { md: 'center' } }}
          >
            {/* Symbol A */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SymbolSearch label="Symbol A" value={draftA} tickers={tickers} onChange={setDraftA} />
            </Box>

            {/* Swap */}
            <Button
              aria-label="Swap symbols"
              onClick={handleSwap}
              sx={{
                minWidth: 40,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid var(--wc-border)',
                color: 'var(--wc-text-secondary)',
                flexShrink: 0,
              }}
            >
              <SwapHorizIcon fontSize="small" />
            </Button>

            {/* Symbol B */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SymbolSearch label="Symbol B" value={draftB} tickers={tickers} onChange={setDraftB} />
            </Box>

            {/* Date range */}
            <TextField
              label="From"
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 160 }}
            />
            <TextField
              label="To"
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 160 }}
            />

            {/* Compare button */}
            <Button
              variant="contained"
              onClick={handleCompare}
              disabled={loading}
              startIcon={<SyncAltIcon />}
              sx={{
                height: 56,
                px: 3,
                fontWeight: 800,
                flexShrink: 0,
                bgcolor: 'var(--wc-primary)',
                '&:hover': { bgcolor: 'var(--wc-primary-hover, #0c3a8f)' },
                whiteSpace: 'nowrap',
              }}
            >
              Compare
            </Button>
          </Stack>

          {/* Chip row showing committed pair */}
          {(committedA || committedB) && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.6 }}>
              <Chip
                size="small"
                label={committedA}
                sx={{ fontWeight: 800, color: 'var(--wc-primary)', borderColor: 'var(--wc-primary)', border: '1px solid' }}
              />
              <Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 12, alignSelf: 'center' }}>vs</Typography>
              <Chip
                size="small"
                label={committedB}
                sx={{ fontWeight: 800, color: 'var(--wc-text-secondary)', borderColor: 'var(--wc-border)', border: '1px solid' }}
              />
              <Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 12, alignSelf: 'center' }}>
                {committedFrom} → {committedTo}
              </Typography>
            </Stack>
          )}
        </Box>

        {/* ── Results ── */}
        {loading && <ComparisonSkeleton />}
        {Boolean(error) && <ErrorBlock error={error} />}
        {!loading && !error && (!first || !second) && (
          <EmptyBlock
            title="Comparison unavailable"
            detail="The API did not return exactly two comparison items. Check that both symbols are valid PSX tickers."
          />
        )}
        {first && second && analytics && (
          <>
            {/* Header cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              {[first, second].map((item) => (
                <Box key={item.symbol} sx={{ ...CARD_SX, p: 2.4 }}>
                  <Typography sx={{ color: 'var(--wc-primary)', fontWeight: 900 }}>{item.symbol}</Typography>
                  <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 20, fontWeight: 850 }}>
                    {item.companyName ?? item.symbol}
                  </Typography>
                  <Typography sx={{ mt: 1, color: 'var(--wc-text-secondary)', fontFamily: DATA_FONT }}>
                    Close {fmtNumber(item.asOfQuote?.close)} · {fmtDate(item.asOfQuote?.tradeDate)} · shares traded {fmtCompact(item.asOfQuote?.turnover)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Chart */}
            <Box sx={{ ...CARD_SX, p: 2.4 }}>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850, mb: 1 }}>Normalized raw performance</Typography>
              <ReactECharts option={option} style={{ height: 430, width: '100%' }} opts={{ renderer: 'svg' }} />
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
                Descriptive market analytics based on raw historical observations; not financial advice.
              </Typography>
            </Box>

            {/* Analytics tiles */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(6, 1fr)' }, gap: 1.4 }}>
              <Metric label="Common obs." value={String(analytics.commonObservationCount)} />
              <Metric label={`${first.symbol} return`} value={fmtPct(analytics.returnA)} />
              <Metric label={`${second.symbol} return`} value={fmtPct(analytics.returnB)} />
              <Metric label="Relative diff." value={fmtPct(analytics.relativePerformancePct)} />
              <Metric label="Correlation" value={analytics.correlation == null ? 'Insufficient history' : analytics.correlation.toFixed(3)} />
              <Metric label="Shared range" value={data?.requestedRange ? `${data.requestedRange.from} → ${data.requestedRange.to}` : '-'} />
            </Box>
          </>
        )}
      </Stack>
    </MarketShell>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ ...CARD_SX, p: 1.8 }}>
      <Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase' }}>{label}</Typography>
      <Typography sx={{ mt: 0.7, color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: 16, fontWeight: 850 }}>{value}</Typography>
    </Box>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ComparisonSkeleton() {
  return (
    <>
      {/* Two stock header cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        {[0, 1].map((i) => (
          <Box key={i} sx={{ ...CARD_SX, p: 2.4 }}>
            <Skeleton variant="text" width={60} height={16} sx={{ mb: 0.6 }} />
            <Skeleton variant="text" width="75%" height={26} sx={{ mb: 1.2 }} />
            <Skeleton variant="text" width="90%" height={14} />
          </Box>
        ))}
      </Box>

      {/* Normalized chart panel */}
      <Box sx={{ ...CARD_SX, p: 2.4 }}>
        <Skeleton variant="text" width={220} height={18} sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" width="100%" height={430} sx={{ borderRadius: 1.5 }} />
        <Skeleton variant="text" width="60%" height={13} sx={{ mt: 1.2 }} />
      </Box>

      {/* 6 analytics metric tiles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(6, 1fr)' }, gap: 1.4 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} sx={{ ...CARD_SX, p: 1.8 }}>
            <Skeleton variant="text" width="70%" height={12} sx={{ mb: 0.8 }} />
            <Skeleton variant="text" width="55%" height={20} />
          </Box>
        ))}
      </Box>
    </>
  )
}
