import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {
  Box,
  CircularProgress,
  Dialog,
  IconButton,
  Typography,
  Slide,
} from '@mui/material'
import { useMediaQuery, useTheme } from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { useMemo, useState, forwardRef, useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'

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
  loading?: boolean
  error?: string | null
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

export function StockDrawer({ open, onClose, stock, loading = false, error = null }: StockDrawerProps) {
  const reduce = useReducedMotion()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const [range, setRange] = useState<'1W' | '1M' | 'YTD' | '1Y'>('1M')

  // Force chart remount after dialog finishes opening so it measures correct width
  const chartRef = useRef<ReactECharts>(null)

  // Resize chart when dialog finishes opening or stock data arrives
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      chartRef.current?.getEchartsInstance()?.resize()
    }, 380)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (open && stock) {
      // Let DOM paint content sections first, then resize
      const timer = setTimeout(() => {
        chartRef.current?.getEchartsInstance()?.resize()
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [open, stock])

  const chartData = useMemo(() => {
    if (!stock) return { ohlc: [] as number[][], labels: [], gain: false, values: [] as number[], volumes: [] as number[], closeLine: [] as number[] }
    const count = range === '1W' ? 5 : range === '1M' ? 22 : stock.history30.length
    const values = stock.history30.slice(-count)
    const labels = stock.historyLabels.slice(-count)
    const gain = values.length > 1 && values[values.length - 1] >= values[0]
    // Generate synthetic OHLC data from close prices
    const rawOhlc = values.map((v, i) => {
      const open = i > 0 ? values[i - 1] : v * 0.998
      const close = v
      const low = Math.min(open, close) * (1 - 0.005 - Math.sin(i * 0.7) * 0.005)
      const high = Math.max(open, close) * (1 + 0.005 + Math.cos(i * 0.6) * 0.005)
      return [open, close, low, high]
    })

    // Synthetic volume from price movement magnitude
    const rawVolumes = rawOhlc.map((candle, i) => {
      const base = parseInt(String(stock.volume).replace(/[^0-9]/g, ''), 10) || 100000
      const changeRatio = Math.abs(candle[1] - candle[0]) / Math.max(candle[0], 1)
      return Math.round(base * (0.5 + changeRatio * 10 + Math.sin(i * 1.3) * 0.2))
    })

    // Aggregate for very large datasets
    const maxVisible = isXs ? 35 : 45
    const needsAggregation = rawOhlc.length > maxVisible * 2

    if (!needsAggregation) {
      return {
        ohlc: rawOhlc,
        labels,
        gain,
        values,
        volumes: rawVolumes,
        closeLine: rawOhlc.map(c => c[1]),
      }
    }

    const bucketSize = Math.ceil(rawOhlc.length / (maxVisible * 2))
    const compactOhlc: number[][] = []
    const compactLabels: string[] = []
    const compactVolumes: number[] = []
    const compactValues: number[] = []

    for (let i = 0; i < rawOhlc.length; i += bucketSize) {
      const slice = rawOhlc.slice(i, i + bucketSize)
      const volSlice = rawVolumes.slice(i, i + bucketSize)
      if (!slice.length) continue
      const open = slice[0][0]
      const close = slice[slice.length - 1][1]
      let low = slice[0][2]
      let high = slice[0][3]
      let totalVol = 0
      for (let j = 0; j < slice.length; j++) {
        low = Math.min(low, slice[j][2])
        high = Math.max(high, slice[j][3])
        totalVol += volSlice[j] || 0
      }
      compactOhlc.push([open, close, low, high])
      compactLabels.push(labels[Math.min(i + slice.length - 1, labels.length - 1)])
      compactVolumes.push(totalVol)
      compactValues.push(close)
    }

    return {
      ohlc: compactOhlc,
      labels: compactLabels,
      gain: compactValues.length > 1 && compactValues[compactValues.length - 1] >= compactValues[0],
      values: compactValues,
      volumes: compactVolumes,
      closeLine: compactOhlc.map(c => c[1]),
    }
  }, [range, stock, isXs])

  if (!stock && !loading && !error) return null

  const chartHeight = isXs ? 260 : 280

  // Determine if we need dataZoom (scrollable chart)
  const totalCandles = chartData.ohlc.length
  const showZoom = totalCandles > (isXs ? 25 : 35)
  const zoomEnd = showZoom ? Math.min(100, ((isXs ? 25 : 35) / totalCandles) * 100) : 100
  const maxVolume = chartData.volumes.length > 0 ? Math.max(...chartData.volumes) : 1

  const pos = stock ? stock.change >= 0 : false
  const changeColor = pos ? C.pos : C.neg
  const candleUp = C.pos
  const candleDown = C.neg

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading && !stock) {
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
            sx: { bgcolor: 'rgba(5,10,20,0.55)', backdropFilter: 'blur(6px)' },
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
        <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, px: { xs: 2.5, md: 3.5 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.ink }}>Loading...</Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: C.muted, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', width: 32, height: 32 }}>
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={40} sx={{ color: C.accentMid }} />
        </Box>
      </Dialog>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (error && !stock) {
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
            sx: { bgcolor: 'rgba(5,10,20,0.55)', backdropFilter: 'blur(6px)' },
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
        <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, px: { xs: 2.5, md: 3.5 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.ink }}>Error</Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: C.muted, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', width: 32, height: 32 }}>
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, px: 4, textAlign: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: C.negBg, border: `1px solid ${C.neg}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: C.neg, fontFamily: mono }}>!</Typography>
          </Box>
          <Typography sx={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>
            Could not load stock data
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.7, maxWidth: 400 }}>
            {error}
          </Typography>
        </Box>
      </Dialog>
    )
  }

  // Type guard: TS can't infer stock is non-null across the compound checks above
  if (!stock) return null

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
            <KpiCard label="P/E Ratio" value={stock.pe !== 0 ? stock.pe.toFixed(1) : 'N/A'} color={stock.pe < 0 ? C.neg : C.accentMid} />
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
            >
              <ReactECharts
                ref={chartRef}
                style={{ height: chartHeight, width: '100%' }}
                opts={{ renderer: 'svg' }}
                option={{
                  animation: true,
                  animationDuration: 600,
                  animationEasing: 'cubicOut',
                  grid: [
                    {
                      // Main candle grid
                      left: isXs ? 52 : 64,
                      right: isXs ? 12 : 24,
                      top: 16,
                      bottom: showZoom ? (isXs ? 85 : 95) : (isXs ? 65 : 72),
                      height: showZoom ? (chartHeight - (isXs ? 145 : 158)) : (chartHeight - (isXs ? 110 : 118)),
                    },
                    {
                      // Volume grid
                      left: isXs ? 52 : 64,
                      right: isXs ? 12 : 24,
                      bottom: showZoom ? (isXs ? 55 : 62) : (isXs ? 26 : 30),
                      height: isXs ? 24 : 30,
                    },
                  ],
                  xAxis: [
                    {
                      type: 'category',
                      data: chartData.labels,
                      boundaryGap: true,
                      axisLine: { show: false },
                      axisTick: { show: false },
                      axisLabel: { show: false },
                      gridIndex: 0,
                    },
                    {
                      type: 'category',
                      data: chartData.labels,
                      boundaryGap: true,
                      gridIndex: 1,
                      axisLine: { show: false },
                      axisTick: { show: false },
                      axisLabel: {
                        show: true,
                        fontSize: isXs ? 8 : 9,
                        color: C.muted,
                        fontFamily: 'DM Mono, monospace',
                        interval: Math.max(0, Math.ceil(chartData.labels.length / (isXs ? 5 : 7)) - 1),
                        rotate: 0,
                      },
                    },
                  ],
                  yAxis: [
                    {
                      type: 'value',
                      scale: true,
                      gridIndex: 0,
                      axisLine: { show: false },
                      axisTick: { show: false },
                      splitLine: {
                        lineStyle: {
                          color: C.border,
                          type: 'dashed',
                          opacity: 0.4,
                        },
                      },
                      axisLabel: {
                        show: true,
                        fontSize: isXs ? 8 : 9,
                        color: C.muted,
                        fontFamily: 'DM Mono, monospace',
                      },
                    },
                    {
                      type: 'value',
                      gridIndex: 1,
                      axisLine: { show: false },
                      axisTick: { show: false },
                      splitLine: { show: false },
                      axisLabel: { show: false },
                      max: maxVolume * 3,
                    },
                  ],
                  dataZoom: showZoom ? [
                    {
                      type: 'slider',
                      xAxisIndex: [0, 1],
                      start: 100 - zoomEnd,
                      end: 100,
                      bottom: isXs ? 8 : 10,
                      height: isXs ? 16 : 20,
                      borderColor: C.border,
                      fillerColor: 'rgba(10,36,99,0.08)',
                      handleStyle: {
                        color: C.accent,
                        borderColor: C.accent,
                      },
                      moveHandleSize: 4,
                      textStyle: {
                        fontSize: 9,
                        color: C.muted,
                        fontFamily: 'DM Mono, monospace',
                      },
                      dataBackground: {
                        lineStyle: { color: 'rgba(10,36,99,0.15)', width: 1 },
                        areaStyle: { color: 'rgba(10,36,99,0.05)' },
                      },
                      selectedDataBackground: {
                        lineStyle: { color: C.accent, width: 1 },
                        areaStyle: { color: 'rgba(10,36,99,0.12)' },
                      },
                    },
                    {
                      type: 'inside',
                      xAxisIndex: [0, 1],
                      start: 100 - zoomEnd,
                      end: 100,
                    },
                  ] : [
                    {
                      type: 'inside',
                      xAxisIndex: [0, 1],
                      start: 0,
                      end: 100,
                    },
                  ],
                  series: [
                    {
                      name: stock.symbol,
                      type: 'candlestick',
                      data: chartData.ohlc,
                      xAxisIndex: 0,
                      yAxisIndex: 0,
                      barMaxWidth: isXs ? 14 : 18,
                      barMinWidth: 2,
                      itemStyle: {
                        color: candleUp,
                        color0: candleDown,
                        borderColor: candleUp,
                        borderColor0: candleDown,
                        borderWidth: 1,
                      },
                      emphasis: {
                        itemStyle: {
                          borderWidth: 2,
                          shadowBlur: 6,
                          shadowColor: 'rgba(0,0,0,0.12)',
                        },
                      },
                    },
                    {
                      name: 'Close',
                      type: 'line',
                      data: chartData.closeLine,
                      xAxisIndex: 0,
                      yAxisIndex: 0,
                      smooth: 0.3,
                      symbol: 'none',
                      lineStyle: {
                        width: 1.2,
                        color: chartData.gain ? 'rgba(13,92,50,0.2)' : 'rgba(155,28,46,0.2)',
                      },
                      areaStyle: {
                        color: {
                          type: 'linear',
                          x: 0, y: 0, x2: 0, y2: 1,
                          colorStops: [
                            { offset: 0, color: chartData.gain ? 'rgba(13,92,50,0.08)' : 'rgba(155,28,46,0.08)' },
                            { offset: 1, color: chartData.gain ? 'rgba(13,92,50,0.01)' : 'rgba(155,28,46,0.01)' },
                          ],
                        },
                      },
                      z: 0,
                    },
                    {
                      name: 'Volume',
                      type: 'bar',
                      data: chartData.volumes.map((v, i) => ({
                        value: v,
                        itemStyle: {
                          color: chartData.ohlc[i] && chartData.ohlc[i][1] >= chartData.ohlc[i][0]
                            ? 'rgba(13,92,50,0.22)'
                            : 'rgba(155,28,46,0.22)',
                        },
                      })),
                      xAxisIndex: 1,
                      yAxisIndex: 1,
                      barMaxWidth: isXs ? 12 : 16,
                      barMinWidth: 1,
                    },
                  ],
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                      type: 'cross',
                      crossStyle: { color: C.muted, width: 0.5 },
                      lineStyle: { color: C.border, width: 1, type: 'dashed' },
                      label: {
                        backgroundColor: C.accent,
                        fontSize: 9,
                        fontFamily: 'DM Mono, monospace',
                      },
                    },
                    backgroundColor: 'rgba(255,255,255,0.96)',
                    borderColor: C.borderStrong,
                    borderRadius: 8,
                    padding: [10, 14],
                    textStyle: {
                      fontSize: 11,
                      color: C.ink,
                      fontFamily: 'DM Mono, monospace',
                    },
                    formatter: (params: { seriesName?: string; value: number | number[] }[]) => {
                      const candleParam = params.find(p => p.seriesName === stock.symbol)
                      if (!candleParam) return ''
                      const d = candleParam.value as number[]
                      const [open, close, low, high] = d
                      const chg = ((close - open) / open * 100).toFixed(2)
                      const sign = close >= open ? '+' : ''
                      const chgColor = close >= open ? candleUp : candleDown
                      return [
                        `<div style="font-weight:700;margin-bottom:4px;font-size:10px;color:${C.muted};">${stock.symbol}</div>`,
                        `<div style="display:grid;grid-template-columns:32px 1fr;gap:2px 8px;font-size:11px;">`,
                        `<span style="color:${C.muted}">O</span><span>Rs.${fmt(open)}</span>`,
                        `<span style="color:${C.muted}">H</span><span>Rs.${fmt(high)}</span>`,
                        `<span style="color:${C.muted}">L</span><span>Rs.${fmt(low)}</span>`,
                        `<span style="color:${C.muted}">C</span><span style="font-weight:700">Rs.${fmt(close)}</span>`,
                        `</div>`,
                        `<div style="margin-top:4px;padding-top:4px;border-top:1px solid ${C.border};color:${chgColor};font-weight:700;font-size:12px">${sign}${chg}%</div>`,
                      ].join('')
                    },
                  },
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
            <StatRow label="EPS (TTM)" value={stock.eps !== 0 ? `Rs.${stock.eps.toFixed(2)}` : 'N/A'} />
            <StatRow label="P/E Ratio" value={stock.pe !== 0 ? stock.pe.toFixed(2) : 'N/A'} valueColor={stock.pe < 0 ? C.neg : undefined} highlight />
            <StatRow label="Price / Book" value={stock.priceToBook !== 0 ? stock.priceToBook.toFixed(2) : 'N/A'} />
            <StatRow label="Dividend Yield" value={stock.dividendYield !== 0 ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'} valueColor={stock.dividendYield > 0 ? C.pos : C.muted} highlight />
            <StatRow label="Beta (5Y)" value={stock.beta !== 0 ? stock.beta.toFixed(2) : 'N/A'} valueColor={stock.beta > 1.2 ? C.neg : stock.beta < 0.8 ? C.pos : undefined} highlight />
          </Box>
        </Box>

        {/* ── RISK METRICS ──────────────────────────────────────────── */}
        {(stock.roe !== 0 || stock.debtToEquity !== 0 || stock.beta !== 0) && (
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
        )}

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