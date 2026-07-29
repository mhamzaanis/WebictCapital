import AddchartIcon from '@mui/icons-material/Addchart'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import SearchIcon from '@mui/icons-material/Search'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { downloadCsv } from '../../lib/csv'
import { fetchLatestMarketSummary } from '../../lib/api/market'
import type { MarketSummaryTickersResponse, MarketTickerDto } from '../../lib/api/types'
import { useAuth } from '../../context/AuthContext'
import { addToWatchlist } from '../../lib/stockService'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock, ErrorBlock } from '../markets/StateBlocks'
import { CARD_SX, DATA_FONT, changePctFromQuote, estimatedValue, fmtCompact, fmtNumber, fmtPct, fmtSigned, toneColor } from '../markets/marketUtils'

type SortKey = 'symbol' | 'companyName' | 'section' | 'close' | 'changePct' | 'turnover' | 'estimated'
type SortDir = 'asc' | 'desc'

type ExplorerRow = MarketTickerDto & {
  changePct: number | null
  estimated: number | null
}

function useLatestMarket() {
  const [data, setData] = useState<MarketSummaryTickersResponse | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetchLatestMarketSummary(controller.signal)
      .then(setData)
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return { data, error, loading }
}

function compare(a: ExplorerRow, b: ExplorerRow, key: SortKey) {
  const av = key === 'estimated' ? a.estimated : a[key]
  const bv = key === 'estimated' ? b.estimated : b[key]
  if (typeof av === 'number' || typeof bv === 'number' || av == null || bv == null) {
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    return Number(av) - Number(bv)
  }
  return String(av).localeCompare(String(bv))
}

export function StocksExplorerPage() {
  const { user } = useAuth()
  const { data, error, loading } = useLatestMarket()
  const [params, setParams] = useSearchParams()
  const [watchMessage, setWatchMessage] = useState<string | null>(null)

  const query = params.get('q') ?? ''
  const sector = params.get('sector') ?? 'all'
  const movement = params.get('move') ?? 'all'
  const sort = (params.get('sort') as SortKey | null) ?? 'symbol'
  const dir = (params.get('dir') as SortDir | null) ?? 'asc'

  const rows = useMemo<ExplorerRow[]>(() => (data?.tickers ?? []).map((ticker) => ({
    ...ticker,
    changePct: changePctFromQuote(ticker),
    estimated: estimatedValue(ticker),
  })), [data])

  const sectors = useMemo(() => Array.from(new Set(rows.map((row) => row.section).filter((value): value is string => Boolean(value)))).sort(), [rows])

  const filtered = useMemo(() => {
    const needle = query.trim().toUpperCase()
    return rows
      .filter((row) => !needle || row.symbol.includes(needle) || (row.companyName ?? '').toUpperCase().includes(needle))
      .filter((row) => sector === 'all' || row.section === sector)
      .filter((row) => {
        if (movement === 'gainers') return row.changePct != null && row.changePct > 0
        if (movement === 'losers') return row.changePct != null && row.changePct < 0
        if (movement === 'unchanged') return row.change === 0
        if (movement === 'liquid') return row.turnover != null && row.turnover > 100_000
        return true
      })
      .sort((a, b) => dir === 'asc' ? compare(a, b, sort) : -compare(a, b, sort))
  }, [dir, movement, query, rows, sector, sort])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all' || (key === 'sort' && value === 'symbol') || (key === 'dir' && value === 'asc')) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  function handleSort(key: SortKey) {
    if (sort === key) updateParam('dir', dir === 'asc' ? 'desc' : 'asc')
    else {
      const next = new URLSearchParams(params)
      next.set('sort', key)
      next.delete('dir')
      setParams(next, { replace: true })
    }
  }

  function exportRows() {
    downloadCsv(
      `psx-stocks-${data?.tradeDate ?? 'latest'}.csv`,
      ['Symbol', 'Company', 'Section', 'Close', 'Change', 'Change %', 'Open', 'High', 'Low', 'Shares traded', 'Estimated traded value'],
      filtered.map((row) => [row.symbol, row.companyName, row.section, row.close, row.change, row.changePct, row.open, row.high, row.low, row.turnover, row.estimated]),
    )
  }

  async function watch(symbol: string) {
    if (!user) {
      setWatchMessage('Sign in with Google to use watchlists. Supabase RLS must protect watchlist rows.')
      return
    }
    await addToWatchlist(symbol)
    setWatchMessage(`${symbol} added to watchlist.`)
  }

  if (loading)
    return (
      <MarketShell title="Stocks Explorer">
        <ExplorerPageSkeleton />
      </MarketShell>
    )
  if (error) return <MarketShell title="Stocks Explorer"><ErrorBlock error={error} /></MarketShell>
  if (!data) return <MarketShell title="Stocks Explorer"><EmptyBlock title="No stock listing" detail="The latest market API response was empty." /></MarketShell>

  return (
    <MarketShell
      title="Stocks Explorer"
    // subtitle={`Latest trade date ${data.tradeDate}. Unsupported fields such as market cap, latest RSI, and SMA relationship are omitted from this listing until the API exposes them here.`}
    >
      <Stack spacing={2.4}>
        <Box sx={{ ...CARD_SX, p: 2.4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(260px,1fr) 220px 180px auto' }, gap: 1.5, alignItems: 'center' }}>
            <TextField
              value={query}
              onChange={(event) => updateParam('q', event.target.value)}
              placeholder="Search symbol or company"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
            />
            <FormControl>
              <InputLabel>Section</InputLabel>
              <Select label="Section" value={sector} onChange={(event) => updateParam('sector', event.target.value)}>
                <MenuItem value="all">All sections</MenuItem>
                {sectors.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Movement</InputLabel>
              <Select label="Movement" value={movement} onChange={(event) => updateParam('move', event.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="gainers">Gainers</MenuItem>
                <MenuItem value="losers">Losers</MenuItem>
                <MenuItem value="unchanged">Unchanged</MenuItem>
                <MenuItem value="liquid">Liquid</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportRows} sx={{ height: 44, border: '1px solid var(--wc-border)', color: 'var(--wc-text-primary)' }}>
              CSV
            </Button>
          </Box>
          {watchMessage && <Typography sx={{ mt: 1.4, color: 'var(--wc-text-secondary)', fontSize: 12.5 }}>{watchMessage}</Typography>}
        </Box>

        <Box sx={{ ...CARD_SX, overflow: 'hidden' }}>
          {/* <Box sx={{ p: 2, borderBottom: '1px solid var(--wc-border)' }}>
            <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>{filtered.length.toLocaleString('en-PK')} observations</Typography>
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>Turnover is share quantity. Estimated traded value is close multiplied by shares traded when both are valid.</Typography>
          </Box> */}
          {filtered.length === 0 ? <EmptyBlock title="No matches" detail="Adjust search or filters to see observations." /> : (
            <TableContainer sx={{ maxHeight: 720, overflowX: 'auto' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1120 }}>
                <TableHead>
                  <TableRow>
                    <Head id="symbol" sort={sort} dir={dir} onSort={handleSort} label="Symbol" align="left" />
                    <Head id="companyName" sort={sort} dir={dir} onSort={handleSort} label="Company" align="left" />
                    <Head id="section" sort={sort} dir={dir} onSort={handleSort} label="Section" align="left" />
                    <Head id="close" sort={sort} dir={dir} onSort={handleSort} label="Close" />
                    <Head id="changePct" sort={sort} dir={dir} onSort={handleSort} label="Change" />
                    <Head id="turnover" sort={sort} dir={dir} onSort={handleSort} label="Shares traded" />
                    <Head id="estimated" sort={sort} dir={dir} onSort={handleSort} label="Est. value" />
                    <TableCell sx={headSx}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.symbol} hover>
                      <TableCell><Button component={Link} to={`/stocks/${row.symbol}`} sx={{ p: 0, fontWeight: 900 }}>{row.symbol}</Button></TableCell>
                      <TableCell sx={{ maxWidth: 260 }}><Typography noWrap sx={{ fontSize: 12.5 }}>{row.companyName ?? row.symbol}</Typography></TableCell>
                      <TableCell sx={{ maxWidth: 260 }}><Typography noWrap sx={{ fontSize: 12.5, color: 'var(--wc-text-secondary)' }}>{row.section ?? '-'}</Typography></TableCell>
                      <Num>{fmtNumber(row.close)}</Num>
                      <TableCell align="right"><Typography sx={{ color: toneColor(row.change), fontFamily: DATA_FONT, fontWeight: 800 }}>{fmtSigned(row.change)} ({fmtPct(row.changePct)})</Typography></TableCell>
                      <Num>{fmtCompact(row.turnover)}</Num>
                      <Num>{fmtCompact(row.estimated)}</Num>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Button component={Link} to={`/stocks/${row.symbol}`} aria-label={`Open ${row.symbol}`}><VisibilityIcon fontSize="small" /></Button>
                          <Button component={Link} to={`/data/compare?a=${row.symbol}&b=HBL`} aria-label={`Compare ${row.symbol}`}><AddchartIcon fontSize="small" /></Button>
                          <Button onClick={() => void watch(row.symbol)} aria-label={`Watch ${row.symbol}`}><StarBorderIcon fontSize="small" /></Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Stack>
    </MarketShell>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function ExplorerPageSkeleton() {
  const COL_WIDTHS = [70, 200, 140, 80, 100, 90, 90, 90]
  return (
    <Stack spacing={2.4}>
      {/* Filter bar */}
      <Box sx={{ ...CARD_SX, p: 2.4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(260px,1fr) 220px 180px auto' }, gap: 1.5 }}>
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} width={72} />
        </Box>
      </Box>

      {/* Table */}
      <Box sx={{ ...CARD_SX, overflow: 'hidden' }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', gap: 1, px: 1.5, py: 1.2, borderBottom: '1px solid var(--wc-border)', bgcolor: 'var(--wc-surface-soft)' }}>
          {COL_WIDTHS.map((w, i) => (
            <Skeleton key={i} variant="text" width={w} height={14} />
          ))}
        </Box>
        {/* Data rows */}
        {Array.from({ length: 15 }).map((_, rowIdx) => (
          <Box
            key={rowIdx}
            sx={{
              display: 'flex',
              gap: 1,
              px: 1.5,
              py: 1.1,
              borderBottom: '1px solid var(--wc-divider-soft)',
              alignItems: 'center',
            }}
          >
            {COL_WIDTHS.map((w, i) => (
              <Skeleton key={i} variant="text" width={w * (0.6 + Math.random() * 0.5)} height={13} />
            ))}
          </Box>
        ))}
      </Box>
    </Stack>
  )
}

const headSx = {
  bgcolor: 'var(--wc-surface-soft)',
  color: 'var(--wc-text-muted)',
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
} as const

function Head({ id, label, sort, dir, onSort, align = 'right' }: { id: SortKey; label: string; sort: SortKey; dir: SortDir; onSort: (key: SortKey) => void; align?: 'left' | 'right' }) {
  return (
    <TableCell align={align} sx={headSx}>
      <TableSortLabel active={sort === id} direction={sort === id ? dir : 'asc'} onClick={() => onSort(id)}>{label}</TableSortLabel>
    </TableCell>
  )
}

function Num({ children }: { children: React.ReactNode }) {
  return <TableCell align="right" sx={{ fontFamily: DATA_FONT, fontWeight: 750 }}>{children}</TableCell>
}
