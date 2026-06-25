import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import GoogleIcon from '@mui/icons-material/Google'
import {
  Box, Container, Divider, Stack, Typography,
} from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { useState, useMemo, memo, useEffect, useCallback, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import { MotionReveal } from '../animations/MotionReveal'
import { CustomButton } from '../CustomButton'
import { PulseSkeleton } from '../PulseSkeleton'
import { StockDrawer, type StockDetail } from '../StockDrawer'
import { MarketSummaryModal, type MarketSummary } from '../MarketSummaryModal'
import { HoldingModal, type Holding } from '../HoldingModal'
import { WatchlistModal, type WatchItem } from '../WatchlistModal'
import {
  hasStockService, fetchStockDetail,
  addToWatchlist as addToWatchlistDb,
  removeFromWatchlist as removeFromWatchlistDb,
  insertUserTrade, deleteUserTradesBySymbol,
  fetchUserTrades, fetchWatchlistSymbols,
  fetchUniqueSymbols, fetchMarketDailySummaryRows, fetchMarketHistoryRows,
  type UserTrade, type MarketSymbolSnapshot, type DbMarketSummaryRow, type MarketHistoryRow,
} from '../../lib/stockService'
import { useAuth } from '../../context/AuthContext'
import { AuthModal } from '../AuthModal'

// ─── Design tokens ────────────────────────────────────────────────────────────

const NUMBER_FONT = "'JetBrains Mono', monospace"
const SERIF = '"Playfair Display", serif'
const BODY = '"Inter", sans-serif'

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryEvent = {
  symbol: string
  type: 'profit' | 'dividend' | 'loss'
  message: string
  profit: number
  profitPct: number
  date: string
}

type MarketHistory = Record<'1M' | 'YTD' | '1Y', { labels: string[]; values: number[]; volumes: number[] }>

// ─── Static data ──────────────────────────────────────────────────────────────

const EMPTY_SPARK: number[] = []
const SECTOR_COLORS = [
  'var(--wc-primary)', '#b77a12', '#0d5c32', '#7c3aed', '#1a4fa8', '#6366f1',
]

// ─── Formatters ───────────────────────────────────────────────────────────────

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

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'string') return parseFloat(v.replace(/,/g, '').trim()) || 0
  return 0
}

// ─── Real market history builder ──────────────────────────────────────────────
const EMPTY_MARKET_HISTORY: MarketHistory = {
  '1M': { labels: [], values: [], volumes: [] },
  'YTD': { labels: [], values: [], volumes: [] },
  '1Y': { labels: [], values: [], volumes: [] },
}

const fmtDateLabel = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
}

function buildRealMarketHistory(
  rows: MarketHistoryRow[],
  closeKey: 'kse100_close' | 'kse30_close',
): MarketHistory {
  if (rows.length === 0) return EMPTY_MARKET_HISTORY

  const sorted = [...rows].reverse()

  const buildSlice = (data: Array<MarketHistoryRow | DbMarketSummaryRow>) => ({
    labels: data.map((r) => fmtDateLabel(r.trade_date)),
    values: data.map((r) => ((r[closeKey] as number) ?? 0)),
    volumes: data.map((r) => ((r as DbMarketSummaryRow).curr_volume ?? (r as MarketHistoryRow).curr_volume ?? 0)),
  })

  const currentYear = new Date().getFullYear()
  const ytdRows = sorted.filter((r) => {
    const y = new Date(r.trade_date + 'T00:00:00').getFullYear()
    return y === currentYear
  })

  return {
    '1M': buildSlice(sorted.slice(-22)),
    'YTD': buildSlice(ytdRows.length > 0 ? ytdRows : sorted.slice(-90)),
    '1Y': buildSlice(sorted),
  }
}

function normalizeSummaryRows(rows: DbMarketSummaryRow[]): DbMarketSummaryRow[] {
  return rows.map((row) => {
    const kse100Prev = toNum(row.kse100_prev)
    const kse100Change = toNum(row.kse100_change)
    const kse100CloseRaw = toNum(row.kse100_close)
    const kse100Close = kse100CloseRaw !== 0 ? kse100CloseRaw : (kse100Prev + kse100Change)

    const kse30Prev = toNum(row.kse30_prev)
    const kse30Change = toNum(row.kse30_change)
    const kse30CloseRaw = toNum(row.kse30_close)
    const kse30Close = kse30CloseRaw !== 0 ? kse30CloseRaw : (kse30Prev + kse30Change)

    return {
      ...row,
      kse100_prev: kse100Prev,
      kse100_close: kse100Close,
      kse100_change: kse100Change !== 0 ? kse100Change : (kse100Close - kse100Prev),
      kse30_prev: kse30Prev,
      kse30_close: kse30Close,
      kse30_change: kse30Change !== 0 ? kse30Change : (kse30Close - kse30Prev),
      prev_volume: toNum(row.prev_volume),
      curr_volume: toNum(row.curr_volume),
      advances: toNum(row.advances),
      declines: toNum(row.declines),
      unchanged: toNum(row.unchanged),
    }
  })
}

// ─── Static sx objects ────────────────────────────────────────────────────────

const cardSx = {
  border: '1px solid var(--wc-divider)',
  borderRadius: 1.5,
  bgcolor: 'var(--wc-paper)',
  p: { xs: 2.4, md: 3.2 },
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
} as const

const statTileBaseSx = {
  p: 2,
  border: '1px solid var(--wc-divider)',
  borderRadius: 1,
  bgcolor: 'var(--wc-surface)',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
} as const

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonIndexCard() {
  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid var(--wc-divider)',
        borderRadius: 1.5,
        bgcolor: 'var(--wc-paper)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PulseSkeleton shape="text" width={110} height={14} />
      <PulseSkeleton shape="text" width={140} height={20} sx={{ mt: 0.6 }} />
      <PulseSkeleton shape="text" width={120} height={14} sx={{ mt: 0.4 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.2 }}>
        <PulseSkeleton shape="rounded" width={80} height={40} />
        <PulseSkeleton shape="text" width={90} height={24} />
      </Box>
    </Box>
  )
}

function SkeletonHoldingRow() {
  return (
    <Box sx={{ py: 1.2, px: 1.2, mx: -1.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
        <PulseSkeleton shape="rounded" width={40} height={40} />
        <Box sx={{ minWidth: 0, flex: { xs: '0 0 90px', sm: '0 0 134px' } }}>
          <PulseSkeleton shape="text" width={80} height={15} />
          <PulseSkeleton shape="text" width={110} height={13} sx={{ mt: 0.3 }} />
          <PulseSkeleton shape="rounded" width={60} height={16} sx={{ mt: 0.6 }} />
        </Box>
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
          <PulseSkeleton shape="text" width={90} height={15} />
          <PulseSkeleton shape="text" width={120} height={13} sx={{ mt: 0.3 }} />
        </Box>
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, minWidth: 72, flexShrink: 0 }}>
          <PulseSkeleton shape="text" width={60} height={14} />
          <PulseSkeleton shape="text" width={40} height={12} sx={{ mt: 0.3 }} />
        </Box>
        <Box sx={{ textAlign: 'right', minWidth: { xs: 78, sm: 90 }, flexShrink: 0 }}>
          <PulseSkeleton shape="text" width={70} height={14} />
          <PulseSkeleton shape="text" width={40} height={12} sx={{ mt: 0.3 }} />
        </Box>
        <Box sx={{ textAlign: 'right', minWidth: { xs: 78, sm: 95 }, flexShrink: 0 }}>
          <PulseSkeleton shape="text" width={70} height={14} />
          <PulseSkeleton shape="text" width={40} height={12} sx={{ mt: 0.3 }} />
        </Box>
      </Box>
    </Box>
  )
}

function SkeletonWatchRow() {
  return (
    <Box sx={{ py: 1.1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <PulseSkeleton shape="text" width={60} height={14} />
        </Box>
        <PulseSkeleton shape="rounded" width={60} height={30} />
        <Box sx={{ textAlign: 'right', minWidth: 90, flexShrink: 0 }}>
          <PulseSkeleton shape="text" width={70} height={14} />
          <PulseSkeleton shape="text" width={70} height={13} sx={{ mt: 0.3 }} />
        </Box>
        <Box sx={{ textAlign: 'right', minWidth: 44, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
          <PulseSkeleton shape="text" width={36} height={13} />
          <PulseSkeleton shape="text" width={28} height={12} sx={{ mt: 0.3 }} />
        </Box>
      </Box>
    </Box>
  )
}

function SkeletonHistoryRow() {
  return (
    <Box sx={{ py: 1.1, display: 'flex', alignItems: 'center', gap: 1.6 }}>
      <PulseSkeleton shape="rounded" width={36} height={36} />
      <Box sx={{ flex: 1 }}>
        <PulseSkeleton shape="text" width={160} height={14} />
        <PulseSkeleton shape="text" width={220} height={13} sx={{ mt: 0.4 }} />
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <PulseSkeleton shape="text" width={70} height={14} />
        <PulseSkeleton shape="text" width={50} height={12} sx={{ mt: 0.3 }} />
      </Box>
    </Box>
  )
}

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontSize: 11, fontFamily: NUMBER_FONT, fontWeight: 600, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--wc-primary)', mb: 1.5,
    }}>
      {children}
    </Typography>
  )
}

// FIXED: was 9px — bumped to 11px
// @ts-expect-error — kept for future use
function SectorTag({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="span" sx={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: 'var(--wc-primary)', fontFamily: NUMBER_FONT,
      px: 0.7, py: 0.25, borderRadius: '3px',
      bgcolor: 'rgba(10,36,99,0.06)', border: '1px solid rgba(10,36,99,0.15)',
      lineHeight: 1.5,
    }}>
      {children}
    </Typography>
  )
}

function Card({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return <Box sx={sx ? { ...cardSx, ...sx } : cardSx}>{children}</Box>
}

// FIXED: label was 10px, value was 15px — now 12px and 17px
function StatTile({
  label, value, sub, positive,
}: { label: string; value: string; sub?: string; positive?: boolean }) {
  const valueColor =
    positive === undefined
      ? 'var(--wc-text-primary)'
      : positive ? 'var(--wc-success)' : 'var(--wc-error)'
  return (
    <Box sx={statTileBaseSx}>
      <Typography sx={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
        color: 'var(--wc-text-secondary, #4a5e78)', textTransform: 'uppercase',
        fontFamily: NUMBER_FONT, mb: 0.8,
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontFamily: NUMBER_FONT, fontSize: 18, fontWeight: 700,
        color: valueColor, letterSpacing: '-0.02em', lineHeight: 1.15,
      }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 13, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: BODY, mt: 0.6, lineHeight: 1.5 }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

// FIXED: icon was 10px, pct was 10px — now 12px each
function PLBadge({ value, pct }: { value: number; pct: number }) {
  const positive = value >= 0
  const Icon = positive ? TrendingUpIcon : TrendingDownIcon
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
      <Icon sx={{ fontSize: 13, color: positive ? 'var(--wc-success)' : 'var(--wc-error)' }} />
      <Typography sx={{
        fontFamily: NUMBER_FONT, fontSize: 12.5, fontWeight: 600,
        color: positive ? 'var(--wc-success)' : 'var(--wc-error)',
      }}>
        {positive ? '+' : ''}{Math.abs(pct).toFixed(2)}%
      </Typography>
    </Box>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 1.4, py: 5, px: 3,
    }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: '12px',
        bgcolor: 'rgba(10,36,99,0.04)', border: '1px solid rgba(10,36,99,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--wc-text-primary)',
      }}>
        {icon}
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        {/* FIXED: was 12.5px — now 14px */}
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'var(--wc-text-primary)', fontFamily: SERIF, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: BODY, lineHeight: 1.6 }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  )
}

// FIXED: was 9px — now 11px
function ColHead({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <Typography sx={{
      fontSize: 11, fontWeight: 600, color: 'var(--wc-text-secondary, #4a5e78)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      fontFamily: NUMBER_FONT, textAlign: align,
    }}>
      {children}
    </Typography>
  )
}

// ─── HoldingRow ───────────────────────────────────────────────────────────────

function HoldingRow({
  h, index, onEdit,
}: { h: Holding; index: number; onEdit: (s: string) => void }) {
  const reduce = useReducedMotion()
  const [hov, setHov] = useState(false)
  const handleEdit = useCallback(() => { onEdit(h.symbol) }, [h.symbol, onEdit])

  const posToday = h.todayPL >= 0
  const posTotal = h.totalPL >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={handleEdit}
      sx={{
        py: 1.2, px: 1.2, mx: -1.2, borderRadius: '8px',
        minHeight: 72,
        maxHeight: 72,
        bgcolor: hov ? 'rgba(10,36,99,0.03)' : 'transparent',
        transition: 'background-color 0.18s ease',
        cursor: 'pointer',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
        {/* Symbol avatar */}
        <Box sx={{
          width: 40, height: 40, borderRadius: '8px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: hov ? 'rgba(10,36,99,0.07)' : 'var(--wc-surface)',
          border: `1px solid ${hov ? 'rgba(10,36,99,0.22)' : 'var(--wc-divider)'}`,
          transition: 'all 0.18s ease',
        }}>
          {/* FIXED: was 9px/11px — now 11px/13px */}
          <Typography sx={{
            fontFamily: NUMBER_FONT,
            fontSize: h.symbol.length > 4 ? 11 : 13,
            fontWeight: 700,
            color: hov ? 'var(--wc-primary)' : 'var(--wc-text-primary)',
            letterSpacing: '0.02em',
          }}>
            {h.symbol.length <= 4 ? h.symbol : h.symbol.slice(0, 4)}
          </Typography>
        </Box>

        {/* Name + sector */}
        <Box sx={{ minWidth: 0, flex: { xs: '0 0 90px', sm: '0 0 134px' } }}>
          {/* FIXED: was 13px — now 14px */}
          <Typography sx={{
            fontSize: 14, fontWeight: 700,
            color: 'var(--wc-text-primary)', fontFamily: SERIF, lineHeight: 1.2,
          }}>
            {h.symbol}
          </Typography>
          
          <Typography sx={{
            fontSize: 12.5, color: 'var(--wc-text-secondary, #4a5e78)', mt: 0.2,
            fontFamily: BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {h.company}
          </Typography>
          {/* <Box sx={{ mt: 0.5 }}><SectorTag>{h.sector}</SectorTag></Box> */}
        </Box>

        {/* Price + shares (desktop) */}
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
          {/* FIXED: was 13px — now 14px */}
          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 14, fontWeight: 600, color: 'var(--wc-text-primary)' }}>
            Rs.&nbsp;{h.price.toFixed(2)}
          </Typography>
          
          <Typography sx={{ fontSize: 12.5, color: 'var(--wc-text-secondary, #4a5e78)', mt: 0.2, fontFamily: NUMBER_FONT, fontWeight: 400 }}>
            {fmt(h.shares)} sh · avg {h.avgCost.toFixed(2)}
          </Typography>
        </Box>

        {/* Market Value */}
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, minWidth: 72, flexShrink: 0 }}>
          {/* FIXED: was 12px — now 14px */}
          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 14, fontWeight: 600, color: 'var(--wc-text-primary)' }}>
            {fmtCompact(h.marketValue)}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: NUMBER_FONT, fontWeight: 500, mt: 0.15 }}>
            Mkt Val
          </Typography>
        </Box>

        {/* Day P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 78, sm: 90 }, flexShrink: 0 }}>
          {/* FIXED: was 11.5px — now 13px */}
          <Typography sx={{
            fontFamily: NUMBER_FONT, fontSize: 13.5, fontWeight: 700, lineHeight: 1.15,
            color: posToday ? 'var(--wc-success)' : 'var(--wc-error)',
          }}>
            {fmtPkrSigned(h.todayPL)}
          </Typography>
          <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={h.todayPL} pct={h.todayPLPct} />
          </Box>
          <Typography sx={{ fontSize: 11, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: NUMBER_FONT, fontWeight: 500, mt: 0.2 }}>Day</Typography>
        </Box>

        {/* Total P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 78, sm: 95 }, flexShrink: 0 }}>
          {/* FIXED: was 13px — now 15px */}
          <Typography sx={{
            fontFamily: NUMBER_FONT, fontSize: 15, fontWeight: 700, lineHeight: 1.15,
            color: posTotal ? 'var(--wc-success)' : 'var(--wc-error)',
          }}>
            {fmtPkrSigned(h.totalPL)}
          </Typography>
          <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={h.totalPL} pct={h.totalPLPct} />
          </Box>
          <Typography sx={{ fontSize: 11, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: NUMBER_FONT, fontWeight: 500, mt: 0.2 }}>Total</Typography>
        </Box>

      </Box>
    </Box>
  )
}

// ─── ECharts Sparkline ────────────────────────────────────────────────────────

const SparkLine = memo(function SparkLine({
  data, width, height, color, area = false,
}: { data: number[]; width: number; height: number; color: string; area?: boolean }) {
  const option = useMemo(() => {
    const safeMin = data.length > 0 ? Math.min(...data) * 0.98 : 0
    const safeMax = data.length > 0 ? Math.max(...data) * 1.02 : 1
    return {
      animation: false,
      silent: true,
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { type: 'category', data: data.map((_, i) => i), show: false },
      yAxis: { type: 'value', show: false, min: safeMin, max: safeMax },
      series: [{
        type: 'line', data, smooth: true, showSymbol: false,
        lineStyle: { color, width: 1.5 },
        areaStyle: area ? { color, opacity: 0.12 } : undefined,
      }],
    }
  }, [area, color, data])

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

// ─── WatchRow ─────────────────────────────────────────────────────────────────

function WatchRow({ item, index, onClick }: { item: WatchItem; index: number; onClick?: () => void }) {
  const reduce = useReducedMotion()
  const pos = item.change >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      sx={{
        py: 1.1, pl: 0, pr: 0, borderRadius: '7px',
        minHeight: 64,
        maxHeight: 64,
        transition: 'background-color 0.18s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            {/* FIXED: was 12.5px — now 14px */}
            <Typography sx={{
              fontFamily: NUMBER_FONT, fontSize: 14, fontWeight: 700,
              color: onClick ? 'var(--wc-primary)' : 'var(--wc-text-primary)',
              textDecoration: onClick ? 'underline' : 'none',
              textUnderlineOffset: '2px', textDecorationThickness: '1px',
              textDecorationColor: 'rgba(10,36,99,0.25)',
            }}>
              {item.symbol}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: 60, flexShrink: 0 }}>
          <SparkLine
            data={item.spark} width={60} height={30}
            color={pos ? 'var(--wc-success)' : 'var(--wc-error)'}
          />
        </Box>

        <Box sx={{ textAlign: 'right', minWidth: 90, flexShrink: 0 }}>
          {/* FIXED: was 12.5px — now 14px */}
          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 14, fontWeight: 700, color: 'var(--wc-text-primary)' }}>
            Rs.&nbsp;{fmt(item.price)}
          </Typography>
          {/* FIXED: was 10.5px — now 12px */}
          <Typography sx={{
            fontFamily: NUMBER_FONT, fontSize: 12, fontWeight: 600,
            color: pos ? 'var(--wc-success)' : 'var(--wc-error)',
          }}>
            {pos ? '+' : ''}{item.change.toFixed(1)} ({pos ? '+' : ''}{item.changePct.toFixed(2)}%)
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right', minWidth: 44, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
          {/* FIXED: was 10.5px — now 12px */}
          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 12, color: 'var(--wc-text-primary)' }}>
            {item.volume}
          </Typography>
          {/* FIXED: was 9px — now 11px */}
          <Typography sx={{ fontSize: 11, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: NUMBER_FONT, fontWeight: 500, mt: 0.15 }}>vol</Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ─── HistRow ──────────────────────────────────────────────────────────────────

const HIST_CFG: Record<HistoryEvent['type'], { color: string; label: string; icon: React.ReactNode }> = {
  profit: { color: 'var(--wc-success)', label: 'PROFIT', icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
  dividend: { color: '#b77a12', label: 'DIVIDEND', icon: <StarBorderIcon sx={{ fontSize: 16 }} /> },
  loss: { color: 'var(--wc-error)', label: 'LOSS', icon: <TrendingDownIcon sx={{ fontSize: 16 }} /> },
}

function HistRow({ event, index }: { event: HistoryEvent; index: number }) {
  const reduce = useReducedMotion()
  const cfg = HIST_CFG[event.type]

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.065, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        py: 1.1,
        minHeight: 64,
        maxHeight: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 1.6,
      }}
    >
      <Box sx={{
        width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: `color-mix(in srgb, ${cfg.color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${cfg.color} 22%, transparent)`,
      }}>
        {/* FIXED: was 9.5px — now 11px */}
        <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 11, fontWeight: 700, color: cfg.color }}>
          {event.symbol.slice(0, 4)}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.3 }}>
          <Box sx={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</Box>
          {/* FIXED: was 9px — now 11px */}
          <Typography sx={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: cfg.color, fontFamily: NUMBER_FONT, textTransform: 'uppercase',
          }}>
            {cfg.label}
          </Typography>
          {/* FIXED: was 10px — now 12px */}
          <Typography sx={{ fontSize: 12, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: BODY }}>
            · {event.date}
          </Typography>
        </Box>
        
        <Typography sx={{
          fontSize: 13.5, color: 'var(--wc-text-primary)', fontFamily: BODY,
          lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {event.message}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        
        <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 15, fontWeight: 700, color: cfg.color }}>
          {fmtPkrSigned(event.profit)}
        </Typography>
        <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
          <PLBadge value={event.profit} pct={event.profitPct} />
        </Box>
      </Box>
    </Box>
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
  const [holdModalHolding, setHoldModalHolding] = useState<Holding | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [marketSnapshots, setMarketSnapshots] = useState<MarketSymbolSnapshot[]>([])
  const marketSnapshotsRef = useRef<MarketSymbolSnapshot[]>([])
  const [marketLoading, setMarketLoading] = useState(true)
  const [marketHistoryLoading, setMarketHistoryLoading] = useState(false)
  const marketHistoryLoadingRef = useRef(false)
  const marketHistoryLoadedRef = useRef({ kse100: false, kse30: false })
  const [userLoading, setUserLoading] = useState(false)
  const [sectorAllocation, setSectorAllocation] = useState<
    { sector: string; value: number; color: string }[]
  >([])
  

  const { user, loading: authLoading, clearError } = useAuth()
  const isLocked = !authLoading && !user

  const syncSnapshots = useCallback((data: MarketSymbolSnapshot[]) => {
    setMarketSnapshots(data)
    marketSnapshotsRef.current = data
  }, [])

  const [marketSummary, setMarketSummary] = useState<MarketSummary>(() => ({
    tradeDate: '',
    kse100_prev: 0, kse100_close: 0, kse100_change: 0,
    kse30_prev: 0, kse30_close: 0, kse30_change: 0,
    prev_volume: 0, curr_volume: 0,
    advances: 0, declines: 0, unchanged: 0,
    flu_no: null,
    kse100History: EMPTY_MARKET_HISTORY,
    kse30History: EMPTY_MARKET_HISTORY,
  }))
  

  useEffect(() => {
    if (isLocked) setAuthModalOpen(true)
  }, [isLocked])

  const processSummaryRows = useCallback((summaryRows: DbMarketSummaryRow[]) => {
    if (summaryRows.length === 0) return

    const normalized = normalizeSummaryRows(summaryRows)
    const latest = normalized[0]

    const kse100Close = latest.kse100_close ?? 0
    const kse30Close = latest.kse30_close ?? 0

    setMarketSummary((prev) => {
      const hasFullHistory =
        prev.kse100History['1Y'].values.length > 30 &&
        prev.kse30History['1Y'].values.length > 30

      return {
        tradeDate: latest.trade_date,
        kse100_prev: latest.kse100_prev ?? 0,
        kse100_close: kse100Close,
        kse100_change: latest.kse100_change ?? 0,
        kse30_prev: latest.kse30_prev ?? 0,
        kse30_close: kse30Close,
        kse30_change: latest.kse30_change ?? 0,
        prev_volume: latest.prev_volume ?? 0,
        curr_volume: latest.curr_volume ?? 0,
        advances: latest.advances ?? 0,
        declines: latest.declines ?? 0,
        unchanged: latest.unchanged ?? 0,
        flu_no: latest.flu_no,
        kse100History: hasFullHistory
          ? prev.kse100History
          : buildRealMarketHistory(normalized, 'kse100_close'),
        kse30History: hasFullHistory
          ? prev.kse30History
          : buildRealMarketHistory(normalized, 'kse30_close'),
      }
    })
  }, [])
  const lastFetchedUserIdRef = useRef<string | undefined>(undefined)
  const lastFetchedAuthLoadingRef = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    // While auth is still resolving, we don't yet know whether the user is
    // logged in. Firing a market-only fetch here would be immediately thrown
    // away once auth settles and loadUserData runs — so we skip it entirely.
    if (authLoading) return

    if (lastFetchedUserIdRef.current === user?.id && lastFetchedAuthLoadingRef.current === authLoading) {
      return
    }
    lastFetchedUserIdRef.current = user?.id
    lastFetchedAuthLoadingRef.current = authLoading

    let cancelled = false

    // ── Anonymous / no user ───────────────────────────────────────────────
    const loadMarketOnly = async () => {
      if (!hasStockService()) return
      setMarketLoading(true)
      try {
        const [summaryRows, snapshots] = await Promise.all([
          fetchMarketDailySummaryRows(2),
          fetchUniqueSymbols(),
        ])
        if (cancelled) return
        processSummaryRows(summaryRows)
        syncSnapshots(snapshots)
      } catch { /* silent */ }
      finally {
        if (!cancelled) setMarketLoading(false)
      }
    }

    // ── Authenticated user ────────────────────────────────────────────────
    const loadUserData = async () => {
      setMarketLoading(true)
      setUserLoading(true)
      try {
        // fetchWatchlistSymbols is included in the same Promise.all so all
        // four requests fire in parallel — eliminates the extra sequential RTT.
        const [summaryRows, trades, marketData, watchlistSymbols] = await Promise.all([
          fetchMarketDailySummaryRows(2),
          fetchUserTrades(),
          hasStockService() ? fetchUniqueSymbols() : Promise.resolve([] as MarketSymbolSnapshot[]),
          fetchWatchlistSymbols(),
        ])
        if (cancelled) return

        processSummaryRows(summaryRows)
        syncSnapshots(marketData)

        const marketMap = new Map(marketData.map((m) => [m.symbol, m]))

        const holdingsMap = new Map<string, {
          quantity: number; totalCost: number; buys: UserTrade[]; sells: UserTrade[]
        }>()
        for (const t of trades) {
          if (!holdingsMap.has(t.symbol)) {
            holdingsMap.set(t.symbol, { quantity: 0, totalCost: 0, buys: [], sells: [] })
          }
          const entry = holdingsMap.get(t.symbol)!
          if (t.trade_type === 'BUY') {
            entry.quantity += t.quantity
            entry.totalCost += t.quantity * t.price
            entry.buys.push(t)
          } else {
            entry.quantity -= t.quantity
            entry.totalCost -= t.quantity * t.price
            entry.sells.push(t)
          }
        }

        const sectorMap = new Map<string, number>()
        const userHoldings: Holding[] = []

        for (const [symbol, data] of holdingsMap) {
          if (data.quantity <= 0) continue
          const live = marketMap.get(symbol)
          const totalBuyQty = data.buys.reduce((sum, b) => sum + b.quantity, 0)
          const totalBuyCost = data.buys.reduce((sum, b) => sum + b.quantity * b.price, 0)
          const avgBuyPrice = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0
          const fallbackPrice = avgBuyPrice > 0 ? avgBuyPrice : (data.totalCost / data.quantity)
          const currentPrice = live?.price ?? fallbackPrice
          const prevFromChange = live ? currentPrice - (live.change ?? 0) : 0
          const prevFromSpark = live?.spark && live.spark.length >= 2
            ? live.spark[live.spark.length - 2]
            : 0
          const previousPrice = prevFromChange > 0 ? prevFromChange : (prevFromSpark > 0 ? prevFromSpark : currentPrice)
          const currentValue = currentPrice * data.quantity
          const costBasis = avgBuyPrice > 0 ? avgBuyPrice * data.quantity : data.totalCost
          const totalPL = currentValue - costBasis
          const totalPLPct = costBasis !== 0 ? (totalPL / costBasis) * 100 : 0
          const todayPL = (currentPrice - previousPrice) * data.quantity
          const todayPLPct = previousPrice !== 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0
          const sector = (live as any)?.sector || 'Unclassified'
          const shortSector = sector.length > 20 ? sector.slice(0, 18) + '…' : sector

          sectorMap.set(shortSector, (sectorMap.get(shortSector) ?? 0) + currentValue)

          userHoldings.push({
            symbol, company: live?.company ?? symbol, sector: shortSector,
            shares: data.quantity, price: currentPrice, avgCost: avgBuyPrice || (costBasis / data.quantity),
            marketValue: currentValue, todayPL, todayPLPct,
            totalPL, totalPLPct,
            buyLots: data.buys.map((b) => ({
              id: `${symbol.toLowerCase()}-${b.id}`,
              shares: b.quantity,
              price: b.price,
              date: b.trade_date,
            })),
          })
        }

        const sectorAlloc = Array.from(sectorMap.entries())
          .map(([sector, value], i) => ({
            sector, value, color: SECTOR_COLORS[i % SECTOR_COLORS.length],
          }))
          .filter((s) => s.value > 0)
          .sort((a, b) => b.value - a.value)

        setHoldings(userHoldings)
        setSectorAllocation(sectorAlloc)

        const events: HistoryEvent[] = trades
          .sort((a, b) => b.trade_date.localeCompare(a.trade_date))
          .slice(0, 10)
          .map((t) => ({
            symbol: t.symbol,
            type: t.trade_type === 'BUY' ? 'profit' : 'loss',
            message: t.trade_type === 'BUY' ? 'Buy order recorded' : 'Sell order recorded',
            profit: t.quantity * t.price,
            profitPct: 0,
            date: new Date(t.trade_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }),
          }))
        setHistoryEvents(events)

        // Watchlist resolved in the same Promise.all above — no extra RTT.
        if (watchlistSymbols.length > 0) {
          const dbWatchlist: WatchItem[] = watchlistSymbols.map((sym) => {
            const live = marketMap.get(sym)
            return live
              ? { symbol: live.symbol, company: live.company, sector: live.sector, price: live.price, change: live.change, changePct: live.changePct, volume: live.volume, spark: live.spark }
              : { symbol: sym, company: sym, sector: 'Unclassified', price: 0, change: 0, changePct: 0, volume: '--', spark: EMPTY_SPARK }
          })
          setWatchlist(dbWatchlist)
        } else {
          setWatchlist([])
        }
      } catch { /* silent degrade */ }
      finally {
        if (!cancelled) {
          setMarketLoading(false)
          setUserLoading(false)
        }
      }
    }

    if (!user) {
      loadMarketOnly()
    } else {
      loadUserData()
    }

    return () => { cancelled = true }
  }, [user, authLoading, syncSnapshots, processSummaryRows])

  // ── Derived values ────────────────────────────────────────────────────────

  const totalMV = useMemo(() => holdings.reduce((s, h) => s + h.marketValue, 0), [holdings])
  const dayPL = useMemo(() => holdings.reduce((s, h) => s + h.todayPL, 0), [holdings])
  const dayPLPct = useMemo(
    () => (totalMV - dayPL !== 0 ? (dayPL / (totalMV - dayPL)) * 100 : 0),
    [totalMV, dayPL],
  )
  const totalPL = useMemo(() => holdings.reduce((s, h) => s + h.totalPL, 0), [holdings])
  const totalPLPct = useMemo(
    () => (totalMV - totalPL !== 0 ? (totalPL / (totalMV - totalPL)) * 100 : 0),
    [totalMV, totalPL],
  )
  const totalShares = useMemo(() => holdings.reduce((s, h) => s + h.shares, 0), [holdings])

  const showMarketSkeleton = marketLoading && !marketSummary.tradeDate
  const showUserSkeleton = userLoading
  const hasMarketHistory =
    marketSummary.kse100History['1Y'].values.length > 30 &&
    marketSummary.kse30History['1Y'].values.length > 30

  useEffect(() => {
    if (
      !marketModalOpen ||
      marketHistoryLoadingRef.current ||
      (marketHistoryLoadedRef.current.kse100 && marketHistoryLoadedRef.current.kse30) ||
      hasMarketHistory
    ) return
    let cancelled = false
    marketHistoryLoadingRef.current = true
    setMarketHistoryLoading(true)
    Promise.all([
      fetchMarketHistoryRows('kse100_close', 252),
      fetchMarketHistoryRows('kse30_close', 252),
    ])
      .then(([kse100Rows, kse30Rows]) => {
        if (cancelled) return
        const kse100History = kse100Rows.length > 0 ? buildRealMarketHistory(kse100Rows, 'kse100_close') : null
        const kse30History = kse30Rows.length > 0 ? buildRealMarketHistory(kse30Rows, 'kse30_close') : null
        setMarketSummary((prev) => ({
          ...prev,
          ...(kse100History ? { kse100History } : {}),
          ...(kse30History ? { kse30History } : {}),
        }))
      })
      .finally(() => {
        if (!cancelled) {
          marketHistoryLoadedRef.current = { kse100: true, kse30: true }
          marketHistoryLoadingRef.current = false
          setMarketHistoryLoading(false)
        }
      })
    return () => {
      cancelled = true
      marketHistoryLoadingRef.current = false
    }
  }, [marketModalOpen, hasMarketHistory])

  const watchlistAvailableStocks = useMemo((): WatchItem[] =>
    marketSnapshots.map((m) => ({
      symbol: m.symbol, company: m.company, sector: m.sector, price: m.price,
      change: m.change, changePct: m.changePct, volume: m.volume, spark: m.spark,
    })), [marketSnapshots])

  const holdingAvailableStocks = useMemo(() =>
    marketSnapshots.map((m) => ({
      symbol: m.symbol, company: m.company, sector: m.sector, price: m.price,
    })), [marketSnapshots])

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const requireAuth = useCallback((): boolean => {
    if (user) return true
    setAuthModalOpen(true)
    return false
  }, [user])

  const openDrawer = useCallback(async (symbol: string) => {
    if (!hasStockService()) {
      const snap = marketSnapshotsRef.current.find((m) => m.symbol === symbol)
      if (snap) {
        setDrawerStock({
          symbol: snap.symbol, company: snap.company, sector: (snap as any).sector ?? '',
          industry: '', price: snap.price, change: snap.change, changePct: snap.changePct,
          volume: snap.volume, avgVolume: '--', sharesOutstanding: 'N/A',
          open: 0, previousClose: 0, dayLow: 0, dayHigh: 0,
          week52Low: 0, week52High: 0, week52ChangePct: 0,
          eps: 0, pe: 0, marketCap: 'N/A', dividendYield: 0, beta: 0,
          roe: 0, debtToEquity: 0, priceToBook: 0,
          spark: snap.spark, history30: snap.spark, historyLabels: [],
        })
        setDrawerOpen(true)
      }
      return
    }
    setDrawerLoading(true)
    setDrawerError(null)
    setDrawerStock(null)
    setDrawerOpen(true)
    try {
      const detail = await fetchStockDetail(symbol)
      setDrawerStock(detail)
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err && typeof (err as any).message === 'string'
          ? (err as any).message
          : 'Failed to load stock data.'
      setDrawerError(message)
      setDrawerStock(null)
    } finally {
      setDrawerLoading(false)
    }
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    const id = setTimeout(() => {
      setDrawerStock(null)
      setDrawerLoading(false)
      setDrawerError(null)
    }, 400)
    return () => clearTimeout(id)
  }, [])

  const handleSaveHolding = useCallback(async (holding: Holding) => {
    setHoldings((prev) => {
      const idx = prev.findIndex((h) => h.symbol === holding.symbol)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = holding; return next
      }
      return [...prev, holding]
    })
    if (user) {
      try {
        await deleteUserTradesBySymbol(holding.symbol)
        const today = new Date().toISOString().slice(0, 10)
        for (const lot of holding.buyLots) {
          await insertUserTrade({
            symbol: holding.symbol, trade_type: 'BUY',
            quantity: lot.shares, price: lot.price, trade_date: lot.date || today,
          })
        }
      } catch { /* silent */ }
    }
  }, [user])

  const handleAddToWatchlist = useCallback((item: WatchItem) => {
    setWatchlist((prev) => {
      if (prev.some((w) => w.symbol === item.symbol)) return prev
      return [...prev, item]
    })
    addToWatchlistDb(item.symbol).catch(() => { /* silent */ })
  }, [])

  const handleRemoveFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol))
    removeFromWatchlistDb(symbol).catch(() => { /* silent */ })
  }, [])

  const handleEditHolding = useCallback((symbol: string) => {
    if (!requireAuth()) return
    const found = holdings.find((h) => h.symbol === symbol)
    setHoldModalMode('manage')
    setHoldModalHolding(found ?? null)
    setHoldModalOpen(true)
  }, [requireAuth, holdings])

  const handleDeleteHolding = useCallback(async (symbol: string) => {
    if (!requireAuth()) return
    setHoldings((prev) => prev.filter((h) => h.symbol !== symbol))
    if (user) deleteUserTradesBySymbol(symbol).catch(() => { /* silent */ })
  }, [requireAuth, user])

  const openMarketModal = useCallback(() => { setMarketModalOpen(true) }, [])
  const closeMarketModal = useCallback(() => setMarketModalOpen(false), [])
  const closeAuthModal = useCallback(() => { clearError(); setAuthModalOpen(false) }, [clearError])
  const closeHoldModal = useCallback(() => setHoldModalOpen(false), [])
  const closeWatchModal = useCallback(() => setWatchModalOpen(false), [])

  const openAddHolding = useCallback(() => {
    if (!requireAuth()) return
    setHoldModalMode('new')
    setHoldModalHolding(null)
    setHoldModalOpen(true)
  }, [requireAuth])

  const openAddWatch = useCallback(() => {
    setWatchModalOpen(true)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

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
        <Stack spacing={{ xs: 7, md: 11 }}>

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <MotionReveal>
            <Box
              component={motion.section}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box sx={{
                display: 'flex', flexDirection: { xs: 'column', md: 'row' },
                alignItems: { md: 'flex-end' }, justifyContent: 'space-between', gap: 2,
              }}>
                <Box sx={{ maxWidth: 620 }}>
                  
                  <Typography sx={{
                    fontSize: 13, fontFamily: SERIF, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'var(--wc-primary)', mb: 1.5,
                  }}>
                    Portfolio
                  </Typography>
                  <Typography variant="h1" sx={{
                    fontSize: { xs: '1.6rem', sm: '2rem', md: '2.4rem' },
                    fontWeight: 700, color: 'var(--wc-text-primary)',
                    letterSpacing: '-0.03em', lineHeight: 1.08,
                  }}>
                    Your holdings at{' '}
                    <Box component="span" sx={{ color: 'var(--wc-primary)' }}>a glance.</Box>
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { md: 'right' }, pb: { md: 0.5 }, flexShrink: 0 }}>
                  
                  <Typography sx={{
                    fontSize: 14, color: 'var(--wc-text-secondary, #4a5e78)', fontWeight: 400,
                    letterSpacing: '0.02em', fontFamily: BODY, mb: 0.3,
                  }}>
                    Pakistan Stock Exchange · daily closing data
                  </Typography>
                </Box>
              </Box>
            </Box>
          </MotionReveal>

          {/* ── Market Snapshot ──────────────────────────────────────────── */}
          <MotionReveal>
            <Box>
              <Box sx={{ mb: 2.5 }}>
                {/* <SecLabel>Market Snapshot</SecLabel> */}
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'var(--wc-text-primary)', fontFamily: SERIF, letterSpacing: '-0.01em' }}>
                  Daily summary from PSX for {' '} {marketSummary.tradeDate
                      ? new Date(marketSummary.tradeDate).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  
                  <Typography component="span" sx={{ fontSize: 20,fontWeight: 700, color: 'var(--wc-text-primary)', fontFamily: SERIF }}>
                    
                  </Typography>
                </Typography>
              </Box>

              {showMarketSkeleton ? (
                <SkeletonIndexCard />
              ) : (
                <Box
                  onClick={openMarketModal}
                  sx={{
                    p: { xs: 2.4, md: 3.2 },
                    border: '1px solid var(--wc-divider)',
                    borderRadius: 1.5,
                    bgcolor: 'var(--wc-paper)',
                    cursor: 'pointer',
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    '&:hover': {
                      borderColor: 'rgba(10,36,99,0.25)',
                      boxShadow: '0 4px 20px rgba(10,36,99,0.06)',
                    },
                  }}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
                    {/* KSE 100 */}
                    <Box>
                      <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: { xs: 20, md: 24 }, fontWeight: 700, color: 'var(--wc-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        KSE 100: {marketSummary.kse100_close.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, mt: 0.6 }}>
                        {marketSummary.kse100_change >= 0
                          ? <TrendingUpIcon sx={{ fontSize: 35, color: 'var(--wc-success)' }} />
                          : <TrendingDownIcon sx={{ fontSize: 35, color: 'var(--wc-error)' }} />}
                        <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 25, fontWeight: 600, color: marketSummary.kse100_change >= 0 ? 'var(--wc-success)' : 'var(--wc-error)' }}>
                          {marketSummary.kse100_change >= 0 ? '+' : ''}{marketSummary.kse100_change.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* KSE 30 */}
                    <Box sx={{ borderLeft: '1px solid var(--wc-divider)', pl: 2 }}>
                      <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: { xs: 20, md: 24 }, fontWeight: 700, color: 'var(--wc-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        KSE 30: {marketSummary.kse30_close.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, mt: 0.6 }}>
                        {marketSummary.kse30_change >= 0
                          ? <TrendingUpIcon sx={{ fontSize: 35, color: 'var(--wc-success)' }} />
                          : <TrendingDownIcon sx={{ fontSize: 35, color: 'var(--wc-error)' }} />}
                        <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 25, fontWeight: 600, color: marketSummary.kse30_change >= 0 ? 'var(--wc-success)' : 'var(--wc-error)' }}>
                          {marketSummary.kse30_change >= 0 ? '+' : ''}{marketSummary.kse30_change.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Footer row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: '1px solid var(--wc-divider)' }}>
                    
                    
                    <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--wc-primary)', fontFamily: NUMBER_FONT }}>
                      View chart →
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </MotionReveal>

          {/* ── Auth gate ────────────────────────────────────────────────── */}
          {isLocked && (
            <MotionReveal>
              <Box sx={{
                border: '1px solid var(--wc-divider)', borderRadius: 2,
                bgcolor: 'var(--wc-paper)', overflow: 'hidden', position: 'relative',
                '&::before': {
                  content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: 'linear-gradient(90deg, var(--wc-primary), var(--wc-primary) 40%, rgba(10,36,99,0.15) 100%)',
                },
              }}>
                <Box sx={{
                  display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                  gap: { xs: 3, md: 4 }, alignItems: 'center', p: { xs: 3, md: 4 },
                }}>
                  <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '14px',
                      bgcolor: 'rgba(10,36,99,0.06)', border: '1px solid rgba(10,36,99,0.12)',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      color: 'var(--wc-primary)', mt: 0.3, display: { xs: 'none', sm: 'flex' },
                    }}>
                      <VisibilityOffOutlinedIcon sx={{ fontSize: 22, opacity: 0.7 }} />
                    </Box>
                    <Box>
                     
                      <Typography sx={{
                        fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--wc-primary)',
                        fontFamily: NUMBER_FONT, mb: 0.8,
                      }}>
                        Portfolio Access
                      </Typography>
                      <Typography sx={{
                        fontSize: { xs: 17, md: 20 }, fontWeight: 700,
                        color: 'var(--wc-text-primary)', fontFamily: SERIF,
                        letterSpacing: '-0.02em', lineHeight: 1.2, mb: 0.8,
                      }}>
                        Sign in to unlock your portfolio
                      </Typography>
                      
                      <Typography sx={{ fontSize: 14, color: 'var(--wc-text-primary)', lineHeight: 1.6, maxWidth: 520 }}>
                        Holdings, watchlist, and trade history sync automatically to your Google account — available on any device.
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{
                    display: 'flex', flexDirection: { xs: 'row', md: 'column' },
                    gap: 1.5, alignItems: { md: 'flex-end' }, flexShrink: 0,
                  }}>
                    <CustomButton
                      variant="contained" tone="light" startIcon={<GoogleIcon />}
                      style={{ fontSize: '0.82rem', paddingInline: '1.3rem', paddingBlock: '0.55rem', whiteSpace: 'nowrap' }}
                      onClick={() => setAuthModalOpen(true)}
                    >
                      Sign in with Google
                    </CustomButton>
                  </Box>
                </Box>
              </Box>
            </MotionReveal>
          )}

          {/* ── Locked blur wrapper ──────────────────────────────────────── */}
          <Box sx={{
            filter: isLocked ? 'blur(6px)' : 'none',
            opacity: isLocked ? 0.7 : 1,
            pointerEvents: isLocked ? 'none' : 'auto',
            transition: 'filter 0.2s ease, opacity 0.2s ease',
          }}>

            {/* Portfolio Value card */}
            <MotionReveal>
              <Box sx={{
                mb: 2,
                border: '1px solid var(--wc-divider)', borderRadius: 1.5,
                bgcolor: 'var(--wc-paper)', p: { xs: 2.4, md: 3.2 },
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                '&::before': {
                  content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: totalPL >= 0
                    ? 'linear-gradient(90deg, var(--wc-success), rgba(13,92,50,0.15))'
                    : 'linear-gradient(90deg, var(--wc-error), rgba(180,40,58,0.15))',
                },
              }}>
                <SecLabel>Total Portfolio Value</SecLabel>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Typography sx={{
                    fontFamily: NUMBER_FONT, fontSize: { xs: 26, md: 38 },
                    fontWeight: 700, color: 'var(--wc-text-primary)',
                    letterSpacing: '-0.04em', lineHeight: 1,
                  }}>
                    {fmtPkr(totalMV)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                  <StatTile label="Day P/L" value={fmtPkrSigned(dayPL)} positive={dayPL >= 0} sub={`${dayPL >= 0 ? '+' : ''}${dayPLPct.toFixed(2)}% today`} />
                  <StatTile label="Total Return" value={fmtPkrSigned(totalPL)} positive={totalPL >= 0} sub={`${totalPL >= 0 ? '+' : ''}${totalPLPct.toFixed(2)}% all time`} />
                  <StatTile label="Total Shares" value={fmtCompact(totalShares)} sub={`${holdings.length} positions`} />
                </Box>
              </Box>
            </MotionReveal>

            {/* Sector Allocation */}
            <MotionReveal>
              <Card>
                <SecLabel>Sector Allocation</SecLabel>
                
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'var(--wc-text-primary)', fontFamily: SERIF, letterSpacing: '-0.01em', mb: 2.5 }}>
                  Where your capital is deployed.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {totalMV === 0 ? (
                    <EmptyState icon={<InboxOutlinedIcon sx={{ fontSize: 20 }} />} title="No capital deployed" subtitle="Add holdings to see your sector allocation." />
                  ) : (
                    sectorAllocation.map((s) => {
                      const pct = (s.value / totalMV) * 100
                      return (
                        <Box key={s.sector} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          
                          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 12, fontWeight: 600, color: 'var(--wc-text-primary)', minWidth: 80, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                         
                          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 13, fontWeight: 600, color: 'var(--wc-text-primary)', minWidth: 48, textAlign: 'right' }}>
                            {pct.toFixed(1)}%
                          </Typography>
                          
                          <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 12.5, color: 'var(--wc-text-secondary, #4a5e78)', fontWeight: 500, minWidth: 72, textAlign: 'right' }}>
                            {fmtCompact(s.value)}
                          </Typography>
                        </Box>
                      )
                    })
                  )}
                </Box>
              </Card>
            </MotionReveal>

            {/* Holdings + Watchlist */}
            <MotionReveal>
              <Box sx={{ borderTop: '1px solid var(--wc-divider)', pt: 4, mb: 5, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.8 }}>
                    <ShowChartIcon sx={{ fontSize: 14, color: 'var(--wc-primary)', opacity: 0.7 }} />
                    <SecLabel>Holdings</SecLabel>
                  </Box>
                  
                  <Typography sx={{ fontSize: { xs: 15, md: 17 }, fontWeight: 700, color: 'var(--wc-text-primary)', fontFamily: SERIF }}>
                    {holdings.length} active positions.
                  </Typography>
                </Box>
                
                <Typography sx={{ fontSize: 13, color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT }}>
                  {fmt(totalShares)} total shares
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'grid', gap: { xs: 2, md: 2.5 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.55fr) minmax(0, 1fr)' }, alignItems: 'start' }}>

                
                <Card sx={{ p: { xs: 1, md: 1.4 }, display: 'flex', flexDirection: 'column', height: 520 }}>
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2, px: 0.5, mb: 0.5, flexShrink: 0 }}>
                    <Box sx={{ width: 40, flexShrink: 0 }} />
                    <Box sx={{ flex: '0 0 134px' }}><ColHead>Stock</ColHead></Box>
                    <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}><ColHead>Price / Shares</ColHead></Box>
                    <Box sx={{ textAlign: 'right', minWidth: 72 }}><ColHead align="right">Mkt Val</ColHead></Box>
                    <Box sx={{ textAlign: 'right', minWidth: 90 }}><ColHead align="right">Day P/L</ColHead></Box>
                    <Box sx={{ textAlign: 'right', minWidth: 95 }}><ColHead align="right">Total P/L</ColHead></Box>
                    <Box sx={{ width: 32 }} />
                  </Box>
                  <Divider sx={{ borderColor: 'var(--wc-divider)', mb: 0.5, flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />

                  <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.5, scrollbarGutter: 'stable' }}>
                    {showUserSkeleton ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <Box key={`holding-skel-${i}`}>
                          <SkeletonHoldingRow />
                          {i < 4 && <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.5 }} />}
                        </Box>
                      ))
                    ) : holdings.length === 0 ? (
                      <EmptyState icon={<InboxOutlinedIcon sx={{ fontSize: 20 }} />} title="No holdings yet" subtitle={`Click "Add holding" to build your portfolio.`} />
                    ) : (
                      holdings.map((h, i) => (
                        <Box key={h.symbol}>
                          <HoldingRow h={h} index={i} onEdit={handleEditHolding} />
                          {i < holdings.length - 1 && <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.5 }} />}
                        </Box>
                      ))
                    )}
                  </Box>

                  <Box sx={{ flexShrink: 0, mt: 2, pt: 2, borderTop: '1px solid var(--wc-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                    
                    <Typography sx={{ fontSize: 13.5, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: BODY }}>
                      Total invested ·{' '}
                      <Box component="span" sx={{ fontFamily: NUMBER_FONT, color: 'var(--wc-text-primary)', fontWeight: 600 }}>
                        {fmtPkr(totalMV - totalPL)}
                      </Box>
                    </Typography>
                    <CustomButton
                      variant="contained" tone="light" startIcon={<AddRoundedIcon />}
                      style={{ fontSize: '0.78rem', paddingInline: '1rem', paddingBlock: '0.45rem' }}
                      onClick={openAddHolding}
                    >
                      Add holding
                    </CustomButton>
                  </Box>
                </Card>

                {/* Watchlist */}
                <Card sx={{ p: { xs: 2, md: 2.4 }, display: 'flex', flexDirection: 'column', height: 520 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexShrink: 0 }}>
                    <Box>
                      <SecLabel>Watchlist</SecLabel>
                    </Box>

                    <Box
                      onClick={openAddWatch}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.6,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        '&:hover .settings-icon': {
                          transform: 'rotate(90deg)',
                        },
                        '&:hover .manage-text': {
                          color: 'var(--wc-text-primary)',
                        },
                      }}
                    >
                      <SettingsIcon
                        className="settings-icon"
                        sx={{
                          fontSize: 16,
                          color: '#071f38',
                          transition: 'transform 0.35s ease',
                        }}
                      />
                      
                      <Typography
                        className="manage-text"
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--wc-primary)',
                          fontFamily: SERIF,
                          transition: 'color 0.2s ease',
                          lineHeight: 1,
                        }}
                      >
                        Manage
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', mr: { xs: -2, md: -2.4 }, pr: 2, scrollbarGutter: 'stable' }}>
                    {showUserSkeleton ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <Box key={`watch-skel-${i}`}>
                          <SkeletonWatchRow />
                          {i < 4 && <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.4 }} />}
                        </Box>
                      ))
                    ) : watchlist.length === 0 ? (
                      <EmptyState icon={<StarBorderIcon sx={{ fontSize: 20 }} />}
                        title="No stocks watched yet" subtitle={`Click "+ Add" to start tracking your favourites.`} />
                    ) : (
                      watchlist.map((item, i) => (
                        <Box key={item.symbol}>
                          <WatchRow item={item} index={i} onClick={() => openDrawer(item.symbol)} />
                          {i < watchlist.length - 1 && <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.4 }} />}
                        </Box>
                      ))
                    )}
                  </Box>
                </Card>
              </Box>
            </MotionReveal>

            {/* Trade History */}
            <MotionReveal>
              <Card sx={{ p: { xs: 2.4, md: 3 } }}>
                <Box sx={{ mb: 2 }}>
                  <SecLabel>Trade History</SecLabel>
                
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'var(--wc-text-primary)', fontFamily: SERIF, letterSpacing: '-0.01em' }}>
                    Recent activity
                  </Typography>
                </Box>
                {showUserSkeleton ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Box key={`history-skel-${i}`}>
                      <SkeletonHistoryRow />
                      {i < 3 && <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.4 }} />}
                    </Box>
                  ))
                ) : historyEvents.length === 0 ? (
                  <EmptyState icon={<ReceiptLongOutlinedIcon sx={{ fontSize: 20 }} />} title="No trade history yet" subtitle="Your buy and sell activity will appear here." />
                ) : (
                  historyEvents.map((ev, i) => (
                    <Box key={`${ev.symbol}-${i}`}>
                      <HistRow event={ev} index={i} />
                      {i < historyEvents.length - 1 && <Divider sx={{ borderColor: 'var(--wc-divider)', opacity: 0.4 }} />}
                    </Box>
                  ))
                )}
              </Card>
            </MotionReveal>
          </Box>

          {/* Footer */}
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            sx={{ textAlign: 'center', pt: 2 }}
          >
            
            <Typography sx={{ fontSize: 13, color: 'var(--wc-text-secondary, #4a5e78)', fontFamily: BODY, letterSpacing: '0.02em' }}>
              For informational purposes only · Not financial advice · Webict Capital
            </Typography>
          </Box>

        </Stack>
      </Container>

      <StockDrawer open={drawerOpen} onClose={handleCloseDrawer} stock={drawerStock} loading={drawerLoading} error={drawerError} />
      <MarketSummaryModal
        open={marketModalOpen}
        onClose={closeMarketModal}
        summary={marketSummary}
        loading={showMarketSkeleton || marketHistoryLoading}
      />
      <HoldingModal open={holdModalOpen} onClose={closeHoldModal} holdings={holdings} onSave={handleSaveHolding} onDelete={handleDeleteHolding} initialMode={holdModalMode} initialHolding={holdModalHolding} availableStocks={holdingAvailableStocks.length > 0 ? holdingAvailableStocks : undefined} />
      <WatchlistModal
        open={watchModalOpen}
        onClose={closeWatchModal}
        watchlist={watchlist}
        onAdd={handleAddToWatchlist}
        onRemove={handleRemoveFromWatchlist}
        availableStocks={watchlistAvailableStocks.length > 0 ? watchlistAvailableStocks : undefined}
      />
      <AuthModal open={authModalOpen} onClose={closeAuthModal} />
    </Box>
  )
}