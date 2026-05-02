import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  Slide,
} from '@mui/material'
import { useMediaQuery, useTheme } from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { useMemo, useState, forwardRef, useEffect, useRef } from 'react'
import { LineChart } from '@mui/x-charts/LineChart'

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

// ─── Design tokens ─────────────────────────────────────────────────────────────

const mono = 'var(--wc-number-font, "DM Mono", monospace)'
const serif = '"Playfair Display", serif'

const C = {
  // Base
  bg: '#ffffff',
  surface: '#f7f9fc',
  surfaceDeep: '#f0f4f9',
  // Borders
  border: '#e4ecf4',
  borderStrong: '#c8d8eb',
  // Text
  ink: '#080e1a',
  ink2: '#3a4e65',
  muted: '#8097b0',
  // Brand
  accent: '#0a2463',
  accentMid: '#1a4fa8',
  accentLight: 'rgba(10,36,99,0.07)',
  accentGlow: 'rgba(26,79,168,0.15)',
  // State
  pos: '#0d5c32',
  posBg: 'rgba(13,92,50,0.07)',
  neg: '#9b1c2e',
  negBg: 'rgba(155,28,46,0.07)',
}

const SlideUp = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

// ─── Formatters ────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ─── Sub-components ────────────────────────────────────────────────────────────

function Tag({ children, color = C.accentMid }: { children: React.ReactNode; color?: string }) {
  return (
    <Typography
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color,
        fontFamily: mono,
        px: 0.9,
        py: 0.3,
        borderRadius: '4px',
        bgcolor: `${color}14`,
        border: `1px solid ${color}30`,
        lineHeight: 1.6,
      }}
    >
      {children}
    </Typography>
  )
}

function SectionTitle({ children, index }: { children: React.ReactNode; index?: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
      {index !== undefined && (
        <Typography sx={{ fontFamily: mono, fontSize: 9, color: C.muted, letterSpacing: '0.06em', mt: '1px' }}>
          {String(index + 1).padStart(2, '0')}
        </Typography>
      )}
      <Typography
        sx={{
          fontSize: 9.5,
          fontFamily: mono,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: C.accentMid,
          fontWeight: 700,
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: C.border }} />
    </Box>
  )
}

function StatRow({
  label,
  value,
  valueColor,
  highlight,
}: {
  label: string
  value: string
  valueColor?: string
  highlight?: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        px: 1.2,
        mx: -1.2,
        borderRadius: '6px',
        transition: 'background 0.18s ease',
        '&:hover': { bgcolor: C.accentLight },
      }}
    >
      <Typography sx={{ fontSize: 12, color: C.ink2, fontFamily: serif, letterSpacing: '0.01em' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: mono,
          fontSize: 12.5,
          fontWeight: 600,
          color: valueColor ?? C.ink,
          letterSpacing: '0.01em',
          ...(highlight && {
            px: 1,
            py: 0.3,
            borderRadius: '5px',
            bgcolor: valueColor ? `${valueColor}14` : C.accentLight,
            border: valueColor ? `1px solid ${valueColor}25` : `1px solid ${C.border}`,
          }),
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function RangeBar({
  low, high, current,
  lowLabel, highLabel,
  formatValue,
  color = C.accentMid,
}: {
  low: number; high: number; current: number
  lowLabel: string; highLabel: string
  formatValue: (v: number) => string
  color?: string
}) {
  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100))

  return (
    <Box>
      <Box sx={{ position: 'relative', height: 4, bgcolor: C.surfaceDeep, borderRadius: '99px', mb: 1.5, mx: 0.5 }}>
        {/* filled track */}
        <Box
          component={motion.div}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          sx={{
            position: 'absolute',
            top: 0, left: 0,
            height: '100%',
            background: `linear-gradient(90deg, ${color}30, ${color}90, ${color})`,
            borderRadius: '99px',
            boxShadow: `0 0 8px ${color}30`,
          }}
        />
        {/* thumb */}
        <Box
          component={motion.div}
          initial={{ left: 0, scale: 0 }}
          animate={{ left: `${pct}%`, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            bgcolor: '#fff',
            border: `2px solid ${color}`,
            boxShadow: `0 0 0 3px ${color}35, 0 2px 8px ${color}45`,
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {lowLabel}
          </Typography>
          <Typography sx={{ fontFamily: mono, fontSize: 11.5, fontWeight: 700, color: C.ink2, mt: 0.3, letterSpacing: '0.01em' }}>
            {formatValue(low)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Current
          </Typography>
          <Typography sx={{ fontFamily: mono, fontSize: 11.5, fontWeight: 700, color, mt: 0.3 }}>
            {formatValue(current)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {highLabel}
          </Typography>
          <Typography sx={{ fontFamily: mono, fontSize: 11.5, fontWeight: 700, color: C.ink2, mt: 0.3 }}>
            {formatValue(high)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function RangeBtn({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      component={motion.button}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      sx={{
        position: 'relative',
        px: 1.6,
        py: 0.6,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        bgcolor: active ? C.accent : 'transparent',
        transition: 'background 0.2s ease',
        outline: 'none',
        '&:hover': { bgcolor: active ? C.accent : C.accentLight },
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: mono,
          letterSpacing: '0.06em',
          color: active ? '#fff' : C.muted,
          transition: 'color 0.2s ease',
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  const accent = color ?? C.accentMid
  return (
    <Box
      component={motion.div}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      sx={{
        p: 1.6,
        borderRadius: '10px',
        border: `1px solid ${C.border}`,
        bgcolor: C.bg,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.4,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '2.5px',
          background: `linear-gradient(90deg, ${accent}, ${accent}40)`,
          borderRadius: '0 0 2px 0',
        },
        '&:hover': {
          boxShadow: '0 8px 24px rgba(10,36,99,0.1)',
          borderColor: C.borderStrong,
        },
      }}
    >
      <Typography sx={{ fontSize: 10, color: C.muted, fontFamily: mono, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: accent, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 10, color: C.muted, fontFamily: serif }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function StockDrawer({ open, onClose, stock }: StockDrawerProps) {
  const reduce = useReducedMotion()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const [range, setRange] = useState<'1W' | '1M' | 'YTD' | '1Y'>('1M')

  // Force chart remount after dialog finishes opening so it measures correct width
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartKey, setChartKey] = useState(0)

  useEffect(() => {
    if (!open) return
    // Wait for slide-up transition (~350ms) then remount chart with correct dimensions
    const timer = setTimeout(() => setChartKey((k) => k + 1), 380)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver(() => setChartKey((k) => k + 1))
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [])

  const chartData = useMemo(() => {
    if (!stock) return { values: [], labels: [], gain: false }
    const slices = { '1W': 7, '1M': stock.history30.length, 'YTD': stock.history30.length, '1Y': stock.history30.length }
    const count = slices[range]
    const values = stock.history30.slice(-count)
    const labels = stock.historyLabels.slice(-count)
    const gain = values.length > 1 && values[values.length - 1] >= values[0]
    return { values, labels, gain }
  }, [range, stock])

  if (!stock) return null

  const tickStep = Math.max(1, Math.ceil(chartData.labels.length / (isXs ? 5 : 7)))
  const chartHeight = isXs ? 210 : 190

  const pos = stock.change >= 0
  const changeColor = pos ? C.pos : C.neg
  const chartColor = chartData.gain ? C.pos : C.neg

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      slots={{ transition: SlideUp }}
      slotProps={{
        transition: { timeout: reduce ? 0 : 320 },
        backdrop: {
          sx: {
            bgcolor: 'rgba(5,10,20,0.55)',
            backdropFilter: 'blur(6px)',
          },
        },
        paper: {
          sx: {
            width: { xs: '100%', sm: '90vw', md: 880 },
            maxWidth: '100vw',
            maxHeight: { xs: '100dvh', sm: '92dvh' },
            borderRadius: { xs: 0, sm: '16px' },
            border: `1px solid ${C.borderStrong}`,
            bgcolor: C.bg,
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(8,14,26,0.28), 0 0 0 1px rgba(10,36,99,0.06)',
          },
        },
      }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.border}`,
          px: { xs: 2.5, md: 3.5 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Symbol block */}
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: C.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 12px ${C.accentGlow}`,
            }}
          >
            <Typography
              sx={{
                fontFamily: mono,
                fontSize: stock.symbol.length > 4 ? 9 : 11,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '0.04em',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {stock.symbol}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
              <Typography sx={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.1 }}>
                {stock.company}
              </Typography>
              <Tag>{stock.sector}</Tag>
            </Box>
            <Typography sx={{ fontSize: 11.5, color: C.muted, fontFamily: mono, letterSpacing: '0.03em' }}>
              {stock.symbol} · {stock.industry}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          component={motion.button}
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
          sx={{
            color: C.muted,
            bgcolor: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            width: 32,
            height: 32,
            '&:hover': { color: C.ink, bgcolor: C.surfaceDeep },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────────────── */}
      <Box sx={{ overflowY: 'auto', px: { xs: 2.5, md: 3.5 }, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── PRICE HERO ──────────────────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  fontFamily: mono,
                  fontSize: { xs: 34, md: 42 },
                  fontWeight: 800,
                  color: C.ink,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                Rs.{fmt(stock.price)}
              </Typography>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.2,
                  py: 0.5,
                  borderRadius: '8px',
                  bgcolor: pos ? C.posBg : C.negBg,
                  border: `1px solid ${changeColor}25`,
                }}
              >
                {pos
                  ? <TrendingUpIcon sx={{ fontSize: 14, color: changeColor }} />
                  : <TrendingDownIcon sx={{ fontSize: 14, color: changeColor }} />
                }
                <Typography sx={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: changeColor, letterSpacing: '0.01em' }}>
                  {pos ? '+' : ''}{stock.change.toFixed(2)} ({pos ? '+' : ''}{stock.changePct.toFixed(2)}%)
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 11, color: C.muted, fontFamily: mono, mt: 0.8, letterSpacing: '0.03em' }}>
              As of {new Date().toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · PSX
            </Typography>
          </Box>

          {/* Mini KPIs */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <KpiCard label="Market Cap" value={stock.marketCap} />
            <KpiCard label="P/E Ratio" value={stock.pe.toFixed(1)} color={stock.pe < 0 ? C.neg : C.accentMid} />
            <KpiCard
              label="52W Chg"
              value={`${stock.week52ChangePct >= 0 ? '+' : ''}${stock.week52ChangePct.toFixed(1)}%`}
              color={stock.week52ChangePct >= 0 ? C.pos : C.neg}
            />
          </Box>
        </Box>

        {/* ── CHART ───────────────────────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            bgcolor: C.surface,
            // FIX: 'visible' so chart SVG marks/tooltips near edges aren't clipped
            overflow: 'visible',
            isolation: 'isolate',
          }}
        >
          {/* Chart header */}
          <Box
            sx={{
              px: 2.5,
              pt: 2,
              pb: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <SectionTitle index={0}>Price History</SectionTitle>
            <Box sx={{ display: 'flex', gap: 0.3, bgcolor: C.surfaceDeep, p: 0.4, borderRadius: '8px', border: `1px solid ${C.border}` }}>
              {(['1W', '1M', 'YTD', '1Y'] as const).map((key) => (
                <RangeBtn key={key} label={key} active={range === key} onClick={() => setRange(key)} />
              ))}
            </Box>
          </Box>

          <AnimatePresence mode="wait">
            <Box
              key={range}
              component={motion.div}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              // FIX: fixed height (not minHeight) so the chart fills exactly this space
              sx={{ px: 1, pb: 1.5, height: chartHeight }}
              ref={chartRef}
            >
              <LineChart
                key={chartKey}
                xAxis={[{
                  data: chartData.labels,
                  scaleType: 'point',
                  height: isXs ? 22 : 28,
                  tickInterval: (_: unknown, i: number) => i % tickStep === 0,
                  tickLabelStyle: { fontSize: isXs ? 8 : 9, fill: C.muted, fontFamily: 'DM Mono, monospace' },
                  disableLine: true,
                  disableTicks: true,
                }]}
                yAxis={[{
                  width: isXs ? 44 : 55,
                  tickLabelStyle: { fontSize: isXs ? 8 : 9, fill: C.muted, fontFamily: 'DM Mono, monospace' },
                  disableLine: true,
                  disableTicks: true,
                }]}
                series={[{
                  data: chartData.values,
                  connectNulls: true,
                  showMark: true,
                  area: true,
                  color: chartColor,
                  valueFormatter: (value) => {
                    const safeValue = typeof value === 'number' ? value : 0
                    return `Rs.${fmt(safeValue)} · Vol ${stock.volume} · Avg ${stock.avgVolume}`
                  },
                }]}
                margin={{ left: isXs ? 44 : 56, right: isXs ? 16 : 24, top: 10, bottom: isXs ? 24 : 30 }}
                grid={{ horizontal: true }}
                // FIX: height matches the container exactly
                height={chartHeight}
                sx={{
                  // FIX: force SVG to fill container width — prevents stale measurement during dialog open animation
                  width: '100% !important',
                  '& .MuiChartsGrid-root line': { stroke: C.border, strokeDasharray: '3 4', strokeOpacity: 0.5 },
                  '& .MuiLineElement-root': {
                    strokeWidth: 2,
                    stroke: chartColor,
                    filter: `drop-shadow(0 2px 4px ${chartColor}30)`,
                  },
                  '& .MuiAreaElement-root': {
                    fill: chartColor,
                    fillOpacity: 0.12,
                  },
                  '& .MuiMarkElement-root': {
                    fill: '#fff',
                    stroke: chartColor,
                    strokeWidth: 2,
                    r: 3,
                  },
                  bgcolor: 'transparent',
                }}
              />
            </Box>
          </AnimatePresence>
        </Box>

        {/* ── RANGES (Day + 52W) ───────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
        >
          {[
            {
              title: "Day's Range",
              low: stock.dayLow, high: stock.dayHigh,
              current: stock.price,
              lowLabel: 'Day Low', highLabel: 'Day High',
            },
            {
              title: '52-Week Range',
              low: stock.week52Low, high: stock.week52High,
              current: stock.price,
              lowLabel: '52W Low', highLabel: '52W High',
            },
          ].map((r, i) => (
            <Box
              key={r.title}
              sx={{
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                bgcolor: C.bg,
                p: 2.5,
              }}
            >
              <SectionTitle index={i + 1}>{r.title}</SectionTitle>
              <RangeBar
                low={r.low} high={r.high} current={r.current}
                lowLabel={r.lowLabel} highLabel={r.highLabel}
                formatValue={(v) => `Rs.${fmt(v)}`}
                color={C.accentMid}
              />
            </Box>
          ))}
        </Box>

        {/* ── TRADING STATS + FUNDAMENTALS ────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
        >
          {/* Trading Stats */}
          <Box sx={{ border: `1px solid ${C.border}`, borderRadius: '12px', bgcolor: C.bg, p: 2.5 }}>
            <SectionTitle index={3}>Trading Stats</SectionTitle>
            <StatRow label="Volume" value={stock.volume} />
            <StatRow label="Avg Volume (10d)" value={stock.avgVolume} />
            <StatRow label="Open" value={`Rs.${fmt(stock.open)}`} />
            <StatRow label="Prev. Close" value={`Rs.${fmt(stock.previousClose)}`} />
            <StatRow label="Shares Outstanding" value={stock.sharesOutstanding} />
          </Box>

          {/* Fundamentals */}
          <Box sx={{ border: `1px solid ${C.border}`, borderRadius: '12px', bgcolor: C.bg, p: 2.5 }}>
            <SectionTitle index={4}>Fundamentals</SectionTitle>
            <StatRow label="EPS (TTM)" value={`Rs.${stock.eps.toFixed(2)}`} />
            <StatRow label="P/E Ratio" value={stock.pe.toFixed(2)} valueColor={stock.pe < 0 ? C.neg : undefined} highlight />
            <StatRow label="Price / Book" value={stock.priceToBook.toFixed(2)} />
            <StatRow label="Dividend Yield" value={`${stock.dividendYield.toFixed(2)}%`} valueColor={stock.dividendYield > 0 ? C.pos : C.muted} highlight />
            <StatRow label="Beta (5Y)" value={stock.beta.toFixed(2)} valueColor={stock.beta > 1.2 ? C.neg : stock.beta < 0.8 ? C.pos : undefined} highlight />
          </Box>
        </Box>

        {/* ── RISK METRICS ──────────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          sx={{ border: `1px solid ${C.border}`, borderRadius: '12px', bgcolor: C.bg, p: 2.5 }}
        >
          <SectionTitle index={5}>Risk & Quality</SectionTitle>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            <KpiCard
              label="ROE"
              value={`${stock.roe.toFixed(1)}%`}
              sub={stock.roe > 15 ? 'Strong' : stock.roe < 5 ? 'Weak' : 'Average'}
              color={stock.roe > 15 ? C.pos : stock.roe < 5 ? C.neg : C.accentMid}
            />
            <KpiCard
              label="Debt / Equity"
              value={stock.debtToEquity.toFixed(2)}
              sub={stock.debtToEquity > 1 ? 'High leverage' : 'Conservative'}
              color={stock.debtToEquity > 1 ? C.neg : C.pos}
            />
            <KpiCard
              label="Beta (5Y)"
              value={stock.beta.toFixed(2)}
              sub={stock.beta > 1.2 ? 'High volatility' : stock.beta < 0.8 ? 'Low volatility' : 'Market-like'}
              color={stock.beta > 1.2 ? C.neg : stock.beta < 0.8 ? C.pos : C.accentMid}
            />
          </Box>
        </Box>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 1,
            borderTop: `1px solid ${C.border}`,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: 10, color: C.muted, fontFamily: serif, letterSpacing: '0.03em' }}>
            Data is indicative · Not financial advice
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Typography
              sx={{
                fontSize: 10,
                color: C.accentMid,
                fontFamily: mono,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Webict Capital
            </Typography>
            <OpenInNewIcon sx={{ fontSize: 10, color: C.muted }} />
          </Box>
        </Box>
      </Box>
    </Dialog>
  )
}