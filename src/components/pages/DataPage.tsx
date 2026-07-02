import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { motion, useReducedMotion } from 'motion/react'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PriceTableSkeleton, StatCardsSkeleton } from './CustomSkeleton'
import { CustomDataTable } from './CustomDataTable'
import { CustomStatsCards } from './CustomStatsCards'
import { FiltersBar, type MovementFilter } from './FiltersBar.tsx'
import { MotionReveal } from '../animations/MotionReveal'

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
    open_kse100?: number
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

type MovementTone = 'positive' | 'negative' | 'neutral'

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

function toneColor(tone: MovementTone): string {
  if (tone === 'positive') return 'var(--wc-success)'
  if (tone === 'negative') return 'var(--wc-error)'
  return 'var(--wc-text-secondary)'
}

function toneBackground(tone: MovementTone): string {
  if (tone === 'positive') return 'rgba(26,102,64,0.08)'
  if (tone === 'negative') return 'rgba(180,40,58,0.08)'
  return 'var(--wc-primary-light)'
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
          open_kse100: summaryResult.data.kse100_prev ?? undefined,
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

const NUMBER_FONT = 'var(--wc-number-font)'
const SERIF = '"Playfair Display", serif'

function SectionHeading({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string
  title: string
  meta?: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
      <Box>
        <Typography
          sx={{
            fontSize: 10,
            fontFamily: NUMBER_FONT,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--wc-primary)',
            mb: 0.6,
            fontWeight: 700,
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          sx={{
            color: 'var(--wc-text-primary)',
            fontFamily: SERIF,
            fontSize: { xs: 18, md: 22 },
            fontWeight: 700,
            lineHeight: 1.18,
          }}
        >
          {title}
        </Typography>
      </Box>
      {meta && (
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 11 }}>
          {meta}
        </Typography>
      )}
    </Box>
  )
}

function DailyMetricCard({
  icon,
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
  tone?: MovementTone
}) {
  const color = toneColor(tone)

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 132,
        p: 2,
        bgcolor: 'var(--wc-bg)',
        border: '1px solid var(--wc-divider)',
        borderRadius: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Stack direction="row" spacing={1.1} sx={{ alignItems: 'center', color }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1,
            bgcolor: toneBackground(tone),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            color: 'var(--wc-text-secondary)',
            fontFamily: NUMBER_FONT,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Box>
        <Typography sx={{ color, fontFamily: NUMBER_FONT, fontSize: { xs: 20, md: 24 }, fontWeight: 800 }}>
          {value}
        </Typography>
        <Typography sx={{ mt: 0.5, color: 'var(--wc-text-secondary)', fontSize: 12, lineHeight: 1.45 }}>
          {detail}
        </Typography>
      </Box>
    </Paper>
  )
}

function LeaderList({
  title,
  subtitle,
  rows,
  kind,
}: {
  title: string
  subtitle: string
  rows: RankedStock[]
  kind: 'gain' | 'loss' | 'volume'
}) {
  const tone: MovementTone = kind === 'gain' ? 'positive' : kind === 'loss' ? 'negative' : 'neutral'
  const color = toneColor(tone)

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'var(--wc-bg)',
        border: '1px solid var(--wc-divider)',
        borderRadius: 1.5,
        minHeight: 320,
      }}
    >
      <Stack spacing={0.4} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {kind === 'gain' && <TrendingUpIcon sx={{ fontSize: 18, color }} />}
          {kind === 'loss' && <TrendingDownIcon sx={{ fontSize: 18, color }} />}
          {kind === 'volume' && <BarChartIcon sx={{ fontSize: 18, color: 'var(--wc-primary)' }} />}
          <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: SERIF, fontSize: 17, fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, lineHeight: 1.5 }}>
          {subtitle}
        </Typography>
      </Stack>

      <Stack spacing={1}>
        {rows.length === 0 && (
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
            No qualifying symbols for this session.
          </Typography>
        )}
        {rows.map((stock, index) => {
          const stockColor = kind === 'volume' ? 'var(--wc-primary)' : changeColor(stock.numericChange)
          const primaryValue =
            kind === 'volume'
              ? formatCompactNumber(stock.numericTurnover)
              : Number.isFinite(stock.changePct)
                ? formatPercent(stock.changePct)
                : formatSignedNumber(stock.numericChange)
          const secondaryValue =
            kind === 'volume'
              ? `Last ${formatNumber(stock.numericClose)}`
              : `${formatSignedNumber(stock.numericChange)} pts at ${formatNumber(stock.numericClose)}`

          return (
            <Box
              key={`${title}-${stock.symbol}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '32px minmax(0, 1fr) auto',
                gap: 1,
                alignItems: 'center',
                py: 1,
                borderTop: index === 0 ? '0' : '1px solid var(--wc-divider)',
              }}
            >
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 11 }}>
                #{index + 1}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: 'var(--wc-primary)', fontFamily: NUMBER_FONT, fontSize: 13, fontWeight: 800 }}>
                  {stock.symbol}
                </Typography>
                <Typography
                  title={stock.company}
                  sx={{
                    color: 'var(--wc-text-secondary)',
                    fontSize: 11,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stock.company}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', minWidth: 86 }}>
                <Typography sx={{ color: stockColor, fontFamily: NUMBER_FONT, fontSize: 13, fontWeight: 800 }}>
                  {primaryValue}
                </Typography>
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 10 }}>
                  {secondaryValue}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}

function SectorActivityPanel({
  sectors,
  totalVolume,
}: {
  sectors: SectorActivity[]
  totalVolume: number
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'var(--wc-bg)',
        border: '1px solid var(--wc-divider)',
        borderRadius: 1.5,
        minHeight: 320,
      }}
    >
      <Stack spacing={0.4} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <BarChartIcon sx={{ fontSize: 18, color: 'var(--wc-primary)' }} />
          <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: SERIF, fontSize: 17, fontWeight: 700 }}>
            Active Industries
          </Typography>
        </Stack>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, lineHeight: 1.5 }}>
          Sectors ranked by traded volume in the latest closing file.
        </Typography>
      </Stack>

      <Stack spacing={1.2}>
        {sectors.map((sector) => {
          const share = totalVolume > 0 ? (sector.turnover / totalVolume) * 100 : 0
          const sectorTone: MovementTone =
            sector.avgChangePct > 0 ? 'positive' : sector.avgChangePct < 0 ? 'negative' : 'neutral'

          return (
            <Box key={sector.industry}>
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography
                  title={sector.industry}
                  sx={{
                    color: 'var(--wc-text-primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '68%',
                  }}
                >
                  {sector.industry}
                </Typography>
                <Typography sx={{ color: 'var(--wc-primary)', fontFamily: NUMBER_FONT, fontSize: 11, fontWeight: 800 }}>
                  {formatCompactNumber(sector.turnover)}
                </Typography>
              </Stack>
              <Box sx={{ mt: 0.8, height: 6, borderRadius: 999, bgcolor: 'var(--wc-primary-light)', overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${Math.min(100, share)}%`,
                    height: '100%',
                    bgcolor: 'var(--wc-primary)',
                  }}
                />
              </Box>
              <Stack direction="row" spacing={1.4} sx={{ mt: 0.65, flexWrap: 'wrap' }}>
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 10 }}>
                  {sector.count} symbols
                </Typography>
                <Typography sx={{ color: 'var(--wc-success)', fontFamily: NUMBER_FONT, fontSize: 10 }}>
                  {sector.gainers} up
                </Typography>
                <Typography sx={{ color: 'var(--wc-error)', fontFamily: NUMBER_FONT, fontSize: 10 }}>
                  {sector.losers} down
                </Typography>
                <Typography sx={{ color: toneColor(sectorTone), fontFamily: NUMBER_FONT, fontSize: 10 }}>
                  avg {formatPercent(sector.avgChangePct)}
                </Typography>
              </Stack>
            </Box>
          )
        })}
        {sectors.length === 0 && (
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
            Industry volume was not available for this session.
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}

function RangeLeadersPanel({
  rows,
  avgRangePct,
}: {
  rows: RankedStock[]
  avgRangePct: number
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'var(--wc-bg)',
        border: '1px solid var(--wc-divider)',
        borderRadius: 1.5,
        minHeight: 320,
      }}
    >
      <Stack spacing={0.4} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ShowChartIcon sx={{ fontSize: 18, color: 'var(--wc-primary)' }} />
          <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: SERIF, fontSize: 17, fontWeight: 700 }}>
            Widest Daily Ranges
          </Typography>
        </Stack>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, lineHeight: 1.5 }}>
          Symbols with the largest high-low spread during the session.
        </Typography>
      </Stack>

      <Box
        sx={{
          mb: 1.5,
          p: 1.4,
          bgcolor: 'var(--wc-paper)',
          border: '1px solid var(--wc-divider)',
          borderRadius: 1,
        }}
      >
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 10, mb: 0.4 }}>
          AVERAGE RANGE
        </Typography>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT, fontSize: 20, fontWeight: 800 }}>
          {formatPercent(avgRangePct, false)}
        </Typography>
      </Box>

      <Stack spacing={1}>
        {rows.map((stock, index) => (
          <Box
            key={`range-${stock.symbol}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: '32px minmax(0, 1fr) auto',
              gap: 1,
              alignItems: 'center',
              py: 1,
              borderTop: index === 0 ? '0' : '1px solid var(--wc-divider)',
            }}
          >
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 11 }}>
              #{index + 1}
            </Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: 'var(--wc-primary)', fontFamily: NUMBER_FONT, fontSize: 13, fontWeight: 800 }}>
                {stock.symbol}
              </Typography>
              <Typography
                title={stock.company}
                sx={{
                  color: 'var(--wc-text-secondary)',
                  fontSize: 11,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {stock.company}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', minWidth: 88 }}>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT, fontSize: 13, fontWeight: 800 }}>
                {formatPercent(stock.intradayRangePct, false)}
              </Typography>
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 10 }}>
                {formatNumber(toNum(stock.low))}-{formatNumber(toNum(stock.high))}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}

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
        KSE100_Open: market.open_kse100 ?? 0,
        KSE100_Close: market.close_kse100 ?? 0,
        Volume_Traded: market.curr_volume ?? 0,
        KSE100_Change: market.kse100_change ?? (market.close_kse100 ?? 0) - (market.open_kse100 ?? 0),
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
      KSE100_Open: totalOpen,
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

    return {
      activeStocks,
      avgRangePct,
      gainers,
      losers,
      rangeLeaders,
      sectors,
      tableVolume,
      topVolumeShare,
      totalIssues,
      totalVolume,
      volumeLeaders,
    }
  }, [marketSummary.Volume_Traded, stats.gainers, stats.losers, stats.unchanged, stocks])

  const indexChangePct =
    marketSummary.KSE100_Open > 0 ? (marketSummary.KSE100_Change / marketSummary.KSE100_Open) * 100 : NaN
  const indexTone: MovementTone =
    marketSummary.KSE100_Change > 0 ? 'positive' : marketSummary.KSE100_Change < 0 ? 'negative' : 'neutral'
  const breadthTone: MovementTone = stats.gainers > stats.losers ? 'positive' : stats.gainers < stats.losers ? 'negative' : 'neutral'
  const breadthLabel = stats.gainers > stats.losers ? 'Advancers led' : stats.gainers < stats.losers ? 'Decliners led' : 'Balanced tape'
  const topVolumeStock = dayInsights.volumeLeaders[0]
  const widestRangeStock = dayInsights.rangeLeaders[0]

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
        <Stack spacing={{ xs: 6, md: 8 }}>

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
                    sx={{
                      fontSize: 11,
                      fontFamily: SERIF,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--wc-primary)',
                      mb: 1.5,
                    }}
                  >
                    Market Data
                  </Typography>
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
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: 'var(--wc-text-secondary)',
                      letterSpacing: '0.04em',
                      fontFamily: SERIF,
                      mb: 0.3,
                    }}
                  >
                    Pakistan Stock Exchange - daily closing data
                  </Typography>
                  {latestTradeDate && (
                    <Typography sx={{ fontSize: 11, color: 'var(--wc-primary)', fontFamily: NUMBER_FONT, fontWeight: 500 }}>
                      Latest: {latestTradeDate}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </MotionReveal>

          {/* ── Loading state ───────────────────────────────────────────── */}
          {status === 'loading' && (
            <MotionReveal>
              <Stack spacing={3}>
                <StatCardsSkeleton />
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
                      <Typography sx={{ fontSize: 11, fontFamily: NUMBER_FONT, color: 'var(--wc-error)', letterSpacing: '0.04em', mb: 0.4 }}>
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
            <>
              <MotionReveal>
                <CustomStatsCards
                  date={activeData.date}
                  kse100Open={marketSummary.KSE100_Open}
                  kse100Close={marketSummary.KSE100_Close}
                  kse100Change={marketSummary.KSE100_Change}
                  volumeTraded={marketSummary.Volume_Traded}
                  advances={stats.gainers}
                  declines={stats.losers}
                  unchanged={stats.unchanged}
                  monoFont={NUMBER_FONT}
                />
              </MotionReveal>

              <MotionReveal>
                <Stack spacing={2}>
                  {/* <SectionHeading
                    eyebrow="Session Brief"
                    title={`Market pulse for ${activeData.date}`}
                    meta={`${dayInsights.totalIssues.toLocaleString('en-PK')} issues tracked`}
                  /> */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                      gap: 1.5,
                    }}
                  >
                    <DailyMetricCard
                      icon={<ShowChartIcon sx={{ fontSize: 17, color: 'inherit' }} />}
                      label="KSE 100 Move"
                      value={formatSignedNumber(marketSummary.KSE100_Change)}
                      detail={`${formatPercent(indexChangePct)} on ${formatNumber(marketSummary.KSE100_Close)} close`}
                      tone={indexTone}
                    />
                    <DailyMetricCard
                      icon={
                        breadthTone === 'negative' ? (
                          <TrendingDownIcon sx={{ fontSize: 17, color: 'inherit' }} />
                        ) : (
                          <TrendingUpIcon sx={{ fontSize: 17, color: 'inherit' }} />
                        )
                      }
                      label="Market Breadth"
                      value={`${stats.gainers.toLocaleString('en-PK')}:${stats.losers.toLocaleString('en-PK')}`}
                      detail={`${breadthLabel}; ${stats.unchanged.toLocaleString('en-PK')} unchanged`}
                      tone={breadthTone}
                    />
                    <DailyMetricCard
                      icon={<BarChartIcon sx={{ fontSize: 17, color: 'inherit' }} />}
                      label="Active Symbols"
                      value={dayInsights.activeStocks.toLocaleString('en-PK')}
                      detail={`${stocks.length.toLocaleString('en-PK')} listed rows loaded for the day`}
                    />
                    <DailyMetricCard
                      icon={<BarChartIcon sx={{ fontSize: 17, color: 'inherit' }} />}
                      label="Total Volume"
                      value={formatCompactNumber(dayInsights.totalVolume)}
                      detail={`Top 5 leaders captured ${formatPercent(dayInsights.topVolumeShare, false)} of volume`}
                    />
                    <DailyMetricCard
                      icon={<ShowChartIcon sx={{ fontSize: 17, color: 'inherit' }} />}
                      label="Average Range"
                      value={formatPercent(dayInsights.avgRangePct, false)}
                      detail={
                        widestRangeStock
                          ? `${widestRangeStock.symbol} widest at ${formatPercent(widestRangeStock.intradayRangePct, false)}`
                          : 'High-low spreads were unavailable'
                      }
                    />
                    <DailyMetricCard
                      icon={<BarChartIcon sx={{ fontSize: 17, color: 'inherit' }} />}
                      label="Most Active"
                      value={topVolumeStock?.symbol ?? '-'}
                      detail={
                        topVolumeStock
                          ? `${formatCompactNumber(topVolumeStock.numericTurnover)} volume - last ${formatNumber(topVolumeStock.numericClose)}`
                          : 'No traded volume was available'
                      }
                    />
                  </Box>
                </Stack>
              </MotionReveal>

              <MotionReveal>
                <Stack spacing={2}>
                  <SectionHeading
                    eyebrow="Movers"
                    title="Top gainers, losers, and volume leaders"
                    // meta="Ranked by percentage move and traded volume"
                  />
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
                      gap: 1.5,
                    }}
                  >
                    <LeaderList
                      title="Top Gainers"
                      subtitle="Largest positive closes versus the prior close."
                      rows={dayInsights.gainers}
                      kind="gain"
                    />
                    <LeaderList
                      title="Top Losers"
                      subtitle="Largest negative closes versus the prior close."
                      rows={dayInsights.losers}
                      kind="loss"
                    />
                    <LeaderList
                      title="Volume Leaders"
                      subtitle="Highest traded turnover in the closing data."
                      rows={dayInsights.volumeLeaders}
                      kind="volume"
                    />
                  </Box>
                </Stack>
              </MotionReveal>

              <MotionReveal>
                <Stack spacing={2}>
                  <SectionHeading
                    eyebrow="Activity"
                    title="Where the day concentrated"
                    // meta={`Table volume ${formatCompactNumber(dayInsights.tableVolume)}`}
                  />
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
                      gap: 1.5,
                    }}
                  >
                    <SectorActivityPanel sectors={dayInsights.sectors} totalVolume={dayInsights.totalVolume} />
                    <RangeLeadersPanel rows={dayInsights.rangeLeaders} avgRangePct={dayInsights.avgRangePct} />
                  </Box>
                </Stack>
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
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                    <SectionHeading
                      eyebrow="Listings"
                      title={`${displayedStocks.length.toLocaleString('en-PK')} of ${stocks.length.toLocaleString('en-PK')} symbols`}
                      meta={search ? `Search: ${search}` : 'Sortable closing table'}
                    />
                  </Box>

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
            </>
          )}

        </Stack>
      </Container>
    </Box>
  )
}
