import {
  Alert,
  Box,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { useEffect, useMemo, useState } from 'react'
import { PriceTableSkeleton, StatCardsSkeleton } from './CustomSkeleton'
import { CustomDataTable } from './CustomDataTable'
import { CustomStatsCards } from './CustomStatsCards'

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

type DbStockRow = {
  symbol: string
  company: string
  section: string | null
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  turnover: number | null
  change: number | null
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

type MovementFilter = 'all' | 'gainers' | 'losers' | 'unchanged'

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

function mapDbStockToPsxStock(stock: DbStockRow): PsxStock {
  return {
    symbol: stock.symbol,
    company: stock.company,
    section: stock.section,
    industry: stock.section,
    turnover: stock.turnover,
    open: stock.open,
    high: stock.high,
    low: stock.low,
    last_rate: stock.close,
    change: stock.change,
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
      .from('datatable')
      .select('symbol,company,section,open,high,low,close,turnover,change')
      .eq('trade_date', tradeDate)
      .order('symbol', { ascending: true }),
  ])

  if (summaryResult.error) throw summaryResult.error
  if (stocksResult.error) throw stocksResult.error

  const rows = ((stocksResult.data ?? []) as DbStockRow[]).map(mapDbStockToPsxStock)

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

const MONO = '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace'

const filterFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#ffffff',
    color: '#0d1c30',
    fontFamily: MONO,
    fontSize: 12,
    borderRadius: 1,
    '& fieldset': { borderColor: '#dde7f4' },
    '&:hover fieldset': { borderColor: '#0a2463' },
    '&.Mui-focused fieldset': { borderColor: '#0a2463', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0a2463' },
  '& input::placeholder': { color: '#8097b0', opacity: 1 },
}

// -- Component ----------------------------------------------------------------

export function DataPage() {
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

  const FiltersBar = ({ disabled }: { disabled: boolean }) => (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
      <TextField
        placeholder="Search symbol or company…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8097b0', fontSize: 15 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: { xs: '100%', md: '50%' }, ...filterFieldSx }}
      />

      <TextField
        select
        size="small"
        label="Movement"
        value={movementFilter}
        onChange={(e) => setMovementFilter(e.target.value as MovementFilter)}
        disabled={disabled}
        slotProps={{ select: { native: true } }}
        sx={{ width: { xs: '100%', md: '25%' }, ...filterFieldSx }}
      >
        <option value="all">All</option>
        <option value="gainers">Gainers</option>
        <option value="losers">Losers</option>
        <option value="unchanged">Unchanged</option>
      </TextField>

      <TextField
        select
        size="small"
        label="Industry"
        value={industryFilter}
        onChange={(e) => setIndustryFilter(e.target.value)}
        disabled={disabled}
        slotProps={{ select: { native: true } }}
        sx={{ width: { xs: '100%', md: '25%' }, ...filterFieldSx }}
      >
        <option value="all">All Industries</option>
        {industryOptions.map((industry) => (
          <option key={industry} value={industry}>
            {industry}
          </option>
        ))}
      </TextField>
    </Stack>
  )

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 14 },
        bgcolor: '#ffffff',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1400px !important', px: { xs: 2, md: 4 } }}>
        <Stack spacing={4}>
          {/* -- Header -- */}
          <Box>
            <Box sx={{ maxWidth: 80 }} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { md: 'flex-end' },
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontFamily: '"Playfair Display", serif',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#0a2463',
                    mb: 1,
                  }}
                >
                  Market Data
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '1.6rem', md: '2.2rem' },
                    fontWeight: 700,
                    color: '#080e1a',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.1,
                  }}
                >
                  PSX Closing Rates
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: 11,
                  color: '#8097b0',
                  letterSpacing: '0.04em',
                  pb: { md: 0.5 },
                }}
              >
                Pakistan Stock Exchange · daily closing data · latest trading day
              </Typography>
            </Box>
            {latestTradeDate && (
              <Typography sx={{ fontSize: 11, color: '#8097b0', mt: 1 }}>
                Latest entry: {latestTradeDate}
              </Typography>
            )}
          </Box>

          {/* -- Loading state -- */}
          {status === 'loading' && (
            <>
              <StatCardsSkeleton />
              <FiltersBar disabled />
              <PriceTableSkeleton />
            </>
          )}

          {/* -- Error state -- */}
          {status === 'error' && (
            <Alert
              severity="error"
              sx={{
                bgcolor: '#fff8f8',
                border: '1px solid #f0d0d0',
                color: '#7a2424',
                fontSize: 12,
                borderRadius: 1,
              }}
            >
              Could not load latest entry from Supabase. Please verify DB access and env vars.
              <br />
              Expected: <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>
              {fetchError && (
                <>
                  <br />
                  Error: <code>{fetchError}</code>
                  <br />
                  If RLS is enabled, add <code>SELECT</code> policies for the <code>anon</code> role on{' '}
                  <code>market_daily_summary</code> and <code>datatable</code>.
                </>
              )}
            </Alert>
          )}

          {/* -- Data state -- */}
          {status === 'ok' && activeData && (
            <>
              <CustomStatsCards
                date={activeData.date}
                kse100Open={marketSummary.KSE100_Open}
                kse100Close={marketSummary.KSE100_Close}
                kse100Change={marketSummary.KSE100_Change}
                volumeTraded={marketSummary.Volume_Traded}
                advances={stats.gainers}
                declines={stats.losers}
                unchanged={stats.unchanged}
                monoFont={MONO}
              />

              <FiltersBar disabled={false} />

              {search && (
                <Typography sx={{ fontSize: 11, color: '#8097b0' }}>
                  {displayedStocks.length} of {stocks.length} symbols
                </Typography>
              )}

              <CustomDataTable rows={displayedStocks} searchQuery={search} monoFont={MONO} />
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
