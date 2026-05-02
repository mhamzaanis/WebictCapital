import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Divider,
} from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { LineChart } from '@mui/x-charts'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StockDetail = {
  symbol: string
  company: string
  sector: string
  industry: string
  price: number
  change: number
  changePct: number
  volume: string
  avgVolume: string
  sharesOutstanding: string
  open: number
  previousClose: number
  dayLow: number
  dayHigh: number
  week52Low: number
  week52High: number
  week52ChangePct: number
  eps: number
  pe: number
  marketCap: string
  dividendYield: number
  beta: number
  roe: number
  debtToEquity: number
  priceToBook: number
  spark: number[]
  history30: number[]
  historyLabels: string[]
}

type StockDrawerProps = {
  open: boolean
  onClose: () => void
  stock: StockDetail | null
}

// ─── Design tokens (matching theme.ts) ─────────────────────────────────────────

const mono = 'var(--wc-number-font)'
const serif = '"Playfair Display", serif'

const C = {
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

// ─── Section label ─────────────────────────────────────────────────────────────

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontFamily: serif,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: C.accent,
        mb: 1.2,
      }}
    >
      {children}
    </Typography>
  )
}

// ─── Stat row ──────────────────────────────────────────────────────────────────

function StatPair({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.85 }}>
      <Typography sx={{ fontSize: 12.5, color: C.ink2, fontFamily: serif }}>{label}</Typography>
      <Typography sx={{ fontFamily: mono, fontSize: 12.5, fontWeight: 600, color: valueColor ?? C.ink }}>
        {value}
      </Typography>
    </Box>
  )
}

// ─── Range bar ─────────────────────────────────────────────────────────────────

function RangeBar({
  low,
  high,
  current,
  lowLabel,
  highLabel,
  formatValue,
}: {
  low: number
  high: number
  current: number
  lowLabel: string
  highLabel: string
  formatValue: (v: number) => string
}) {
  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100))

  return (
    <Box>
      <Box sx={{ position: 'relative', height: 5, bgcolor: C.border, borderRadius: '3px', mb: 1.2 }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${pct}%`,
            bgcolor: C.accent,
            borderRadius: '3px',
            opacity: 0.55,
            transition: 'width 0.4s ease',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: C.accent,
            border: '2.5px solid #fff',
            boxShadow: '0 0 0 1px rgba(10,36,99,0.18)',
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 9.5, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {lowLabel}
          </Typography>
          <Typography sx={{ fontFamily: mono, fontSize: 11.5, fontWeight: 600, color: C.ink2, mt: 0.2 }}>
            {formatValue(low)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 9.5, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {highLabel}
          </Typography>
          <Typography sx={{ fontFamily: mono, fontSize: 11.5, fontWeight: 600, color: C.ink2, mt: 0.2 }}>
            {formatValue(high)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ─── Sector badge ──────────────────────────────────────────────────────────────

function SectorBadge({ sector }: { sector: string }) {
  return (
    <Typography
      sx={{
        display: 'inline-block',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: C.accent,
        fontFamily: mono,
        px: 0.6,
        py: 0.2,
        borderRadius: '3px',
        bgcolor: 'rgba(10,36,99,0.06)',
        border: '1px solid rgba(10,36,99,0.15)',
        lineHeight: 1.5,
      }}
    >
      {sector}
    </Typography>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StockDrawer({ open, onClose, stock }: StockDrawerProps) {
  const reduce = useReducedMotion()

  const chartData = useMemo(() => {
    if (!stock) return { values: [], labels: [], gain: false }
    const values = stock.history30
    const gain = values.length > 1 && values[values.length - 1] >= values[0]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.15
    return {
      values,
      labels: stock.historyLabels,
      gain,
      min: min - padding,
      max: max + padding,
    }
  }, [stock])

  if (!stock) return null

  const pos = stock.change >= 0

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 620 },
          maxWidth: '100vw',
          borderRight: `1px solid ${C.border}`,
          bgcolor: C.bg,
          overflow: 'auto',
        },
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${C.border}`,
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.4 }}>
            <Typography sx={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: '0.02em' }}>
              {stock.symbol}
            </Typography>
            <SectorBadge sector={stock.sector} />
          </Box>
          <Typography sx={{ fontSize: 12, color: C.ink2, fontFamily: serif }}>
            {stock.company} · {stock.industry}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: C.muted, '&:hover': { color: C.ink, bgcolor: C.surface }, mt: 0.2 }}
        >
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.5 }}>
        {/* ── Price + Change ────────────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          sx={{ mb: 3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 0.4 }}>
            <Typography sx={{ fontFamily: mono, fontSize: 36, fontWeight: 700, color: C.ink, letterSpacing: '-0.04em', lineHeight: 1 }}>
              Rs. {fmt(stock.price)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              {pos ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: C.pos }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: C.neg }} />
              )}
              <Typography sx={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: pos ? C.pos : C.neg }}>
                {pos ? '+' : ''}{stock.change.toFixed(1)} ({pos ? '+' : ''}{stock.changePct.toFixed(2)}%)
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: 11.5, color: C.muted, fontFamily: serif }}>
            {pos ? '+' : ''}{stock.changePct.toFixed(2)}% today · Closed {new Date().toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Typography>
        </Box>

        {/* ── Price Chart ───────────────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            border: `1px solid ${C.border}`,
            borderRadius: 1.5,
            bgcolor: C.surface,
            p: 2,
            mb: 3,
          }}
        >
          <SecLabel>30-Day Price History</SecLabel>
          <LineChart
            height={200}
            margin={{ left: 55, right: 14, top: 8, bottom: 28 }}
            series={[{
              data: chartData.values,
              area: true,
              showMark: false,
              curve: 'natural',
              color: chartData.gain ? C.pos : C.neg,
              valueFormatter: (v) => `Rs. ${v?.toLocaleString('en-PK')}`,
            }]}
            xAxis={[{
              data: chartData.labels,
              scaleType: 'point',
              tickInterval: (_: unknown, i: number) => i % 7 === 0,
              tickLabelStyle: { fontSize: 9.5, fill: C.muted, fontFamily: mono },
            }]}
            yAxis={[{
              min: chartData.min,
              max: chartData.max,
              valueFormatter: (v: number | null) => `${((v ?? 0) / 1_000).toFixed(1)}K`,
              tickLabelStyle: { fontSize: 9.5, fill: C.muted, fontFamily: mono },
            }]}
            sx={{
              '& .MuiChartsGrid-root': { display: 'none' },
              '& .MuiChartsAxis-line': { stroke: C.border },
              '& .MuiChartsAxis-tick': { stroke: C.border },
              '& .MuiAreaElement-root': { fill: 'url(#drawerChartGrad)', opacity: 0.5 },
              '& .MuiLineElement-root': { strokeWidth: 2 },
              bgcolor: 'transparent',
            }}
          >
            <defs>
              <linearGradient id="drawerChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartData.gain ? C.pos : C.neg} stopOpacity={0.22} />
                <stop offset="100%" stopColor={chartData.gain ? C.pos : C.neg} stopOpacity={0.0} />
              </linearGradient>
            </defs>
          </LineChart>
        </Box>

        {/* ── Trading Stats + Ranges (2-col grid) ────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 2,
          }}
        >
          {/* Key Statistics */}
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              border: `1px solid ${C.border}`,
              borderRadius: 1.5,
              bgcolor: C.bg,
              p: 2,
            }}
          >
            <SecLabel>Trading Stats</SecLabel>
            <StatPair label="Volume" value={stock.volume} />
            <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
            <StatPair label="Avg Volume (10d)" value={stock.avgVolume} />
            <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
            <StatPair label="Open" value={`Rs. ${fmt(stock.open)}`} />
            <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
            <StatPair label="Previous Close" value={`Rs. ${fmt(stock.previousClose)}`} />
            <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
            <StatPair label="Shares Outstanding" value={stock.sharesOutstanding} />
          </Box>

          {/* Ranges */}
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Day's Range */}
            <Box sx={{ border: `1px solid ${C.border}`, borderRadius: 1.5, bgcolor: C.bg, p: 2 }}>
              <SecLabel>Day's Range</SecLabel>
              <RangeBar
                low={stock.dayLow}
                high={stock.dayHigh}
                current={stock.price}
                lowLabel="Day Low"
                highLabel="Day High"
                formatValue={(v) => `Rs. ${fmt(v)}`}
              />
            </Box>

            {/* 52 Week Range */}
            <Box sx={{ border: `1px solid ${C.border}`, borderRadius: 1.5, bgcolor: C.bg, p: 2 }}>
              <SecLabel>52 Week Range</SecLabel>
              <RangeBar
                low={stock.week52Low}
                high={stock.week52High}
                current={stock.price}
                lowLabel="52W Low"
                highLabel="52W High"
                formatValue={(v) => `Rs. ${fmt(v)}`}
              />
              <Box sx={{ mt: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 11, color: C.muted, fontFamily: serif }}>52W Change</Typography>
                <Typography
                  sx={{
                    fontFamily: mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: stock.week52ChangePct >= 0 ? C.pos : C.neg,
                  }}
                >
                  {stock.week52ChangePct >= 0 ? '+' : ''}{stock.week52ChangePct.toFixed(2)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── Fundamentals ───────────────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            border: `1px solid ${C.border}`,
            borderRadius: 1.5,
            bgcolor: C.bg,
            p: 2,
            mb: 2,
          }}
        >
          <SecLabel>Fundamentals</SecLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              columnGap: 4,
            }}
          >
            <Box>
              <StatPair label="EPS (TTM)" value={`Rs. ${stock.eps.toFixed(2)}`} />
              <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
              <StatPair label="P/E Ratio" value={stock.pe.toFixed(2)} valueColor={stock.pe < 0 ? C.neg : C.ink} />
              <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
              <StatPair label="Price / Book" value={stock.priceToBook.toFixed(2)} />
              <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
              <StatPair label="Market Cap" value={stock.marketCap} />
            </Box>
            <Box>
              <StatPair label="Dividend Yield" value={`${stock.dividendYield.toFixed(2)}%`} valueColor={stock.dividendYield > 0 ? C.pos : C.muted} />
              <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
              <StatPair label="ROE" value={`${stock.roe.toFixed(1)}%`} valueColor={stock.roe > 15 ? C.pos : stock.roe < 5 ? C.neg : C.ink} />
              <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
              <StatPair label="Debt / Equity" value={stock.debtToEquity.toFixed(2)} valueColor={stock.debtToEquity > 1 ? C.neg : C.ink} />
              <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
              <StatPair label="Beta (5Y)" value={stock.beta.toFixed(2)} valueColor={stock.beta > 1.2 ? C.neg : stock.beta < 0.8 ? C.pos : C.ink} />
            </Box>
          </Box>
        </Box>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <Typography sx={{ fontSize: 10, color: C.muted, fontFamily: serif, textAlign: 'center', mt: 2, letterSpacing: '0.03em' }}>
          Data is indicative · Not financial advice · Webict Capital
        </Typography>
      </Box>
    </Drawer>
  )
}
