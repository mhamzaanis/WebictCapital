import {
  Box,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import BubbleChartIcon from '@mui/icons-material/BubbleChart'
import DonutLargeIcon from '@mui/icons-material/DonutLarge'
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart'
import TimelineIcon from '@mui/icons-material/Timeline'
import { motion, useReducedMotion } from 'motion/react'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { useEffect, useMemo, useState } from 'react'
import { MarketDashboardSkeleton, MarketSnapshotSkeleton, PriceTableSkeleton } from './CustomSkeleton'
import { CustomDataTable } from './CustomDataTable'
import { MarketSnapshot } from './MarketSnapshot'
import { FiltersBar, type MovementFilter } from './FiltersBar.tsx'
import { MotionReveal } from '../animations/MotionReveal'
import {
  BarChart,
  DonutChart,
  LineChart,
  MarketLeaderList,
  RangeLeadersPanel,
  SectorActivityPanel,
  StockHeatmap,
  type BarChartItem,
  type DonutChartItem,
  type HeatmapItem,
  type LineChartPoint,
  type MarketLeaderItem,
  type SectorActivityItem,
} from '../market/MarketVisuals'
import { TickerTape, TickerTapeSkeleton, type TickerTapeItem } from './TickerTape'

// -- Types --------------------------------------------------------------------

type PsxStock = {
  symbol: string
  company: string
  section: string | null
  industry: string | null
  turnover: string | number | null
  open: string | number | null
  high: string | number | null
  low: string | number | null
  last_rate: string | number | null
  change: string | number | null
  eps: number | null
  pe: number | null
  result_period: string | null
  period_ending: string | null
}

type PsxData = {
  date: string
  source: 'Supabase'
  market?: {
    previous_kse100?: number
    close_kse100?: number
    curr_volume?: number
    advances?: number
    declines?: number
    unchanged?: number
    kse100_change?: number
  }
  total_stocks: number
  stocks: PsxStock[]
}

type DbStockTableRow = {
  symbol: string
  company: string
  section: string | null
  trade_date: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  turnover: number | null
  change: number | null
  eps: number | null
  result_period: string | null
  period_ending: string | null
}

type DbSummaryRow = {
  trade_date: string
  kse100_prev: number | null
  kse100_close: number | null
  kse100_change: number | null
  curr_volume: number | null
  advances: number | null
  declines: number | null
  unchanged: number | null
}

type RankedStock = PsxStock & {
  numericTurnover: number
  numericChange: number
  numericClose: number
  changePct: number
  intradayRange: number
  intradayRangePct: number
}

type SectorActivity = {
  industry: string
  turnover: number
  count: number
  gainers: number
  losers: number
  unchanged: number
  avgChangePct: number
}

// -- Helpers ------------------------------------------------------------------

function toNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return NaN
  if (typeof val === 'number') return Number.isFinite(val) ? val : NaN
  if (typeof val === 'string') return parseFloat(val.replace(/,/g, '').trim())
  const n = Number(val)
  return Number.isFinite(n) ? n : NaN
}

function changeVal(change: string | number | null | undefined): number {
  return toNum(change)
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('en-PK', { maximumFractionDigits })
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '-'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return value.toLocaleString('en-PK')
}

function formatSignedNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '-'
  if (value === 0) return '0'
  const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits })
  return `${value > 0 ? '+' : '-'}${formatted}`
}

function formatPercent(value: number, signed = true): string {
  if (!Number.isFinite(value)) return '-'
  const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: 2 })
  if (!signed || value === 0) return `${formatted}%`
  return `${value > 0 ? '+' : '-'}${formatted}%`
}

function changeColor(change: number): string {
  if (!Number.isFinite(change) || change === 0) return 'var(--wc-text-secondary)'
  return change > 0 ? 'var(--wc-success)' : 'var(--wc-error)'
}

function getChangePct(close: number, change: number): number {
  const previousClose = close - change
  if (!Number.isFinite(previousClose) || previousClose === 0) return NaN
  return (change / previousClose) * 100
}

function getRankedStock(stock: PsxStock): RankedStock {
  const high = toNum(stock.high)
  const low = toNum(stock.low)
  const numericClose = toNum(stock.last_rate)
  const numericChange = changeVal(stock.change)
  const numericTurnover = toNum(stock.turnover)
  const intradayRange = Number.isFinite(high) && Number.isFinite(low) ? high - low : NaN

  return {
    ...stock,
    numericTurnover,
    numericChange,
    numericClose,
    changePct: getChangePct(numericClose, numericChange),
    intradayRange,
    intradayRangePct: Number.isFinite(intradayRange) && low > 0 ? (intradayRange / low) * 100 : NaN,
  }
}

function changeRankValue(stock: RankedStock): number {
  return Number.isFinite(stock.changePct) ? stock.changePct : stock.numericChange
}

const MARKET_CHART_COLORS = {
  primary: '#0a2463',
  success: '#1a6640',
  error: '#b4283a',
  neutral: '#8a9bb0',
}

function mapMarketLeaderItem(stock: RankedStock): MarketLeaderItem {
  return {
    id: stock.symbol,
    symbol: stock.symbol,
    company: stock.company,
    price: stock.numericClose,
    change: stock.numericChange,
    changePct: stock.changePct,
    volume: stock.numericTurnover,
    low: toNum(stock.low),
    high: toNum(stock.high),
    rangePct: stock.intradayRangePct,
  }
}

function mapVolumeBarItem(stock: RankedStock): BarChartItem {
  return {
    id: stock.symbol,
    label: stock.symbol,
    value: stock.numericTurnover,
    tooltipLabel: 'Volume',
  }
}

function mapMomentumPoint(stock: RankedStock): LineChartPoint {
  return {
    label: stock.symbol,
    value: Number.isFinite(stock.changePct) ? stock.changePct : 0,
  }
}

function mapHeatmapItem(stock: RankedStock): HeatmapItem {
  return {
    id: stock.symbol,
    label: stock.symbol,
    value: Math.max(1, stock.numericTurnover),
    company: stock.company,
    changePct: stock.changePct,
  }
}

function mapSectorActivityItem(sector: SectorActivity): SectorActivityItem {
  return {
    id: sector.industry,
    label: sector.industry,
    turnover: sector.turnover,
    count: sector.count,
    gainers: sector.gainers,
    losers: sector.losers,
    unchanged: sector.unchanged,
    avgChangePct: sector.avgChangePct,
  }
}

function mapSectorVolumeItem(sector: SectorActivity): BarChartItem {
  return {
    id: sector.industry,
    label: sector.industry,
    value: sector.turnover,
    tooltipLabel: 'Volume',
    color:
      sector.avgChangePct > 0
        ? MARKET_CHART_COLORS.success
        : sector.avgChangePct < 0
          ? MARKET_CHART_COLORS.error
          : MARKET_CHART_COLORS.primary,
  }
}

function mapDbStockTableRow(row: DbStockTableRow): PsxStock {
  const close = row.close != null ? toNum(row.close) : null
  const eps = row.eps != null ? toNum(row.eps) : null
  const pe =
    close != null && eps != null && eps > 0
      ? parseFloat((close / eps).toFixed(2))
      : null

  return {
    symbol: row.symbol,
    company: row.company,
    section: row.section,
    industry: row.section,
    turnover: row.turnover,
    open: row.open,
    high: row.high,
    low: row.low,
    last_rate: row.close,
    change: row.change,
    eps: eps != null ? parseFloat(eps.toFixed(2)) : null,
    pe,
    result_period: row.result_period,
    period_ending: row.period_ending,
  }
}

async function fetchSupabaseTradeDay(tradeDate: string): Promise<PsxData> {
  if (!supabase) throw new Error('Supabase client is not configured')

  const [summaryResult, stocksResult] = await Promise.all([
    supabase
      .from('market_daily_summary')
      .select('trade_date,kse100_prev,kse100_close,kse100_change,curr_volume,advances,declines,unchanged')
      .eq('trade_date', tradeDate)
      .single<DbSummaryRow>(),
    supabase
      .from('v_stock_table')
      .select('symbol,company,section,trade_date,open,high,low,close,turnover,change,eps,result_period,period_ending')
      .eq('trade_date', tradeDate)
      .neq('section', 'EXCHANGE TRADED FUNDS')
      .neq('section', 'CLOSE - END MUTUAL FUND')
      .neq('section', 'INV. BANKS / INV. COS. / SECURITIES COS.')
      .order('symbol', { ascending: true }),
  ])

  if (summaryResult.error) throw summaryResult.error
  if (stocksResult.error) throw stocksResult.error

  const rows = ((stocksResult.data ?? []) as DbStockTableRow[]).map(mapDbStockTableRow)

  return {
    date: tradeDate,
    source: 'Supabase',
    market: summaryResult.data
      ? {
          // `kse100_prev` is the DB column for the previous session's close —
          // it is NOT today's open, so it's mapped to `previous_kse100`.
          previous_kse100: summaryResult.data.kse100_prev ?? undefined,
          close_kse100: summaryResult.data.kse100_close ?? undefined,
          kse100_change: summaryResult.data.kse100_change ?? undefined,
          curr_volume: summaryResult.data.curr_volume ?? undefined,
          advances: summaryResult.data.advances ?? undefined,
          declines: summaryResult.data.declines ?? undefined,
          unchanged: summaryResult.data.unchanged ?? undefined,
        }
      : undefined,
    total_stocks: rows.length,
    stocks: rows,
  }
}

const NUMBER_FONT = 'var(--wc-font-mono)'
const SERIF = 'var(--wc-font-display)'

// -- Component ----------------------------------------------------------------

export function DataPage() {
  const reduce = useReducedMotion()
  const [data, setData] = useState<PsxData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [latestTradeDate, setLatestTradeDate] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
  const [industryFilter, setIndustryFilter] = useState('all')

  useEffect(() => {
    let cancelled = false

    async function loadLatestSupabaseData() {
      if (!hasSupabaseConfig || !supabase) {
        setFetchError('Supabase env vars are missing.')
        setStatus('error')
        return
      }

      setStatus('loading')
      setFetchError(null)

      const latestDateResult = await supabase
        .from('market_daily_summary')
        .select('trade_date')
        .order('trade_date', { ascending: false })
        .limit(1)

      if (latestDateResult.error || !latestDateResult.data?.length) {
        if (!cancelled) {
          const message = latestDateResult.error?.message ?? 'No trade_date entries found in Supabase.'
          setFetchError(message)
          setStatus('error')
        }
        return
      }

      if (cancelled) return

      const tradeDate = latestDateResult.data[0]?.trade_date ?? null
      if (!tradeDate) {
        setFetchError('No trade_date entries found in Supabase.')
        setStatus('error')
        return
      }

      setLatestTradeDate(tradeDate)

      try {
        const latestData = await fetchSupabaseTradeDay(tradeDate)
        if (cancelled) return
        setData(latestData)
        setStatus('ok')
      } catch (error: unknown) {
        if (cancelled) return
        const message =
          typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Unknown error while querying Supabase.'
        setFetchError(message)
        setStatus('error')
      }
    }

    loadLatestSupabaseData()

    return () => {
      cancelled = true
    }
  }, [])

  const activeData = data
  const stocks = useMemo(() => activeData?.stocks ?? [], [activeData])

  const industryOptions = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.industry).filter((s): s is string => Boolean(s)))).sort(),
    [stocks],
  )

  const displayedStocks = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? stocks.filter((s) => s.symbol.toLowerCase().includes(q) || s.company.toLowerCase().includes(q))
      : stocks

    return filtered
      .filter((s) => {
        const chg = changeVal(s.change)
        if (movementFilter === 'gainers') return chg > 0
        if (movementFilter === 'losers') return chg < 0
        if (movementFilter === 'unchanged') return !isNaN(chg) && chg === 0
        return true
      })
      .filter((s) => industryFilter === 'all' || s.industry === industryFilter)
  }, [stocks, search, movementFilter, industryFilter])

  const stats = useMemo(() => {
    const market = activeData?.market
    if (market) return { gainers: market.advances ?? 0, losers: market.declines ?? 0, unchanged: market.unchanged ?? 0 }
    return {
      gainers: stocks.filter((s) => changeVal(s.change) > 0).length,
      losers: stocks.filter((s) => changeVal(s.change) < 0).length,
      unchanged: stocks.filter((s) => {
        const n = changeVal(s.change)
        return !isNaN(n) && n === 0
      }).length,
    }
  }, [stocks, activeData])

  const marketSummary = useMemo(() => {
    const market = activeData?.market
    if (market) {
      return {
        KSE100_PreviousClose: market.previous_kse100 ?? 0,
        KSE100_Close: market.close_kse100 ?? 0,
        Volume_Traded: market.curr_volume ?? 0,
        KSE100_Change: market.kse100_change ?? (market.close_kse100 ?? 0) - (market.previous_kse100 ?? 0),
      }
    }

    let totalOpen = 0
    let totalClose = 0
    let totalVolume = 0
    stocks.forEach((s) => {
      const open = toNum(s.open)
      const close = toNum(s.last_rate)
      const turnover = toNum(s.turnover)
      if (!isNaN(open)) totalOpen += open
      if (!isNaN(close)) totalClose += close
      if (!isNaN(turnover)) totalVolume += turnover
    })

    return {
      KSE100_PreviousClose: totalOpen,
      KSE100_Close: totalClose,
      Volume_Traded: totalVolume,
      KSE100_Change: totalClose - totalOpen,
    }
  }, [stocks, activeData])

  const dayInsights = useMemo(() => {
    const rankedStocks = stocks.map(getRankedStock)
    const gainers = rankedStocks
      .filter((stock) => Number.isFinite(stock.numericChange) && stock.numericChange > 0)
      .sort((a, b) => changeRankValue(b) - changeRankValue(a))
      .slice(0, 5)
    const losers = rankedStocks
      .filter((stock) => Number.isFinite(stock.numericChange) && stock.numericChange < 0)
      .sort((a, b) => changeRankValue(a) - changeRankValue(b))
      .slice(0, 5)
    const volumeLeaders = rankedStocks
      .filter((stock) => Number.isFinite(stock.numericTurnover) && stock.numericTurnover > 0)
      .sort((a, b) => b.numericTurnover - a.numericTurnover)
      .slice(0, 5)
    const heatmapStocks = rankedStocks
      .filter((stock) => Number.isFinite(stock.numericTurnover) && stock.numericTurnover > 0)
      .sort((a, b) => b.numericTurnover - a.numericTurnover)
      .slice(0, 54)
    const rangeStocks = rankedStocks
      .filter((stock) => Number.isFinite(stock.intradayRangePct) && stock.intradayRangePct > 0)
      .sort((a, b) => b.intradayRangePct - a.intradayRangePct)
    const rangeLeaders = rangeStocks.slice(0, 5)
    const tableVolume = rankedStocks.reduce(
      (sum, stock) => sum + (Number.isFinite(stock.numericTurnover) ? Math.max(0, stock.numericTurnover) : 0),
      0,
    )
    const totalVolume = marketSummary.Volume_Traded > 0 ? marketSummary.Volume_Traded : tableVolume
    const activeStocks = rankedStocks.filter((stock) => Number.isFinite(stock.numericTurnover) && stock.numericTurnover > 0).length
    const avgRangePct =
      rangeStocks.length > 0
        ? rangeStocks.reduce((sum, stock) => sum + stock.intradayRangePct, 0) / rangeStocks.length
        : NaN
    const topVolumeShare =
      totalVolume > 0
        ? (volumeLeaders.reduce((sum, stock) => sum + stock.numericTurnover, 0) / totalVolume) * 100
        : NaN
    const totalIssues =
      stats.gainers + stats.losers + stats.unchanged ||
      rankedStocks.filter((stock) => Number.isFinite(stock.numericChange)).length ||
      stocks.length
    const sectorMap = new Map<
      string,
      SectorActivity & {
        changePctCount: number
        changePctTotal: number
      }
    >()

    rankedStocks.forEach((stock) => {
      const industry = stock.industry || 'Unclassified'
      const current =
        sectorMap.get(industry) ??
        {
          industry,
          turnover: 0,
          count: 0,
          gainers: 0,
          losers: 0,
          unchanged: 0,
          avgChangePct: NaN,
          changePctCount: 0,
          changePctTotal: 0,
        }

      current.count += 1
      if (Number.isFinite(stock.numericTurnover)) current.turnover += Math.max(0, stock.numericTurnover)
      if (Number.isFinite(stock.numericChange)) {
        if (stock.numericChange > 0) current.gainers += 1
        else if (stock.numericChange < 0) current.losers += 1
        else current.unchanged += 1
      }
      if (Number.isFinite(stock.changePct)) {
        current.changePctTotal += stock.changePct
        current.changePctCount += 1
      }
      sectorMap.set(industry, current)
    })

    const sectors = Array.from(sectorMap.values())
      .map(({ changePctCount, changePctTotal, ...sector }) => ({
        ...sector,
        avgChangePct: changePctCount > 0 ? changePctTotal / changePctCount : NaN,
      }))
      .sort((a, b) => b.turnover - a.turnover)
      .slice(0, 5)
    const momentumStocks = [...losers].reverse().concat(gainers)

    return {
      activeStocks,
      avgRangePct,
      gainers,
      heatmapStocks,
      losers,
      momentumStocks,
      rangeLeaders,
      sectors,
      tableVolume,
      topVolumeShare,
      totalIssues,
      totalVolume,
      volumeLeaders,
    }
  }, [marketSummary.Volume_Traded, stats.gainers, stats.losers, stats.unchanged, stocks])

  const breadthChartItems = useMemo<DonutChartItem[]>(
    () => [
      { name: 'Advancers', value: stats.gainers, color: MARKET_CHART_COLORS.success },
      { name: 'Decliners', value: stats.losers, color: MARKET_CHART_COLORS.error },
      { name: 'Unchanged', value: stats.unchanged, color: MARKET_CHART_COLORS.neutral },
    ],
    [stats.gainers, stats.losers, stats.unchanged],
  )

  const marketVisualData = useMemo(
    () => ({
      gainers: dayInsights.gainers.map(mapMarketLeaderItem),
      losers: dayInsights.losers.map(mapMarketLeaderItem),
      volumeLeaders: dayInsights.volumeLeaders.map(mapMarketLeaderItem),
      rangeLeaders: dayInsights.rangeLeaders.map(mapMarketLeaderItem),
      momentum: dayInsights.momentumStocks.map(mapMomentumPoint),
      heatmap: dayInsights.heatmapStocks.map(mapHeatmapItem),
      sectors: dayInsights.sectors.map(mapSectorActivityItem),
      sectorVolume: dayInsights.sectors.map(mapSectorVolumeItem),
      volumeBars: dayInsights.volumeLeaders.map(mapVolumeBarItem),
    }),
    [dayInsights],
  )

  // Change % must be computed off the *previous* close, not the intraday open.
  const indexChangePct =
    marketSummary.KSE100_PreviousClose > 0
      ? (marketSummary.KSE100_Change / marketSummary.KSE100_PreviousClose) * 100
      : NaN

  const tickerTapeItems = useMemo<TickerTapeItem[]>(() => {
    const uniqueStocks = new Map<string, RankedStock>()

    ;[
      ...dayInsights.volumeLeaders,
      ...dayInsights.gainers,
      ...dayInsights.losers,
      ...dayInsights.heatmapStocks.slice(0, 14),
    ].forEach((stock) => {
      if (!uniqueStocks.has(stock.symbol)) uniqueStocks.set(stock.symbol, stock)
    })

    return Array.from(uniqueStocks.values()).slice(0, 26).map((stock) => {
      const tone: TickerTapeItem['tone'] =
        stock.numericChange > 0 ? 'positive' : stock.numericChange < 0 ? 'negative' : 'neutral'

      return {
        symbol: stock.symbol,
        company: stock.company,
        price: formatNumber(stock.numericClose),
        change: formatSignedNumber(stock.numericChange),
        changePct: Number.isFinite(stock.changePct) ? `(${formatPercent(stock.changePct)})` : '',
        volume: formatCompactNumber(stock.numericTurnover),
        tone,
      }
    })
  }, [dayInsights.gainers, dayInsights.heatmapStocks, dayInsights.losers, dayInsights.volumeLeaders])
  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 14 },
        bgcolor: 'var(--wc-bg)',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1400px !important', px: { xs: 2.5, md: 5 } }}>
        {/* Header-to-content spacing: ~40-48px */}
        <Stack spacing={{ xs: 5, md: 6 }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <MotionReveal>
            <Box
              component={motion.section}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box sx={{ maxWidth: 80 }} />

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { md: 'flex-end' },
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ maxWidth: 620 }}>
                  
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '1.6rem', sm: '2rem', md: '2.4rem' },
                      fontWeight: 700,
                      color: 'var(--wc-text-primary)',
                      letterSpacing: 0,
                      lineHeight: 1.08,
                    }}
                  >
                    PSX Daily{' '}
                    <Box component="span" sx={{ color: 'var(--wc-primary)' }}>
                      Dashboard
                    </Box>
                    .
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.5,
                      color: 'var(--wc-text-secondary)',
                      fontSize: 14,
                      lineHeight: 1.7,
                      maxWidth: 620,
                    }}
                  >
                    Daily breadth, market movers, volume leaders, active industries, and complete closing
                    rates from the latest PSX session.
                  </Typography>
                </Box>

                <Box sx={{ textAlign: { md: 'right' }, pb: { md: 0.5 }, flexShrink: 0 }}>
                  
                  
                </Box>
              </Box>
            </Box>
          </MotionReveal>

          {/* ── Loading state ───────────────────────────────────────────── */}
          {status === 'loading' && (
            <MotionReveal>
              <Stack spacing={{ xs: 2, md: 2.5 }}>
                <TickerTapeSkeleton />
                <MarketSnapshotSkeleton />
                <MarketDashboardSkeleton />
                <FiltersBar
                  disabled
                  search={search}
                  setSearch={setSearch}
                  movementFilter={movementFilter}
                  setMovementFilter={setMovementFilter}
                  industryFilter={industryFilter}
                  setIndustryFilter={setIndustryFilter}
                  industryOptions={industryOptions}
                />
                <PriceTableSkeleton />
              </Stack>
            </MotionReveal>
          )}

          {/* ── Error state ─────────────────────────────────────────────── */}
          {status === 'error' && (
            <MotionReveal>
              <Box
                sx={{
                  border: '1px solid #e2eaf5',
                  borderRadius: 1.5,
                  bgcolor: '#fafbfd',
                  p: { xs: 3, md: 5 },
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(180,40,58,0.08)',
                    border: '1px solid rgba(180,40,58,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'var(--wc-error)', fontFamily: NUMBER_FONT }}>
                    !
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--wc-text-primary)',
                    fontFamily: SERIF,
                    mb: 1.5,
                    letterSpacing: 0,
                  }}
                >
                  Could not load market data
                </Typography>

                <Typography
                  sx={{
                    fontSize: 14,
                    color: 'var(--wc-text-secondary)',
                    lineHeight: 1.7,
                    maxWidth: 520,
                    mx: 'auto',
                    mb: 0.5,
                  }}
                >
                  Please verify database access and environment variables.
                </Typography>

                <Box
                  sx={{
                    mt: 2,
                    display: 'inline-block',
                    textAlign: 'left',
                    bgcolor: 'rgba(10,36,99,0.04)',
                    border: '1px solid rgba(10,36,99,0.12)',
                    borderRadius: 1,
                    px: 2.5,
                    py: 1.5,
                  }}
                >
                  {fetchError && (
                    <Box sx={{ mt: 1 }}>
                      <Typography sx={{ fontSize: 11, fontFamily: SERIF, fontWeight: 600, color: 'var(--wc-error)', letterSpacing: '0.06em', mb: 0.4 }}>
                        ERROR
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontFamily: NUMBER_FONT, color: 'var(--wc-text-secondary)', wordBreak: 'break-all' }}>
                        {fetchError}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </MotionReveal>
          )}

          {/* ── Data state ──────────────────────────────────────────────── */}
          {status === 'ok' && activeData && (
            // Regular dashboard section gaps: ~24-32px. This Stack — not the
            // outer page Stack — now controls spacing between dashboard blocks.
            <Stack spacing={{ xs: 3, md: 4 }}>

              {/* Ticker-to-snapshot spacing: ~16-20px, tighter than the
                  section rhythm below since these two read as one unit. */}
              <Stack spacing={{ xs: 2, md: 2.5 }}>
                <MotionReveal>
                  <TickerTape items={tickerTapeItems} date={activeData.date} monoFont={NUMBER_FONT} />
                </MotionReveal>

                <MotionReveal>
                  <MarketSnapshot
                    date={activeData.date}
                    previousClose={marketSummary.KSE100_PreviousClose}
                    close={marketSummary.KSE100_Close}
                    change={marketSummary.KSE100_Change}
                    changePercent={indexChangePct}
                    volume={marketSummary.Volume_Traded}
                    advancing={stats.gainers}
                    declining={stats.losers}
                    unchanged={stats.unchanged}
                    monoFont={NUMBER_FONT}
                  />
                </MotionReveal>
              </Stack>

              <MotionReveal>
                <Box
                  sx={{
                    display: 'grid',
                  }}
                >
                  <StockHeatmap
                    heading="Stock Heatmap"
                    detail="Top active names sized by volume and colored by daily move."
                    icon={<BubbleChartIcon sx={{ fontSize: 18 }} />}
                    height={460}
                    data={marketVisualData.heatmap}
                    colors={{
                      positive: MARKET_CHART_COLORS.success,
                      negative: MARKET_CHART_COLORS.error,
                      neutral: '#eef2f7',
                    }}
                  />
                </Box>
              </MotionReveal>

              <MotionReveal>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '0.85fr 1.05fr 1.1fr' },
                    gap: 1.5,
                  }}
                >
                  <DonutChart
                    heading="Breadth Donut"
                    detail="Advancers, decliners, and unchanged issues."
                    icon={<DonutLargeIcon sx={{ fontSize: 18 }} />}
                    height={270}
                    data={breadthChartItems}
                    colors={[
                      MARKET_CHART_COLORS.success,
                      MARKET_CHART_COLORS.error,
                      MARKET_CHART_COLORS.neutral,
                    ]}
                    centerSubtext="issues"
                    emptyLabel="Breadth data is unavailable."
                  />
                  <BarChart
                    heading="Sector Volume"
                    detail="Top industries by trading concentration."
                    icon={<AnalyticsIcon sx={{ fontSize: 18 }} />}
                    height={360}
                    data={marketVisualData.sectorVolume}
                    left={120}
                    emptyLabel="Sector volume is unavailable."
                  />
                  <LineChart
                    heading="Mover Curve"
                    detail="Largest losers through largest gainers."
                    icon={<TimelineIcon sx={{ fontSize: 18 }} />}
                    height={270}
                    data={marketVisualData.momentum}
                    color={MARKET_CHART_COLORS.primary}
                    emptyLabel="Momentum line needs more mover data."
                  />
                </Box>
              </MotionReveal>

              <MotionReveal>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
                    gap: 1.5,
                  }}
                >
                  <MarketLeaderList
                    title="Top Gainers"
                    subtitle="Largest positive closes versus the prior close."
                    items={marketVisualData.gainers}
                    kind="gain"
                    monoFont={NUMBER_FONT}
                  />
                  <MarketLeaderList
                    title="Top Losers"
                    subtitle="Largest negative closes versus the prior close."
                    items={marketVisualData.losers}
                    kind="loss"
                    monoFont={NUMBER_FONT}
                  />
                  <BarChart
                    heading="Volume Leaders"
                    detail="Most active symbols by traded turnover."
                    icon={<StackedBarChartIcon sx={{ fontSize: 18 }} />}
                    height={270}
                    data={marketVisualData.volumeBars}
                    color={MARKET_CHART_COLORS.primary}
                    emptyLabel="Volume leaders are unavailable."
                  />
                </Box>
              </MotionReveal>

              <MotionReveal>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
                    gap: 1.5,
                  }}
                >
                  <SectorActivityPanel
                    sectors={marketVisualData.sectors}
                    totalVolume={dayInsights.totalVolume}
                    monoFont={NUMBER_FONT}
                  />
                  <RangeLeadersPanel
                    items={marketVisualData.rangeLeaders}
                    avgRangePct={dayInsights.avgRangePct}
                    monoFont={NUMBER_FONT}
                  />
                </Box>
              </MotionReveal>

              {/* Filters + Search */}
              <MotionReveal>
                <Box
                  sx={{
                    borderTop: '1px solid var(--wc-divider)',
                    pt: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <FiltersBar
                    disabled={false}
                    search={search}
                    setSearch={setSearch}
                    movementFilter={movementFilter}
                    setMovementFilter={setMovementFilter}
                    industryFilter={industryFilter}
                    setIndustryFilter={setIndustryFilter}
                    industryOptions={industryOptions}
                  />
                </Box>
              </MotionReveal>

              <MotionReveal>
                <CustomDataTable rows={displayedStocks} searchQuery={search} monoFont={NUMBER_FONT} />
              </MotionReveal>
            </Stack>
          )}

        </Stack>
      </Container>
    </Box>
  )
}