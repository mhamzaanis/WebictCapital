import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Dialog, IconButton, Slide, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { LineChart } from '@mui/x-charts/LineChart'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement, Ref } from 'react'

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
  history: Record<'1W' | '1M' | 'YTD' | '1Y', { labels: string[]; values: number[] }>
}

type MarketSummaryModalProps = {
  open: boolean
  onClose: () => void
  summary: MarketSummary | null
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

export function MarketSummaryModal({ open, onClose, summary }: MarketSummaryModalProps) {
  const reduce = useReducedMotion()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const [range, setRange] = useState<'1W' | '1M' | 'YTD' | '1Y'>('1M')

  // Force chart remount after dialog finishes opening so it measures correct width
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartKey, setChartKey] = useState(0)

  useEffect(() => {
    if (!open) return
    // Wait for slide-up transition to complete (~350ms) then remount chart
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
    if (!summary) return { values: [], labels: [], gain: false, min: 0, max: 0 }
    const data = summary.history[range]
    const gain = data.values.length > 1 && data.values[data.values.length - 1] >= data.values[0]
    const minValue = Math.min(...data.values)
    const maxValue = Math.max(...data.values)
    const padding = Math.max(1, (maxValue - minValue) * 0.12)
    return {
      values: data.values,
      labels: data.labels,
      gain,
      min: minValue - padding,
      max: maxValue + padding,
    }
  }, [range, summary])

  if (!summary) return null

  const pos = summary.kse100_change >= 0
  const pos30 = summary.kse30_change >= 0
  const changeColor = pos ? COLORS.success : COLORS.error
  const change30Color = pos30 ? COLORS.success : COLORS.error
  const chartColor = chartData.gain ? COLORS.success : COLORS.error
  const chartHeight = isXs ? 230 : 260
  const formattedDate = new Date(summary.tradeDate).toLocaleDateString('en-PK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

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
            KSE 100 · {formattedDate}
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
              KSE 100 Trend
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
              ref={chartRef}
            >
              <LineChart
                key={chartKey}
                xAxis={[{
                  data: chartData.labels,
                  scaleType: 'point',
                  height: isXs ? 22 : 28,
                  tickInterval: (_: unknown, i: number) => (isXs ? i % 3 === 0 : i % 2 === 0),
                  tickLabelStyle: { fontSize: isXs ? 8 : 9, fill: COLORS.textSecondary, fontFamily: 'DM Mono, monospace' },
                  disableLine: true,
                  disableTicks: true,
                }]}
                yAxis={[{
                  width: isXs ? 44 : 55,
                  min: chartData.min,
                  max: chartData.max,
                  tickLabelStyle: { fontSize: isXs ? 8 : 9, fill: COLORS.textSecondary, fontFamily: 'DM Mono, monospace' },
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
                    return `${fmtIndex(safeValue)} · Vol ${fmtNumber(summary.curr_volume)} · Adv ${summary.advances} · Dec ${summary.declines}`
                  },
                }]}
                margin={{ left: isXs ? 44 : 56, right: isXs ? 12 : 24, top: 10, bottom: isXs ? 22 : 30 }}
                grid={{ horizontal: true }}
                // FIX: height matches the container exactly
                height={chartHeight}
                sx={{
                  // FIX: force SVG to fill container width, prevents stale measurement on mount
                  width: '100% !important',
                  '& .MuiChartsGrid-root line': { stroke: COLORS.border, strokeDasharray: '3 4', strokeOpacity: 0.5 },
                  '& .MuiLineElement-root': {
                    strokeWidth: 2.5,
                    stroke: chartColor,
                    filter: `drop-shadow(0 2px 4px ${chartColor}30)`,
                  },
                  '& .MuiAreaElement-root': {
                    fill: chartColor,
                    fillOpacity: 0.14,
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