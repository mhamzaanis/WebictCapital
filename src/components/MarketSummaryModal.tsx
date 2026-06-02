import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Dialog, IconButton, Slide, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import ReactECharts from 'echarts-for-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement, Ref } from 'react'
import { PulseSkeleton } from './PulseSkeleton'

export type MarketSummary = {
  tradeDate: string
  kse100_prev: number
  kse100_close: number
  kse100_change: number
  kse30_prev: number
  kse30_close: number
  kse30_change: number
  prev_volume: number
  curr_volume: number
  advances: number
  declines: number
  unchanged: number
  flu_no?: string | null
  kse100History: Record<'1W' | '1M' | 'YTD' | '1Y', { labels: string[]; values: number[] }>
  kse30History: Record<'1W' | '1M' | 'YTD' | '1Y', { labels: string[]; values: number[] }>
}

type MarketSummaryModalProps = {
  open: boolean
  onClose: () => void
  summary: MarketSummary | null
  activeIndex?: 'kse100' | 'kse30'
  loading?: boolean
}

const NUMBER_FONT = 'var(--wc-number-font)'
const SERIF = '"Playfair Display", serif'

const COLORS = {
  bg: 'var(--wc-paper)',
  surface: 'var(--wc-surface)',
  border: 'var(--wc-divider)',
  primary: 'var(--wc-primary)',
  text: 'var(--wc-text-primary)',
  textSecondary: 'var(--wc-text-secondary)',
  success: 'var(--wc-success)',
  error: 'var(--wc-error)',
}

function BreadthBar({ advances, declines, unchanged }: { advances: number; declines: number; unchanged: number }) {
  const total = advances + declines + unchanged
  const advPct = (advances / total) * 100
  const decPct = (declines / total) * 100
  const unchPct = (unchanged / total) * 100

  return (
    <Box sx={{ mt: 1.2 }}>
      <Box sx={{ display: 'flex', borderRadius: '99px', overflow: 'hidden', height: 8, gap: 0.3 }}>
        <Box
          component={motion.div}
          initial={{ width: 0 }}
          animate={{ width: `${advPct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          sx={{ bgcolor: COLORS.success, borderRadius: '99px', minWidth: advPct > 0 ? 4 : 0 }}
        />
        <Box
          component={motion.div}
          initial={{ width: 0 }}
          animate={{ width: `${decPct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          sx={{ bgcolor: COLORS.error, borderRadius: '99px', minWidth: decPct > 0 ? 4 : 0 }}
        />
        <Box
          component={motion.div}
          initial={{ width: 0 }}
          animate={{ width: `${unchPct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
          sx={{ bgcolor: '#c8d6e5', borderRadius: '99px', minWidth: unchPct > 0 ? 4 : 0 }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS.success }} />
          <Typography sx={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: NUMBER_FONT }}>
            Adv {advances}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS.error }} />
          <Typography sx={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: NUMBER_FONT }}>
            Dec {declines}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#c8d6e5' }} />
          <Typography sx={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: NUMBER_FONT }}>
            Unch {unchanged}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

const SlideUp = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

function RangeBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      component={motion.button}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      sx={{
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        px: 1.5,
        py: 0.6,
        bgcolor: active ? COLORS.primary : 'transparent',
        transition: 'background 0.2s ease',
        outline: 'none',
        '&:hover': { bgcolor: active ? COLORS.primary : 'rgba(10,36,99,0.08)' },
      }}
    >
      <Typography
        sx={{
          fontSize: 10.5,
          fontWeight: 700,
          fontFamily: NUMBER_FONT,
          letterSpacing: '0.06em',
          color: active ? '#fff' : COLORS.textSecondary,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

function InfoTile({ label, value, sub, onClick }: { label: string; value: string; sub?: string; onClick?: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 1.25,
        bgcolor: COLORS.bg,
        px: 1.8,
        py: 1.6,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': onClick
          ? { borderColor: COLORS.primary, boxShadow: '0 6px 20px rgba(10,36,99,0.08)' }
          : undefined,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.textSecondary,
          fontFamily: SERIF,
          mb: 0.6,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: NUMBER_FONT,
          fontSize: 16,
          fontWeight: 700,
          color: COLORS.text,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 10.5, color: COLORS.textSecondary, fontFamily: SERIF, mt: 0.4 }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

function StatRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8 }}>
      <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: SERIF }}>{label}</Typography>
      <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 12.5, fontWeight: 600, color: valueColor ?? COLORS.text }}>
        {value}
      </Typography>
    </Box>
  )
}

const fmtIndex = (v: number) => v.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtNumber = (v: number) => v.toLocaleString('en-PK')

export function MarketSummaryModal({ open, onClose, summary, activeIndex = 'kse100', loading = false }: MarketSummaryModalProps) {
  const reduce = useReducedMotion()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const [range, setRange] = useState<'1W' | '1M' | 'YTD' | '1Y'>('1M')

  // Force chart remount after dialog finishes opening so it measures correct width
  const chartRef = useRef<ReactECharts>(null)
  const [chartKey, setChartKey] = useState(0)

  useEffect(() => {
    if (!open) return
    // Wait for slide-up transition to complete (~350ms) then remount chart
    const timer = setTimeout(() => setChartKey((k) => k + 1), 380)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => chartRef.current?.getEchartsInstance()?.resize(), 400)
    return () => clearTimeout(timer)
  }, [open, chartKey, range])

  const chartData = useMemo(() => {
    if (!summary) return { ohlc: [] as number[][], labels: [] as string[], volumes: [] as number[], closeLine: [] as number[] }
    const historyMap = activeIndex === 'kse100' ? summary.kse100History : summary.kse30History
    const data = historyMap[range]
    const rawOhlc = data.values.map((v, i) => {
      const open = i > 0 ? data.values[i - 1] : v * 0.998
      const close = v
      const low = Math.min(open, close) * (1 - 0.004 - Math.sin(i * 0.7) * 0.004)
      const high = Math.max(open, close) * (1 + 0.004 + Math.cos(i * 0.6) * 0.004)
      return [open, close, low, high]
    })

    // Generate synthetic volumes (based on price change magnitude)
    const rawVolumes = rawOhlc.map((candle, i) => {
      const base = summary.curr_volume || 100000
      const changeRatio = Math.abs(candle[1] - candle[0]) / Math.max(candle[0], 1)
      return Math.round(base * (0.6 + changeRatio * 8 + Math.sin(i * 1.3) * 0.25))
    })

    // Smarter aggregation: show a window of visible candles, keep all data for zoom
    const maxVisible = isXs ? 40 : 50
    const needsAggregation = rawOhlc.length > maxVisible * 2

    if (!needsAggregation) {
      return {
        ohlc: rawOhlc,
        labels: data.labels,
        volumes: rawVolumes,
        closeLine: rawOhlc.map(c => c[1]),
      }
    }

    // Aggregate into buckets for very large datasets
    const bucketSize = Math.ceil(rawOhlc.length / (maxVisible * 2))
    const compactOhlc: number[][] = []
    const compactLabels: string[] = []
    const compactVolumes: number[] = []

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
      compactLabels.push(data.labels[Math.min(i + slice.length - 1, data.labels.length - 1)])
      compactVolumes.push(totalVol)
    }

    return {
      ohlc: compactOhlc,
      labels: compactLabels,
      volumes: compactVolumes,
      closeLine: compactOhlc.map(c => c[1]),
    }
  }, [range, summary, isXs, activeIndex])

  if (loading || !summary) {
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
              bgcolor: 'rgba(5,10,20,0.45)',
              backdropFilter: 'blur(6px)',
            },
          },
          paper: {
            sx: {
              width: { xs: '100%', sm: '90vw', md: 880 },
              maxWidth: '100vw',
              maxHeight: { xs: '100dvh', sm: '92dvh' },
              borderRadius: { xs: 0, sm: '16px' },
              border: `1px solid ${COLORS.border}`,
              bgcolor: COLORS.bg,
              overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(8,14,26,0.2), 0 0 0 1px rgba(10,36,99,0.06)',
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${COLORS.border}`,
            px: { xs: 2.5, md: 3.5 },
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <PulseSkeleton shape="text" width={140} height={12} />
            <PulseSkeleton shape="text" width={220} height={18} />
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: COLORS.textSecondary,
              bgcolor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              width: 32,
              height: 32,
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ overflowY: 'auto', px: { xs: 2.5, md: 3.5 }, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            {[0, 1].map((i) => (
              <Box
                key={i}
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  bgcolor: COLORS.surface,
                  px: 2,
                  py: 1.6,
                }}
              >
                <PulseSkeleton shape="text" width={120} height={12} />
                <PulseSkeleton shape="text" width={140} height={24} sx={{ mt: 0.6 }} />
                <PulseSkeleton shape="text" width={100} height={12} sx={{ mt: 0.6 }} />
              </Box>
            ))}
          </Box>

          <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', bgcolor: COLORS.surface }}>
            <Box sx={{ px: 2.5, pt: 2, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <PulseSkeleton shape="text" width={140} height={14} />
              <Box sx={{ display: 'flex', gap: 0.6 }}>
                {[0, 1, 2, 3].map((i) => (
                  <PulseSkeleton key={i} shape="rounded" width={36} height={22} />
                ))}
              </Box>
            </Box>
            <Box sx={{ px: 1, pb: 1.5, height: isXs ? 320 : 360 }}>
              <PulseSkeleton shape="rounded" height={isXs ? 320 : 360} />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
            {[0, 1, 2, 3].map((i) => (
              <Box key={i} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 1.25, bgcolor: COLORS.bg, px: 1.8, py: 1.6 }}>
                <PulseSkeleton shape="text" width={90} height={10} />
                <PulseSkeleton shape="text" width={120} height={18} sx={{ mt: 0.6 }} />
                <PulseSkeleton shape="text" width={70} height={10} sx={{ mt: 0.6 }} />
              </Box>
            ))}
          </Box>

          <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', bgcolor: COLORS.bg, p: 2.5 }}>
            <PulseSkeleton shape="text" width={140} height={14} />
            {[0, 1, 2].map((i) => (
              <PulseSkeleton key={i} shape="text" width={200} height={14} sx={{ mt: 1 }} />
            ))}
            <PulseSkeleton shape="rounded" height={10} sx={{ mt: 1.4 }} />
            {[0, 1, 2].map((i) => (
              <PulseSkeleton key={`row-${i}`} shape="text" width={160} height={14} sx={{ mt: 1 }} />
            ))}
          </Box>
        </Box>
      </Dialog>
    )
  }

  if (!summary) return null

  const pos = summary.kse100_change >= 0
  const pos30 = summary.kse30_change >= 0
  const changeColor = pos ? COLORS.success : COLORS.error
  const change30Color = pos30 ? COLORS.success : COLORS.error
  const activeLabel = activeIndex === 'kse100' ? 'KSE 100' : 'KSE 30'
  const candleUp = COLORS.success
  const candleDown = COLORS.error
  const chartHeight = isXs ? 320 : 360

  // Determine if we need dataZoom (scrollable chart)
  const totalCandles = chartData.ohlc.length
  const showZoom = totalCandles > (isXs ? 30 : 40)
  const zoomEnd = showZoom ? Math.min(100, ((isXs ? 30 : 40) / totalCandles) * 100) : 100
  const maxVolume = chartData.volumes.length > 0 ? Math.max(...chartData.volumes) : 1
  const formattedDate = summary.tradeDate
    ? new Date(summary.tradeDate).toLocaleDateString('en-PK', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

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
            bgcolor: 'rgba(5,10,20,0.45)',
            backdropFilter: 'blur(6px)',
          },
        },
        paper: {
          sx: {
            width: { xs: '100%', sm: '90vw', md: 880 },
            maxWidth: '100vw',
            maxHeight: { xs: '100dvh', sm: '92dvh' },
            borderRadius: { xs: 0, sm: '16px' },
            border: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.bg,
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(8,14,26,0.2), 0 0 0 1px rgba(10,36,99,0.06)',
          },
        },
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.border}`,
          px: { xs: 2.5, md: 3.5 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontFamily: SERIF,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: COLORS.primary,
              mb: 0.6,
            }}
          >
            Market Summary
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: COLORS.text }}>
            {activeLabel} · {formattedDate}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          component={motion.button}
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
          sx={{
            color: COLORS.textSecondary,
            bgcolor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            width: 32,
            height: 32,
            '&:hover': { color: COLORS.text, bgcolor: COLORS.surface },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* ── BODY ── */}
      <Box sx={{ overflowY: 'auto', px: { xs: 2.5, md: 3.5 }, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── INDEX CHANGE CARDS ── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
          }}
        >
          {/* KSE 100 */}
          <Box
            sx={{
              border: `1px solid ${changeColor}20`,
              borderRadius: '12px',
              bgcolor: pos ? `${COLORS.success}08` : `${COLORS.error}08`,
              px: 2,
              py: 1.6,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '3px',
                background: `linear-gradient(90deg, ${changeColor}, ${changeColor}60)`,
                borderRadius: '0 0 3px 0',
              },
            }}
          >
            <Typography sx={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: SERIF, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              KSE 100 Change
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.6 }}>
              {pos ? <TrendingUpIcon sx={{ fontSize: 16, color: changeColor }} /> : <TrendingDownIcon sx={{ fontSize: 16, color: changeColor }} />}
              <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 20, fontWeight: 800, color: changeColor, letterSpacing: '-0.02em' }}>
                {pos ? '+' : ''}{summary.kse100_change.toFixed(2)}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11, color: COLORS.textSecondary, fontFamily: SERIF, mt: 0.5 }}>
              Close {fmtIndex(summary.kse100_close)}
            </Typography>
          </Box>

          {/* KSE 30 */}
          <Box
            sx={{
              border: `1px solid ${change30Color}20`,
              borderRadius: '12px',
              bgcolor: pos30 ? `${COLORS.success}08` : `${COLORS.error}08`,
              px: 2,
              py: 1.6,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '3px',
                background: `linear-gradient(90deg, ${change30Color}, ${change30Color}60)`,
                borderRadius: '0 0 3px 0',
              },
            }}
          >
            <Typography sx={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: SERIF, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              KSE 30 Change
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.6 }}>
              {pos30 ? <TrendingUpIcon sx={{ fontSize: 16, color: change30Color }} /> : <TrendingDownIcon sx={{ fontSize: 16, color: change30Color }} />}
              <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: 20, fontWeight: 800, color: change30Color, letterSpacing: '-0.02em' }}>
                {pos30 ? '+' : ''}{summary.kse30_change.toFixed(2)}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 11, color: COLORS.textSecondary, fontFamily: SERIF, mt: 0.5 }}>
              Close {fmtIndex(summary.kse30_close)}
            </Typography>
          </Box>
        </Box>

        {/* ── CHART CARD ── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            bgcolor: COLORS.surface,
            // FIX: use 'visible' so chart SVG marks/tooltips near edges aren't clipped
            overflow: 'visible',
            // Keep the visual rounded corner appearance on child elements
            '& > *:first-of-type': { borderRadius: '12px 12px 0 0' },
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
            <Typography
              sx={{
                fontSize: 11,
                fontFamily: SERIF,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: COLORS.primary,
                mb: 1.2,
              }}
            >
              {activeLabel} Trend
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.3, bgcolor: COLORS.surface, p: 0.4, borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
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
              transition={{ duration: 0.2 }}
              // FIX: use fixed height (not minHeight) so chart fills exactly this space
              sx={{ px: 1, pb: 1.5, height: chartHeight }}
            >
              <ReactECharts
                key={chartKey}
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
                      bottom: showZoom ? (isXs ? 90 : 100) : (isXs ? 70 : 80),
                      height: showZoom ? (chartHeight - (isXs ? 155 : 170)) : (chartHeight - (isXs ? 120 : 130)),
                    },
                    {
                      // Volume grid
                      left: isXs ? 52 : 64,
                      right: isXs ? 12 : 24,
                      bottom: showZoom ? (isXs ? 60 : 68) : (isXs ? 28 : 34),
                      height: isXs ? 28 : 36,
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
                        color: COLORS.textSecondary,
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
                          color: COLORS.border,
                          type: 'dashed',
                          opacity: 0.4,
                        },
                      },
                      axisLabel: {
                        show: true,
                        fontSize: isXs ? 8 : 9,
                        color: COLORS.textSecondary,
                        fontFamily: 'DM Mono, monospace',
                        formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
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
                      bottom: isXs ? 10 : 14,
                      height: isXs ? 18 : 22,
                      borderColor: COLORS.border,
                      fillerColor: 'rgba(10,36,99,0.08)',
                      handleStyle: {
                        color: COLORS.primary,
                        borderColor: COLORS.primary,
                      },
                      moveHandleSize: 4,
                      textStyle: {
                        fontSize: 9,
                        color: COLORS.textSecondary,
                        fontFamily: 'DM Mono, monospace',
                      },
                      dataBackground: {
                        lineStyle: { color: 'rgba(10,36,99,0.15)', width: 1 },
                        areaStyle: { color: 'rgba(10,36,99,0.05)' },
                      },
                      selectedDataBackground: {
                        lineStyle: { color: COLORS.primary, width: 1 },
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
                      name: activeLabel,
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
                        color: 'rgba(10,36,99,0.25)',
                      },
                      areaStyle: {
                        color: {
                          type: 'linear',
                          x: 0, y: 0, x2: 0, y2: 1,
                          colorStops: [
                            { offset: 0, color: 'rgba(10,36,99,0.08)' },
                            { offset: 1, color: 'rgba(10,36,99,0.01)' },
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
                            ? 'rgba(13,92,50,0.25)'
                            : 'rgba(155,28,46,0.25)',
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
                      crossStyle: { color: COLORS.textSecondary, width: 0.5 },
                      lineStyle: { color: COLORS.border, width: 1, type: 'dashed' },
                      label: {
                        backgroundColor: COLORS.primary,
                        fontSize: 9,
                        fontFamily: 'DM Mono, monospace',
                      },
                    },
                    backgroundColor: 'rgba(255,255,255,0.96)',
                    borderColor: COLORS.border,
                    borderRadius: 8,
                    padding: [10, 14],
                    textStyle: {
                      fontSize: 11,
                      color: COLORS.text,
                      fontFamily: 'DM Mono, monospace',
                    },
                    formatter: (params: { seriesName?: string; value: number | number[]; dataIndex?: number }[]) => {
                      const candleParam = params.find(p => p.seriesName === activeLabel)
                      if (!candleParam) return ''
                      const d = candleParam.value as number[]
                      const close = d[1]
                      const dataIndex = candleParam.dataIndex ?? -1
                      const volumeValue = dataIndex >= 0 ? chartData.volumes[dataIndex] : null
                      const volumeLabel = volumeValue != null
                        ? volumeValue.toLocaleString('en-PK')
                        : '—'
                      return [
                        `<div style="font-weight:700;margin-bottom:4px;font-size:10px;color:${COLORS.textSecondary};">${activeLabel} INDEX</div>`,
                        `<div style="display:grid;grid-template-columns:46px 1fr;gap:2px 10px;font-size:11px;">`,
                        `<span style="color:${COLORS.textSecondary}">Price</span><span style="font-weight:700">${fmtIndex(close)}</span>`,
                        `<span style="color:${COLORS.textSecondary}">Turnover</span><span>${volumeLabel}</span>`,
                        `</div>`,
                      ].join('')
                    },
                  },
                }}
              />
            </Box>
          </AnimatePresence>
        </Box>

        {/* ── INFO TILES ── */}
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
          <InfoTile label="KSE 100 Open" value={fmtIndex(summary.kse100_prev)} />
          <InfoTile label="KSE 100 Close" value={fmtIndex(summary.kse100_close)} />
          <InfoTile label="KSE 30 Open" value={fmtIndex(summary.kse30_prev)} />
          <InfoTile label="KSE 30 Close" value={fmtIndex(summary.kse30_close)} />
        </Box>

        {/* ── MARKET BREADTH ── */}
        <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', bgcolor: COLORS.bg, p: 2.5 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontFamily: SERIF,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: COLORS.primary,
              mb: 1.2,
            }}
          >
            Market Breadth
          </Typography>
          <StatRow label="Volume (Prev)" value={fmtNumber(summary.prev_volume)} />
          <StatRow label="Volume (Curr)" value={fmtNumber(summary.curr_volume)} />
          <BreadthBar advances={summary.advances} declines={summary.declines} unchanged={summary.unchanged} />
          <Box sx={{ mt: 2 }}>
            <StatRow label="Advancing" value={fmtNumber(summary.advances)} valueColor={COLORS.success} />
            <StatRow label="Declining" value={fmtNumber(summary.declines)} valueColor={COLORS.error} />
            <StatRow label="Unchanged" value={fmtNumber(summary.unchanged)} />
          </Box>
          {summary.flu_no && <StatRow label="Flu No" value={summary.flu_no} />}
        </Box>
      </Box>
    </Dialog>
  )
}