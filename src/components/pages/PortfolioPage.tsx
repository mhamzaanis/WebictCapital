import AddRoundedIcon from '@mui/icons-material/AddRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { Box, Container, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { useState, useMemo, memo } from 'react'
import ReactECharts from 'echarts-for-react'
import { MotionReveal } from '../animations/MotionReveal'
import { CustomButton } from '../CustomButton'
import { StockDrawer, type StockDetail } from '../StockDrawer'
import { MarketSummaryModal } from '../MarketSummaryModal'
import { HoldingModal, type Holding } from '../HoldingModal'
import { WatchlistModal, type WatchItem } from '../WatchlistModal'
import { hasStockService, fetchStockDetail, addToWatchlist as addToWatchlistDb } from '../../lib/stockService'

// ─── Types ─────────────────────────────────────────────────────────────────────

type HistoryEvent = {
  symbol: string
  type: 'profit' | 'dividend' | 'loss'
  message: string
  profit: number
  profitPct: number
  date: string
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const initialHoldings: Holding[] = [
  { symbol: 'HBL', company: 'Habib Bank Ltd', sector: 'Banking', shares: 408_011, price: 117.03, avgCost: 119.58, marketValue: 47_749_417, todayPL: 1_394, todayPLPct: 0.35, totalPL: -10_109, totalPLPct: -2.48, buyLots: [{ id: 'hbl-1', shares: 200_000, price: 120.5 }, { id: 'hbl-2', shares: 208_011, price: 118.7 }] },
  { symbol: 'NESTLE', company: 'Nestlé Pakistan', sector: 'Consumer', shares: 5_300, price: 5_725.49, avgCost: 5_300.0, marketValue: 30_345_097, todayPL: 425_490, todayPLPct: 8.03, totalPL: 425_490, totalPLPct: 8.03, buyLots: [{ id: 'nest-1', shares: 5_300, price: 5_300 }] },
  { symbol: 'TRG', company: 'TRG Pakistan', sector: 'Technology', shares: 26_040, price: 130.2, avgCost: 143.8, marketValue: 3_390_408, todayPL: -23_760, todayPLPct: -9.12, totalPL: -23_760, totalPLPct: -9.12, buyLots: [{ id: 'trg-1', shares: 15_000, price: 145.0 }, { id: 'trg-2', shares: 11_040, price: 142.2 }] },
  { symbol: 'MARI', company: 'Mari Petroleum', sector: 'Energy', shares: 12_000, price: 445.75, avgCost: 430.5, marketValue: 5_349_000, todayPL: 48_000, todayPLPct: 0.91, totalPL: 182_400, totalPLPct: 3.53, buyLots: [{ id: 'mari-1', shares: 12_000, price: 430.5 }] },
  { symbol: 'SYS', company: 'Systems Ltd', sector: 'Technology', shares: 18_500, price: 312.6, avgCost: 304.2, marketValue: 5_783_100, todayPL: -12_950, todayPLPct: -0.22, totalPL: 156_200, totalPLPct: 2.78, buyLots: [{ id: 'sys-1', shares: 10_000, price: 300.0 }, { id: 'sys-2', shares: 8_500, price: 309.1 }] },
]

const historyEvents: HistoryEvent[] = [
  { symbol: 'KEL', type: 'profit', message: 'Total profit realised on full exit', profit: 147_100, profitPct: 437.02, date: '28 Dec' },
  { symbol: 'HBL', type: 'profit', message: 'Partial sell — profit realised', profit: 23_649, profitPct: 10.22, date: '21 Dec' },
  { symbol: 'EFERT', type: 'dividend', message: 'Dividend received', profit: 42_500, profitPct: 3.8, date: '15 Dec' },
  { symbol: 'TRG', type: 'loss', message: 'Stop-loss triggered', profit: -11_240, profitPct: -4.3, date: '10 Dec' },
]

const initialWatchlist: WatchItem[] = [
  { symbol: 'OGDC', company: 'Oil & Gas Dev. Co.', price: 158.4, change: 2.3, changePct: 1.47, volume: '4.2M', spark: [14, 15, 13, 16, 12, 11, 10, 9, 11, 10, 9, 8] },
  { symbol: 'ENGRO', company: 'Engro Corporation', price: 286.0, change: -4.1, changePct: -1.41, volume: '1.8M', spark: [9, 10, 11, 13, 15, 17, 18, 20, 21, 22, 20, 21] },
  { symbol: 'LUCK', company: 'Lucky Cement', price: 1_024.5, change: 8.7, changePct: 0.86, volume: '890K', spark: [20, 18, 17, 16, 15, 14, 12, 10, 9, 8, 7, 6] },
  { symbol: 'PSO', company: 'Pakistan State Oil', price: 312.9, change: -3.6, changePct: -1.14, volume: '3.1M', spark: [8, 10, 11, 13, 14, 17, 19, 20, 21, 22, 21, 23] },
  { symbol: 'MCB', company: 'MCB Bank Ltd', price: 198.6, change: 1.2, changePct: 0.61, volume: '2.4M', spark: [10, 11, 12, 10, 13, 14, 15, 14, 16, 17, 16, 18] },
]

const watchDetails: Record<string, StockDetail> = {
  OGDC: { symbol: 'OGDC', company: 'Oil & Gas Development Co.', sector: 'Energy', industry: 'Oil & Gas Exploration', price: 158.4, change: 2.3, changePct: 1.47, volume: '4.2M', avgVolume: '3.8M', sharesOutstanding: '4.3B', open: 156.1, previousClose: 156.1, dayLow: 155.2, dayHigh: 159.8, week52Low: 112.5, week52High: 178.9, week52ChangePct: 28.4, eps: 28.45, pe: 5.57, marketCap: 'Rs. 681B', dividendYield: 8.2, beta: 0.72, roe: 24.3, debtToEquity: 0.18, priceToBook: 1.12, spark: [14, 15, 13, 16, 12, 11, 10, 9, 11, 10, 9, 8], history30: [148, 150, 152, 149, 151, 153, 155, 154, 156, 158, 157, 159, 160, 158, 156, 155, 153, 154, 156, 157, 159, 158, 160, 159, 157, 158, 156, 155, 157, 158.4], historyLabels: ['1 Apr', '2 Apr', '3 Apr', '4 Apr', '5 Apr', '8 Apr', '9 Apr', '10 Apr', '11 Apr', '12 Apr', '15 Apr', '16 Apr', '17 Apr', '18 Apr', '19 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '29 Apr', '30 Apr', '1 May', '2 May', '3 May', '6 May', '7 May', '8 May', '9 May', '10 May'] },
  ENGRO: { symbol: 'ENGRO', company: 'Engro Corporation', sector: 'Conglomerate', industry: 'Diversified Holdings', price: 286.0, change: -4.1, changePct: -1.41, volume: '1.8M', avgVolume: '2.1M', sharesOutstanding: '1.14B', open: 290.1, previousClose: 290.1, dayLow: 284.5, dayHigh: 292.0, week52Low: 241.0, week52High: 345.5, week52ChangePct: -8.2, eps: 42.18, pe: 6.78, marketCap: 'Rs. 327B', dividendYield: 5.8, beta: 0.89, roe: 18.6, debtToEquity: 0.62, priceToBook: 1.45, spark: [9, 10, 11, 13, 15, 17, 18, 20, 21, 22, 20, 21], history30: [280, 282, 279, 283, 285, 288, 290, 292, 289, 291, 294, 293, 295, 292, 290, 288, 286, 287, 289, 291, 290, 288, 287, 285, 284, 286, 288, 287, 285, 286], historyLabels: ['1 Apr', '2 Apr', '3 Apr', '4 Apr', '5 Apr', '8 Apr', '9 Apr', '10 Apr', '11 Apr', '12 Apr', '15 Apr', '16 Apr', '17 Apr', '18 Apr', '19 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '29 Apr', '30 Apr', '1 May', '2 May', '3 May', '6 May', '7 May', '8 May', '9 May', '10 May'] },
  LUCK: { symbol: 'LUCK', company: 'Lucky Cement', sector: 'Cement', industry: 'Construction Materials', price: 1024.5, change: 8.7, changePct: 0.86, volume: '890K', avgVolume: '1.1M', sharesOutstanding: '294M', open: 1015.8, previousClose: 1015.8, dayLow: 1010.2, dayHigh: 1030.0, week52Low: 785.0, week52High: 1180.5, week52ChangePct: 12.6, eps: 156.2, pe: 6.56, marketCap: 'Rs. 302B', dividendYield: 3.4, beta: 1.12, roe: 16.8, debtToEquity: 0.41, priceToBook: 1.28, spark: [20, 18, 17, 16, 15, 14, 12, 10, 9, 8, 7, 6], history30: [980, 985, 990, 988, 995, 1000, 1005, 1010, 1008, 1012, 1018, 1020, 1015, 1022, 1025, 1020, 1018, 1015, 1020, 1022, 1025, 1028, 1030, 1026, 1022, 1020, 1024, 1022, 1025, 1024.5], historyLabels: ['1 Apr', '2 Apr', '3 Apr', '4 Apr', '5 Apr', '8 Apr', '9 Apr', '10 Apr', '11 Apr', '12 Apr', '15 Apr', '16 Apr', '17 Apr', '18 Apr', '19 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '29 Apr', '30 Apr', '1 May', '2 May', '3 May', '6 May', '7 May', '8 May', '9 May', '10 May'] },
  PSO: { symbol: 'PSO', company: 'Pakistan State Oil', sector: 'Energy', industry: 'Oil & Gas Marketing', price: 312.9, change: -3.6, changePct: -1.14, volume: '3.1M', avgVolume: '2.7M', sharesOutstanding: '470M', open: 316.5, previousClose: 316.5, dayLow: 310.8, dayHigh: 318.2, week52Low: 248.0, week52High: 420.0, week52ChangePct: -5.8, eps: 58.73, pe: 5.33, marketCap: 'Rs. 147B', dividendYield: 7.5, beta: 0.95, roe: 22.1, debtToEquity: 0.85, priceToBook: 0.94, spark: [8, 10, 11, 13, 14, 17, 19, 20, 21, 22, 21, 23], history30: [305, 308, 310, 307, 312, 315, 318, 316, 320, 322, 319, 317, 315, 318, 320, 322, 319, 316, 314, 317, 319, 321, 318, 315, 313, 315, 318, 316, 314, 312.9], historyLabels: ['1 Apr', '2 Apr', '3 Apr', '4 Apr', '5 Apr', '8 Apr', '9 Apr', '10 Apr', '11 Apr', '12 Apr', '15 Apr', '16 Apr', '17 Apr', '18 Apr', '19 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '29 Apr', '30 Apr', '1 May', '2 May', '3 May', '6 May', '7 May', '8 May', '9 May', '10 May'] },
  MCB: { symbol: 'MCB', company: 'MCB Bank Ltd', sector: 'Banking', industry: 'Commercial Banks', price: 198.6, change: 1.2, changePct: 0.61, volume: '2.4M', avgVolume: '2.2M', sharesOutstanding: '1.18B', open: 197.4, previousClose: 197.4, dayLow: 196.5, dayHigh: 200.2, week52Low: 162.0, week52High: 235.0, week52ChangePct: 3.1, eps: 35.82, pe: 5.54, marketCap: 'Rs. 235B', dividendYield: 9.1, beta: 0.68, roe: 20.4, debtToEquity: 0.08, priceToBook: 1.05, spark: [10, 11, 12, 10, 13, 14, 15, 14, 16, 17, 16, 18], history30: [190, 192, 191, 193, 195, 194, 196, 198, 197, 199, 200, 198, 197, 196, 195, 194, 196, 198, 199, 197, 198, 200, 199, 197, 196, 198, 199, 197, 198, 198.6], historyLabels: ['1 Apr', '2 Apr', '3 Apr', '4 Apr', '5 Apr', '8 Apr', '9 Apr', '10 Apr', '11 Apr', '12 Apr', '15 Apr', '16 Apr', '17 Apr', '18 Apr', '19 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '29 Apr', '30 Apr', '1 May', '2 May', '3 May', '6 May', '7 May', '8 May', '9 May', '10 May'] },
}

type MarketHistory = Record<'1W' | '1M' | 'YTD' | '1Y', { labels: string[]; values: number[] }>

const buildTradingDates = (endDate: string, count: number) => {
  const dates: Date[] = []
  const cursor = new Date(endDate)
  while (dates.length < count) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return dates.reverse()
}

const formatShortDate = (d: Date) =>
  d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })

const buildTradingSeries = (endDate: string, count: number, startValue: number, endValue: number) => {
  const dates = buildTradingDates(endDate, count)
  const values = dates.map((_, i) => {
    const t = count > 1 ? i / (count - 1) : 1
    const trend = startValue + (endValue - startValue) * t
    const wiggle = Math.sin(i * 0.7) * (startValue * 0.002) + Math.cos(i * 0.33) * (startValue * 0.0016)
    return Math.max(1, trend + wiggle)
  })
  return {
    labels: dates.map(formatShortDate),
    values,
  }
}

const buildMarketHistory = (tradeDate: string, closeValue: number): MarketHistory => {
  return {
    '1W': buildTradingSeries(tradeDate, 7, 167_210, closeValue),
    '1M': buildTradingSeries(tradeDate, 22, 168_420, closeValue),
    'YTD': buildTradingSeries(tradeDate, 90, 163_540, closeValue),
    '1Y': buildTradingSeries(tradeDate, 252, 155_820, closeValue),
  }
}

const marketSummary = {
  tradeDate: '2026-04-30',
  kse100_prev: 165_823.88,
  kse100_close: 162_994.17,
  kse100_change: -2_829.71,
  kse30_prev: 74_980.25,
  kse30_close: 73_220.19,
  kse30_change: -1_760.06,
  prev_volume: 912_550_000,
  curr_volume: 837_371_894,
  advances: 101,
  declines: 348,
  unchanged: 36,
  flu_no: 'KSE-2026-04-30',
  history: buildMarketHistory('2026-04-30', 162_994.17),
}

const portfolioTrend = [92_680_000, 92_340_000, 91_950_000, 92_120_000, 92_450_000, 92_800_000, 93_150_000, 92_900_000, 92_700_000, 92_300_000, 92_500_000, 92_650_000]

// ─── Design tokens — CSS variables only (matches DataPage) ────────────────────

const NUMBER_FONT = 'var(--wc-number-font)'
const SERIF = '"Playfair Display", serif'

// ─── Formatters ────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString('en-PK')
const fmtPkr = (v: number) => `${v < 0 ? '-' : ''}Rs. ${fmt(Math.round(Math.abs(v)))}`
const fmtPkrSigned = (v: number) => `${v >= 0 ? '+' : '-'}Rs. ${fmt(Math.round(Math.abs(v)))}`
const fmtCompact = (v: number) => {
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toString()
}

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Matches DataPage's section eyebrow */
function SecLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </Typography>
  )
}

/** Sector / industry pill — same as DataPage tag style */
function SectorTag({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="span"
      sx={{
        display: 'inline-block',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--wc-primary)',
        fontFamily: NUMBER_FONT,
        px: 0.6,
        py: 0.2,
        borderRadius: '3px',
        bgcolor: 'rgba(10,36,99,0.06)',
        border: '1px solid rgba(10,36,99,0.15)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </Typography>
  )
}

/** Card shell — same border/radius/hover as DataPage cards */
function Card({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        border: '1px solid var(--wc-divider)',
        borderRadius: 1.5,
        bgcolor: 'var(--wc-paper)',
        p: { xs: 2.4, md: 3.2 },
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'var(--wc-primary)',
          boxShadow: '0 4px 24px rgba(10,36,99,0.07)',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

/** Stat tile — matches CustomStatsCards visual language */
function StatTile({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  const valueColor =
    positive === undefined
      ? 'var(--wc-text-primary)'
      : positive
        ? 'var(--wc-success)'
        : 'var(--wc-error)'

  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid var(--wc-divider)',
        borderRadius: 1,
        bgcolor: 'var(--wc-surface)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'var(--wc-primary)',
          boxShadow: '0 4px 24px rgba(10,36,99,0.07)',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--wc-text-secondary)',
          textTransform: 'uppercase',
          fontFamily: SERIF,
          mb: 0.6,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: NUMBER_FONT,
          fontSize: 15,
          fontWeight: 700,
          color: valueColor,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 10.5, color: 'var(--wc-text-secondary)', fontFamily: SERIF, mt: 0.4 }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

/** Inline P/L change badge */
function PLBadge({ value, pct }: { value: number; pct: number }) {
  const positive = value >= 0
  const Icon = positive ? TrendingUpIcon : TrendingDownIcon
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3 }}>
      <Icon sx={{ fontSize: 10, color: positive ? 'var(--wc-success)' : 'var(--wc-error)' }} />
      <Typography
        sx={{
          fontFamily: NUMBER_FONT,
          fontSize: 10,
          fontWeight: 600,
          color: positive ? 'var(--wc-success)' : 'var(--wc-error)',
        }}
      >
        {positive ? '+' : ''}{Math.abs(pct).toFixed(2)}%
      </Typography>
    </Box>
  )
}

// ─── Holding Row ──────────────────────────────────────────────────────────────

function HoldingRow({ h, index, onEdit, onDelete }: { h: Holding; index: number; onEdit: (symbol: string) => void; onDelete: (symbol: string) => void }) {
  const reduce = useReducedMotion()
  const [hov, setHov] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const posToday = h.todayPL >= 0
  const posTotal = h.totalPL >= 0

  const menuOpen = Boolean(menuAnchor)
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
  }
  const handleMenuClose = () => setMenuAnchor(null)
  const handleEdit = () => {
    onEdit(h.symbol)
    handleMenuClose()
  }
  const handleDelete = () => {
    onDelete(h.symbol)
    handleMenuClose()
  }

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      sx={{
        py: 1.4,
        px: 1.2,
        mx: -1.2,
        borderRadius: '8px',
        bgcolor: hov ? 'rgba(10,36,99,0.03)' : 'transparent',
        transition: 'background-color 0.18s ease',
        cursor: 'default',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
        {/* Symbol avatar */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: hov ? 'rgba(10,36,99,0.07)' : 'var(--wc-surface)',
            border: `1px solid ${hov ? 'rgba(10,36,99,0.22)' : 'var(--wc-divider)'}`,
            transition: 'all 0.18s ease',
          }}
        >
          <Typography
            sx={{
              fontFamily: NUMBER_FONT,
              fontSize: h.symbol.length > 4 ? 9 : 11,
              fontWeight: 700,
              color: hov ? 'var(--wc-primary)' : 'var(--wc-text-secondary)',
              letterSpacing: '0.02em',
            }}
          >
            {h.symbol.length <= 4 ? h.symbol : h.symbol.slice(0, 4)}
          </Typography>
        </Box>

        {/* Name + sector */}
        <Box sx={{ minWidth: 0, flex: { xs: '0 0 90px', sm: '0 0 134px' } }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--wc-text-primary)',
              fontFamily: SERIF,
              lineHeight: 1.2,
            }}
          >
            {h.symbol}
          </Typography>
          <Typography
            sx={{
              fontSize: 10.5,
              color: 'var(--wc-text-secondary)',
              mt: 0.2,
              fontFamily: SERIF,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {h.company}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <SectorTag>{h.sector}</SectorTag>
          </Box>
        </Box>

        {/* Price + shares (desktop) */}
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 13, fontWeight: 700, color: 'var(--wc-text-primary)' }}>
            Rs.&nbsp;{h.price.toFixed(2)}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'var(--wc-text-secondary)', mt: 0.2, fontFamily: NUMBER_FONT }}>
            {fmt(h.shares)} sh · avg {h.avgCost.toFixed(2)}
          </Typography>
        </Box>

        {/* Market Value (tablet+) */}
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, minWidth: 72, flexShrink: 0 }}>
          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 12, fontWeight: 700, color: 'var(--wc-text-primary)' }}>
            {fmtCompact(h.marketValue)}
          </Typography>
          <Typography sx={{ fontSize: 9.5, color: 'var(--wc-text-secondary)', fontFamily: SERIF, mt: 0.15 }}>
            Mkt Val
          </Typography>
        </Box>

        {/* Day P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 78, sm: 90 }, flexShrink: 0 }}>
          <Typography
            sx={{
              fontFamily: NUMBER_FONT,
              fontSize: 11.5,
              fontWeight: 700,
              color: posToday ? 'var(--wc-success)' : 'var(--wc-error)',
              lineHeight: 1,
            }}
          >
            {fmtPkrSigned(h.todayPL)}
          </Typography>
          <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={h.todayPL} pct={h.todayPLPct} />
          </Box>
          <Typography sx={{ fontSize: 9, color: 'var(--wc-text-secondary)', fontFamily: SERIF, mt: 0.2 }}>Day</Typography>
        </Box>

        {/* Total P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 78, sm: 95 }, flexShrink: 0 }}>
          <Typography
            sx={{
              fontFamily: NUMBER_FONT,
              fontSize: 13,
              fontWeight: 700,
              color: posTotal ? 'var(--wc-success)' : 'var(--wc-error)',
              lineHeight: 1,
            }}
          >
            {fmtPkrSigned(h.totalPL)}
          </Typography>
          <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={h.totalPL} pct={h.totalPLPct} />
          </Box>
          <Typography sx={{ fontSize: 9, color: 'var(--wc-text-secondary)', fontFamily: SERIF, mt: 0.2 }}>Total</Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ minWidth: 32, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ color: hov ? 'var(--wc-text-primary)' : 'var(--wc-text-secondary)' }}
          >
            <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleEdit} sx={{ fontFamily: SERIF, fontSize: 12 }}>
              <EditRoundedIcon sx={{ fontSize: 16, mr: 1, color: 'var(--wc-primary)' }} />
              Edit holding
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ fontFamily: SERIF, fontSize: 12, color: 'var(--wc-error)' }}>
              <DeleteOutlineRoundedIcon sx={{ fontSize: 16, mr: 1, color: 'var(--wc-error)' }} />
              Delete holding
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  )
}

// ─── ECharts Sparkline ─────────────────────────────────────────────────────

const SparkLine = memo(function SparkLine({ data, width, height, color, area = false }: { data: number[]; width: number; height: number; color: string; area?: boolean }) {
  const safeMin = data.length > 0 ? Math.min(...data) * 0.98 : 0
  const safeMax = data.length > 0 ? Math.max(...data) * 1.02 : 1
  const option = useMemo(() => ({
    animation: false,
    silent: true,
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'category', data: data.map((_, i) => i), show: false },
    yAxis: { type: 'value', show: false, min: safeMin, max: safeMax },
    series: [{
      type: 'line',
      data,
      smooth: true,
      showSymbol: false,
      lineStyle: { color, width: 1.5 },
      areaStyle: area ? { color, opacity: 0.12 } : undefined,
    }],
  }), [area, color, data, safeMax, safeMin])

  return (
    <ReactECharts
      style={{ width, height }}
      opts={{ renderer: 'svg' }}
      option={option}
      notMerge
      lazyUpdate
    />
  )
})

// ─── Watchlist Row ────────────────────────────────────────────────────────────

function WatchRow({ item, index, onClick }: { item: WatchItem; index: number; onClick?: () => void }) {
  const reduce = useReducedMotion()
  const [hov, setHov] = useState(false)
  const pos = item.change >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      sx={{
        py: 1.2,
        pl: 0,
        pr: 0,
        borderRadius: '7px',
        bgcolor: hov ? 'rgba(10,36,99,0.03)' : 'transparent',
        transition: 'background-color 0.18s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Symbol + company */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Typography
              sx={{
                fontFamily: NUMBER_FONT,
                fontSize: 12.5,
                fontWeight: 700,
                color: onClick ? 'var(--wc-primary)' : 'var(--wc-text-primary)',
                textDecoration: onClick ? 'underline' : 'none',
                textUnderlineOffset: '2px',
                textDecorationThickness: '1px',
                textDecorationColor: 'rgba(10,36,99,0.25)',
              }}
            >
              {item.symbol}
            </Typography>
            <StarBorderIcon
              sx={{
                fontSize: 12,
                color: 'var(--wc-text-secondary)',
                opacity: hov ? 1 : 0,
                transition: 'opacity 0.18s ease',
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 10, color: 'var(--wc-text-secondary)', fontFamily: SERIF, mt: 0.1 }}>
            {item.company}
          </Typography>
        </Box>

        {/* Sparkline */}
        <Box sx={{ width: 60, flexShrink: 0 }}>
          <SparkLine
            data={item.spark}
            width={60}
            height={30}
            color={pos ? 'var(--wc-success)' : 'var(--wc-error)'}
          />
        </Box>

        {/* Price & change */}
        <Box sx={{ textAlign: 'right', minWidth: 90, flexShrink: 0 }}>
          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 12.5, fontWeight: 700, color: 'var(--wc-text-primary)' }}>
            Rs.&nbsp;{fmt(item.price)}
          </Typography>
          <Typography
            sx={{
              fontFamily: NUMBER_FONT,
              fontSize: 10.5,
              fontWeight: 600,
              color: pos ? 'var(--wc-success)' : 'var(--wc-error)',
            }}
          >
            {pos ? '+' : ''}{item.change.toFixed(1)} ({pos ? '+' : ''}{item.changePct.toFixed(2)}%)
          </Typography>
        </Box>

        {/* Volume (tablet+) */}
        <Box sx={{ textAlign: 'right', minWidth: 44, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 10.5, color: 'var(--wc-text-secondary)' }}>
            {item.volume}
          </Typography>
          <Typography sx={{ fontSize: 9, color: 'var(--wc-text-secondary)', fontFamily: SERIF, mt: 0.15 }}>vol</Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ─── History Row ──────────────────────────────────────────────────────────────

const histCfg: Record<HistoryEvent['type'], { color: string; label: string }> = {
  profit: { color: 'var(--wc-success)', label: 'PROFIT' },
  dividend: { color: '#b77a12', label: 'DIVIDEND' },
  loss: { color: 'var(--wc-error)', label: 'LOSS' },
}

function HistRow({ event, index }: { event: HistoryEvent; index: number }) {
  const reduce = useReducedMotion()
  const cfg = histCfg[event.type]

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.065, ease: [0.22, 1, 0.36, 1] }}
      sx={{ py: 1.3, display: 'flex', alignItems: 'center', gap: 1.6 }}
    >
      {/* Symbol icon */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '8px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `color-mix(in srgb, ${cfg.color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${cfg.color} 22%, transparent)`,
        }}
      >
        <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 9.5, fontWeight: 800, color: cfg.color }}>
          {event.symbol.slice(0, 4)}
        </Typography>
      </Box>

      {/* Details */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: cfg.color,
              fontFamily: NUMBER_FONT,
              textTransform: 'uppercase',
            }}
          >
            {cfg.label}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'var(--wc-text-secondary)', fontFamily: SERIF }}>· {event.date}</Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 11.5,
            color: 'var(--wc-text-secondary)',
            fontFamily: SERIF,
            lineHeight: 1.45,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {event.message}
        </Typography>
      </Box>

      {/* Amount */}
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 13, fontWeight: 700, color: cfg.color }}>
          {fmtPkrSigned(event.profit)}
        </Typography>
        <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
          <PLBadge value={event.profit} pct={event.profitPct} />
        </Box>
      </Box>
    </Box>
  )
}

// ─── Column header helper ─────────────────────────────────────────────────────

function ColHead({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <Typography
      sx={{
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--wc-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: NUMBER_FONT,
        textAlign: align,
      }}
    >
      {children}
    </Typography>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PortfolioPage() {
  const reduce = useReducedMotion()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerStock, setDrawerStock] = useState<StockDetail | null>(null)
  const [marketModalOpen, setMarketModalOpen] = useState(false)
  const [holdModalOpen, setHoldModalOpen] = useState(false)
  const [watchModalOpen, setWatchModalOpen] = useState(false)
  const [holdModalMode, setHoldModalMode] = useState<'new' | 'manage'>('new')
  const [holdModalSymbol, setHoldModalSymbol] = useState<string | undefined>(undefined)
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings)
  const [watchlist, setWatchlist] = useState<WatchItem[]>(initialWatchlist)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const openDrawer = async (symbol: string) => {
    // Fallback to hardcoded data when Supabase is not configured
    if (!hasStockService()) {
      const detail = watchDetails[symbol]
      if (detail) { setDrawerStock(detail); setDrawerOpen(true) }
      return
    }

    // Open dialog immediately with loading state
    setDrawerLoading(true)
    setDrawerError(null)
    setDrawerStock(null)
    setDrawerOpen(true)

    try {
      const detail = await fetchStockDetail(symbol)
      setDrawerStock(detail)
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Failed to load stock data.'
      setDrawerError(message)
      setDrawerStock(null)
    } finally {
      setDrawerLoading(false)
    }
  }

  // ── Derived computations ──────────────────────────────────────────────────
  const totalMV = useMemo(() => holdings.reduce((s, h) => s + h.marketValue, 0), [holdings])
  const dayPL = useMemo(() => holdings.reduce((s, h) => s + h.todayPL, 0), [holdings])
  const dayPLPct = useMemo(() => totalMV - dayPL !== 0 ? (dayPL / (totalMV - dayPL)) * 100 : 0, [totalMV, dayPL])
  const totalPL = useMemo(() => holdings.reduce((s, h) => s + h.totalPL, 0), [holdings])
  const totalPLPct = useMemo(() => totalMV - totalPL !== 0 ? (totalPL / (totalMV - totalPL)) * 100 : 0, [totalMV, totalPL])
  const totalShares = useMemo(() => holdings.reduce((s, h) => s + h.shares, 0), [holdings])

  const sectorAllocation = useMemo(() => [
    { sector: 'Banking', value: holdings.filter(h => h.sector === 'Banking').reduce((s, h) => s + h.marketValue, 0), color: 'var(--wc-primary)' },
    { sector: 'Consumer', value: holdings.filter(h => h.sector === 'Consumer').reduce((s, h) => s + h.marketValue, 0), color: '#b77a12' },
    { sector: 'Technology', value: holdings.filter(h => h.sector === 'Technology').reduce((s, h) => s + h.marketValue, 0), color: '#0d5c32' },
    { sector: 'Energy', value: holdings.filter(h => h.sector === 'Energy').reduce((s, h) => s + h.marketValue, 0), color: '#7c3aed' },
  ].filter(s => s.value > 0).sort((a, b) => b.value - a.value), [holdings])

  // ── Modal handlers ───────────────────────────────────────────────────────
  const handleSaveHolding = (holding: Holding) => {
    setHoldings(prev => {
      const idx = prev.findIndex(h => h.symbol === holding.symbol)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = holding
        return next
      }
      return [...prev, holding]
    })
  }

  const handleAddToWatchlist = (item: WatchItem) => {
    setWatchlist(prev => {
      if (prev.some(w => w.symbol === item.symbol)) return prev
      return [...prev, item]
    })
    // Fire-and-forget DB persistence
    addToWatchlistDb(item.symbol).catch(() => {
      // Silently degrade — local state remains updated
    })
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    // Delay state reset to let slide-out transition finish
    setTimeout(() => {
      setDrawerStock(null)
      setDrawerLoading(false)
      setDrawerError(null)
    }, 400)
  }

  const handleEditHolding = (symbol: string) => {
    setHoldModalMode('manage')
    setHoldModalSymbol(symbol)
    setHoldModalOpen(true)
  }

  const handleDeleteHolding = (symbol: string) => {
    setHoldings(prev => prev.filter(h => h.symbol !== symbol))
  }

  const mvFmt = useMemo(() => fmtPkr(totalMV), [totalMV])
  const dayFmt = useMemo(() => fmtPkrSigned(dayPL), [dayPL])
  const totalFmt = useMemo(() => fmtPkrSigned(totalPL), [totalPL])
  const sharesFmt = useMemo(() => fmtCompact(totalShares), [totalShares])

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
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={{ xs: 6, md: 10 }}>

          {/* ── Page Header ─────────────────────────────────────────────── */}
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
                    Portfolio
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
                    Your holdings at{' '}
                    <Box component="span" sx={{ color: 'var(--wc-primary)' }}>
                      a glance.
                    </Box>
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

                </Box>
              </Box>
            </Box>
          </MotionReveal>

          {/* ── Market Snapshot ─────────────────────────────────────────── */}
          <MotionReveal>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                <Box>
                  <SecLabel>Market Snapshot</SecLabel>
                  <Typography
                    sx={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--wc-text-primary)',
                      fontFamily: SERIF,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Daily summary from PSX.
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 11, color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT }}>
                  {marketSummary.tradeDate}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 1.5,
                }}
              >
                <Box
                  onClick={() => setMarketModalOpen(true)}
                  sx={{
                    p: 2,
                    border: '1px solid var(--wc-divider)',
                    borderRadius: 1.5,
                    bgcolor: 'var(--wc-paper)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': { borderColor: 'var(--wc-primary)', boxShadow: '0 6px 24px rgba(10,36,99,0.08)' },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--wc-text-secondary)', textTransform: 'uppercase', fontFamily: SERIF, mb: 0.4 }}>
                        KSE 100 Index
                      </Typography>
                      <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 12, fontWeight: 600, color: 'var(--wc-text-secondary)' }}>
                        Close {marketSummary.kse100_close.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 80, height: 36 }}>
                      <SparkLine
                        data={marketSummary.history['1W'].values}
                        width={80}
                        height={36}
                        color={marketSummary.kse100_change >= 0 ? 'var(--wc-success)' : 'var(--wc-error)'}
                        area
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {marketSummary.kse100_change >= 0 ? <TrendingUpIcon sx={{ fontSize: 14, color: 'var(--wc-success)' }} /> : <TrendingDownIcon sx={{ fontSize: 14, color: 'var(--wc-error)' }} />}
                    <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 18, fontWeight: 800, color: marketSummary.kse100_change >= 0 ? 'var(--wc-success)' : 'var(--wc-error)', letterSpacing: '-0.02em' }}>
                      {marketSummary.kse100_change >= 0 ? '+' : ''}{marketSummary.kse100_change.toFixed(2)}
                    </Typography>
                    <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 11, color: 'var(--wc-text-secondary)', ml: 0.5 }}>
                      {marketSummary.kse100_change >= 0 ? '+' : ''}{((marketSummary.kse100_change / marketSummary.kse100_prev) * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
                <Box
                  onClick={() => setMarketModalOpen(true)}
                  sx={{
                    p: 2,
                    border: '1px solid var(--wc-divider)',
                    borderRadius: 1.5,
                    bgcolor: 'var(--wc-paper)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': { borderColor: 'var(--wc-primary)', boxShadow: '0 6px 24px rgba(10,36,99,0.08)' },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--wc-text-secondary)', textTransform: 'uppercase', fontFamily: SERIF, mb: 0.4 }}>
                        KSE 30 Index
                      </Typography>
                      <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 12, fontWeight: 600, color: 'var(--wc-text-secondary)' }}>
                        Close {marketSummary.kse30_close.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 80, height: 36 }}>
                      <SparkLine
                        data={marketSummary.history['1W'].values}
                        width={80}
                        height={36}
                        color={marketSummary.kse30_change >= 0 ? 'var(--wc-success)' : 'var(--wc-error)'}
                        area
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {marketSummary.kse30_change >= 0 ? <TrendingUpIcon sx={{ fontSize: 14, color: 'var(--wc-success)' }} /> : <TrendingDownIcon sx={{ fontSize: 14, color: 'var(--wc-error)' }} />}
                    <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 18, fontWeight: 800, color: marketSummary.kse30_change >= 0 ? 'var(--wc-success)' : 'var(--wc-error)', letterSpacing: '-0.02em' }}>
                      {marketSummary.kse30_change >= 0 ? '+' : ''}{marketSummary.kse30_change.toFixed(2)}
                    </Typography>
                    <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 11, color: 'var(--wc-text-secondary)', ml: 0.5 }}>
                      {marketSummary.kse30_change >= 0 ? '+' : ''}{((marketSummary.kse30_change / marketSummary.kse30_prev) * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </MotionReveal>

          {/* ── Portfolio Value card ─────────────────────────────────────── */}
          <MotionReveal>
            <Card>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.6 }}>
                {/* <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 15, color: 'var(--wc-primary)', opacity: 0.7 }} /> */}
                <SecLabel>Total Portfolio Value</SecLabel>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Typography
                  sx={{
                    fontFamily: NUMBER_FONT,
                    fontSize: { xs: 26, md: 38 },
                    fontWeight: 700,
                    color: 'var(--wc-text-primary)',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                  }}
                >
                  {mvFmt}
                </Typography>
                <Box sx={{ width: 140, height: 44 }}>
                  <SparkLine
                    data={portfolioTrend}
                    width={140}
                    height={44}
                    color={totalPL >= 0 ? 'var(--wc-success)' : 'var(--wc-error)'}
                    area
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1.5,
                }}
              >
                <StatTile
                  label="Day P/L"
                  value={dayFmt}
                  positive={dayPL >= 0}
                  sub={`${dayPL >= 0 ? '+' : ''}${dayPLPct.toFixed(2)}% today`}
                />
                <StatTile
                  label="Total Return"
                  value={totalFmt}
                  positive={totalPL >= 0}
                  sub={`${totalPL >= 0 ? '+' : ''}${totalPLPct.toFixed(2)}% all time`}
                />
                <StatTile
                  label="Total Shares"
                  value={sharesFmt}
                  sub={`${holdings.length} positions`}
                />
                <StatTile
                  label="Cash Balance"
                  value="Rs. 492,800"
                  sub="Available to invest"
                />
              </Box>
            </Card>
          </MotionReveal>

          {/* ── Sector Allocation ─────────────────────────────────────── */}
          <MotionReveal>
            <Card>
              <SecLabel>Sector Allocation</SecLabel>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--wc-text-primary)',
                  fontFamily: SERIF,
                  letterSpacing: '-0.01em',
                  mb: 2,
                }}
              >
                Where your capital is deployed.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {sectorAllocation.map((s) => {
                  const pct = (s.value / totalMV) * 100
                  return (
                    <Box key={s.sector} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 10.5, fontWeight: 700, color: 'var(--wc-text-secondary)', minWidth: 80, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {s.sector}
                      </Typography>
                      <Box sx={{ flex: 1, height: 10, bgcolor: 'var(--wc-surface)', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
                        <Box
                          component={motion.div}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                          sx={{ height: '100%', bgcolor: s.color, borderRadius: '99px', opacity: 0.85 }}
                        />
                      </Box>
                      <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 11, fontWeight: 600, color: 'var(--wc-text-primary)', minWidth: 48, textAlign: 'right' }}>
                        {pct.toFixed(1)}%
                      </Typography>
                      <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 10, color: 'var(--wc-text-secondary)', minWidth: 72, textAlign: 'right' }}>
                        {fmtCompact(s.value)}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            </Card>
          </MotionReveal>

          {/* ── Holdings + Watchlist ─────────────────────────────────────── */}
          <MotionReveal>
            {/* Section divider — identical to DataPage "All Listings" section */}
            <Box
              sx={{
                borderTop: '1px solid var(--wc-divider)',
                pt: 4,
                mb: 4,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.8 }}>
                  <ShowChartIcon sx={{ fontSize: 14, color: 'var(--wc-primary)', opacity: 0.7 }} />
                  <SecLabel>Holdings</SecLabel>
                </Box>
                <Typography
                  sx={{
                    fontSize: { xs: 14, md: 16 },
                    fontWeight: 700,
                    color: 'var(--wc-text-primary)',
                    fontFamily: SERIF,
                  }}
                >
                  {holdings.length} active positions.
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT }}>
                {fmt(totalShares)} total shares
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.55fr) minmax(0, 1fr)' },
                alignItems: 'start',
              }}
            >
              {/* ── Holdings table ─────────────────────────────────────── */}
              <Card sx={{ p: { xs: 2, md: 2.4 }, '&:hover': { borderColor: 'var(--wc-divider)', boxShadow: 'none' } }}>
                {/* Column headers */}
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 2,
                    px: 1.2,
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ width: 40, flexShrink: 0 }} />
                  <Box sx={{ flex: '0 0 134px' }}><ColHead>Stock</ColHead></Box>
                  <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}><ColHead>Price / Shares</ColHead></Box>
                  <Box sx={{ textAlign: 'right', minWidth: 72 }}><ColHead align="right">Mkt Val</ColHead></Box>
                  <Box sx={{ textAlign: 'right', minWidth: 90 }}><ColHead align="right">Day P/L</ColHead></Box>
                  <Box sx={{ textAlign: 'right', minWidth: 95 }}><ColHead align="right">Total P/L</ColHead></Box>
                  <Box sx={{ width: 32 }} />
                </Box>

                <Divider sx={{ borderColor: 'var(--wc-divider)', mb: 0.5, display: { xs: 'none', sm: 'block' } }} />

                <Box
                  sx={{
                    maxHeight: { xs: 420, md: 500 },
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    mr: -2.4,          // pulls scrollbar flush to card edge (matches card padding)
                    pr: 2,             // padding between content and scrollbar
                    scrollbarGutter: 'stable',
                  }}
                >                  {holdings.map((h, i) => (
                  <Box key={h.symbol}>
                    <HoldingRow h={h} index={i} onEdit={handleEditHolding} onDelete={handleDeleteHolding} />
                    {i < holdings.length - 1 && (
                      <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.5 }} />
                    )}
                  </Box>
                ))}
                </Box>

                {/* Footer row */}
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid var(--wc-divider)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: 'var(--wc-text-secondary)', fontFamily: SERIF }}>
                    Total invested ·{' '}
                    <Box component="span" sx={{ fontFamily: NUMBER_FONT, color: 'var(--wc-text-primary)', fontWeight: 600 }}>
                      {fmtPkr(totalMV - totalPL)}
                    </Box>
                  </Typography>
                  <CustomButton
                    variant="contained"
                    tone="light"
                    startIcon={<AddRoundedIcon />}
                    style={{ fontSize: '0.78rem', paddingInline: '1rem', paddingBlock: '0.45rem' }}
                    onClick={() => {
                      setHoldModalMode('new')
                      setHoldModalSymbol(undefined)
                      setHoldModalOpen(true)
                    }}
                  >
                    Add holding
                  </CustomButton>
                </Box>
              </Card>

              {/* ── Watchlist ──────────────────────────────────────────── */}
              <Card sx={{ p: { xs: 2, md: 2.4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <SecLabel>Watchlist</SecLabel>
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--wc-text-primary)',
                        fontFamily: SERIF,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Favourites
                    </Typography>
                  </Box>
                  <Typography
                    onClick={() => setWatchModalOpen(true)}
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--wc-primary)',
                      fontFamily: SERIF,
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                      '&:hover': { color: 'var(--wc-text-primary)' },
                    }}
                  >
                    + Add
                  </Typography>
                </Box>

                <Box
                  sx={{
                    maxHeight: { xs: 420, md: 500 },
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    mr: { xs: -2, md: -2.4 },   // pulls scrollbar to card edge
                    pr: 2,                       // breathing room between content and scrollbar
                    scrollbarGutter: 'stable',
                  }}
                >
                  {watchlist.map((item, i) => (
                    <Box key={item.symbol}>
                      <WatchRow item={item} index={i} onClick={() => openDrawer(item.symbol)} />
                      {i < watchlist.length - 1 && (
                        <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.4 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Card>
            </Box>
          </MotionReveal>

          {/* ── Trade History ─────────────────────────────────────────────── */}
          <MotionReveal>
            <Card sx={{ p: { xs: 2, md: 2.4 } }}>
              <Box sx={{ mb: 2 }}>
                <SecLabel>Trade History</SecLabel>
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--wc-text-primary)',
                    fontFamily: SERIF,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Recent activity
                </Typography>
              </Box>
              {historyEvents.map((ev, i) => (
                <Box key={`${ev.symbol}-${i}`}>
                  <HistRow event={ev} index={i} />
                  {i < historyEvents.length - 1 && (
                    <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.4 }} />
                  )}
                </Box>
              ))}
            </Card>
          </MotionReveal>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            sx={{ textAlign: 'center', pt: 2 }}
          >
            <Typography
              sx={{
                fontSize: 10.5,
                color: 'var(--wc-text-secondary)',
                fontFamily: SERIF,
                letterSpacing: '0.04em',
              }}
            >
              For informational purposes only · Not financial advice · Webict Capital
            </Typography>
          </Box>

        </Stack>
      </Container>

      <StockDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        stock={drawerStock}
        loading={drawerLoading}
        error={drawerError}
      />
      <MarketSummaryModal
        open={marketModalOpen}
        onClose={() => setMarketModalOpen(false)}
        summary={marketSummary}
      />
      <HoldingModal
        open={holdModalOpen}
        onClose={() => setHoldModalOpen(false)}
        holdings={holdings}
        onSave={handleSaveHolding}
        initialMode={holdModalMode}
        initialSymbol={holdModalSymbol}
      />
      <WatchlistModal
        open={watchModalOpen}
        onClose={() => setWatchModalOpen(false)}
        watchlist={watchlist}
        onAdd={handleAddToWatchlist}
      />
    </Box>
  )
}