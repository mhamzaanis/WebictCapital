import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from '@mui/material'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import BubbleChartIcon from '@mui/icons-material/BubbleChart'
import DonutLargeIcon from '@mui/icons-material/DonutLarge'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart'
import TimelineIcon from '@mui/icons-material/Timeline'
import { motion, useReducedMotion } from 'motion/react'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { MarketDashboardSkeleton, PriceTableSkeleton } from './CustomSkeleton'
import { CustomDataTable } from './CustomDataTable'
import { FiltersBar, type MovementFilter } from './FiltersBar.tsx'
import { MotionReveal } from '../animations/MotionReveal'
import {
  BarChart,
  DonutChart,
  LineChart,
  StockHeatmap,
  type BarChartItem,
  type DonutChartItem,
  type HeatmapItem,
  type LineChartPoint,
  type MarketLeaderItem,
  type SectorActivityItem,
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
  market?: {
    previous_kse100?: number
    close_kse100?: number
    curr_volume?: number
    advances?: number
    declines?: number
    unchanged?: number
    kse100_change?: number
  }
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

type DbSummaryRow = {
  trade_date: string
  kse100_prev: number | null
  kse100_close: number | null
  kse100_change: number | null
  curr_volume: number | null
  advances: number | null
  declines: number | null
  unchanged: number | null
}

type RankedStock = PsxStock & {
  numericTurnover: number
  numericChange: number
  numericClose: number
  changePct: number
  intradayRange: number
  intradayRangePct: number
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

function formatSignedNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '-'
  if (value === 0) return '0'
  const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits })
  return `${value > 0 ? '+' : '-'}${formatted}`
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
  const intradayRange = Number.isFinite(high) && Number.isFinite(low) ? high - low : NaN

  return {
    ...stock,
    numericTurnover,
    numericChange,
    numericClose,
    changePct: getChangePct(numericClose, numericChange),
    intradayRange,
    intradayRangePct: Number.isFinite(intradayRange) && low > 0 ? (intradayRange / low) * 100 : NaN,
  }
}

function changeRankValue(stock: RankedStock): number {
  return Number.isFinite(stock.changePct) ? stock.changePct : stock.numericChange
}

const MARKET_CHART_COLORS = {
  primary: '#0a2463',
  success: '#1a6640',
  error: '#b4283a',
  neutral: '#8a9bb0',
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
    rangePct: stock.intradayRangePct,
  }
}

function mapVolumeBarItem(stock: RankedStock): BarChartItem {
  return {
    id: stock.symbol,
    label: stock.symbol,
    value: stock.numericTurnover,
    tooltipLabel: 'Volume',
  }
}

function mapMomentumPoint(stock: RankedStock): LineChartPoint {
  return {
    label: stock.symbol,
    value: Number.isFinite(stock.changePct) ? stock.changePct : 0,
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

function mapSectorActivityItem(sector: SectorActivity): SectorActivityItem {
  return {
    id: sector.industry,
    label: sector.industry,
    turnover: sector.turnover,
    count: sector.count,
    gainers: sector.gainers,
    losers: sector.losers,
    unchanged: sector.unchanged,
    avgChangePct: sector.avgChangePct,
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

async function fetchSupabaseTradeDay(tradeDate: string): Promise<PsxData> {
  if (!supabase) throw new Error('Supabase client is not configured')

  const [summaryResult, stocksResult] = await Promise.all([
    supabase
      .from('market_daily_summary')
      .select('trade_date,kse100_prev,kse100_close,kse100_change,curr_volume,advances,declines,unchanged')
      .eq('trade_date', tradeDate)
      .single<DbSummaryRow>(),
    supabase
      .from('v_stock_table')
      .select('symbol,company,section,trade_date,open,high,low,close,turnover,change,eps,result_period,period_ending')
      .eq('trade_date', tradeDate)
      .neq('section', 'EXCHANGE TRADED FUNDS')
      .neq('section', 'CLOSE - END MUTUAL FUND')
      .neq('section', 'INV. BANKS / INV. COS. / SECURITIES COS.')
      .order('symbol', { ascending: true }),
  ])

  if (summaryResult.error) throw summaryResult.error
  if (stocksResult.error) throw stocksResult.error

  const rows = ((stocksResult.data ?? []) as DbStockTableRow[]).map(mapDbStockTableRow)

  return {
    date: tradeDate,
    source: 'Supabase',
    market: summaryResult.data
      ? {
          // `kse100_prev` is the DB column for the previous session's close —
          // it is NOT today's open, so it's mapped to `previous_kse100`.
          previous_kse100: summaryResult.data.kse100_prev ?? undefined,
          close_kse100: summaryResult.data.kse100_close ?? undefined,
          kse100_change: summaryResult.data.kse100_change ?? undefined,
          curr_volume: summaryResult.data.curr_volume ?? undefined,
          advances: summaryResult.data.advances ?? undefined,
          declines: summaryResult.data.declines ?? undefined,
          unchanged: summaryResult.data.unchanged ?? undefined,
        }
      : undefined,
    total_stocks: rows.length,
    stocks: rows,
  }
}

const NUMBER_FONT = 'var(--wc-font-mono)'
const SERIF = 'var(--wc-font-display)'
const CARD_SX = {
  bgcolor: '#ffffff',
  border: '1px solid var(--wc-divider)',
  borderRadius: '7px',
  boxShadow: '0 18px 42px rgba(10, 36, 99, 0.025)',
}

function formatMarketDate(value: string | null | undefined): string {
  if (!value) return '-'
  const parsed = new Date(`${value}T17:00:00+05:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 05:00 PM PKT`
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return '-'
  const parsed = new Date(`${value}T12:00:00+05:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function InfoDot() {
  return (
    <Box
      component="span"
      sx={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '1px solid #9db6ed',
        color: '#143baf',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: NUMBER_FONT,
        fontSize: 8,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      i
    </Box>
  )
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
        <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: SERIF, fontSize: 18, fontWeight: 700 }}>
          {title}
        </Typography>
        <InfoDot />
      </Stack>
      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5, lineHeight: 1.45 }}>
        {subtitle}
      </Typography>
    </Stack>
  )
}

function HeaderMetric({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string
  value: string
  detail?: string
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  const color =
    tone === 'positive' ? 'var(--wc-success)' : tone === 'negative' ? 'var(--wc-error)' : 'var(--wc-text-primary)'

  return (
    <Box
      sx={{
        minWidth: { xs: 150, lg: 132 },
        px: { xs: 0, lg: 2.3 },
        py: { xs: 1.2, lg: 0 },
        borderLeft: { lg: '1px solid var(--wc-divider)' },
      }}
    >
      <Typography
        sx={{
          color: '#31518a',
          fontFamily: SERIF,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0,
          textTransform: 'uppercase',
          mb: 0.8,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ color, fontFamily: NUMBER_FONT, fontSize: 18, fontWeight: 800, lineHeight: 1.15 }}>
        {value}
      </Typography>
      {detail && (
        <Typography sx={{ mt: 0.6, color, fontFamily: NUMBER_FONT, fontSize: 10.5, fontWeight: 700 }}>
          {detail}
        </Typography>
      )}
    </Box>
  )
}

function BreadthMetric({
  advancing,
  declining,
  unchanged,
}: {
  advancing: number
  declining: number
  unchanged: number
}) {
  return (
    <Box
      sx={{
        minWidth: { xs: '100%', sm: 260 },
        border: '1px solid var(--wc-divider)',
        borderRadius: '7px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        overflow: 'hidden',
        bgcolor: '#ffffff',
      }}
    >
      {[
        { label: 'Advancers', value: advancing, color: 'var(--wc-success)' },
        { label: 'Decliners', value: declining, color: 'var(--wc-error)' },
        { label: 'Unchanged', value: unchanged, color: 'var(--wc-text-primary)' },
      ].map((item, index) => (
        <Box
          key={item.label}
          sx={{
            px: 2,
            py: 1.8,
            borderLeft: index === 0 ? 'none' : '1px solid var(--wc-divider)',
            textAlign: 'center',
          }}
        >
          {index === 0 && (
            <Typography
              sx={{
                color: '#31518a',
                fontFamily: SERIF,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0,
                textTransform: 'uppercase',
                mb: 0.8,
                textAlign: 'left',
              }}
            >
              Breadth
            </Typography>
          )}
          {index !== 0 && <Box sx={{ height: 19 }} />}
          <Typography sx={{ color: item.color, fontFamily: NUMBER_FONT, fontSize: 18, fontWeight: 800 }}>
            {item.value.toLocaleString('en-PK')}
          </Typography>
          <Typography sx={{ mt: 0.5, color: 'var(--wc-text-secondary)', fontSize: 10.5 }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

function LeaderTable({
  title,
  subtitle,
  icon,
  items,
  footer,
  monoFont,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  items: MarketLeaderItem[]
  footer: string
  monoFont: string
}) {
  return (
    <Box sx={{ ...CARD_SX, p: 2.2, minHeight: 330 }}>
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      <Box sx={{ overflowX: 'auto' }}>
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
                  color: 'var(--wc-text-secondary)',
                  fontFamily: monoFont,
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: 0,
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
                  minHeight: 36,
                  borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--wc-divider)',
                }}
              >
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11 }}>
                  {index + 1}
                </Typography>
                <Typography sx={{ color: 'var(--wc-primary)', fontFamily: monoFont, fontSize: 12, fontWeight: 800 }}>
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
                <Typography sx={{ color: toneValue, fontFamily: monoFont, fontSize: 11.5, fontWeight: 700, textAlign: 'right' }}>
                  {formatSignedNumber(item.change)}
                </Typography>
                <Typography
                  sx={{
                    color: tone === 'positive' ? 'var(--wc-success)' : tone === 'negative' ? 'var(--wc-error)' : 'var(--wc-text-secondary)',
                    fontFamily: monoFont,
                    fontSize: 11.5,
                    fontWeight: 800,
                    textAlign: 'right',
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
  monoFont,
}: {
  items: RankedStock[]
  monoFont: string
}) {
  return (
    <Box sx={{ ...CARD_SX, p: 2.2, minHeight: 330 }}>
      <SectionTitle
        icon={<StackedBarChartIcon sx={{ fontSize: 18 }} />}
        title="Volume Leaders"
        subtitle="Most active symbols by traded turnover."
      />
      <Box sx={{ overflowX: 'auto' }}>
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
                  color: 'var(--wc-text-secondary)',
                  fontFamily: monoFont,
                  fontSize: 9.5,
                  fontWeight: 800,
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
                  minHeight: 36,
                  borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--wc-divider)',
                }}
              >
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11 }}>
                  {index + 1}
                </Typography>
                <Typography sx={{ color: 'var(--wc-primary)', fontFamily: monoFont, fontSize: 12, fontWeight: 800 }}>
                  {item.symbol}
                </Typography>
                <Typography
                  title={item.company}
                  sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {item.company}
                </Typography>
                <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: monoFont, fontSize: 11.5, textAlign: 'right' }}>
                  {formatCompactNumber(item.numericTurnover)}
                </Typography>
                <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11.5, textAlign: 'right' }}>
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

function ActiveIndustriesTable({
  sectors,
  monoFont,
}: {
  sectors: SectorActivityItem[]
  monoFont: string
}) {
  const maxTurnover = Math.max(...sectors.map((sector) => sector.turnover), 1)

  return (
    <Box sx={{ ...CARD_SX, p: 2.2, minHeight: 340 }}>
      <SectionTitle
        icon={<AnalyticsIcon sx={{ fontSize: 18 }} />}
        title="Active Industries"
        subtitle="Sectors ranked by traded value in the latest closing file."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 120px 84px',
          gap: 1.5,
          pb: 1.2,
          borderBottom: '1px solid var(--wc-divider)',
        }}
      >
        {['Sector', 'Turnover', '% Change'].map((label) => (
          <Typography
            key={label}
            sx={{
              color: 'var(--wc-text-secondary)',
              fontFamily: monoFont,
              fontSize: 9.5,
              fontWeight: 800,
              textTransform: 'uppercase',
              textAlign: label === 'Sector' ? 'left' : 'right',
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
      <Stack spacing={1.4} sx={{ mt: 1.4 }}>
        {sectors.map((sector) => {
          const tone = changeColor(sector.avgChangePct ?? NaN)
          const width = `${Math.max(8, (sector.turnover / maxTurnover) * 100)}%`
          return (
            <Box
              key={sector.id ?? sector.label}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) 120px 84px',
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  title={sector.label}
                  sx={{
                    color: 'var(--wc-text-primary)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sector.label}
                </Typography>
                <Box sx={{ mt: 0.8, height: 6, bgcolor: 'var(--wc-primary-light)', borderRadius: 999, overflow: 'hidden' }}>
                  <Box sx={{ width, height: '100%', bgcolor: 'var(--wc-primary)', borderRadius: 999 }} />
                </Box>
              </Box>
              <Typography sx={{ color: 'var(--wc-primary)', fontFamily: monoFont, fontSize: 11.5, textAlign: 'right' }}>
                {formatCompactNumber(sector.turnover)}
              </Typography>
              <Typography sx={{ color: tone, fontFamily: monoFont, fontSize: 11.5, fontWeight: 800, textAlign: 'right' }}>
                {formatPercent(sector.avgChangePct ?? NaN)}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

function RangeTable({
  items,
  avgRangePct,
  monoFont,
}: {
  items: MarketLeaderItem[]
  avgRangePct: number
  monoFont: string
}) {
  return (
    <Box sx={{ ...CARD_SX, p: 2.2, minHeight: 340 }}>
      <SectionTitle
        icon={<TimelineIcon sx={{ fontSize: 18 }} />}
        title="Widest Daily Ranges"
        subtitle="Symbols with the largest high-low spread during the session."
      />
      <Box sx={{ mb: 1.7, px: 1.6, py: 1.3, border: '1px solid var(--wc-divider)', borderRadius: '5px', bgcolor: 'var(--wc-paper)' }}>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
          Average Range
        </Typography>
        <Typography sx={{ mt: 0.3, color: 'var(--wc-text-primary)', fontFamily: monoFont, fontSize: 20, fontWeight: 800 }}>
          {formatPercent(avgRangePct, false)}
        </Typography>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 520 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '34px 82px minmax(0,1fr) 70px 70px 76px',
              columnGap: 1.3,
              pb: 1.1,
              borderBottom: '1px solid var(--wc-divider)',
            }}
          >
            {['#', 'Symbol', 'Company', 'Low', 'High', 'Range'].map((label) => (
              <Typography
                key={label}
                sx={{
                  color: 'var(--wc-text-secondary)',
                  fontFamily: monoFont,
                  fontSize: 9.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  textAlign: ['Low', 'High', 'Range'].includes(label) ? 'right' : 'left',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>
          {items.map((item, index) => (
            <Box
              key={item.id ?? item.symbol}
              sx={{
                display: 'grid',
                gridTemplateColumns: '34px 82px minmax(0,1fr) 70px 70px 76px',
                columnGap: 1.3,
                alignItems: 'center',
                minHeight: 34,
                borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--wc-divider)',
              }}
            >
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11 }}>
                {index + 1}
              </Typography>
              <Typography sx={{ color: 'var(--wc-primary)', fontFamily: monoFont, fontSize: 12, fontWeight: 800 }}>
                {item.symbol}
              </Typography>
              <Typography
                title={item.company}
                sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {item.company}
              </Typography>
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11.5, textAlign: 'right' }}>
                {formatNumber(item.low ?? NaN)}
              </Typography>
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11.5, textAlign: 'right' }}>
                {formatNumber(item.high ?? NaN)}
              </Typography>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: monoFont, fontSize: 11.5, fontWeight: 800, textAlign: 'right' }}>
                {formatPercent(item.rangePct ?? NaN, false)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Button
        endIcon={<Box component="span" sx={{ fontSize: 16 }}>→</Box>}
        sx={{ mt: 2, p: 0, color: 'var(--wc-primary)', fontSize: 12.5, fontWeight: 800, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
      >
        View all ranges
      </Button>
    </Box>
  )
}

// -- Component ----------------------------------------------------------------

export function DataPage() {
  const reduce = useReducedMotion()
  const [data, setData] = useState<PsxData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [latestTradeDate, setLatestTradeDate] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
  const [industryFilter, setIndustryFilter] = useState('all')

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

      const latestDateResult = await supabase
        .from('market_daily_summary')
        .select('trade_date')
        .order('trade_date', { ascending: false })
        .limit(1)

      if (latestDateResult.error || !latestDateResult.data?.length) {
        if (!cancelled) {
          const message = latestDateResult.error?.message ?? 'No trade_date entries found in Supabase.'
          setFetchError(message)
          setStatus('error')
        }
        return
      }

      if (cancelled) return

      const tradeDate = latestDateResult.data[0]?.trade_date ?? null
      if (!tradeDate) {
        setFetchError('No trade_date entries found in Supabase.')
        setStatus('error')
        return
      }

      setLatestTradeDate(tradeDate)

      try {
        const latestData = await fetchSupabaseTradeDay(tradeDate)
        if (cancelled) return
        setData(latestData)
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
      return {
        KSE100_PreviousClose: market.previous_kse100 ?? 0,
        KSE100_Close: market.close_kse100 ?? 0,
        Volume_Traded: market.curr_volume ?? 0,
        KSE100_Change: market.kse100_change ?? (market.close_kse100 ?? 0) - (market.previous_kse100 ?? 0),
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
      Volume_Traded: totalVolume,
      KSE100_Change: totalClose - totalOpen,
    }
  }, [stocks, activeData])

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
    const rangeStocks = rankedStocks
      .filter((stock) => Number.isFinite(stock.intradayRangePct) && stock.intradayRangePct > 0)
      .sort((a, b) => b.intradayRangePct - a.intradayRangePct)
    const rangeLeaders = rangeStocks.slice(0, 5)
    const tableVolume = rankedStocks.reduce(
      (sum, stock) => sum + (Number.isFinite(stock.numericTurnover) ? Math.max(0, stock.numericTurnover) : 0),
      0,
    )
    const totalVolume = marketSummary.Volume_Traded > 0 ? marketSummary.Volume_Traded : tableVolume
    const activeStocks = rankedStocks.filter((stock) => Number.isFinite(stock.numericTurnover) && stock.numericTurnover > 0).length
    const avgRangePct =
      rangeStocks.length > 0
        ? rangeStocks.reduce((sum, stock) => sum + stock.intradayRangePct, 0) / rangeStocks.length
        : NaN
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
    const momentumStocks = [...losers].reverse().concat(gainers)

    return {
      activeStocks,
      avgRangePct,
      gainers,
      heatmapStocks,
      losers,
      momentumStocks,
      rangeLeaders,
      sectors,
      tableVolume,
      topVolumeShare,
      totalIssues,
      totalVolume,
      volumeLeaders,
    }
  }, [marketSummary.Volume_Traded, stats.gainers, stats.losers, stats.unchanged, stocks])

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
      volumeLeaders: dayInsights.volumeLeaders.map(mapMarketLeaderItem),
      rangeLeaders: dayInsights.rangeLeaders.map(mapMarketLeaderItem),
      momentum: dayInsights.momentumStocks.map(mapMomentumPoint),
      heatmap: dayInsights.heatmapStocks.map(mapHeatmapItem),
      sectors: dayInsights.sectors.map(mapSectorActivityItem),
      sectorVolume: dayInsights.sectors.map(mapSectorVolumeItem),
      volumeBars: dayInsights.volumeLeaders.map(mapVolumeBarItem),
    }),
    [dayInsights],
  )

  // Change % must be computed off the *previous* close, not the intraday open.
  const indexChangePct =
    marketSummary.KSE100_PreviousClose > 0
      ? (marketSummary.KSE100_Change / marketSummary.KSE100_PreviousClose) * 100
      : NaN

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2.4rem)', md: 'calc(72px + 3.6rem)' },
        pb: { xs: 6, md: 8 },
        bgcolor: 'var(--wc-bg)',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1720px !important', px: { xs: 2.5, md: 5, xl: 7 } }}>
        <Stack spacing={{ xs: 3, md: 3.5 }}>
          {status === 'loading' && (
            <MotionReveal>
              <Stack spacing={{ xs: 2.5, md: 3 }}>
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
                  border: '1px solid #e2eaf5',
                  borderRadius: 1.5,
                  bgcolor: '#fafbfd',
                  p: { xs: 3, md: 5 },
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(180,40,58,0.08)',
                    border: '1px solid rgba(180,40,58,0.15)',
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
                    fontFamily: SERIF,
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
                    bgcolor: 'rgba(10,36,99,0.04)',
                    border: '1px solid rgba(10,36,99,0.12)',
                    borderRadius: 1,
                    px: 2.5,
                    py: 1.5,
                  }}
                >
                  {fetchError && (
                    <Box sx={{ mt: 1 }}>
                      <Typography sx={{ fontSize: 11, fontFamily: SERIF, fontWeight: 600, color: 'var(--wc-error)', letterSpacing: '0.06em', mb: 0.4 }}>
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
            <Stack spacing={{ xs: 2.5, md: 3 }}>
              <MotionReveal>
                <Box
                  component={motion.section}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 0.9fr) minmax(700px, 1.1fr)' },
                    gap: { xs: 3, xl: 5 },
                    alignItems: 'end',
                  }}
                >
                  <Box>
                    <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 2.2 }}>
                      <Typography sx={{ color: '#31518a', fontSize: 12, fontWeight: 700 }}>
                        Markets
                      </Typography>
                      <Typography sx={{ color: '#a5b5cb', fontSize: 12, fontWeight: 800 }}>›</Typography>
                      <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 12, fontWeight: 800 }}>
                        PSX Market Overview
                      </Typography>
                    </Stack>

                    <Typography
                      variant="h1"
                      sx={{
                        color: 'var(--wc-text-primary)',
                        fontSize: { xs: '2.7rem', sm: '3.4rem', md: '4.55rem' },
                        fontWeight: 700,
                        lineHeight: 0.98,
                        letterSpacing: 0,
                      }}
                    >
                      PSX Market Overview
                    </Typography>
                    <Typography
                      sx={{
                        mt: 1.8,
                        color: 'var(--wc-text-secondary)',
                        fontSize: { xs: 14, md: 15 },
                        lineHeight: 1.7,
                        maxWidth: 630,
                      }}
                    >
                      Real-time overview of Pakistan Stock Exchange with key market statistics, sector
                      performance, and closing rates.
                    </Typography>
                    <Typography sx={{ mt: 1.7, color: 'var(--wc-text-secondary)', fontSize: 12.5, fontWeight: 600 }}>
                      Last updated:{' '}
                      <Box component="span" sx={{ color: 'var(--wc-primary)', fontWeight: 800 }}>
                        {formatMarketDate(latestTradeDate ?? activeData.date)}
                      </Box>
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: { xs: 'flex-start', xl: 'flex-end' },
                      alignItems: 'stretch',
                      gap: { xs: 2, lg: 0 },
                    }}
                  >
                    <HeaderMetric
                      label="Previous Close"
                      value={formatNumber(marketSummary.KSE100_PreviousClose)}
                      detail={formatShortDate(latestTradeDate ?? activeData.date)}
                    />
                    <HeaderMetric label="KSE-100 Close" value={formatNumber(marketSummary.KSE100_Close)} />
                    <HeaderMetric
                      label="Daily Change"
                      value={formatSignedNumber(marketSummary.KSE100_Change)}
                      detail={formatPercent(indexChangePct)}
                      tone={marketSummary.KSE100_Change > 0 ? 'positive' : marketSummary.KSE100_Change < 0 ? 'negative' : 'neutral'}
                    />
                    <HeaderMetric
                      label="Volume Traded"
                      value={formatCompactNumber(marketSummary.Volume_Traded)}
                      detail="Turnover (PKR)"
                    />
                    <BreadthMetric advancing={stats.gainers} declining={stats.losers} unchanged={stats.unchanged} />
                  </Box>
                </Box>
              </MotionReveal>

              <MotionReveal>
                <Box sx={{ position: 'relative' }}>
                  <StockHeatmap
                    heading="Market Heatmap"
                    detail="Top active stocks sized by traded value and colored by daily change."
                    icon={<BubbleChartIcon sx={{ fontSize: 18 }} />}
                    height={390}
                    data={marketVisualData.heatmap}
                    sx={{ ...CARD_SX, p: 2.2, borderRadius: '7px', minHeight: { xs: 420, md: 500 } }}
                    colors={{
                      positive: MARKET_CHART_COLORS.success,
                      negative: MARKET_CHART_COLORS.error,
                      neutral: '#eef2f7',
                    }}
                  />
                  <Stack
                    direction="row"
                    spacing={1.2}
                    sx={{
                      position: 'absolute',
                      right: { xs: 22, md: 32 },
                      top: { xs: 58, md: 50 },
                      alignItems: 'center',
                      display: { xs: 'none', sm: 'flex' },
                    }}
                  >
                    <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 10, fontWeight: 800 }}>
                      -5%
                    </Typography>
                    <Box
                      sx={{
                        width: 220,
                        height: 8,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, #c72f43 0%, #eef2f7 50%, #1f8b55 100%)',
                      }}
                    />
                    <Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: NUMBER_FONT, fontSize: 10, fontWeight: 800 }}>
                      +5%
                    </Typography>
                  </Stack>
                </Box>
              </MotionReveal>

              <MotionReveal>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '0.85fr 1.05fr 1.1fr' },
                    gap: 1.5,
                  }}
                >
                  <DonutChart
                    heading="Market Breadth"
                    detail="Advancers, decliners, and unchanged."
                    icon={<DonutLargeIcon sx={{ fontSize: 18 }} />}
                    height={245}
                    data={breadthChartItems}
                    centerText={dayInsights.totalIssues.toLocaleString('en-PK')}
                    colors={[
                      MARKET_CHART_COLORS.success,
                      MARKET_CHART_COLORS.error,
                      MARKET_CHART_COLORS.neutral,
                    ]}
                    centerSubtext="Total Stocks"
                    emptyLabel="Breadth data is unavailable."
                    sx={{ ...CARD_SX, borderRadius: '7px', minHeight: 350 }}
                  />
                  <BarChart
                    heading="Sector Volume"
                    detail="Top industries by trading concentration."
                    icon={<AnalyticsIcon sx={{ fontSize: 18 }} />}
                    height={245}
                    data={marketVisualData.sectorVolume}
                    left={135}
                    emptyLabel="Sector volume is unavailable."
                    sx={{ ...CARD_SX, borderRadius: '7px', minHeight: 350 }}
                  />
                  <LineChart
                    heading="Mover Curve"
                    detail="Largest losers through largest gainers."
                    icon={<TimelineIcon sx={{ fontSize: 18 }} />}
                    height={245}
                    data={marketVisualData.momentum}
                    color={MARKET_CHART_COLORS.primary}
                    emptyLabel="Momentum line needs more mover data."
                    sx={{ ...CARD_SX, borderRadius: '7px', minHeight: 350 }}
                  />
                </Box>
              </MotionReveal>

              <MotionReveal>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
                    gap: 1.5,
                  }}
                >
                  <LeaderTable
                    title="Top Gainers"
                    subtitle="Largest positive closes vs prior close."
                    items={marketVisualData.gainers}
                    kind="gain"
                    icon={<Box component="span" sx={{ color: 'var(--wc-success)', fontFamily: NUMBER_FONT, fontSize: 16, fontWeight: 900 }}>↑</Box>}
                    footer="View all gainers"
                    monoFont={NUMBER_FONT}
                  />
                  <LeaderTable
                    title="Top Losers"
                    subtitle="Largest negative closes vs prior close."
                    items={marketVisualData.losers}
                    kind="loss"
                    icon={<Box component="span" sx={{ color: 'var(--wc-error)', fontFamily: NUMBER_FONT, fontSize: 16, fontWeight: 900 }}>↓</Box>}
                    footer="View all losers"
                    monoFont={NUMBER_FONT}
                  />
                  <VolumeLeaderTable items={dayInsights.volumeLeaders} monoFont={NUMBER_FONT} />
                </Box>
              </MotionReveal>

              <MotionReveal>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
                    gap: 1.5,
                  }}
                >
                  <ActiveIndustriesTable
                    sectors={marketVisualData.sectors}
                    monoFont={NUMBER_FONT}
                  />
                  <RangeTable
                    items={marketVisualData.rangeLeaders}
                    avgRangePct={dayInsights.avgRangePct}
                    monoFont={NUMBER_FONT}
                  />
                </Box>
              </MotionReveal>

              <MotionReveal>
                <Box
                  sx={{
                    ...CARD_SX,
                    overflow: 'hidden',
                    '& .MuiTableContainer-root': {
                      border: 'none',
                      borderRadius: 0,
                      boxShadow: 'none',
                    },
                    '& .MuiTablePagination-root': {
                      borderRadius: 0,
                      bgcolor: '#ffffff',
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: '1fr auto' },
                      gap: 1.5,
                      alignItems: 'center',
                      borderBottom: '1px solid var(--wc-divider)',
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
                    <Button
                      startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        height: 40,
                        px: 2,
                        border: '1px solid var(--wc-divider)',
                        borderRadius: '5px',
                        color: 'var(--wc-text-primary)',
                        fontSize: 12,
                        fontWeight: 800,
                        justifySelf: { xs: 'stretch', lg: 'end' },
                        '&:hover': { bgcolor: 'var(--wc-primary-light)', borderColor: '#b9c9e4' },
                      }}
                    >
                      Export
                    </Button>
                  </Box>

                  <CustomDataTable rows={displayedStocks} searchQuery={search} monoFont={NUMBER_FONT} />
                </Box>
              </MotionReveal>
            </Stack>
          )}

        </Stack>
      </Container>
    </Box>
  )
}
