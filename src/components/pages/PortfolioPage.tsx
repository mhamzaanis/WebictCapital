import AddRoundedIcon from '@mui/icons-material/AddRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded'
import { Box, Container, Divider, IconButton, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion, useReducedMotion } from 'motion/react'
import { useState, useMemo } from 'react'
import { BarChart, LineChart, PieChart } from '@mui/x-charts'

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
  spark: string
}

type PerformancePoint = {
  day: number
  label: string
  value: number
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const holdings: Holding[] = [
  {
    symbol: 'HBL',
    company: 'Habib Bank Ltd',
    shares: 408_011,
    price: 117.03,
    marketValue: 47_749_417,
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
    marketValue: 30_345_097,
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
    marketValue: 3_390_408,
    todayPL: -23_760,
    todayPLPct: -9.12,
    totalPL: -23_760,
    totalPLPct: -9.12,
  },
  {
    symbol: 'MARI',
    company: 'Mari Petroleum',
    shares: 12_000,
    price: 445.75,
    marketValue: 5_349_000,
    todayPL: 48_000,
    todayPLPct: 0.91,
    totalPL: 182_400,
    totalPLPct: 3.53,
  },
  {
    symbol: 'SYS',
    company: 'Systems Ltd',
    shares: 18_500,
    price: 312.6,
    marketValue: 5_783_100,
    todayPL: -12_950,
    todayPLPct: -0.22,
    totalPL: 156_200,
    totalPLPct: 2.78,
  },
]

// Derived totals – single source of truth
const totalMV = holdings.reduce((s, h) => s + h.marketValue, 0)
const dayPL = holdings.reduce((s, h) => s + h.todayPL, 0)
const dayPLPct = totalMV - dayPL !== 0 ? (dayPL / (totalMV - dayPL)) * 100 : 0
const totalPL = holdings.reduce((s, h) => s + h.totalPL, 0)
const totalPLPct = totalMV - totalPL !== 0 ? (totalPL / (totalMV - totalPL)) * 100 : 0
const totalShares = holdings.reduce((s, h) => s + h.shares, 0)
const alloc = holdings.map((h) => ({ ...h, pct: (h.marketValue / totalMV) * 100 }))

const historyEvents: HistoryEvent[] = [
  { symbol: 'KEL', message: 'Total PROFIT realised', profit: 147_100, profitPct: 437.02 },
  { symbol: 'HBL', message: 'Total PROFIT realised', profit: 23_649, profitPct: 10.22 },
  { symbol: 'EFERT', message: 'Dividend received', profit: 42_500, profitPct: 3.8 },
]

const watchlist: WatchItem[] = [
  { symbol: 'OGDC',  company: 'Oil & Gas Dev. Co.', price: 158.4,   change: 2.3,  changePct: 1.47,  spark: '0,20 10,18 20,15 30,17 40,12 50,10 60,8' },
  { symbol: 'ENGRO', company: 'Engro Corporation',  price: 286.0,   change: -4.1, changePct: -1.41, spark: '0,10 10,12 20,11 30,16 40,18 50,20 60,22' },
  { symbol: 'LUCK',  company: 'Lucky Cement',        price: 1_024.5, change: 8.7,  changePct: 0.86,  spark: '0,22 10,20 20,18 30,15 40,14 50,11 60,9' },
  { symbol: 'PSO',   company: 'Pakistan State Oil',  price: 312.9,   change: -3.6, changePct: -1.14, spark: '0,10 10,13 20,12 30,15 40,19 50,21 60,23' },
]

// 30-day portfolio performance (deterministic pseudo-random walk)
const performanceData: PerformancePoint[] = (() => {
  const start = totalMV - 1_200_000
  const end = totalMV
  const points: PerformancePoint[] = []
  const months = ['Dec', 'Jan']
  for (let i = 0; i < 30; i++) {
    const t = i / 29
    const trend = start + (end - start) * t
    const season = Math.sin(t * Math.PI * 2.3) * 380_000
    const noise = Math.sin(t * 41.7) * 120_000 + Math.cos(t * 67.3) * 90_000
    const day = i + 1
    const monthIdx = day <= 18 ? 0 : 1
    points.push({
      day,
      label: `${months[monthIdx]} ${monthIdx === 0 ? day : day - 18}`,
      value: Math.round(trend + season + noise),
    })
  }
  return points
})()

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString('en-PK')
const fmtPkr = (v: number) =>
  `${v < 0 ? '-' : ''}Rs. ${fmt(Math.round(Math.abs(v)))}`
const fmtPkrSigned = (v: number) =>
  `${v >= 0 ? '+' : '-'}Rs. ${fmt(Math.round(Math.abs(v)))}`
const fmtCompact = (v: number) => {
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toString()
}
const parseSpark = (points: string) =>
  points
    .trim()
    .split(' ')
    .map((pair) => Number(pair.split(',')[1]))
    .filter((val) => Number.isFinite(val))

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  ink:    'var(--ink)',
  ink2:   'var(--ink2)',
  muted:  'var(--muted)',
  border: 'var(--divider)',
  blue:   'var(--primary)',
  pos:    'var(--success)',
  posBg:  'var(--successBg)',
  neg:    'var(--error)',
  negBg:  'var(--errorBg)',
  card:   'var(--paper)',
}

const numberSx = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
  fontFamily: 'var(--wc-number-font)',
}

const motionEase = [0.22, 1, 0.36, 1] as const

// ─── PLBadge ──────────────────────────────────────────────────────────────────

function PLBadge({ value, pct, size = 'sm' }: { value: number; pct: number; size?: 'sm' | 'md' }) {
  const theme = useTheme()
  const pos = value >= 0
  const sz = { sm: 11, md: 12.5 }[size]
  const Icon = pos ? TrendingUpIcon : TrendingDownIcon

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.4,
        px: 0.7,
        py: 0.25,
        borderRadius: '5px',
        bgcolor: pos ? T.posBg : T.negBg,
        border: `1px solid ${alpha(pos ? theme.palette.success.main : theme.palette.error.main, 0.15)}`,
      }}
    >
      <Icon sx={{ fontSize: sz, color: pos ? T.pos : T.neg }} />
      <Typography sx={{ ...numberSx, fontSize: sz, fontWeight: 700, color: pos ? T.pos : T.neg, lineHeight: 1 }}>
        {pos ? '+' : ''}{pct.toFixed(2)}%
      </Typography>
    </Box>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: T.muted, textTransform: 'uppercase', mb: 0.4 }}>
      {children}
    </Typography>
  )
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  badge,
  icon: Icon,
  accent = 'neutral',
}: {
  label: string
  value: string
  badge?: React.ReactNode
  icon: React.ElementType
  accent?: 'pos' | 'neg' | 'neutral'
}) {
  const borderColor =
    accent === 'pos' ? 'rgba(26,102,64,0.2)' :
    accent === 'neg' ? 'rgba(180,40,58,0.2)' :
    'var(--wc-divider)'

  const bgColor =
    accent === 'pos' ? T.posBg :
    accent === 'neg' ? T.negBg :
    'var(--wc-primary-soft)'

  const iconColor =
    accent === 'pos' ? T.pos :
    accent === 'neg' ? T.neg :
    T.blue

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 1.8 },
        borderRadius: 1.5,
        border: `1px solid ${borderColor}`,
        bgcolor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.8,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: accent === 'pos' ? 'rgba(26,102,64,0.35)' : accent === 'neg' ? 'rgba(180,40,58,0.35)' : 'var(--wc-primary-strong)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <Icon sx={{ fontSize: 16, color: iconColor }} />
        <Label>{label}</Label>
      </Box>
      <Typography sx={{ ...numberSx, fontSize: { xs: 15, sm: 17 }, fontWeight: 900, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {badge && <Box sx={{ mt: -0.2 }}>{badge}</Box>}
    </Box>
  )
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
      <Box>
        <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase' }}>
          {children}
        </Typography>
        <Box sx={{ mt: 0.4, width: 22, height: 2, background: `linear-gradient(90deg, ${T.blue}, transparent)`, borderRadius: 4 }} />
      </Box>
      {sub && (
        <Typography sx={{ fontSize: 10.5, color: T.muted, fontWeight: 600 }}>{sub}</Typography>
      )}
    </Box>
  )
}

// ─── DonutChart ───────────────────────────────────────────────────────────────

const donutColors = ['#0a2463', '#1b3f7a', '#2d5a96', '#4575b4', '#6490cc']

function DonutChart({ slices }: { slices: { pct: number; symbol: string; company: string }[] }) {
  const colors = donutColors.slice(0, slices.length)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <PieChart
          width={150}
          height={150}
          colors={colors}
          series={[
            {
              data: slices.map((s, i) => ({ id: i, value: s.pct, label: s.symbol })),
              innerRadius: 42,
              outerRadius: 68,
              paddingAngle: 1.5,
              cornerRadius: 2,
            },
          ]}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography sx={{ fontFamily: 'var(--wc-number-font)', fontSize: 15, fontWeight: 800, color: T.ink, lineHeight: 1 }}>
            {slices.length}
          </Typography>
          <Typography sx={{ fontSize: 9.5, color: T.muted, mt: 0.2 }}>holdings</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 140 }}>
        {slices.map((s, i) => (
          <Box key={s.symbol} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: colors[i], flexShrink: 0 }} />
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6, flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: T.ink, letterSpacing: '0.01em' }}>
                {s.symbol}
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.company}
              </Typography>
            </Box>
            <Typography sx={{ ...numberSx, fontSize: 12, fontWeight: 700, color: T.ink2, flexShrink: 0 }}>
              {s.pct.toFixed(1)}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ─── AllocationBar ────────────────────────────────────────────────────────────

function AllocationBar({ data }: { data: { symbol: string; pct: number }[] }) {
  const theme = useTheme()

  return (
    <BarChart
      height={Math.max(180, data.length * 38)}
      layout="horizontal"
      margin={{ left: 50, right: 20, top: 8, bottom: 8 }}
      series={[
        {
          data: data.map((h) => h.pct),
          color: theme.palette.primary.main,
          valueFormatter: (v) => `${v?.toFixed(1)}%`,
        },
      ]}
      yAxis={[
        {
          data: data.map((h) => h.symbol),
          scaleType: 'band',
          tickLabelStyle: {
            fontFamily: 'var(--wc-number-font)',
            fontWeight: 700,
            fontSize: 11.5,
            fill: theme.palette.text.primary,
          },
        },
      ]}
      xAxis={[
        {
          min: 0,
          max: 100,
          valueFormatter: (v: number | null) => `${v}%`,
          tickLabelStyle: {
            fontSize: 10.5,
            fill: theme.palette.text.secondary,
          },
        },
      ]}
      sx={{
        '& .MuiChartsGrid-root': { display: 'none' },
        '& .MuiChartsAxis-line': { stroke: theme.palette.divider },
        '& .MuiChartsAxis-tick': { stroke: theme.palette.divider },
      }}
    />
  )
}

// ─── PerformanceArea ──────────────────────────────────────────────────────────

function PerformanceArea({ data }: { data: PerformancePoint[] }) {
  const theme = useTheme()
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = (max - min) * 0.15

  return (
    <Box sx={{ position: 'relative' }}>
      <LineChart
        height={220}
        margin={{ left: 10, right: 10, top: 16, bottom: 28 }}
        series={[
          {
            data: values,
            area: true,
            color: theme.palette.primary.main,
            showMark: false,
            curve: 'natural',
            valueFormatter: (v) => `Rs. ${v?.toLocaleString('en-PK')}`,
          },
        ]}
        xAxis={[
          {
            data: data.map((d) => d.label),
            scaleType: 'point',
            tickInterval: (_, i) => i % 7 === 0,
            tickLabelStyle: {
              fontSize: 10,
              fill: theme.palette.text.secondary,
            },
          },
        ]}
        yAxis={[
          {
            min: min - padding,
            max: max + padding,
            valueFormatter: (v: number | null) => `${((v ?? 0) / 1_000_000).toFixed(1)}M`,
            tickLabelStyle: {
              fontSize: 10,
              fill: theme.palette.text.secondary,
            },
          },
        ]}
        sx={{
          '& .MuiChartsGrid-root': { display: 'none' },
          '& .MuiChartsAxis-line': { stroke: 'transparent' },
          '& .MuiChartsAxis-tick': { stroke: theme.palette.divider },
          '& .MuiAreaElement-root': {
            fill: 'url(#portfolioAreaGradient)',
          },
        }}
      >
        <defs>
          <linearGradient id="portfolioAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.18} />
            <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.0} />
          </linearGradient>
        </defs>
      </LineChart>
    </Box>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ points, positive }: { points: string; positive: boolean }) {
  const theme = useTheme()
  const data = parseSpark(points)
  const color = positive ? theme.palette.success.main : theme.palette.error.main

  return (
    <LineChart
      width={76}
      height={34}
      series={[{ data, color, showMark: false, curve: 'natural' }]}
      xAxis={[{ data: data.map((_, i) => i), scaleType: 'point' }]}
      yAxis={[{ min: Math.min(...data) - 1, max: Math.max(...data) + 1 }]}
      sx={{
        '& .MuiChartsAxis-root': { display: 'none' },
        '& .MuiChartsGrid-root': { display: 'none' },
      }}
    />
  )
}

// ─── HoldingRow ───────────────────────────────────────────────────────────────

function HoldingRow({ holding, index }: { holding: Holding; index: number }) {
  const reduce = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const pos = holding.totalPL >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.36, delay: index * 0.07, ease: motionEase }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        py: 1.6,
        px: 1,
        mx: -1,
        borderRadius: 1.5,
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        bgcolor: hovered ? 'var(--wc-primary-soft)' : 'transparent',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Symbol avatar */}
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 1.4,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hovered
              ? `linear-gradient(135deg, ${T.blue} 0%, #1b3f7a 100%)`
              : `linear-gradient(135deg, var(--wc-primary-light) 0%, var(--wc-paper) 100%)`,
            border: `1px solid ${hovered ? 'var(--wc-primary-strong)' : T.border}`,
            transition: 'all 0.22s ease',
          }}
        >
          <Typography sx={{ fontFamily: 'var(--wc-number-font)', fontSize: 11, fontWeight: 700, color: hovered ? '#fff' : T.blue, letterSpacing: '0.02em' }}>
            {holding.symbol.slice(0, 3)}
          </Typography>
        </Box>

        {/* Name + shares */}
        <Box sx={{ minWidth: 0, flex: { xs: '0 0 75px', sm: '0 0 100px' } }}>
          <Typography sx={{ fontFamily: 'var(--wc-number-font)', fontSize: { xs: 13, sm: 14 }, fontWeight: 700, letterSpacing: '0.01em', color: T.ink, lineHeight: 1.2 }}>
            {holding.symbol}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: T.muted, fontWeight: 500, mt: 0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {holding.company}
          </Typography>
        </Box>

        {/* Market value (hidden on xs) */}
        <Box sx={{ flex: 1, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Label>Mkt Value</Label>
          <Typography sx={{ ...numberSx, fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em' }}>
            {fmtPkr(holding.marketValue)}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: T.muted, mt: 0.1, fontWeight: 500 }}>
            {fmt(holding.shares)} @ {holding.price.toFixed(2)}
          </Typography>
        </Box>

        {/* Today P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 75, sm: 88 } }}>
          <Label>Day P/L</Label>
          <Typography sx={{ ...numberSx, fontSize: 12.5, fontWeight: 700, color: holding.todayPL >= 0 ? T.pos : T.neg, letterSpacing: '-0.01em' }}>
            {fmtPkrSigned(holding.todayPL)}
          </Typography>
          <Box sx={{ mt: 0.4, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={holding.todayPL} pct={holding.todayPLPct} />
          </Box>
        </Box>

        {/* Total P/L */}
        <Box sx={{ textAlign: 'right', minWidth: { xs: 80, sm: 95 } }}>
          <Label>Total P/L</Label>
          <Typography sx={{ ...numberSx, fontSize: 13.5, fontWeight: 900, color: pos ? T.pos : T.neg, letterSpacing: '-0.02em' }}>
            {fmtPkrSigned(holding.totalPL)}
          </Typography>
          <Box sx={{ mt: 0.4, display: 'flex', justifyContent: 'flex-end' }}>
            <PLBadge value={holding.totalPL} pct={holding.totalPLPct} />
          </Box>
        </Box>

        {/* Actions (desktop only) */}
        <Box sx={{ display: { xs: 'none', sm: 'block' }, flexShrink: 0, ml: '0 !important' }}>
          <IconButton
            size="small"
            sx={{
              color: T.muted,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
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
      transition={{ duration: 0.34, delay: index * 0.08, ease: motionEase }}
      sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1.6 }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 1.2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, var(--wc-primary-light) 0%, var(--wc-paper) 100%)`,
          border: `1px solid ${T.border}`,
        }}
      >
        <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: T.blue, letterSpacing: '0.02em' }}>
          {event.symbol}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, color: T.ink2, lineHeight: 1.4, fontWeight: 500 }}>
          {event.message}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
          <Typography sx={{ ...numberSx, fontSize: 13.5, fontWeight: 900, color: T.pos, letterSpacing: '-0.01em' }}>
            {fmtPkrSigned(event.profit)}
          </Typography>
          <PLBadge value={event.profit} pct={event.profitPct} size="sm" />
        </Box>
      </Box>
    </Box>
  )
}

// ─── WatchlistRow ─────────────────────────────────────────────────────────────

function WatchlistRow({ item, index }: { item: WatchItem; index: number }) {
  const reduce = useReducedMotion()
  const positive = item.change >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: index * 0.07, ease: motionEase }}
      sx={{ py: 1.3 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontFamily: 'var(--wc-number-font)', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: T.ink }}>
            {item.symbol}
          </Typography>
          <Typography sx={{ fontSize: 11, color: T.muted, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.company}
          </Typography>
        </Box>

        <Sparkline points={item.spark} positive={positive} />

        <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
          <Typography sx={{ ...numberSx, fontSize: 13, fontWeight: 700, color: T.ink }}>
            Rs. {fmt(item.price)}
          </Typography>
          <Typography sx={{ ...numberSx, fontSize: 11, fontWeight: 600, color: positive ? T.pos : T.neg }}>
            {positive ? '+' : ''}{item.change.toFixed(1)} ({positive ? '+' : ''}{item.changePct.toFixed(2)}%)
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({ children, delay = 0, sx: sxProp = {} }: { children: React.ReactNode; delay?: number; sx?: object }) {
  const reduce = useReducedMotion()
  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: motionEase }}
      sx={{
        bgcolor: T.card,
        borderRadius: 1.5,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
        ...sxProp,
      }}
    >
      {children}
    </Box>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PortfolioPage() {
  const reduce = useReducedMotion()
  const theme = useTheme()

  const lastUpdated = '03 Jan 5:55 PM'
  const cashAvailable = 'Rs. 492,800'

  const mvFormatted = useMemo(() => fmtPkr(totalMV), [])
  const dayPLFormatted = useMemo(() => fmtPkrSigned(dayPL), [])
  const totalPLFormatted = useMemo(() => fmtPkrSigned(totalPL), [])
  const sharesFormatted = useMemo(() => fmtCompact(totalShares), [])

  return (
    <Box
      sx={{
        '--ink':     theme.palette.text.primary,
        '--ink2':    theme.palette.text.secondary,
        '--muted':   theme.palette.text.secondary,
        '--divider': theme.palette.divider,
        '--primary': theme.palette.primary.main,
        '--success': theme.palette.success.main,
        '--error':   theme.palette.error.main,
        '--paper':   theme.palette.background.paper,
        '--successBg': 'rgba(26,102,64,0.07)',
        '--errorBg':   'rgba(180,40,58,0.07)',
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 14 },
        minHeight: '100vh',
        bgcolor: 'var(--wc-bg)',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1400px !important', px: { xs: 2, md: 4 } }}>
        <Stack sx={{ gap: 3.5 }}>

          {/* ── Header ── */}
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: motionEase }}
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
                  mb: 0.8,
                }}
              >
                Portfolio
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '1.6rem', md: '2.1rem' },
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
                px: 1.4,
                py: 0.5,
                borderRadius: '999px',
                bgcolor: alpha(theme.palette.error.main, 0.07),
                border: `1px solid ${alpha(theme.palette.error.main, 0.18)}`,
                alignSelf: { xs: 'flex-start', md: 'flex-end' },
              }}
            >
              <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: 'var(--error)', letterSpacing: '0.04em' }}>
                State: CLOSED · Updated {lastUpdated}
              </Typography>
            </Box>
          </Box>

          {/* ── Overview KPIs ── */}
          <Panel delay={0.05} sx={{ px: { xs: 2, md: 2.6 }, py: { xs: 2, md: 2.5 } }}>
            <Box>
              <Typography sx={{ fontSize: 10.5, color: T.muted, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Total Market Value
              </Typography>
              <Typography sx={{ ...numberSx, fontSize: { xs: 26, md: 32 }, fontWeight: 900, letterSpacing: '-0.03em', color: T.ink, lineHeight: 1.1, mt: 0.3 }}>
                {mvFormatted}
              </Typography>
              <Typography sx={{ fontSize: 12, color: T.muted, fontWeight: 500, mt: 0.5 }}>
                Snapshot of current holdings and performance
              </Typography>
            </Box>

            <Box
              sx={{
                mt: { xs: 2, md: 2.5 },
                pt: { xs: 2, md: 2.5 },
                borderTop: `1px solid ${T.border}`,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 1.6,
              }}
            >
              <KpiCard
                label="Day P/L"
                value={dayPLFormatted}
                badge={<PLBadge value={dayPL} pct={dayPLPct} size="sm" />}
                icon={dayPL >= 0 ? TrendingUpIcon : TrendingDownIcon}
                accent={dayPL >= 0 ? 'pos' : 'neg'}
              />
              <KpiCard
                label="Total Return"
                value={totalPLFormatted}
                badge={<PLBadge value={totalPL} pct={totalPLPct} size="sm" />}
                icon={totalPL >= 0 ? TrendingUpIcon : TrendingDownIcon}
                accent={totalPL >= 0 ? 'pos' : 'neg'}
              />
              <KpiCard
                label="Total Shares"
                value={sharesFormatted}
                icon={PieChartRoundedIcon}
                accent="neutral"
              />
              <KpiCard
                label="Available Cash"
                value={cashAvailable}
                icon={AccountBalanceWalletRoundedIcon}
                accent="neutral"
              />
            </Box>
          </Panel>

          {/* ── Main two-column grid ── */}
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', lg: '1.3fr 0.9fr' },
              alignItems: 'start',
            }}
          >
            {/* ── Left Column ── */}
            <Stack sx={{ gap: 3 }}>
              {/* Allocation */}
              <Panel delay={0.1} sx={{ px: { xs: 2, md: 2.6 }, py: 2.2 }}>
                <SectionTitle sub={`${holdings.length} holdings`}>Allocation</SectionTitle>
                <Box sx={{ mb: 2 }}>
                  <DonutChart slices={alloc.map((h) => ({ pct: h.pct, symbol: h.symbol, company: h.company }))} />
                </Box>
                <Divider sx={{ borderColor: T.border, mb: 1.6 }} />
                <AllocationBar data={alloc.map((h) => ({ symbol: h.symbol, pct: h.pct }))} />
              </Panel>

              {/* Holdings */}
              <Panel delay={0.16} sx={{ px: { xs: 2, md: 2.6 }, py: 2 }}>
                <SectionTitle sub={`${fmt(totalShares)} shares`}>Holdings</SectionTitle>
                <Box>
                  {holdings.map((h, idx) => (
                    <Box key={h.symbol}>
                      <HoldingRow holding={h} index={idx} />
                      {idx < holdings.length - 1 && <Divider sx={{ borderColor: T.border }} />}
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Box
                    component={motion.button}
                    whileHover={reduce ? undefined : { scale: 1.06, y: -2 }}
                    whileTap={reduce ? undefined : { scale: 0.96 }}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.6,
                      border: 'none',
                      cursor: 'pointer',
                      background: `linear-gradient(135deg, ${T.blue} 0%, #1b3f7a 100%)`,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(10,36,99,0.28)',
                    }}
                  >
                    <AddRoundedIcon sx={{ fontSize: 20 }} />
                  </Box>
                </Box>
              </Panel>
            </Stack>

            {/* ── Right Column ── */}
            <Stack sx={{ gap: 3 }}>
              {/* Performance trend */}
              <Panel delay={0.12} sx={{ px: { xs: 2, md: 2.4 }, py: 2 }}>
                <SectionTitle sub="30-day trend">Performance</SectionTitle>
                <PerformanceArea data={performanceData} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography sx={{ fontSize: 10.5, color: T.muted, fontWeight: 500 }}>
                    {performanceData[0].label}
                  </Typography>
                  <Typography sx={{ ...numberSx, fontSize: 11, fontWeight: 700, color: T.pos }}>
                    {fmtPkrSigned(performanceData[29].value - performanceData[0].value)}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: T.muted, fontWeight: 500 }}>
                    {performanceData[29].label}
                  </Typography>
                </Box>
              </Panel>

              {/* Watchlist */}
              <Panel delay={0.18} sx={{ px: { xs: 2, md: 2.4 }, py: 2 }}>
                <SectionTitle sub="Live movers">Watchlist</SectionTitle>
                <Box>
                  {watchlist.map((item, idx) => (
                    <Box key={item.symbol}>
                      <WatchlistRow item={item} index={idx} />
                      {idx < watchlist.length - 1 && <Divider sx={{ borderColor: T.border }} />}
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>
                    Alerts update every 5m
                  </Typography>
                  <Box
                    component={motion.button}
                    whileHover={reduce ? undefined : { scale: 1.04 }}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                    sx={{
                      px: 1.4,
                      py: 0.5,
                      borderRadius: 999,
                      border: `1px solid ${T.border}`,
                      background: 'transparent',
                      color: T.blue,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: '"Playfair Display", serif',
                      transition: 'background 0.2s ease',
                      '&:hover': { bgcolor: 'var(--wc-primary-soft)' },
                    }}
                  >
                    + Add symbol
                  </Box>
                </Box>
              </Panel>

              {/* History */}
              <Panel delay={0.22} sx={{ px: { xs: 2, md: 2.4 }, py: 2 }}>
                <SectionTitle>History</SectionTitle>
                <Box>
                  {historyEvents.map((ev, idx) => (
                    <Box key={ev.symbol + idx}>
                      <HistoryRow event={ev} index={idx} />
                      {idx < historyEvents.length - 1 && <Divider sx={{ borderColor: T.border }} />}
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
            transition={{ duration: 0.5, delay: 0.4 }}
            sx={{ textAlign: 'center', pb: 1 }}
          >
            <Typography sx={{ fontSize: 10.5, color: T.muted, letterSpacing: '0.04em' }}>
              Data is for informational purposes only · Webict Capital
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
