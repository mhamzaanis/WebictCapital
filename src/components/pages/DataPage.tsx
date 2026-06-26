import {
  Box,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { useEffect, useMemo, useState } from 'react'
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

// Replace mapDbStockToPsxStock:
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
      .from('v_stock_table')                          // ← single source now
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

      console.log('market_daily_summary latest trade_date result:', latestDateResult)

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
  const stocks = activeData?.stocks ?? []

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
                      letterSpacing: '-0.03em',
                      lineHeight: 1.08,
                    }}
                  >
                    PSX Closing{' '}
                    <Box component="span" sx={{ color: 'var(--wc-primary)' }}>
                      Rates
                    </Box>
                    .
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
                    Pakistan Stock Exchange · daily closing data
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
                    letterSpacing: '-0.01em',
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
                  {/* <Typography sx={{ fontSize: 10, fontFamily: NUMBER_FONT, color: 'var(--wc-text-secondary)', letterSpacing: '0.04em', mb: 0.6 }}>
                    REQUIRED ENV VARIABLES
                  </Typography> */}
                  {/* <Typography sx={{ fontSize: 12, fontFamily: NUMBER_FONT, color: 'var(--wc-text-primary)', lineHeight: 1.8 }}> */}
                    {/* <code>VITE_SUPABASE_URL</code> */}
                    {/* <br /> */}
                    {/* <code>VITE_SUPABASE_ANON_KEY</code> */}
                  {/* </Typography> */}
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
                    <Box>
                      {/* <Typography
                        sx={{
                          fontSize: 11,
                          fontFamily: SERIF,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--wc-primary)',
                          mb: 0.8,
                        }}
                      >
                        All Listings
                      </Typography> */}
                      {/* <Typography sx={{ fontSize: { xs: 14, md: 16 }, fontWeight: 700, color: 'var(--wc-text-primary)', fontFamily: SERIF }}>
                        {stocks.length.toLocaleString()} symbols on the exchange.
                      </Typography> */}
                    </Box>
                    {/* {search && (
                      <Typography sx={{ fontSize: 11, color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT }}>
                        Showing {displayedStocks.length} of {stocks.length}
                      </Typography>
                    )} */}
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
