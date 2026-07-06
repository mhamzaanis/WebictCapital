import {
  Box,
  Button,
  Container,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import BubbleChartIcon from '@mui/icons-material/BubbleChart'
import DonutLargeIcon from '@mui/icons-material/DonutLarge'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart'
import { motion, useReducedMotion } from 'motion/react'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import {
  fetchMarketAiSummary,
  fetchMarketDailySummaryRows,
  getMarketIndexSnapshots,
  type DbMarketSummaryRow,
  type MarketAiSummary,
  type MarketIndexSnapshot,
} from '../../lib/stockService'
import { type Dispatch, type ReactNode, type SetStateAction, useEffect, useMemo, useState } from 'react'
import { MarketDashboardSkeleton, PriceTableSkeleton } from './CustomSkeleton'
import { CustomDataTable } from './CustomDataTable'
import { FiltersBar, type MovementFilter } from './FiltersBar.tsx'
import { MotionReveal } from '../animations/MotionReveal'
import {
  BarChart,
  DonutChart,
  StockHeatmap,
  type BarChartItem,
  type DonutChartItem,
  type HeatmapItem,
  type MarketLeaderItem,
} from '../market/MarketVisuals'

// -- Types --------------------------------------------------------------------

type PsxStock = {
  symbol: string
  company: string
  section: string | null
  industry: string | null
  turnover: string | number | null
  open: string | number | null
  high: string | number | null
  low: string | number | null
  last_rate: string | number | null
  change: string | number | null
  eps: number | null
  pe: number | null
  result_period: string | null
  period_ending: string | null
}

type PsxData = {
  date: string
  source: 'Supabase'
  market?: DbMarketSummaryRow
  total_stocks: number
  stocks: PsxStock[]
}

type DbStockTableRow = {
  symbol: string
  company: string
  section: string | null
  trade_date: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  turnover: number | null
  change: number | null
  eps: number | null
  result_period: string | null
  period_ending: string | null
}

type RankedStock = PsxStock & {
  numericTurnover: number
  numericChange: number
  numericClose: number
  changePct: number
  dailyRange: number
  dailyRangePct: number
}

type SectorActivity = {
  industry: string
  turnover: number
  count: number
  gainers: number
  losers: number
  unchanged: number
  avgChangePct: number
}



// -- Helpers ------------------------------------------------------------------

function toNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return NaN
  if (typeof val === 'number') return Number.isFinite(val) ? val : NaN
  if (typeof val === 'string') return parseFloat(val.replace(/,/g, '').trim())
  const n = Number(val)
  return Number.isFinite(n) ? n : NaN
}

function changeVal(change: string | number | null | undefined): number {
  return toNum(change)
}

function formatNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('en-PK', { maximumFractionDigits })
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '-'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return value.toLocaleString('en-PK')
}

function formatVolume(value: number): string {
  return formatCompactNumber(value)
}

function formatSignedNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '-'
  if (value === 0) return '0'
  const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits })
  return `${value > 0 ? '+' : '-'}${formatted}`
}

function formatChange(value: number, maximumFractionDigits = 2): string {
  return formatSignedNumber(value, maximumFractionDigits)
}

function formatPercent(value: number, signed = true): string {
  if (!Number.isFinite(value)) return '-'
  const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: 2 })
  if (!signed || value === 0) return `${formatted}%`
  return `${value > 0 ? '+' : '-'}${formatted}%`
}

function changeColor(change: number): string {
  if (!Number.isFinite(change) || change === 0) return 'var(--wc-text-secondary)'
  return change > 0 ? 'var(--wc-success)' : 'var(--wc-error)'
}

function getChangePct(close: number, change: number): number {
  const previousClose = close - change
  if (!Number.isFinite(previousClose) || previousClose === 0) return NaN
  return (change / previousClose) * 100
}

function getRankedStock(stock: PsxStock): RankedStock {
  const high = toNum(stock.high)
  const low = toNum(stock.low)
  const numericClose = toNum(stock.last_rate)
  const numericChange = changeVal(stock.change)
  const numericTurnover = toNum(stock.turnover)
  const dailyRange = Number.isFinite(high) && Number.isFinite(low) ? high - low : NaN

  return {
    ...stock,
    numericTurnover,
    numericChange,
    numericClose,
    changePct: getChangePct(numericClose, numericChange),
    dailyRange,
    dailyRangePct: Number.isFinite(dailyRange) && low > 0 ? (dailyRange / low) * 100 : NaN,
  }
}

function changeRankValue(stock: RankedStock): number {
  return Number.isFinite(stock.changePct) ? stock.changePct : stock.numericChange
}

const MARKET_CHART_COLORS = {
  primary: '#0a2e78',
  success: '#147a4d',
  error: '#c53346',
  neutral: '#7b8da8',
}

function mapMarketLeaderItem(stock: RankedStock): MarketLeaderItem {
  return {
    id: stock.symbol,
    symbol: stock.symbol,
    company: stock.company,
    price: stock.numericClose,
    change: stock.numericChange,
    changePct: stock.changePct,
    volume: stock.numericTurnover,
    low: toNum(stock.low),
    high: toNum(stock.high),
    rangePct: stock.dailyRangePct,
  }
}

function mapHeatmapItem(stock: RankedStock): HeatmapItem {
  return {
    id: stock.symbol,
    label: stock.symbol,
    value: Math.max(1, stock.numericTurnover),
    company: stock.company,
    changePct: stock.changePct,
  }
}

function mapSectorVolumeItem(sector: SectorActivity): BarChartItem {
  return {
    id: sector.industry,
    label: sector.industry,
    value: sector.turnover,
    tooltipLabel: 'Volume',
    color:
      sector.avgChangePct > 0
        ? MARKET_CHART_COLORS.success
        : sector.avgChangePct < 0
          ? MARKET_CHART_COLORS.error
          : MARKET_CHART_COLORS.primary,
  }
}

function mapDbStockTableRow(row: DbStockTableRow): PsxStock {
  const close = row.close != null ? toNum(row.close) : null
  const eps = row.eps != null ? toNum(row.eps) : null
  const pe =
    close != null && eps != null && eps > 0
      ? parseFloat((close / eps).toFixed(2))
      : null

  return {
    symbol: row.symbol,
    company: row.company,
    section: row.section,
    industry: row.section,
    turnover: row.turnover,
    open: row.open,
    high: row.high,
    low: row.low,
    last_rate: row.close,
    change: row.change,
    eps: eps != null ? parseFloat(eps.toFixed(2)) : null,
    pe,
    result_period: row.result_period,
    period_ending: row.period_ending,
  }
}

async function fetchSupabaseTradeDay(summaryRow: DbMarketSummaryRow): Promise<PsxData> {
  if (!supabase) throw new Error('Supabase client is not configured')

  const tradeDate = summaryRow.trade_date
  const stocksResult = await supabase
    .from('v_stock_table')
    .select('symbol,company,section,trade_date,open,high,low,close,turnover,change,eps,result_period,period_ending')
    .eq('trade_date', tradeDate)
    .neq('section', 'EXCHANGE TRADED FUNDS')
    .neq('section', 'CLOSE - END MUTUAL FUND')
    .neq('section', 'INV. BANKS / INV. COS. / SECURITIES COS.')
    .order('symbol', { ascending: true })

  if (stocksResult.error) throw stocksResult.error

  const rows = ((stocksResult.data ?? []) as DbStockTableRow[]).map(mapDbStockTableRow)

  return {
    date: tradeDate,
    source: 'Supabase',
    market: summaryRow,
    total_stocks: rows.length,
    stocks: rows,
  }
}

const NUMBER_FONT = 'var(--wc-font-data)'
const DISPLAY_FONT = 'var(--wc-font-display)'
const UI_FONT = 'var(--wc-font-body)'
const CARD_SX = {
  bgcolor: 'var(--wc-surface)',
  border: '1px solid var(--wc-border)',
  borderRadius: '12px',
  boxShadow: 'var(--wc-shadow-card)',
}

function formatMarketDate(value: string | null | undefined): string {
  if (!value) return '-'
  const parsed = new Date(`${value}T17:00:00+05:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 05:00 PM PKT`
}

function formatMarketTimestamp(asOf: string | null | undefined, fallbackDate: string | null | undefined): string {
  if (asOf) {
    const parsed = new Date(asOf)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Karachi',
        timeZoneName: 'short',
      })
    }
  }
  return formatMarketDate(fallbackDate)
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '-'
  const parsed = new Date(`${value}T12:00:00+05:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatNullableNumber(value: number | null | undefined, maximumFractionDigits = 2): string {
  return value == null ? '-' : formatNumber(value, maximumFractionDigits)
}

function formatNullableCompact(value: number | null | undefined): string {
  return value == null ? '-' : formatCompactNumber(value)
}

function formatNullablePercent(value: number | null | undefined): string {
  return value == null ? '-' : formatPercent(value)
}

function moveTone(value: number | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (value == null || value === 0) return 'neutral'
  return value > 0 ? 'positive' : 'negative'
}

function moveToneColor(value: number | null | undefined): string {
  const tone = moveTone(value)
  if (tone === 'positive') return 'var(--wc-success)'
  if (tone === 'negative') return 'var(--wc-error)'
  return 'var(--wc-text-secondary)'
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <Stack spacing={0.4} sx={{ mb: 1.8 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box sx={{ color: 'var(--wc-primary)', display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: UI_FONT, fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>
          {title}
        </Typography>
        {/* <InfoDot /> */}
      </Stack>
      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5, lineHeight: 1.45 }}>
        {subtitle}
      </Typography>
    </Stack>
  )
}

function getSummaryParagraphs(summary: string | null | undefined): string[] {
  if (!summary?.trim()) return []
  const paragraphs = summary
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => !/^key points\s*[:\-]/i.test(part))
    .filter(Boolean)

  return (paragraphs.length > 0 ? paragraphs : [summary.trim()]).slice(0, 3)
}

function getAdvanceDeclineRatio(gainers: number, losers: number): string {
  if (losers === 0) return gainers > 0 ? `${gainers.toLocaleString('en-PK')}:0` : '-'
  return `${(gainers / losers).toFixed(2)}x`
}

function buildFallbackSummaryParagraphs({
  activeStocks,
  gainers,
  kse100Change,
  kse100ChangePct,
  kse100Close,
  losers,
  regularVolume,
  topVolumeShare,
  unchanged,
}: {
  activeStocks: number
  gainers: number
  kse100Change: number
  kse100ChangePct: number
  kse100Close: number
  losers: number
  regularVolume: number
  topVolumeShare: number
  unchanged: number
}): string[] {
  const direction = kse100Change > 0 ? 'closed higher' : kse100Change < 0 ? 'closed lower' : 'ended flat'
  const concentration = Number.isFinite(topVolumeShare)
    ? `The top turnover names represented ${formatPercent(topVolumeShare, false)} of regular market volume, showing where activity was concentrated in today's snapshot.`
    : `${activeStocks.toLocaleString('en-PK')} active stocks traded in the regular market snapshot.`

  return [
    `KSE-100 ${direction} at ${formatNumber(kse100Close)}, moving ${formatChange(kse100Change)} points (${formatPercent(kse100ChangePct)}).`,
    `Breadth closed with ${gainers.toLocaleString('en-PK')} advancers, ${losers.toLocaleString('en-PK')} decliners, and ${unchanged.toLocaleString('en-PK')} unchanged names. Regular market volume was ${formatVolume(regularVolume)} shares.`,
    concentration,
  ]
}

function buildFallbackSummaryPoints({
  activeStocks,
  gainers,
  losers,
  regularVolume,
  topVolumeShare,
}: {
  activeStocks: number
  gainers: number
  losers: number
  regularVolume: number
  topVolumeShare: number
}): string[] {
  return [
    `Advance/decline ratio: ${getAdvanceDeclineRatio(gainers, losers)}.`,
    `Regular market volume: ${formatVolume(regularVolume)} shares.`,
    Number.isFinite(topVolumeShare)
      ? `Top five turnover concentration: ${formatPercent(topVolumeShare, false)} of regular market volume.`
      : `${activeStocks.toLocaleString('en-PK')} active stocks traded today.`,
  ]
}

function AiMarketSummaryCard({
  activeStocks,
  aiSummary,
  gainers,
  generatedLabel,
  kse100Change,
  kse100ChangePct,
  kse100Close,
  losers,
  regularVolume,
  topVolumeShare,
  unchanged,
}: {
  activeStocks: number
  aiSummary: MarketAiSummary | null
  gainers: number
  generatedLabel: string
  kse100Change: number
  kse100ChangePct: number
  kse100Close: number
  losers: number
  regularVolume: number
  topVolumeShare: number
  unchanged: number
}) {
  const hasAiSummary = Boolean(aiSummary?.summary?.trim())
  const paragraphs = hasAiSummary
    ? getSummaryParagraphs(aiSummary?.summary)
    : buildFallbackSummaryParagraphs({
      activeStocks,
      gainers,
      kse100Change,
      kse100ChangePct,
      kse100Close,
      losers,
      regularVolume,
      topVolumeShare,
      unchanged,
    })
  const points = (aiSummary?.key_points ?? []).slice(0, 3)
  const fallbackPoints = buildFallbackSummaryPoints({
    activeStocks,
    gainers,
    losers,
    regularVolume,
    topVolumeShare,
  })
  const displayPoints = points.length > 0 ? points : fallbackPoints

  return (
    <Box
      sx={{
        minWidth: 0,
        height: '100%',
        border: '1px solid #dbe5f1',
        borderRadius: '14px',
        bgcolor: '#ffffff',
        boxShadow: '0 18px 45px rgba(7,19,41,0.06)',
        p: { xs: 2.4, md: 3.2 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 2.4,
      }}
    >
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.8, mb: 1.8 }}>
          <Box sx={{ color: 'var(--wc-primary)', display: 'flex', alignItems: 'center' }}>
            <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ color: 'var(--wc-primary)', fontFamily: UI_FONT, fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI market summary · generated once, after close
          </Typography>
        </Stack>

        <Stack spacing={1.55} sx={{ maxWidth: 760 }}>
          {paragraphs.map((paragraph, index) => (
            <Typography
              key={`ai-summary-paragraph-${index}`}
              sx={{
                color: index === 0 ? 'var(--wc-text-primary)' : 'var(--wc-text-secondary)',
                fontSize: { xs: 14.5, md: index === 0 ? 16 : 14.5 },
                lineHeight: 1.75,
                fontWeight: index === 0 ? 650 : 500,
              }}
            >
              {paragraph}
            </Typography>
          ))}
        </Stack>
      </Box>

      <Box sx={{ borderTop: '1px solid var(--wc-divider)', pt: 1.8 }}>
        <Stack spacing={1.05}>
          {displayPoints.map((point, index) => (
            <Box key={`ai-summary-point-${index}`} sx={{ display: 'grid', gridTemplateColumns: '10px minmax(0, 1fr)', gap: 1.2, alignItems: 'start' }}>
              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'var(--wc-primary)', mt: 0.85 }} />
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12.5, lineHeight: 1.55 }}>
                {point}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Typography sx={{ mt: 1.6, color: 'var(--wc-text-muted)', fontFamily: NUMBER_FONT, fontSize: 11, fontWeight: 700 }}>
          {hasAiSummary ? `Generated ${generatedLabel}` : 'Fallback note generated from daily market snapshot only'}
        </Typography>
      </Box>
    </Box>
  )
}

function HeroMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: 'var(--wc-text-muted)', fontFamily: UI_FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.45 }}>
        {label}
      </Typography>
      <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT, fontSize: 12.5, fontWeight: 800, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  )
}

function MarketHero({
  updatedLabel,
  dateLabel,
  generatedLabel,
  aiSummary,
  kse100Close,
  kse100Change,
  kse100ChangePct,
  regularVolume,
  kse100Volume,
  activeStocks,
  topVolumeShare,
  gainers,
  losers,
  unchanged,
}: {
  updatedLabel: string
  dateLabel: string
  generatedLabel: string
  aiSummary: MarketAiSummary | null
  kse100Close: number
  kse100Change: number
  kse100ChangePct: number
  regularVolume: number
  kse100Volume: number
  activeStocks: number
  topVolumeShare: number
  gainers: number
  losers: number
  unchanged: number
}) {
  const tone = moveTone(kse100Change)
  const toneColor = moveToneColor(kse100Change)

  return (
    <Box
      component="section"
      sx={{
        ...CARD_SX,
        overflow: 'hidden',
        bgcolor: '#fff',
        borderColor: '#e2e8f0',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.82fr) minmax(0, 1fr)' },
          gap: { xs: 2.4, md: 3.2 },
          p: { xs: 2.4, sm: 3, md: 3.6 },
          alignItems: 'stretch',
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 3 }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.8, mb: 1.8 }}>
              <Typography sx={{ color: 'var(--wc-primary)', fontFamily: UI_FONT, fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Today's Market Pulse · {dateLabel}
              </Typography>
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 11.5, fontWeight: 700 }}>
                As of close
              </Typography>
            </Stack>

            <Typography
              variant="h1"
              sx={{
                color: 'var(--wc-text-primary)',
                fontFamily: DISPLAY_FONT,
                fontSize: { xs: '2.1rem', sm: '2.7rem', md: '3.55rem' },
                fontWeight: 750,
                lineHeight: 0.98,
                letterSpacing: '-0.035em',
                maxWidth: 620,
              }}
            >
              PSX Market Overview
            </Typography>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'var(--wc-text-muted)', fontFamily: UI_FONT, fontSize: 11, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', mb: 0.9 }}>
              KSE-100 Close
            </Typography>
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1.4, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, minWidth: 0 }}>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT, fontSize: { xs: 42, sm: 52, md: 64 }, fontWeight: 850, lineHeight: 0.92, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1', overflowWrap: 'anywhere' }}>
                {formatNumber(kse100Close)}
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 1,
                  px: 1.4,
                  py: 0.9,
                  borderRadius: '9px',
                  bgcolor: tone === 'positive' ? 'rgba(20,122,77,0.11)' : tone === 'negative' ? 'rgba(197,51,70,0.11)' : 'var(--wc-surface-soft)',
                  color: toneColor,
                  border: `1px solid ${tone === 'positive' ? 'rgba(20,122,77,0.18)' : tone === 'negative' ? 'rgba(197,51,70,0.18)' : '#e2e8f0'}`,
                  maxWidth: '100%',
                }}
              >
                <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: { xs: 18, md: 21 }, fontWeight: 850, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {formatChange(kse100Change)}
                </Typography>
                <Typography sx={{ fontFamily: NUMBER_FONT, fontSize: { xs: 12, md: 13 }, fontWeight: 850, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {formatPercent(kse100ChangePct)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              gap: { xs: 1.6, sm: 2 },
              pt: 2.2,
              borderTop: '1px solid var(--wc-divider)',
            }}
          >
            <HeroMetaItem label="Last updated" value={updatedLabel} />
            <HeroMetaItem label="KSE-100 volume" value={kse100Volume > 0 ? formatVolume(kse100Volume) : '-'} />
            <HeroMetaItem label="Regular volume" value={regularVolume > 0 ? formatVolume(regularVolume) : '-'} />
          </Box>
        </Box>

        <AiMarketSummaryCard
          activeStocks={activeStocks}
          aiSummary={aiSummary}
          gainers={gainers}
          generatedLabel={generatedLabel}
          kse100Change={kse100Change}
          kse100ChangePct={kse100ChangePct}
          kse100Close={kse100Close}
          losers={losers}
          regularVolume={regularVolume}
          topVolumeShare={topVolumeShare}
          unchanged={unchanged}
        />
      </Box>
    </Box>
  )
}

function MarketHeatmapSection({ data }: { data: HeatmapItem[] }) {
  return (
    <Box component="section" sx={{ position: 'relative', minWidth: 0, maxWidth: '100%' }}>
      <StockHeatmap
        heading="Market Heatmap"
        detail="Top active stocks sized by traded value and colored by daily change."
        icon={<BubbleChartIcon sx={{ fontSize: 18 }} />}
        height={420}
        data={data}
        sx={{
          ...CARD_SX,
          p: { xs: 2.2, md: 3 },
          minHeight: { xs: 430, md: 535 },
          borderColor: '#e2e8f0',
          boxShadow: '0 18px 45px rgba(7,19,41,0.055)',
        }}
        colors={{
          positive: '#0f8f5d',
          negative: '#b93242',
          neutral: '#e8eef6',
        }}
      />
      <Stack
        direction="row"
        spacing={1.2}
        sx={{
          position: 'absolute',
          right: { xs: 22, md: 34 },
          top: { xs: 60, md: 54 },
          alignItems: 'center',
          display: { xs: 'none', sm: 'flex' },
        }}
      >
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
          -5%
        </Typography>
        <Box
          sx={{
            width: 240,
            height: 8,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #b93242 0%, #e8eef6 50%, #0f8f5d 100%)',
            border: '1px solid rgba(7,19,41,0.06)',
          }}
        />
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
          +5%
        </Typography>
      </Stack>
    </Box>
  )
}

function IndexSnapshotCard({
  indexes,
  regularVolume,
  topVolumeShare,
}: {
  indexes: MarketIndexSnapshot[]
  regularVolume: number
  topVolumeShare: number
}) {
  const order = ['kse100', 'kse30', 'kse_all', 'kmi30', 'kmi_all']
  const rows = order
    .map((key) => indexes.find((index) => index.key === key))
    .filter((index): index is MarketIndexSnapshot => Boolean(index))

  return (
    <Box sx={{ ...CARD_SX, p: { xs: 2.2, md: 2.6 }, minHeight: 350, minWidth: 0, borderColor: '#e2e8f0' }}>
      <SectionTitle
        icon={<QueryStatsIcon sx={{ fontSize: 18 }} />}
        title="Index Snapshot"
        subtitle="Close, change, and each index's own reported volume."
      />

      <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Box sx={{ minWidth: 520 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(120px, 1fr) 110px 94px 104px',
              gap: 1.4,
              pb: 1,
              borderBottom: '1px solid var(--wc-divider)',
            }}
          >
            {['Index', 'Close', 'Change', 'Volume'].map((label) => (
              <Typography
                key={label}
                sx={{
                  color: 'var(--wc-text-muted)',
                  fontFamily: UI_FONT,
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textAlign: label === 'Index' ? 'left' : 'right',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>

          {rows.map((index) => {
            const color = moveToneColor(index.change)
            return (
              <Box
                key={index.key}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(120px, 1fr) 110px 94px 104px',
                  gap: 1.4,
                  alignItems: 'center',
                  minHeight: 42,
                  borderBottom: '1px solid var(--wc-divider-soft)',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: UI_FONT, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {index.label}
                </Typography>
                <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT, fontSize: 12.5, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {formatNullableNumber(index.close)}
                </Typography>
                <Typography sx={{ color, fontFamily: NUMBER_FONT, fontSize: 12.5, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {formatNullablePercent(index.changePct)}
                </Typography>
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 12, fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {formatNullableCompact(index.volume)}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Box sx={{ mt: 2, pt: 1.6, borderTop: '1px solid var(--wc-divider)', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: 'var(--wc-text-muted)', fontFamily: UI_FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.45 }}>
            Regular Market Volume
          </Typography>
          <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT, fontSize: 15, fontWeight: 850 }}>
            {formatVolume(regularVolume)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ color: 'var(--wc-text-muted)', fontFamily: UI_FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.45 }}>
            Top Turnover Concentration
          </Typography>
          <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT, fontSize: 15, fontWeight: 850 }}>
            {Number.isFinite(topVolumeShare) ? formatPercent(topVolumeShare, false) : '-'}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function InsightCardsGrid({
  breadthChartItems,
  indexes,
  regularVolume,
  sectorVolume,
  topVolumeShare,
  totalIssues,
}: {
  breadthChartItems: DonutChartItem[]
  indexes: MarketIndexSnapshot[]
  regularVolume: number
  sectorVolume: BarChartItem[]
  topVolumeShare: number
  totalIssues: number
}) {
  return (
    <Box
      component="section"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '0.82fr 1fr 1.18fr' },
        gap: { xs: 2, md: 2.5 },
        minWidth: 0,
        '& > *': { minWidth: 0 },
      }}
    >
      <DonutChart
        heading="Market Breadth"
        detail="Daily market snapshot: advancers, decliners, and unchanged."
        icon={<DonutLargeIcon sx={{ fontSize: 18 }} />}
        height={245}
        data={breadthChartItems}
        centerText={totalIssues.toLocaleString('en-PK')}
        colors={[
          MARKET_CHART_COLORS.success,
          MARKET_CHART_COLORS.error,
          MARKET_CHART_COLORS.neutral,
        ]}
        centerSubtext="Total Stocks"
        emptyLabel="Breadth data is unavailable."
        sx={{ ...CARD_SX, minHeight: 350, borderColor: '#e2e8f0' }}
      />
      <BarChart
        heading="Sector Volume"
        detail="Sector activity derived from today's regular-market turnover."
        icon={<AnalyticsIcon sx={{ fontSize: 18 }} />}
        height={245}
        data={sectorVolume}
        left={135}
        emptyLabel="Sector volume is unavailable."
        sx={{ ...CARD_SX, minHeight: 350, borderColor: '#e2e8f0' }}
      />
      <IndexSnapshotCard
        indexes={indexes}
        regularVolume={regularVolume}
        topVolumeShare={topVolumeShare}
      />
    </Box>
  )
}


function LeaderTable({
  title,
  subtitle,
  icon,
  items,
  footer,
  dataFont,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  items: MarketLeaderItem[]
  footer: string
  dataFont: string
}) {
  return (
    <Box sx={{ ...CARD_SX, p: { xs: 2.2, md: 2.8 }, minHeight: 330, minWidth: 0, maxWidth: '100%' }}>
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      <Box sx={{ maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
        <Box sx={{ minWidth: 470 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '34px 82px minmax(0,1fr) 78px 86px',
              columnGap: 1.5,
              pb: 1.1,
              borderBottom: '1px solid var(--wc-divider)',
            }}
          >
            {['#', 'Symbol', 'Company', 'Change', '% Change'].map((label) => (
              <Typography
                key={label}
                sx={{
                  color: 'var(--wc-text-muted)',
                  fontFamily: UI_FONT,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textAlign: label === 'Company' || label === 'Symbol' || label === '#' ? 'left' : 'right',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>
          {items.map((item, index) => {
            const tone = item.change > 0 ? 'positive' : item.change < 0 ? 'negative' : 'neutral'
            const toneValue = changeColor(item.change)
            return (
              <Box
                key={item.id ?? `${title}-${item.symbol}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '34px 82px minmax(0,1fr) 78px 86px',
                  columnGap: 1.5,
                  alignItems: 'center',
                  minHeight: 42,
                  borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--wc-divider)',
                }}
              >
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: dataFont, fontSize: 12, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {index + 1}
                </Typography>
                <Typography sx={{ color: 'var(--wc-primary)', fontFamily: UI_FONT, fontSize: 13, fontWeight: 750, letterSpacing: 0, textTransform: 'uppercase' }}>
                  {item.symbol}
                </Typography>
                <Typography
                  title={item.company}
                  sx={{
                    color: 'var(--wc-text-secondary)',
                    fontSize: 11.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.company}
                </Typography>
                <Typography sx={{ color: toneValue, fontFamily: dataFont, fontSize: 12, fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {formatSignedNumber(item.change)}
                </Typography>
                <Typography
                  sx={{
                    color: tone === 'positive' ? 'var(--wc-success)' : tone === 'negative' ? 'var(--wc-error)' : 'var(--wc-text-secondary)',
                    fontFamily: dataFont,
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum" 1',
                  }}
                >
                  {formatPercent(item.changePct ?? NaN)}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>
      <Button
        endIcon={<Box component="span" sx={{ fontSize: 16 }}>→</Box>}
        sx={{ mt: 2, p: 0, color: 'var(--wc-primary)', fontSize: 12.5, fontWeight: 800, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
      >
        {footer}
      </Button>
    </Box>
  )
}

function VolumeLeaderTable({
  items,
  dataFont,
}: {
  items: RankedStock[]
  dataFont: string
}) {
  return (
    <Box sx={{ ...CARD_SX, p: { xs: 2.2, md: 2.8 }, minHeight: 330, minWidth: 0, maxWidth: '100%' }}>
      <SectionTitle
        icon={<StackedBarChartIcon sx={{ fontSize: 18 }} />}
        title="Volume Leaders"
        subtitle="Most active symbols by traded turnover."
      />
      <Box sx={{ maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
        <Box sx={{ minWidth: 480 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '34px 82px minmax(0,1fr) 88px 88px',
              columnGap: 1.5,
              pb: 1.1,
              borderBottom: '1px solid var(--wc-divider)',
            }}
          >
            {['#', 'Symbol', 'Company', 'Volume', 'Turnover'].map((label) => (
              <Typography
                key={label}
                sx={{
                  color: 'var(--wc-text-muted)',
                  fontFamily: UI_FONT,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textAlign: ['Volume', 'Turnover'].includes(label) ? 'right' : 'left',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>
          {items.map((item, index) => {
            const turnoverValue =
              Number.isFinite(item.numericTurnover) && Number.isFinite(item.numericClose)
                ? item.numericTurnover * item.numericClose
                : NaN
            return (
              <Box
                key={item.symbol}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '34px 82px minmax(0,1fr) 88px 88px',
                  columnGap: 1.5,
                  alignItems: 'center',
                  minHeight: 42,
                  borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--wc-divider)',
                }}
              >
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: dataFont, fontSize: 12, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {index + 1}
                </Typography>
                <Typography sx={{ color: 'var(--wc-primary)', fontFamily: UI_FONT, fontSize: 13, fontWeight: 750, letterSpacing: 0, textTransform: 'uppercase' }}>
                  {item.symbol}
                </Typography>
                <Typography
                  title={item.company}
                  sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {item.company}
                </Typography>
                <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: dataFont, fontSize: 12, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {formatCompactNumber(item.numericTurnover)}
                </Typography>
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: dataFont, fontSize: 12, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
                  {formatCompactNumber(turnoverValue)}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>
      <Button
        endIcon={<Box component="span" sx={{ fontSize: 16 }}>→</Box>}
        sx={{ mt: 2, p: 0, color: 'var(--wc-primary)', fontSize: 12.5, fontWeight: 800, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
      >
        View all volume leaders
      </Button>
    </Box>
  )
}

function TopMoversGrid({
  gainers,
  losers,
  volumeLeaders,
}: {
  gainers: MarketLeaderItem[]
  losers: MarketLeaderItem[]
  volumeLeaders: RankedStock[]
}) {
  return (
    <Box
      component="section"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
        gap: { xs: 2, md: 2.5 },
        minWidth: 0,
        '& > *': { minWidth: 0 },
      }}
    >
      <LeaderTable
        title="Top Gainers"
        subtitle="Largest positive closes vs prior close."
        items={gainers}
        icon={<Box component="span" sx={{ color: 'var(--wc-success)', fontFamily: NUMBER_FONT, fontSize: 16, fontWeight: 900 }}>↑</Box>}
        footer="View all gainers"
        dataFont={NUMBER_FONT}
      />
      <LeaderTable
        title="Top Losers"
        subtitle="Largest negative closes vs prior close."
        items={losers}
        icon={<Box component="span" sx={{ color: 'var(--wc-error)', fontFamily: NUMBER_FONT, fontSize: 16, fontWeight: 900 }}>↓</Box>}
        footer="View all losers"
        dataFont={NUMBER_FONT}
      />
      <VolumeLeaderTable items={volumeLeaders} dataFont={NUMBER_FONT} />
    </Box>
  )
}

function MarketSnapshotTable({
  activeDate,
  displayedStocks,
  exportAnchor,
  industryFilter,
  industryOptions,
  latestTradeDate,
  movementFilter,
  search,
  setExportAnchor,
  setIndustryFilter,
  setMovementFilter,
  setSearch,
}: {
  activeDate: string
  displayedStocks: PsxStock[]
  exportAnchor: HTMLElement | null
  industryFilter: string
  industryOptions: string[]
  latestTradeDate: string | null
  movementFilter: MovementFilter
  search: string
  setExportAnchor: Dispatch<SetStateAction<HTMLElement | null>>
  setIndustryFilter: Dispatch<SetStateAction<string>>
  setMovementFilter: Dispatch<SetStateAction<MovementFilter>>
  setSearch: Dispatch<SetStateAction<string>>
}) {
  return (
    <Box
      component="section"
      sx={{
        ...CARD_SX,
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        borderColor: '#e2e8f0',
        mb: { xs: 3, md: 0 },
        '& .MuiTableContainer-root': {
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
        },
        '& .MuiTablePagination-root': {
          borderRadius: 0,
          bgcolor: '#ffffff',
          pb: { xs: 8, md: 0 },
        },
      }}
    >
      <Box
        sx={{
          p: { xs: 2.2, md: 2.8 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto' },
          gap: 2,
          alignItems: 'center',
          borderBottom: '1px solid var(--wc-divider)',
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: UI_FONT, fontSize: 18, fontWeight: 800, letterSpacing: '-0.015em' }}>
            Full Market Table
          </Typography>
          <Typography sx={{ mt: 0.4, color: 'var(--wc-text-secondary)', fontSize: 12.5, lineHeight: 1.45 }}>
            Daily market snapshot as of close · {formatShortDate(latestTradeDate ?? activeDate)}
          </Typography>
        </Box>
        <Button
          startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => setExportAnchor(e.currentTarget)}
          sx={{
            height: 40,
            px: 2,
            border: '1px solid var(--wc-border)',
            borderRadius: '8px',
            color: 'var(--wc-text-primary)',
            fontSize: 12,
            fontWeight: 700,
            justifySelf: { xs: 'stretch', lg: 'end' },
            '&:hover': { bgcolor: 'var(--wc-surface-soft)', borderColor: 'rgba(10,46,120,0.35)' },
          }}
        >
          Export
        </Button>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 2.4 },
          borderBottom: '1px solid var(--wc-divider)',
          bgcolor: '#fbfdff',
        }}
      >
        <FiltersBar
          disabled={false}
          search={search}
          setSearch={setSearch}
          movementFilter={movementFilter}
          setMovementFilter={setMovementFilter}
          industryFilter={industryFilter}
          setIndustryFilter={setIndustryFilter}
          industryOptions={industryOptions}
        />
      </Box>

      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.8,
              minWidth: 200,
              borderRadius: '10px',
              border: '1px solid var(--wc-border)',
              boxShadow: '0 12px 28px rgba(10,36,99,0.1)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const filename = `psx-market-data-${latestTradeDate ?? activeDate ?? 'export'}.csv`
            exportToCSV(displayedStocks, filename)
            setExportAnchor(null)
          }}
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--wc-text-primary)',
            py: 1.4,
            gap: 1.2,
            fontFamily: 'var(--wc-font-body)',
            '&:hover': { bgcolor: 'var(--wc-surface-soft)' },
          }}
        >
          <FileDownloadOutlinedIcon sx={{ fontSize: 16, color: 'var(--wc-primary)' }} />
          Export as CSV
        </MenuItem>
      </Menu>

      <CustomDataTable rows={displayedStocks} searchQuery={search} dataFont={NUMBER_FONT} />
    </Box>
  )
}

// -- Export -------------------------------------------------------------------

function exportToCSV(stocks: PsxStock[], filename: string) {
  const headers = ['Symbol', 'Company', 'Industry', 'Open', 'High', 'Low', 'Last Rate', 'Change', 'Turnover', 'EPS', 'P/E', 'Result Period']
  const rows = stocks.map((s) => [
    s.symbol,
    `"${s.company.replace(/"/g, '""')}"`,
    s.industry ?? '',
    toNum(s.open),
    toNum(s.high),
    toNum(s.low),
    toNum(s.last_rate),
    changeVal(s.change),
    toNum(s.turnover),
    s.eps != null ? toNum(s.eps) : '',
    s.pe != null ? s.pe.toFixed(2) : '',
    s.result_period ?? '',
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// -- Component ----------------------------------------------------------------

export function DataPage() {
  const reduce = useReducedMotion()
  const [data, setData] = useState<PsxData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [latestTradeDate, setLatestTradeDate] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<MarketAiSummary | null>(null)

  const [search, setSearch] = useState('')
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadLatestSupabaseData() {
      if (!hasSupabaseConfig || !supabase) {
        setFetchError('Supabase env vars are missing.')
        setStatus('error')
        return
      }

      setStatus('loading')
      setFetchError(null)

      const summaryRows = await fetchMarketDailySummaryRows(1)
      const summaryRow = summaryRows[0] ?? null

      if (!summaryRow) {
        if (!cancelled) {
          setFetchError('No trade_date entries found in Supabase.')
          setStatus('error')
        }
        return
      }

      if (cancelled) return

      const tradeDate = summaryRow.trade_date ?? null
      if (!tradeDate) {
        setFetchError('No trade_date entries found in Supabase.')
        setStatus('error')
        return
      }

      setLatestTradeDate(tradeDate)

      try {
        const [latestData, aiSummaryForDate] = await Promise.all([
          fetchSupabaseTradeDay(summaryRow),
          fetchMarketAiSummary(tradeDate),
        ])
        if (cancelled) return
        setData(latestData)
        setAiSummary(aiSummaryForDate)
        setStatus('ok')
      } catch (error: unknown) {
        if (cancelled) return
        const message =
          typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Unknown error while querying Supabase.'
        setFetchError(message)
        setStatus('error')
      }
    }

    loadLatestSupabaseData()

    return () => {
      cancelled = true
    }
  }, [])

  const activeData = data
  const stocks = useMemo(() => activeData?.stocks ?? [], [activeData])
  const marketIndexes = useMemo(
    () => getMarketIndexSnapshots(activeData?.market ?? null).filter((index) => index.hasData),
    [activeData],
  )
  const kse100Index = useMemo(
    () => marketIndexes.find((index) => index.key === 'kse100') ?? null,
    [marketIndexes],
  )

  const industryOptions = useMemo(
    () => Array.from(new Set(stocks.map((s) => s.industry).filter((s): s is string => Boolean(s)))).sort(),
    [stocks],
  )

  const displayedStocks = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? stocks.filter((s) => s.symbol.toLowerCase().includes(q) || s.company.toLowerCase().includes(q))
      : stocks

    return filtered
      .filter((s) => {
        const chg = changeVal(s.change)
        if (movementFilter === 'gainers') return chg > 0
        if (movementFilter === 'losers') return chg < 0
        if (movementFilter === 'unchanged') return !isNaN(chg) && chg === 0
        return true
      })
      .filter((s) => industryFilter === 'all' || s.industry === industryFilter)
  }, [stocks, search, movementFilter, industryFilter])

  const stats = useMemo(() => {
    const market = activeData?.market
    if (market) return { gainers: market.advances ?? 0, losers: market.declines ?? 0, unchanged: market.unchanged ?? 0 }
    return {
      gainers: stocks.filter((s) => changeVal(s.change) > 0).length,
      losers: stocks.filter((s) => changeVal(s.change) < 0).length,
      unchanged: stocks.filter((s) => {
        const n = changeVal(s.change)
        return !isNaN(n) && n === 0
      }).length,
    }
  }, [stocks, activeData])

  const marketSummary = useMemo(() => {
    const market = activeData?.market
    if (market) {
      const index = kse100Index ?? getMarketIndexSnapshots(market).find((item) => item.key === 'kse100') ?? null
      return {
        KSE100_PreviousClose: index?.previousClose ?? market.kse100_prev ?? 0,
        KSE100_Close: index?.close ?? market.kse100_close ?? 0,
        KSE100_ChangePct:
          index?.changePct ??
          market.kse100_change_pct ??
          (
            (index?.previousClose ?? market.kse100_prev ?? 0) > 0
              ? ((index?.change ?? market.kse100_change ?? 0) / (index?.previousClose ?? market.kse100_prev ?? 0)) * 100
              : NaN
          ),
        RegularVolume: market.curr_volume ?? 0,
        KSE100_Volume: index?.volume ?? market.kse100_volume ?? 0,
        KSE100_Change:
          index?.change ??
          market.kse100_change ??
          ((index?.close ?? market.kse100_close ?? 0) - (index?.previousClose ?? market.kse100_prev ?? 0)),
      }
    }

    let totalOpen = 0
    let totalClose = 0
    let totalVolume = 0
    stocks.forEach((s) => {
      const open = toNum(s.open)
      const close = toNum(s.last_rate)
      const turnover = toNum(s.turnover)
      if (!isNaN(open)) totalOpen += open
      if (!isNaN(close)) totalClose += close
      if (!isNaN(turnover)) totalVolume += turnover
    })

    return {
      KSE100_PreviousClose: totalOpen,
      KSE100_Close: totalClose,
      KSE100_ChangePct: totalOpen > 0 ? ((totalClose - totalOpen) / totalOpen) * 100 : NaN,
      RegularVolume: totalVolume,
      KSE100_Volume: 0,
      KSE100_Change: totalClose - totalOpen,
    }
  }, [stocks, activeData, kse100Index])

  const dayInsights = useMemo(() => {
    const rankedStocks = stocks.map(getRankedStock)
    const gainers = rankedStocks
      .filter((stock) => Number.isFinite(stock.numericChange) && stock.numericChange > 0)
      .sort((a, b) => changeRankValue(b) - changeRankValue(a))
      .slice(0, 5)
    const losers = rankedStocks
      .filter((stock) => Number.isFinite(stock.numericChange) && stock.numericChange < 0)
      .sort((a, b) => changeRankValue(a) - changeRankValue(b))
      .slice(0, 5)
    const volumeLeaders = rankedStocks
      .filter((stock) => Number.isFinite(stock.numericTurnover) && stock.numericTurnover > 0)
      .sort((a, b) => b.numericTurnover - a.numericTurnover)
      .slice(0, 5)
    const heatmapStocks = rankedStocks
      .filter((stock) => Number.isFinite(stock.numericTurnover) && stock.numericTurnover > 0)
      .sort((a, b) => b.numericTurnover - a.numericTurnover)
      .slice(0, 54)
    const tableVolume = rankedStocks.reduce(
      (sum, stock) => sum + (Number.isFinite(stock.numericTurnover) ? Math.max(0, stock.numericTurnover) : 0),
      0,
    )
    const totalVolume = marketSummary.RegularVolume > 0 ? marketSummary.RegularVolume : tableVolume
    const activeStocks = rankedStocks.filter((stock) => Number.isFinite(stock.numericTurnover) && stock.numericTurnover > 0).length
    const topVolumeShare =
      totalVolume > 0
        ? (volumeLeaders.reduce((sum, stock) => sum + stock.numericTurnover, 0) / totalVolume) * 100
        : NaN
    const totalIssues =
      stats.gainers + stats.losers + stats.unchanged ||
      rankedStocks.filter((stock) => Number.isFinite(stock.numericChange)).length ||
      stocks.length
    const sectorMap = new Map<
      string,
      SectorActivity & {
        changePctCount: number
        changePctTotal: number
      }
    >()

    rankedStocks.forEach((stock) => {
      const industry = stock.industry || 'Unclassified'
      const current =
        sectorMap.get(industry) ??
        {
          industry,
          turnover: 0,
          count: 0,
          gainers: 0,
          losers: 0,
          unchanged: 0,
          avgChangePct: NaN,
          changePctCount: 0,
          changePctTotal: 0,
        }

      current.count += 1
      if (Number.isFinite(stock.numericTurnover)) current.turnover += Math.max(0, stock.numericTurnover)
      if (Number.isFinite(stock.numericChange)) {
        if (stock.numericChange > 0) current.gainers += 1
        else if (stock.numericChange < 0) current.losers += 1
        else current.unchanged += 1
      }
      if (Number.isFinite(stock.changePct)) {
        current.changePctTotal += stock.changePct
        current.changePctCount += 1
      }
      sectorMap.set(industry, current)
    })

    const sectors = Array.from(sectorMap.values())
      .map(({ changePctCount, changePctTotal, ...sector }) => ({
        ...sector,
        avgChangePct: changePctCount > 0 ? changePctTotal / changePctCount : NaN,
      }))
      .sort((a, b) => b.turnover - a.turnover)
      .slice(0, 5)

    return {
      activeStocks,
      gainers,
      heatmapStocks,
      losers,
      sectors,
      tableVolume,
      topVolumeShare,
      totalIssues,
      totalVolume,
      volumeLeaders,
    }
  }, [marketSummary.RegularVolume, stats.gainers, stats.losers, stats.unchanged, stocks])

  const breadthChartItems = useMemo<DonutChartItem[]>(
    () => [
      { name: 'Advancers', value: stats.gainers, color: MARKET_CHART_COLORS.success },
      { name: 'Decliners', value: stats.losers, color: MARKET_CHART_COLORS.error },
      { name: 'Unchanged', value: stats.unchanged, color: MARKET_CHART_COLORS.neutral },
    ],
    [stats.gainers, stats.losers, stats.unchanged],
  )

  const marketVisualData = useMemo(
    () => ({
      gainers: dayInsights.gainers.map(mapMarketLeaderItem),
      losers: dayInsights.losers.map(mapMarketLeaderItem),
      heatmap: dayInsights.heatmapStocks.map(mapHeatmapItem),
      sectorVolume: dayInsights.sectors.map(mapSectorVolumeItem),
    }),
    [dayInsights],
  )

  const indexChangePct = marketSummary.KSE100_ChangePct

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 2.5rem)' },
        pb: { xs: '9rem', md: '6rem' },
        bgcolor: '#f6f8fb',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1880px !important', px: { xs: 'var(--wc-page-gutter-xs)', md: 'var(--wc-page-gutter-md)', xl: 'var(--wc-page-gutter-xl)' } }}>
        <Stack spacing={{ xs: 5, md: 6 }}>
          {status === 'loading' && (
            <MotionReveal>
              <Stack spacing={{ xs: 3.5, md: 4.5 }}>
                <MarketDashboardSkeleton />
                <FiltersBar
                  disabled
                  search={search}
                  setSearch={setSearch}
                  movementFilter={movementFilter}
                  setMovementFilter={setMovementFilter}
                  industryFilter={industryFilter}
                  setIndustryFilter={setIndustryFilter}
                  industryOptions={industryOptions}
                />
                <PriceTableSkeleton />
              </Stack>
            </MotionReveal>
          )}

          {status === 'error' && (
            <MotionReveal>
              <Box
                sx={{
                  border: '1px solid var(--wc-border)',
                  borderRadius: '12px',
                  bgcolor: 'var(--wc-surface)',
                  p: { xs: 3, md: 5 },
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'var(--wc-error-soft)',
                    border: '1px solid rgba(197,51,70,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'var(--wc-error)', fontFamily: NUMBER_FONT }}>
                    !
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--wc-text-primary)',
                    fontFamily: UI_FONT,
                    mb: 1.5,
                    letterSpacing: 0,
                  }}
                >
                  Could not load market data
                </Typography>

                <Typography
                  sx={{
                    fontSize: 14,
                    color: 'var(--wc-text-secondary)',
                    lineHeight: 1.7,
                    maxWidth: 520,
                    mx: 'auto',
                    mb: 0.5,
                  }}
                >
                  Please verify database access and environment variables.
                </Typography>

                <Box
                  sx={{
                    mt: 2,
                    display: 'inline-block',
                    textAlign: 'left',
                    bgcolor: 'var(--wc-primary-soft)',
                    border: '1px solid rgba(10,46,120,0.12)',
                    borderRadius: 1,
                    px: 2.5,
                    py: 1.5,
                  }}
                >
                  {fetchError && (
                    <Box sx={{ mt: 1 }}>
                      <Typography sx={{ fontSize: 11, fontFamily: UI_FONT, fontWeight: 700, color: 'var(--wc-error)', letterSpacing: '0.08em', mb: 0.4 }}>
                        ERROR
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontFamily: NUMBER_FONT, color: 'var(--wc-text-secondary)', wordBreak: 'break-all' }}>
                        {fetchError}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </MotionReveal>
          )}

          {status === 'ok' && activeData && (
            <Stack spacing={{ xs: 4.5, md: 5.5 }}>
              <MotionReveal>
                <Box
                  component={motion.div}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <MarketHero
                    updatedLabel={formatMarketTimestamp(activeData.market?.index_as_of, latestTradeDate ?? activeData.date)}
                    generatedLabel={formatMarketTimestamp(aiSummary?.generated_at ?? activeData.market?.index_as_of, latestTradeDate ?? activeData.date)}
                    dateLabel={formatShortDate(latestTradeDate ?? activeData.date)}
                    aiSummary={aiSummary}
                    kse100Close={marketSummary.KSE100_Close}
                    kse100Change={marketSummary.KSE100_Change}
                    kse100ChangePct={indexChangePct}
                    regularVolume={marketSummary.RegularVolume}
                    kse100Volume={marketSummary.KSE100_Volume}
                    activeStocks={dayInsights.activeStocks}
                    topVolumeShare={dayInsights.topVolumeShare}
                    gainers={stats.gainers}
                    losers={stats.losers}
                    unchanged={stats.unchanged}
                  />
                </Box>
              </MotionReveal>

              <MotionReveal>
                <MarketHeatmapSection data={marketVisualData.heatmap} />
              </MotionReveal>

              <MotionReveal>
                <InsightCardsGrid
                  breadthChartItems={breadthChartItems}
                  indexes={marketIndexes}
                  regularVolume={marketSummary.RegularVolume}
                  sectorVolume={marketVisualData.sectorVolume}
                  topVolumeShare={dayInsights.topVolumeShare}
                  totalIssues={dayInsights.totalIssues}
                />
              </MotionReveal>

              <MotionReveal>
                <TopMoversGrid
                  gainers={marketVisualData.gainers}
                  losers={marketVisualData.losers}
                  volumeLeaders={dayInsights.volumeLeaders}
                />
              </MotionReveal>

              <MotionReveal>
                <MarketSnapshotTable
                  activeDate={activeData.date}
                  displayedStocks={displayedStocks}
                  exportAnchor={exportAnchor}
                  industryFilter={industryFilter}
                  industryOptions={industryOptions}
                  latestTradeDate={latestTradeDate}
                  movementFilter={movementFilter}
                  search={search}
                  setExportAnchor={setExportAnchor}
                  setIndustryFilter={setIndustryFilter}
                  setMovementFilter={setMovementFilter}
                  setSearch={setSearch}
                />
              </MotionReveal>
            </Stack>
          )}

        </Stack>
      </Container>
    </Box>
  )
}
