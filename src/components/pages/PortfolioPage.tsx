import AddRoundedIcon from '@mui/icons-material/AddRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { Box, Container, Divider, IconButton, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Holding = {
  symbol: string
  company: string
  shares: number
  price: number
  marketValue: number
  todayPL: number
  todayPLPct: number
  totalPL: number
  totalPLPct: number
}

type HistoryEvent = {
  symbol: string
  message: string
  profit: number
  profitPct: number
}

type WatchItem = {
  symbol: string
  company: string
  price: number
  change: number
  changePct: number
  spark: string // SVG polyline points
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const holdings: Holding[] = [
  {
    symbol: 'HBL',
    company: 'Habib Bank Ltd',
    shares: 408_011,
    price: 117.03,
    marketValue: 1_397_902,
    todayPL: 1_394,
    todayPLPct: 0.35,
    totalPL: -10_109,
    totalPLPct: -2.48,
  },
  {
    symbol: 'NESTLE',
    company: 'Nestlé Pakistan',
    shares: 5_300,
    price: 5_725.49,
    marketValue: 5_725_490,
    todayPL: 425_490,
    todayPLPct: 8.03,
    totalPL: 425_490,
    totalPLPct: 8.03,
  },
  {
    symbol: 'TRG',
    company: 'TRG Pakistan',
    shares: 26_040,
    price: 130.2,
    marketValue: 2_236_640,
    todayPL: -23_760,
    todayPLPct: -9.12,
    totalPL: -23_760,
    totalPLPct: -9.12,
  },
]

const historyEvents: HistoryEvent[] = [
  { symbol: 'KEL', message: 'Total PROFIT realised', profit: 147_100, profitPct: 437.02 },
  { symbol: 'HBL', message: 'Total PROFIT realised', profit: 23_649, profitPct: 10.22 },
]

const watchlist: WatchItem[] = [
  { symbol: 'OGDC', company: 'Oil & Gas Dev. Co.', price: 158.4,   change: 2.3,  changePct: 1.47,  spark: '0,20 10,18 20,15 30,17 40,12 50,10 60,8'   },
  { symbol: 'ENGRO', company: 'Engro Corporation',  price: 286.0,   change: -4.1, changePct: -1.41, spark: '0,10 10,12 20,11 30,16 40,18 50,20 60,22'  },
  { symbol: 'LUCK',  company: 'Lucky Cement',        price: 1_024.5, change: 8.7,  changePct: 0.86,  spark: '0,22 10,20 20,18 30,15 40,14 50,11 60,9'   },
  { symbol: 'PSO',   company: 'Pakistan State Oil',  price: 312.9,   change: -3.6, changePct: -1.14, spark: '0,10 10,13 20,12 30,15 40,19 50,21 60,23'  },
]

// ─── Donut segments ───────────────────────────────────────────────────────────

// circumference of r=42 circle = 2π×42 ≈ 263.9
// segment dasharray = (pct/100)*263.9, dashoffset shifts start position

const CIRC = 263.9
const donutColors = ['#1e40af', '#3b82f6', '#93c5fd']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt    = (v: number) => v.toLocaleString('en-PK')
const fmtPkr = (v: number) => `${v < 0 ? '-' : ''}Rs. ${fmt(Math.round(Math.abs(v)))}`

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  ink:    'var(--ink)',
  ink2:   'var(--ink2)',
  muted:  'var(--muted)',
  border: 'var(--divider)',
  blue:   'var(--primary)',
  blueHi: 'var(--primary)',
  pos:    'var(--success)',
  posBg:  'var(--successBg)',
  neg:    'var(--error)',
  negBg:  'var(--errorBg)',
  card:   'var(--paper)',
  bg:     'var(--bg)',
}

const numberSx = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
  fontFamily: 'var(--wc-number-font)',
}

// ─── PLBadge ──────────────────────────────────────────────────────────────────

function PLBadge({ value, pct, size = 'sm' }: { value: number; pct: number; size?: 'sm' | 'md' | 'lg' }) {
  const pos  = value >= 0
  const sz   = { sm: 11.5, md: 13, lg: 15 }[size]
  const Icon = pos ? TrendingUpIcon : TrendingDownIcon

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.4,
        px: size === 'lg' ? 1.2 : 0.8,
        py: 0.3,
        borderRadius: '6px',
        bgcolor: pos ? T.posBg : T.negBg,
        border: `1px solid ${pos ? 'rgba(26,102,64,0.18)' : 'rgba(180,40,58,0.18)'}`,
      }}
    >
      <Icon sx={{ fontSize: sz + 1, color: pos ? T.pos : T.neg }} />
      <Typography sx={{ ...numberSx, fontSize: sz, fontWeight: 800, color: pos ? T.pos : T.neg, letterSpacing: '-0.01em' }}>
        {pos ? '+' : ''}{pct.toFixed(2)}%
      </Typography>
    </Box>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', mb: 0.5 }}>
      {children}
    </Typography>
  )
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
      <Box>
        <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase' }}>
          {children}
        </Typography>
        <Box sx={{ mt: 0.4, width: 24, height: 2, background: `linear-gradient(90deg, ${T.blueHi}, transparent)`, borderRadius: 4 }} />
      </Box>
      {sub && (
        <Typography sx={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{sub}</Typography>
      )}
    </Stack>
  )
}

// ─── DonutChart ───────────────────────────────────────────────────────────────

function DonutChart({ slices }: { slices: { pct: number; symbol: string; company: string }[] }) {
  let offset = 0
  // Start from the top (rotate -90deg)
  const GAP = 2 // gap between segments in px along circumference

  return (
    <Stack direction="row" alignItems="center" spacing={2.5} flexWrap="wrap">
      <Box sx={{ flexShrink: 0 }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          {/* Track */}
          <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(30,64,175,0.08)" strokeWidth="15" />
          {slices.map((s, i) => {
            const dash    = (s.pct / 100) * CIRC - GAP
            const gap     = CIRC - dash
            // dashoffset: positive = shift clockwise from top
            // svg default start = 3 o'clock, we add -90deg rotation via transform
            const segOffset = -(offset / 100) * CIRC
            offset += s.pct
            return (
              <circle
                key={s.symbol}
                cx="55" cy="55" r="42"
                fill="none"
                stroke={donutColors[i]}
                strokeWidth="15"
                strokeDasharray={`${Math.max(0, dash)} ${gap + GAP}`}
                strokeDashoffset={segOffset}
                transform="rotate(-90 55 55)"
                strokeLinecap="butt"
              />
            )
          })}
          {/* Centre label */}
          <circle cx="55" cy="55" r="34" fill="var(--paper)" />
          <text x="55" y="51" textAnchor="middle" fontFamily="var(--wc-number-font)" fontSize="13" fontWeight="700" fill="var(--ink)">
            {slices.length}
          </text>
          <text x="55" y="63" textAnchor="middle" fontFamily="var(--wc-body-font, sans-serif)" fontSize="9" fill="var(--muted)">
            holdings
          </text>
        </svg>
      </Box>

      {/* Legend */}
      <Stack spacing={0.9}>
        {slices.map((s, i) => (
          <Stack key={s.symbol} direction="row" alignItems="center" spacing={0.9}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: donutColors[i], flexShrink: 0 }} />
            <Box>
              <Stack direction="row" spacing={0.6} alignItems="baseline">
                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>{s.symbol}</Typography>
                <Typography sx={{ fontSize: 10.5, color: T.muted }}>{s.company}</Typography>
              </Stack>
            </Box>
            <Typography sx={{ ...numberSx, fontSize: 12, fontWeight: 800, color: T.ink2, ml: 'auto !important', pl: 1 }}>
              {s.pct.toFixed(1)}%
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ points, positive }: { points: string; positive: boolean }) {
  return (
    <svg width="60" height="30" viewBox="0 0 60 30" style={{ flexShrink: 0 }}>
      <polyline
        points={points}
        fill="none"
        stroke={positive ? 'var(--success)' : 'var(--error)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── HoldingRow ───────────────────────────────────────────────────────────────

function HoldingRow({ holding, index }: { holding: Holding; index: number }) {
  const reduce  = useReducedMotion()
  const [hovered, setHovered] = useState(false)

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.36, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        py: 1.8,
        px: 0.5,
        borderRadius: 1.5,
        cursor: 'pointer',
        transition: 'background 0.22s ease',
        bgcolor: hovered ? 'var(--wc-primary-soft)' : 'transparent',
      }}
    >
      <Stack direction="row" alignItems="center" sx={{ gap: { xs: 1.5, sm: 2 } }}>
        {/* Avatar */}
        <Box
          sx={{
            width: { xs: 38, sm: 44 },
            height: { xs: 38, sm: 44 },
            borderRadius: 1.4,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hovered
              ? `linear-gradient(135deg, ${T.blue} 0%, ${T.blueHi} 100%)`
              : 'linear-gradient(135deg, var(--wc-primary-light) 0%, var(--paper) 100%)',
            border: `1px solid ${hovered ? 'var(--wc-primary-strong)' : T.border}`,
            transition: 'all 0.22s ease',
          }}
        >
          <Typography sx={{ fontFamily: 'var(--wc-number-font)', fontSize: 10.5, fontWeight: 700, color: hovered ? 'var(--wc-bg)' : T.blue, letterSpacing: '0.04em' }}>
            {holding.symbol.slice(0, 3)}
          </Typography>
        </Box>

        {/* Name */}
        <Box sx={{ minWidth: 0, flex: '0 0 auto', width: { xs: 80, sm: 110 } }}>
          <Typography sx={{ fontFamily: 'var(--wc-number-font)', fontSize: { xs: 13.5, sm: 15 }, fontWeight: 700, letterSpacing: '0.02em', color: T.ink, lineHeight: 1.2 }}>
            {holding.symbol}
          </Typography>
          <Typography sx={{ fontSize: 11, color: T.muted, fontWeight: 500, mt: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {holding.company}
          </Typography>
        </Box>

        {/* Market value */}
        <Box sx={{ flex: 1, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Label>Market Value</Label>
          <Typography sx={{ ...numberSx, fontSize: 13.5, fontWeight: 800, color: T.ink, letterSpacing: '-0.015em' }}>
            {fmtPkr(holding.marketValue)}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: T.muted, mt: 0.2, fontWeight: 600 }}>
            {fmt(holding.shares)} @ {holding.price.toFixed(2)}
          </Typography>
        </Box>

        {/* Today P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 80, sm: 96 } }}>
          <Label>Today P/L</Label>
          <Typography sx={{ ...numberSx, fontSize: 13, fontWeight: 800, color: holding.todayPL >= 0 ? T.pos : T.neg, letterSpacing: '-0.01em' }}>
            {fmtPkr(holding.todayPL)}
          </Typography>
          <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={holding.todayPL} pct={holding.todayPLPct} />
          </Box>
        </Box>

        {/* Total P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 80, sm: 100 } }}>
          <Label>Total P/L</Label>
          <Typography sx={{ ...numberSx, fontSize: 14, fontWeight: 900, color: holding.totalPL >= 0 ? T.pos : T.neg, letterSpacing: '-0.02em' }}>
            {fmtPkr(holding.totalPL)}
          </Typography>
          <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={holding.totalPL} pct={holding.totalPLPct} />
          </Box>
        </Box>

        {/* More */}
        <Box sx={{ display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
          <IconButton size="small" sx={{ color: T.muted, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s ease' }}>
            <MoreHorizRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Stack>
    </Box>
  )
}

// ─── HistoryRow ───────────────────────────────────────────────────────────────

function HistoryRow({ event, index }: { event: HistoryEvent; index: number }) {
  const reduce = useReducedMotion()
  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.34, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      sx={{ py: 1.8, display: 'flex', alignItems: 'center', gap: 2 }}
    >
      <Box
        sx={{
          width: 40, height: 40,
          borderRadius: 1.4,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--wc-primary-light) 0%, var(--wc-paper) 100%)',
          border: `1px solid ${T.border}`,
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 900, color: T.blue, letterSpacing: '0.04em' }}>{event.symbol}</Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, color: T.ink2, lineHeight: 1.5, fontWeight: 500 }}>{event.message}</Typography>
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 0.5 }}>
          <Typography sx={{ ...numberSx, fontSize: 14, fontWeight: 900, color: T.pos, letterSpacing: '-0.01em' }}>
            {fmtPkr(event.profit)}
          </Typography>
          <PLBadge value={event.profit} pct={event.profitPct} size="sm" />
        </Stack>
      </Box>
    </Box>
  )
}

// ─── WatchlistRow ─────────────────────────────────────────────────────────────

function WatchlistRow({ item, index }: { item: WatchItem; index: number }) {
  const reduce   = useReducedMotion()
  const positive = item.change >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      sx={{ py: 1.2 }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: 'var(--wc-number-font)', fontSize: 13.5, fontWeight: 700, letterSpacing: '0.02em', color: T.ink }}>
            {item.symbol}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: T.muted, fontWeight: 500 }}>{item.company}</Typography>
        </Box>

        {/* Sparkline */}
        <Sparkline points={item.spark} positive={positive} />

        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography sx={{ ...numberSx, fontSize: 13.5, fontWeight: 800, color: T.ink }}>
            Rs. {fmt(item.price)}
          </Typography>
          <Typography sx={{ ...numberSx, fontSize: 11.5, fontWeight: 700, color: positive ? T.pos : T.neg }}>
            {positive ? '+' : ''}{item.change.toFixed(1)} ({positive ? '+' : ''}{item.changePct.toFixed(2)}%)
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({ children, delay = 0, sx: sxProp = {} }: { children: React.ReactNode; delay?: number; sx?: object }) {
  const reduce = useReducedMotion()
  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.44, delay, ease: [0.22, 1, 0.36, 1] }}
      sx={{ bgcolor: T.card, borderRadius: 1.5, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: 'none', ...sxProp }}
    >
      {children}
    </Box>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PortfolioPage() {
  const reduce = useReducedMotion()

  const totalMarketValue = 6_360_032
  const totalHoldings    = 391_621
  const totalHoldingsPct = 6.56
  const dayPL            = -22_366
  const dayPLPct         = -0.35
  const lastUpdated      = '03 Jan 5:55 PM'

  const totalMV = holdings.reduce((s, h) => s + h.marketValue, 0)
  const alloc   = holdings.map(h => ({ ...h, pct: (h.marketValue / totalMV) * 100 }))

  return (
    <Box
      sx={(theme) => ({
        '--ink':        theme.palette.text.primary,
        '--ink2':       theme.palette.text.secondary,
        '--muted':      theme.palette.text.secondary,
        '--divider':    theme.palette.divider,
        '--primary':    theme.palette.primary.main,
        '--primaryLight': theme.palette.primary.light,
        '--success':    theme.palette.success.main,
        '--error':      theme.palette.error.main,
        '--paper':      theme.palette.background.paper,
        '--bg':         theme.palette.background.default,
        '--successBg':  'rgba(26,102,64,0.08)',
        '--errorBg':    'rgba(180,40,58,0.08)',
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 14 },
        minHeight: '100vh',
        bgcolor: 'var(--wc-bg)',
      })}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1400px !important', px: { xs: 2, md: 4 } }}>
        <Stack spacing={4}>

          {/* ── Header ── */}
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
                  color: 'var(--wc-primary)',
                  mb: 1,
                }}
              >
                Portfolio
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '1.6rem', md: '2.2rem' },
                  fontWeight: 700,
                  color: 'var(--wc-text-primary)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                }}
              >
                Portfolio Overview
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.4, py: 0.55,
                borderRadius: '999px',
                bgcolor: 'rgba(180,40,58,0.08)',
                border: '1px solid rgba(180,40,58,0.2)',
                alignSelf: { xs: 'flex-start', md: 'flex-end' },
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'var(--error)', letterSpacing: '0.04em' }}>
                State: CLOSED · Updated {lastUpdated}
              </Typography>
            </Box>
          </Box>

          {/* ── Overview card ── */}
          <Panel delay={0.05}>
            <Box sx={{ px: { xs: 2.2, md: 2.6 }, py: { xs: 2.1, md: 2.6 } }}>
              <Box>
                <Typography sx={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Total Market Value
                </Typography>
                <Typography sx={{ ...numberSx, fontSize: { xs: 24, md: 30 }, fontWeight: 900, letterSpacing: '-0.03em', color: T.ink }}>
                  {fmtPkr(totalMarketValue)}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: T.muted, fontWeight: 600, mt: 0.5 }}>
                  Snapshot of current holdings and performance
                </Typography>
              </Box>

              <Box
                sx={{
                  mt: { xs: 2, md: 2.5 },
                  pt: { xs: 2, md: 2.4 },
                  borderTop: `1px solid ${T.border}`,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                }}
              >
                {/* Day P/L */}
                <Box sx={{ p: 1.6, borderRadius: 1.6, border: `1px solid rgba(180,40,58,0.16)`, bgcolor: T.negBg }}>
                  <Label>Day P/L</Label>
                  <Typography sx={{ ...numberSx, fontSize: { xs: 14, sm: 15.5 }, fontWeight: 900, color: T.neg, letterSpacing: '-0.02em' }}>
                    {fmtPkr(dayPL)}
                  </Typography>
                  <Box sx={{ mt: 0.8 }}><PLBadge value={dayPL} pct={dayPLPct} size="sm" /></Box>
                </Box>

                {/* Total Holdings */}
                <Box sx={{ p: 1.6, borderRadius: 1.6, border: `1px solid rgba(26,102,64,0.2)`, bgcolor: T.posBg }}>
                  <Label>Total Holdings</Label>
                  <Typography sx={{ ...numberSx, fontSize: { xs: 14, sm: 15.5 }, fontWeight: 900, color: T.pos, letterSpacing: '-0.02em' }}>
                    {fmtPkr(totalHoldings)}
                  </Typography>
                  <Box sx={{ mt: 0.8 }}><PLBadge value={totalHoldings} pct={totalHoldingsPct} size="sm" /></Box>
                </Box>

                {/* Cash */}
                <Box sx={{ p: 1.6, borderRadius: 1.6, border: `1px solid ${T.border}`, bgcolor: 'var(--wc-primary-soft)' }}>
                  <Label>Cash Available</Label>
                  <Typography sx={{ ...numberSx, fontSize: { xs: 14, sm: 15.5 }, fontWeight: 900, color: T.ink, letterSpacing: '-0.02em' }}>
                    Rs. 492,800
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: T.muted, fontWeight: 600, mt: 0.6 }}>
                    Funding window opens 10:00 AM
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Panel>

          {/* ── Main two-column grid ── */}
          <Box
            sx={{
              display: 'grid',
              gap: 2.6,
              gridTemplateColumns: { xs: '1fr', lg: '1.35fr 0.9fr' },
              alignItems: 'start',
            }}
          >
            {/* Left column */}
            <Stack spacing={2.6}>

              {/* Donut + Allocation in one panel */}
              <Panel delay={0.1} sx={{ px: 2.2, py: 2 }}>
                <SectionTitle sub="Dynamic">Allocation</SectionTitle>

                {/* Donut chart */}
                <Box sx={{ mb: 2.5 }}>
                  <DonutChart slices={alloc.map(h => ({ pct: h.pct, symbol: h.symbol, company: h.company }))} />
                </Box>

                <Divider sx={{ borderColor: T.border, mb: 2 }} />

                {/* Allocation bars */}
                <Stack spacing={1.4}>
                  {alloc.map((h, i) => (
                    <Box
                      key={h.symbol}
                      component={motion.div}
                      initial={reduce ? false : { opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.38, delay: 0.12 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.6 }}>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: donutColors[i], flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>{h.symbol}</Typography>
                          <Typography sx={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{h.company}</Typography>
                        </Stack>
                        <Typography sx={{ ...numberSx, fontSize: 12, fontWeight: 800, color: T.ink2 }}>
                          {h.pct.toFixed(1)}%
                        </Typography>
                      </Stack>
                      <Box sx={{ position: 'relative', height: 6, bgcolor: 'var(--wc-primary-soft)', borderRadius: 99 }}>
                        <Box
                          component={motion.div}
                          initial={reduce ? false : { scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.7, delay: 0.22 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          sx={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${h.pct}%`,
                            borderRadius: 99,
                            transformOrigin: 'left',
                            bgcolor: donutColors[i],
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Panel>

              {/* Holdings list */}
              <Panel delay={0.16} sx={{ px: 2, py: 2 }}>
                <Box sx={{ px: 0.5 }}>
                  <SectionTitle sub="Shares in Hand">Holdings</SectionTitle>
                </Box>
                <Box sx={{ mt: 0.5 }}>
                  {holdings.map((h, idx) => (
                    <Box key={h.symbol}>
                      <HoldingRow holding={h} index={idx} />
                      {idx < holdings.length - 1 && <Divider sx={{ borderColor: T.border, mx: 0.5 }} />}
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 2, px: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                  <Box
                    component={motion.button}
                    whileHover={reduce ? undefined : { scale: 1.07, y: -2 }}
                    whileTap={reduce ? undefined : { scale: 0.95 }}
                    sx={{
                      width: 40, height: 40,
                      borderRadius: 1.6,
                      border: 'none',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${T.blue} 0%, ${T.blueHi} 100%)`,
                      color: 'var(--wc-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(10,36,99,0.25)',
                    }}
                  >
                    <AddRoundedIcon sx={{ fontSize: 20 }} />
                  </Box>
                </Box>
              </Panel>
            </Stack>

            {/* Right column */}
            <Stack spacing={2.6}>

              {/* Watchlist — now with sparklines */}
              <Panel delay={0.14} sx={{ px: 2, py: 2 }}>
                <Box sx={{ px: 0.5 }}>
                  <SectionTitle sub="Live movers">Watchlist</SectionTitle>
                </Box>
                <Box sx={{ mt: 0.4 }}>
                  {watchlist.map((item, idx) => (
                    <Box key={item.symbol}>
                      <WatchlistRow item={item} index={idx} />
                      {idx < watchlist.length - 1 && <Divider sx={{ borderColor: T.border, mx: 0.5 }} />}
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 1.6, px: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>
                    Alerts update every 5m
                  </Typography>
                  <Box
                    component="button"
                    sx={{
                      px: 1.2, py: 0.6, borderRadius: 999,
                      border: `1px solid ${T.border}`,
                      background: 'transparent',
                      color: T.blue,
                      fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    + Add symbol
                  </Box>
                </Box>
              </Panel>

              {/* History */}
              <Panel delay={0.2} sx={{ px: 2, py: 2 }}>
                <Box sx={{ px: 0.5 }}>
                  <SectionTitle>History</SectionTitle>
                </Box>
                <Box>
                  {historyEvents.map((ev, idx) => (
                    <Box key={ev.symbol + idx}>
                      <HistoryRow event={ev} index={idx} />
                      {idx < historyEvents.length - 1 && <Divider sx={{ borderColor: T.border, mx: 0.5 }} />}
                    </Box>
                  ))}
                </Box>
              </Panel>

            </Stack>
          </Box>

          {/* Footer */}
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            sx={{ textAlign: 'center', pb: 1 }}
          >
            <Typography sx={{ fontSize: 11, color: T.muted, letterSpacing: '0.04em' }}>
              Data is for informational purposes only · Webict Capital
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}