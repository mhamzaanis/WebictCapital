import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Dialog, IconButton, Slide, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import ReactECharts from 'echarts-for-react'
import { motion, useReducedMotion } from 'motion/react'
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
  kse100History: Record<'1M' | 'YTD' | '1Y', { labels: string[]; values: number[]; volumes: number[] }>
  kse30History: Record<'1M' | 'YTD' | '1Y', { labels: string[]; values: number[]; volumes: number[] }>
}

type MarketSummaryModalProps = {
  open: boolean
  onClose: () => void
  summary: MarketSummary | null
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
const CHART = {
  primary: '#0a2463',
  success: '#0d5c32',
  border: '#e2eaf5',
  text: '#080e1a',
  textSecondary: '#6b7e96',
  tooltipBg: 'rgba(255,255,255,0.97)',
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
      // whileHover={{ scale: active ? 1 : 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.12 }}
      sx={{
        border: active ? `1px solid ${COLORS.primary}` : '1px solid transparent',
        borderRadius: '6px',
        cursor: 'pointer',
        px: 1.5,
        py: 0.6,
        bgcolor: active ? COLORS.primary : 'transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        outline: 'none',
        boxShadow: active ? '0 2px 8px rgba(10,36,99,0.22)' : 'none',
        // '&:hover': { bgcolor: active ? COLORS.primary : 'rgba(10,36,99,0.07)' },
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


const fmtIndex = (v: number) => v.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtNumber = (v: number) => v.toLocaleString('en-PK')

export function MarketSummaryModal({ open, onClose, summary, loading = false }: MarketSummaryModalProps) {
  const reduce = useReducedMotion()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const [range, setRange] = useState<'1M' | 'YTD' | '1Y'>('1M')

  // Force chart remount after dialog finishes opening so it measures correct width
  const chartRef = useRef<ReactECharts>(null)
  const [chartKey, setChartKey] = useState(0)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setChartKey((k) => k + 1), 350)
    return () => clearTimeout(timer)
  }, [open])

  const chartData = useMemo(() => {
    const kse100 = summary?.kse100History[range] ?? { labels: [], values: [], volumes: [] }
    const kse30 = summary?.kse30History[range] ?? { labels: [], values: [], volumes: [] }
    const useKse100 = kse100.labels.length >= kse30.labels.length

    // Volume: use curr_volume as a single daily figure spread across the range.
    // Real per-day volume isn't in history rows, so we show a flat reference bar
    // at each point to give visual weight without fabricating data.
    const count = useKse100 ? kse100.labels.length : kse30.labels.length

    return {
      labels: useKse100 ? kse100.labels : kse30.labels,
      kse100Values: kse100.values,
      kse30Values: kse30.values,
      volumeValues: (useKse100 ? kse100 : kse30).volumes ?? Array(count).fill(summary?.curr_volume ?? 0),
    }
  }, [range, summary])

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
  const chartHeight = isXs ? 320 : 360
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
            Market Comparison · {formattedDate}
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

        {/* ── SESSION STATS ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}
        >
          {[
            {
              label: 'Volume (Today)',
              value: fmtNumber(summary.curr_volume),
              sub: summary.prev_volume > 0
                ? `vs ${fmtNumber(summary.prev_volume)} prev`
                : undefined,
              highlight: summary.curr_volume > summary.prev_volume ? CHART.success
                : summary.curr_volume < summary.prev_volume ? '#b94040'
                  : undefined,
            },
            {
              label: 'Advancing',
              value: fmtNumber(summary.advances),
              highlight: CHART.success,
            },
            {
              label: 'Declining',
              value: fmtNumber(summary.declines),
              highlight: '#b94040',
            },
            {
              label: 'Unchanged',
              value: fmtNumber(summary.unchanged),
              highlight: undefined,
            },
          ].map(({ label, value, sub, highlight }) => (
            <Box
              key={label}
              sx={{
                px: 1.6,
                py: 1.2,
                border: `1px solid ${CHART.border}`,
                borderRadius: '10px',
                bgcolor: COLORS.bg,
              }}
            >
              <Typography sx={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: CHART.textSecondary,
                fontFamily: NUMBER_FONT, mb: 0.4,
              }}>
                {label}
              </Typography>
              <Typography sx={{
                fontFamily: NUMBER_FONT, fontSize: 14, fontWeight: 700,
                color: highlight ?? CHART.text, letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {value}
              </Typography>
              {sub && (
                <Typography sx={{
                  fontSize: 9.5, color: CHART.textSecondary,
                  fontFamily: SERIF, mt: 0.3, lineHeight: 1.3,
                }}>
                  {sub}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* ── CHART CARD ── */}

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
            overflow: 'hidden',
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
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontFamily: SERIF,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: COLORS.primary,
                  mb: 0.3,
                }}
              >
                KSE 100 vs KSE 30 Trend
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: CHART.textSecondary, fontFamily: SERIF, mb: 1.2 }}>
                Closing values · {formattedDate}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.3, bgcolor: COLORS.surface, p: 0.4, borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
              {(['1M', 'YTD', '1Y'] as const).map((key) => (
                <RangeBtn key={key} label={key} active={range === key} onClick={() => setRange(key)} />
              ))}
            </Box>
          </Box>

          {/* <AnimatePresence mode="wait"> */}
          <Box sx={{ px: 1, pb: 1.5, pt: 0.5, height: chartHeight }}>
            <ReactECharts
              key={`${chartKey}-${range}`}
              ref={chartRef}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge
              option={{
                animation: true,
                animationDuration: 600,
                animationEasing: 'cubicOut',
                grid: {
                  left: isXs ? 52 : 64,
                  right: isXs ? 12 : 24,
                  top: 18,
                  bottom: isXs ? 40 : 48,
                },
                xAxis: {
                  type: 'category',
                  data: chartData.labels,
                  boundaryGap: false,
                  axisLine: { lineStyle: { color: CHART.border } },
                  axisTick: { show: false },
                  axisLabel: {
                    fontSize: isXs ? 8 : 9,
                    color: CHART.textSecondary,
                    fontFamily: '"JetBrains Mono", monospace',
                    interval: Math.max(0, Math.ceil(chartData.labels.length / (isXs ? 6 : 8)) - 1),
                  },
                },
                yAxis: [
                  {
                    // Price axis (left)
                    type: 'value',
                    scale: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: {
                      lineStyle: { color: CHART.border, type: 'dashed', opacity: 0.6 },
                    },
                    axisLabel: {
                      show: true,
                      fontSize: isXs ? 8 : 9,
                      color: CHART.textSecondary,
                      fontFamily: '"JetBrains Mono", monospace',
                      formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
                    },
                  },
                  {
                    // Volume axis (right, hidden — bars fill bottom 25% of chart)
                    type: 'value',
                    show: false,
                    min: 0,
                    max: (value: { max: number }) => value.max * 4,
                  },
                ],
                series: [
                  {
                    name: 'KSE 100',
                    type: 'line',
                    yAxisIndex: 0,
                    data: chartData.kse100Values,
                    smooth: 0.3,
                    symbol: 'circle',
                    symbolSize: 5,
                    showSymbol: false,
                    lineStyle: { width: 2.2, color: CHART.primary },
                    itemStyle: { color: CHART.primary },
                    areaStyle: { color: 'rgba(10,36,99,0.07)' },
                    z: 3,
                  },
                  {
                    name: 'KSE 30',
                    type: 'line',
                    yAxisIndex: 0,
                    data: chartData.kse30Values,
                    smooth: 0.3,
                    symbol: 'circle',
                    symbolSize: 5,
                    showSymbol: false,
                    lineStyle: { width: 2.2, color: CHART.success },
                    itemStyle: { color: CHART.success },
                    areaStyle: { color: 'rgba(13,92,50,0.06)' },
                    z: 3,
                  },
                  {
                    name: 'Volume',
                    type: 'bar',
                    yAxisIndex: 1,
                    data: chartData.volumeValues,
                    barMaxWidth: 6,
                    itemStyle: {
                      color: 'rgba(10,36,99,0.12)',
                      borderRadius: [2, 2, 0, 0],
                    },
                    emphasis: {
                      itemStyle: { color: 'rgba(10,36,99,0.28)' },
                    },
                    z: 1,
                  },
                ],
                tooltip: {
                  trigger: 'axis',
                  axisPointer: {
                    type: 'line',
                    lineStyle: {
                      color: CHART.border,
                      width: 1,
                      type: 'dashed',
                    },
                  },
                  backgroundColor: CHART.tooltipBg,
                  borderColor: CHART.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: [10, 14],
                  textStyle: {
                    fontSize: 11,
                    color: CHART.text,
                    fontFamily: '"JetBrains Mono", monospace',
                  },
                  formatter: (params: { seriesName?: string; value: number | number[] }[]) => {
                    const kse100 = params.find((p) => p.seriesName === 'KSE 100')?.value as number | undefined
                    const kse30 = params.find((p) => p.seriesName === 'KSE 30')?.value as number | undefined
                    const vol = params.find((p) => p.seriesName === 'Volume')?.value as number | undefined
                    if (kse100 == null && kse30 == null) return ''
                    const fmtVol = (v: number) => {
                      if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
                      return v.toString()
                    }
                    return [
                      `<div style="font-weight:700;margin-bottom:6px;font-size:10px;color:${CHART.textSecondary};letter-spacing:0.06em;text-transform:uppercase;">Index Comparison</div>`,
                      `<div style="display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:11px;align-items:center;">`,
                      `<span style="display:inline-flex;align-items:center;gap:5px;color:${CHART.textSecondary}"><span style="width:10px;height:2px;background:${CHART.primary};display:inline-block;border-radius:2px;"></span>KSE 100</span>`,
                      `<span style="font-weight:700;color:${CHART.primary}">${kse100 != null ? fmtIndex(kse100) : '—'}</span>`,
                      `<span style="display:inline-flex;align-items:center;gap:5px;color:${CHART.textSecondary}"><span style="width:10px;height:2px;background:${CHART.success};display:inline-block;border-radius:2px;"></span>KSE 30</span>`,
                      `<span style="font-weight:700;color:${CHART.success}">${kse30 != null ? fmtIndex(kse30) : '—'}</span>`,
                      vol != null ? `<span style="color:${CHART.textSecondary};margin-top:2px;">Vol</span><span style="font-weight:600;color:${CHART.text}">${fmtVol(vol)}</span>` : '',
                      `</div>`,
                    ].join('')
                  },
                },
              }}
            />
          </Box>
          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 2.5, px: 2.5, pb: 2, mt: -0.5, alignItems: 'center' }}>
            {[
              { label: 'KSE 100', color: COLORS.primary, bar: false },
              { label: 'KSE 30', color: COLORS.success, bar: false },
              { label: 'Volume', color: 'rgba(10,36,99,0.25)', bar: true },
            ].map(({ label, color, bar }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                {bar
                  ? <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '2px' }} />
                  : <Box sx={{ width: 20, height: 2, bgcolor: color, borderRadius: '99px' }} />}
                <Typography sx={{ fontSize: 10, fontFamily: NUMBER_FONT, color: COLORS.textSecondary, fontWeight: 600, letterSpacing: '0.06em' }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
          {/* </AnimatePresence> */}
        </Box>

        {/* ── INFO TILES ── */}
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
          <InfoTile label="KSE 100 Open" value={fmtIndex(summary.kse100_prev)} />
          <InfoTile label="KSE 100 Close" value={fmtIndex(summary.kse100_close)} />
          <InfoTile label="KSE 30 Open" value={fmtIndex(summary.kse30_prev)} />
          <InfoTile label="KSE 30 Close" value={fmtIndex(summary.kse30_close)} />
        </Box>

        {/* ── MARKET BREADTH ── */}
        {/* <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', bgcolor: COLORS.bg, p: 2.5 }}>
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
        <BreadthBar advances={summary.advances} declines={summary.declines} unchanged={summary.unchanged} />
        <Box sx={{ mt: 2 }}>
          <StatRow label="Advancing" value={fmtNumber(summary.advances)} valueColor={COLORS.success} />
          <StatRow label="Declining" value={fmtNumber(summary.declines)} valueColor={COLORS.error} />
          <StatRow label="Unchanged" value={fmtNumber(summary.unchanged)} />
        </Box>
        {summary.flu_no && <StatRow label="Flu No" v
        alue={summary.flu_no} />}
      </Box> */}
      </Box>
    </Dialog >
  )
}