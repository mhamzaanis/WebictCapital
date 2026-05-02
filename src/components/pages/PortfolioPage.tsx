import AddRoundedIcon from '@mui/icons-material/AddRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { Box, Container, Divider, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { useState, useMemo } from 'react'
import { SparkLineChart } from '@mui/x-charts'
import { MotionReveal } from '../animations/MotionReveal'
import { CustomButton } from '../CustomButton'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Holding = {
  symbol: string
  company: string
  sector: string
  shares: number
  price: number
  avgCost: number
  marketValue: number
  todayPL: number
  todayPLPct: number
  totalPL: number
  totalPLPct: number
}

type HistoryEvent = {
  symbol: string
  type: 'profit' | 'dividend' | 'loss'
  message: string
  profit: number
  profitPct: number
  date: string
}

type WatchItem = {
  symbol: string
  company: string
  price: number
  change: number
  changePct: number
  volume: string
  spark: number[]
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const holdings: Holding[] = [
  {
    symbol: 'HBL',
    company: 'Habib Bank Ltd',
    sector: 'Banking',
    shares: 408_011,
    price: 117.03,
    avgCost: 119.58,
    marketValue: 47_749_417,
    todayPL: 1_394,
    todayPLPct: 0.35,
    totalPL: -10_109,
    totalPLPct: -2.48,
  },
  {
    symbol: 'NESTLE',
    company: 'Nestlé Pakistan',
    sector: 'Consumer',
    shares: 5_300,
    price: 5_725.49,
    avgCost: 5_300.0,
    marketValue: 30_345_097,
    todayPL: 425_490,
    todayPLPct: 8.03,
    totalPL: 425_490,
    totalPLPct: 8.03,
  },
  {
    symbol: 'TRG',
    company: 'TRG Pakistan',
    sector: 'Technology',
    shares: 26_040,
    price: 130.2,
    avgCost: 143.8,
    marketValue: 3_390_408,
    todayPL: -23_760,
    todayPLPct: -9.12,
    totalPL: -23_760,
    totalPLPct: -9.12,
  },
  {
    symbol: 'MARI',
    company: 'Mari Petroleum',
    sector: 'Energy',
    shares: 12_000,
    price: 445.75,
    avgCost: 430.5,
    marketValue: 5_349_000,
    todayPL: 48_000,
    todayPLPct: 0.91,
    totalPL: 182_400,
    totalPLPct: 3.53,
  },
  {
    symbol: 'SYS',
    company: 'Systems Ltd',
    sector: 'Technology',
    shares: 18_500,
    price: 312.6,
    avgCost: 304.2,
    marketValue: 5_783_100,
    todayPL: -12_950,
    todayPLPct: -0.22,
    totalPL: 156_200,
    totalPLPct: 2.78,
  },
]

const totalMV = holdings.reduce((s, h) => s + h.marketValue, 0)
const dayPL = holdings.reduce((s, h) => s + h.todayPL, 0)
const dayPLPct = totalMV - dayPL !== 0 ? (dayPL / (totalMV - dayPL)) * 100 : 0
const totalPL = holdings.reduce((s, h) => s + h.totalPL, 0)
const totalPLPct = totalMV - totalPL !== 0 ? (totalPL / (totalMV - totalPL)) * 100 : 0
const totalShares = holdings.reduce((s, h) => s + h.shares, 0)

const historyEvents: HistoryEvent[] = [
  { symbol: 'KEL', type: 'profit', message: 'Total PROFIT realised on exit', profit: 147_100, profitPct: 437.02, date: '28 Dec' },
  { symbol: 'HBL', type: 'profit', message: 'Partial sell — PROFIT realised', profit: 23_649, profitPct: 10.22, date: '21 Dec' },
  { symbol: 'EFERT', type: 'dividend', message: 'Dividend received', profit: 42_500, profitPct: 3.8, date: '15 Dec' },
  { symbol: 'TRG', type: 'loss', message: 'Stop-loss triggered', profit: -11_240, profitPct: -4.3, date: '10 Dec' },
]

const watchlist: WatchItem[] = [
  { symbol: 'OGDC', company: 'Oil & Gas Dev. Co.', price: 158.4, change: 2.3, changePct: 1.47, volume: '4.2M', spark: [14, 15, 13, 16, 12, 11, 10, 9, 11, 10, 9, 8] },
  { symbol: 'ENGRO', company: 'Engro Corporation', price: 286.0, change: -4.1, changePct: -1.41, volume: '1.8M', spark: [9, 10, 11, 13, 15, 17, 18, 20, 21, 22, 20, 21] },
  { symbol: 'LUCK', company: 'Lucky Cement', price: 1_024.5, change: 8.7, changePct: 0.86, volume: '890K', spark: [20, 18, 17, 16, 15, 14, 12, 10, 9, 8, 7, 6] },
  { symbol: 'PSO', company: 'Pakistan State Oil', price: 312.9, change: -3.6, changePct: -1.14, volume: '3.1M', spark: [8, 10, 11, 13, 14, 17, 19, 20, 21, 22, 21, 23] },
  { symbol: 'MCB', company: 'MCB Bank Ltd', price: 198.6, change: 1.2, changePct: 0.61, volume: '2.4M', spark: [10, 11, 12, 10, 13, 14, 15, 14, 16, 17, 16, 18] },
]

// ─── Design tokens (matching theme.ts) ─────────────────────────────────────────

const mono = 'var(--wc-number-font)'
const serif = '"Playfair Display", serif'

const colors = {
  ink: '#080e1a',
  ink2: '#4a5e78',
  muted: '#8097b0',
  accent: '#0a2463',
  border: '#e2eaf5',
  surface: '#fafbfd',
  bg: '#ffffff',
  pos: '#1a6640',
  neg: '#b4283a',
}

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

// ─── Micro: P/L badge ──────────────────────────────────────────────────────────

function PLBadge({ value, pct }: { value: number; pct: number }) {
  const positive = value >= 0
  const Icon = positive ? TrendingUpIcon : TrendingDownIcon
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3 }}>
      <Icon sx={{ fontSize: 10, color: positive ? colors.pos : colors.neg }} />
      <Typography sx={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: positive ? colors.pos : colors.neg }}>
        {positive ? '+' : ''}{Math.abs(pct).toFixed(2)}%
      </Typography>
    </Box>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontFamily: serif,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: colors.accent,
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  )
}

// ─── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({
  label, value, sub, positive,
}: {
  label: string; value: string; sub?: string; positive?: boolean
}) {
  const valueColor = positive === undefined ? colors.ink : positive ? colors.pos : colors.neg
  return (
    <Box
      sx={{
        p: 2,
        border: `1px solid ${colors.border}`,
        borderRadius: 1,
        bgcolor: colors.surface,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: colors.accent,
          boxShadow: '0 4px 24px rgba(10,36,99,0.07)',
        },
      }}
    >
      <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.muted, textTransform: 'uppercase', fontFamily: serif, mb: 0.6 }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: valueColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 10.5, color: colors.muted, fontFamily: serif, mt: 0.4 }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

// ─── Card shell ────────────────────────────────────────────────────────────────

function Card({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        border: `1px solid ${colors.border}`,
        borderRadius: 1.5,
        bgcolor: colors.bg,
        p: { xs: 2.4, md: 3.2 },
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: colors.accent,
          boxShadow: '0 4px 24px rgba(10,36,99,0.07)',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

// ─── Holding row ───────────────────────────────────────────────────────────────

function HoldingRow({ h, index }: { h: Holding; index: number }) {
  const reduce = useReducedMotion()
  const [hov, setHov] = useState(false)
  const posToday = h.todayPL >= 0
  const posTotal = h.totalPL >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      sx={{
        py: 1.4,
        px: 1.2,
        mx: -1.2,
        borderRadius: '8px',
        bgcolor: hov ? 'rgba(10,36,99,0.03)' : 'transparent',
        transition: 'background-color 0.2s ease',
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
            bgcolor: hov ? 'rgba(10,36,99,0.06)' : colors.surface,
            border: `1px solid ${hov ? 'rgba(10,36,99,0.25)' : colors.border}`,
            transition: 'all 0.2s ease',
          }}
        >
          <Typography sx={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: hov ? colors.accent : colors.ink2, letterSpacing: '0.02em' }}>
            {h.symbol.length <= 3 ? h.symbol : h.symbol.slice(0, 3)}
          </Typography>
        </Box>

        {/* Name + sector */}
        <Box sx={{ minWidth: 0, flex: { xs: '0 0 90px', sm: '0 0 130px' } }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: colors.ink, fontFamily: serif, lineHeight: 1.2 }}>
            {h.symbol}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: colors.ink2, mt: 0.2, fontFamily: serif, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {h.company}
          </Typography>
          <Typography
            sx={{
              display: 'inline-block',
              mt: 0.5,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: colors.accent,
              fontFamily: mono,
              px: 0.5,
              py: 0.15,
              borderRadius: '3px',
              bgcolor: 'rgba(10,36,99,0.06)',
              border: `1px solid rgba(10,36,99,0.15)`,
              lineHeight: 1.5,
            }}
          >
            {h.sector}
          </Typography>
        </Box>

        {/* Price + shares (desktop) */}
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
          <Typography sx={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: colors.ink }}>
            Rs. {h.price.toFixed(2)}
          </Typography>
          <Typography sx={{ fontSize: 10, color: colors.muted, mt: 0.2, fontFamily: mono }}>
            {fmt(h.shares)} shares · avg {h.avgCost.toFixed(2)}
          </Typography>
        </Box>

        {/* Market Value (desktop) */}
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, minWidth: 72 }}>
          <Typography sx={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: colors.ink }}>
            {fmtCompact(h.marketValue)}
          </Typography>
          <Typography sx={{ fontSize: 9.5, color: colors.muted, fontFamily: serif, mt: 0.15 }}>
            Mkt Value
          </Typography>
        </Box>

        {/* Day P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 80, sm: 90 } }}>
          <Typography sx={{ fontFamily: mono, fontSize: 11.5, fontWeight: 700, color: posToday ? colors.pos : colors.neg, lineHeight: 1 }}>
            {fmtPkrSigned(h.todayPL)}
          </Typography>
          <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={h.todayPL} pct={h.todayPLPct} />
          </Box>
          <Typography sx={{ fontSize: 9, color: colors.muted, fontFamily: serif, mt: 0.2 }}>Day</Typography>
        </Box>

        {/* Total P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 80, sm: 95 } }}>
          <Typography sx={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: posTotal ? colors.pos : colors.neg, lineHeight: 1 }}>
            {fmtPkrSigned(h.totalPL)}
          </Typography>
          <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={h.totalPL} pct={h.totalPLPct} />
          </Box>
          <Typography sx={{ fontSize: 9, color: colors.muted, fontFamily: serif, mt: 0.2 }}>Total</Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ─── Watchlist row ─────────────────────────────────────────────────────────────

function WatchRow({ item, index }: { item: WatchItem; index: number }) {
  const reduce = useReducedMotion()
  const [hov, setHov] = useState(false)
  const pos = item.change >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      sx={{
        py: 1.2,
        px: 1,
        mx: -1,
        borderRadius: '7px',
        bgcolor: hov ? 'rgba(10,36,99,0.03)' : 'transparent',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Symbol */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Typography sx={{ fontFamily: mono, fontSize: 12.5, fontWeight: 700, color: colors.ink }}>
              {item.symbol}
            </Typography>
            <StarBorderIcon sx={{ fontSize: 12, color: colors.muted, opacity: hov ? 1 : 0, transition: 'opacity 0.2s ease' }} />
          </Box>
          <Typography sx={{ fontSize: 10, color: colors.ink2, fontFamily: serif, mt: 0.1 }}>
            {item.company}
          </Typography>
        </Box>

        {/* Sparkline */}
        <Box sx={{ width: 64, flexShrink: 0 }}>
          <SparkLineChart
            data={item.spark}
            width={64}
            height={32}
            curve="natural"
            color={pos ? colors.pos : colors.neg}
            sx={{ '& .MuiChartsAxis-root': { display: 'none' } }}
          />
        </Box>

        {/* Price & Change */}
        <Box sx={{ textAlign: 'right', minWidth: 90, flexShrink: 0 }}>
          <Typography sx={{ fontFamily: mono, fontSize: 12.5, fontWeight: 700, color: colors.ink }}>
            Rs. {fmt(item.price)}
          </Typography>
          <Typography sx={{ fontFamily: mono, fontSize: 10.5, fontWeight: 600, color: pos ? colors.pos : colors.neg }}>
            {pos ? '+' : ''}{item.change.toFixed(1)} ({pos ? '+' : ''}{item.changePct.toFixed(2)}%)
          </Typography>
        </Box>

        {/* Volume */}
        <Box sx={{ textAlign: 'right', minWidth: 46, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
          <Typography sx={{ fontFamily: mono, fontSize: 10.5, color: colors.muted }}>
            {item.volume}
          </Typography>
          <Typography sx={{ fontSize: 9, color: colors.muted, fontFamily: serif, mt: 0.15 }}>vol</Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ─── History row ───────────────────────────────────────────────────────────────

const histStyles: Record<string, { color: string; label: string }> = {
  profit:   { color: colors.pos, label: 'PROFIT' },
  dividend: { color: '#b77a12', label: 'DIVIDEND' },
  loss:     { color: colors.neg, label: 'LOSS' },
}

function HistRow({ event, index }: { event: HistoryEvent; index: number }) {
  const reduce = useReducedMotion()
  const cfg = histStyles[event.type]

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      sx={{ py: 1.2, display: 'flex', alignItems: 'center', gap: 1.4 }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '8px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${cfg.color}10`,
          border: `1px solid ${cfg.color}25`,
        }}
      >
        <Typography sx={{ fontFamily: mono, fontSize: 9.5, fontWeight: 800, color: cfg.color }}>
          {event.symbol}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: cfg.color, fontFamily: mono, textTransform: 'uppercase' }}>
            {cfg.label}
          </Typography>
          <Typography sx={{ fontSize: 10, color: colors.muted, fontFamily: serif }}>· {event.date}</Typography>
        </Box>
        <Typography sx={{ fontSize: 11.5, color: colors.ink2, fontFamily: serif, lineHeight: 1.4 }}>
          {event.message}
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: cfg.color }}>
          {fmtPkrSigned(event.profit)}
        </Typography>
        <Box sx={{ mt: 0.3, display: 'flex', justifyContent: 'flex-end' }}>
          <PLBadge value={event.profit} pct={event.profitPct} />
        </Box>
      </Box>
    </Box>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PortfolioPage() {
  const reduce = useReducedMotion()

  const mvFmt = useMemo(() => fmtPkr(totalMV), [])
  const dayFmt = useMemo(() => fmtPkrSigned(dayPL), [])
  const totalFmt = useMemo(() => fmtPkrSigned(totalPL), [])
  const sharesFmt = useMemo(() => fmtCompact(totalShares), [])

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 14 },
        bgcolor: colors.bg,
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={{ xs: 6, md: 10 }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <MotionReveal>
            <Box
              component={motion.section}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box sx={{ maxWidth: 80 }} />

              <Stack spacing={4} sx={{ maxWidth: 720 }}>
                <SecLabel>Portfolio</SecLabel>

                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.4rem', sm: '3rem', md: '3.8rem', lg: '4.4rem' },
                    lineHeight: 1.04,
                    letterSpacing: '-0.03em',
                    color: colors.ink,
                    fontWeight: 700,
                  }}
                >
                  Your holdings at{' '}
                  <Box component="span" sx={{ color: colors.accent }}>
                    a glance
                  </Box>
                  .
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: 16, md: 18 },
                    color: colors.ink2,
                    lineHeight: 1.78,
                    maxWidth: 560,
                  }}
                >
                  Track performance, monitor positions, and stay informed with real-time
                  portfolio analytics across the Pakistan Stock Exchange.
                </Typography>
              </Stack>
            </Box>
          </MotionReveal>

          {/* ── Portfolio Value ─────────────────────────────────────────── */}
          <MotionReveal>
            <Card>
              <SecLabel>Total Portfolio Value</SecLabel>
              <Typography
                sx={{
                  fontFamily: mono,
                  fontSize: { xs: 28, md: 40 },
                  fontWeight: 700,
                  color: colors.ink,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  mb: 3,
                }}
              >
                {mvFmt}
              </Typography>

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

          {/* ── Holdings + Watchlist ───────────────────────────────────── */}
          <MotionReveal>
            <Box
              sx={{
                borderTop: '1px solid #e2eaf5',
                pt: 5,
                mb: 5,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <SecLabel>Holdings</SecLabel>
                <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, color: colors.ink, letterSpacing: '-0.025em' }}>
                  Current positions.
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: colors.muted, fontFamily: serif }}>
                {fmt(totalShares)} total shares · {holdings.length} positions
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.5fr) minmax(0, 1fr)' },
                alignItems: 'start',
              }}
            >
              {/* Holdings */}
              <Card sx={{ p: { xs: 2, md: 2.4 }, minWidth: 0, '&:hover': { borderColor: colors.border, boxShadow: 'none' } }}>
                {/* Column headers (desktop) */}
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
                  <Box sx={{ flex: '0 0 130px' }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono }}>
                      Stock
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono }}>
                      Price / Shares
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', minWidth: 72 }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono }}>
                      Mkt Val
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', minWidth: 90 }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono }}>
                      Day P/L
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', minWidth: 95 }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: mono }}>
                      Total P/L
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: colors.border, mb: 0.5, display: { xs: 'none', sm: 'block' } }} />

                <Box sx={{ maxHeight: { xs: 420, md: 520 }, overflowY: 'auto', overflowX: 'hidden', pr: 0.5 }}>
                  {holdings.map((h, i) => (
                    <Box key={h.symbol}>
                      <HoldingRow h={h} index={i} />
                      {i < holdings.length - 1 && <Divider sx={{ borderColor: colors.border, opacity: 0.5 }} />}
                    </Box>
                  ))}
                </Box>

                {/* Footer */}
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: colors.muted, fontFamily: serif }}>
                    Total invested ·{' '}
                    <Box component="span" sx={{ fontFamily: mono, color: colors.ink2, fontWeight: 600 }}>
                      {fmtPkr(totalMV - totalPL)}
                    </Box>
                  </Typography>
                  <CustomButton
                    variant="contained"
                    tone="light"
                    startIcon={<AddRoundedIcon />}
                    style={{ fontSize: '0.78rem', paddingInline: '1rem', paddingBlock: '0.45rem' }}
                  >
                    Add holding
                  </CustomButton>
                </Box>
              </Card>

              {/* Watchlist */}
              <Card sx={{ p: { xs: 2, md: 2.4 }, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <SecLabel>Watchlist</SecLabel>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.ink, fontFamily: serif, letterSpacing: '-0.01em' }}>
                      Favourites
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.accent,
                      fontFamily: serif,
                      cursor: 'pointer',
                      '&:hover': { color: colors.ink },
                      transition: 'color 0.2s ease',
                    }}
                  >
                    + Add
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: { xs: 360, md: 520 }, overflowY: 'auto', overflowX: 'hidden', pr: 0.5 }}>
                  {watchlist.map((item, i) => (
                    <Box key={item.symbol}>
                      <WatchRow item={item} index={i} />
                      {i < watchlist.length - 1 && <Divider sx={{ borderColor: colors.border, opacity: 0.4 }} />}
                    </Box>
                  ))}
                </Box>
              </Card>
            </Box>
          </MotionReveal>

          {/* ── Trade History ─────────────────────────────────────────── */}
          <MotionReveal>
            <Card sx={{ p: { xs: 2, md: 2.4 } }}>
              <Box sx={{ mb: 2 }}>
                <SecLabel>Trade History</SecLabel>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.ink, fontFamily: serif, letterSpacing: '-0.01em' }}>
                  Recent activity
                </Typography>
              </Box>
              {historyEvents.map((ev, i) => (
                <Box key={`${ev.symbol}-${i}`}>
                  <HistRow event={ev} index={i} />
                  {i < historyEvents.length - 1 && <Divider sx={{ borderColor: colors.border, opacity: 0.4 }} />}
                </Box>
              ))}
            </Card>
          </MotionReveal>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            sx={{ textAlign: 'center', pt: 2 }}
          >
            <Typography sx={{ fontSize: 10.5, color: colors.muted, fontFamily: serif, letterSpacing: '0.04em' }}>
              For informational purposes only · Not financial advice · Webict Capital
            </Typography>
          </Box>

        </Stack>
      </Container>
    </Box>
  )
}
