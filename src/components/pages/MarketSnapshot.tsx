import { Box, Paper, Stack, Typography } from '@mui/material'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

export type MarketSnapshotProps = {
  date: string
  previousClose: number
  close: number
  change: number
  changePercent: number
  volume: number
  advancing: number
  declining: number
  unchanged: number
  monoFont: string
}

// -- Local formatting helpers (kept private to this component so it has no
// dependency on the parent page's formatter set). --------------------------

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

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '-'
  const formatted = Math.abs(value).toLocaleString('en-PK', { maximumFractionDigits: 2 })
  if (value === 0) return `${formatted}%`
  return `${value > 0 ? '+' : '-'}${formatted}%`
}


function directionColor(value: number): string {
  if (!Number.isFinite(value) || value === 0) return 'var(--wc-text-secondary)'
  return value > 0 ? 'var(--wc-success)' : 'var(--wc-error)'
}

// -- Sub components -----------------------------------------------------------

type MetricProps = {
  label: string
  value: string
  trend?: string
  trendColor?: string
  monoFont: string
  showDivider: boolean
}

function Metric({ label, value, trend, trendColor, monoFont, showDivider }: MetricProps) {
  return (
    <Box
      sx={{
        px: { xs: 0, md: 2.5 },
        py: { xs: 0.5, md: 0 },
        borderRight: { md: showDivider ? '1px solid var(--wc-divider)' : 'none' },
        '&:first-of-type': { pl: { md: 0 } },
      }}
    >
      <Typography
        sx={{
          color: 'var(--wc-text-secondary)',
          fontFamily: 'var(--wc-font-display)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap', rowGap: 0.25 }}>
        <Typography
          sx={{
            color: 'var(--wc-text-primary)',
            fontSize: { xs: 21, md: 24 },
            fontWeight: 700,
            fontFamily: monoFont,
            lineHeight: 1.15,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Typography>
        {trend && (
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 500,
              fontFamily: monoFont,
              fontVariantNumeric: 'tabular-nums',
              color: trendColor ?? 'var(--wc-text-secondary)',
            }}
          >
            {trend}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

type BreadthEntryProps = {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  monoFont: string
}

function BreadthEntry({ icon, label, value, color, monoFont }: BreadthEntryProps) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', color, '& svg': { fontSize: 16 } }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 12,
          fontFamily: 'var(--wc-font-body)',
          color: 'var(--wc-text-secondary)',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 500,
          fontFamily: monoFont,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--wc-text-primary)',
        }}
      >
        {value.toLocaleString('en-PK')}
      </Typography>
    </Stack>
  )
}

// -- Component ----------------------------------------------------------------

export function MarketSnapshot({
  previousClose,
  close,
  change,
  changePercent,
  volume,
  advancing,
  declining,
  unchanged,
  monoFont,
}: MarketSnapshotProps) {
  const changeTrendColor = directionColor(change)

  const metrics: MetricProps[] = [
    {
      label: 'Previous Close',
      value: formatNumber(previousClose),
      monoFont,
      showDivider: true,
    },
    {
      label: 'KSE 100 Close',
      value: formatNumber(close),
      monoFont,
      showDivider: true,
    },
    {
      label: 'Daily Change',
      value: formatSignedNumber(change),
      trend: Number.isFinite(changePercent) ? formatPercent(changePercent) : undefined,
      trendColor: changeTrendColor,
      monoFont,
      showDivider: true,
    },
    {
      label: 'Volume Traded',
      value: formatCompactNumber(volume),
      monoFont,
      showDivider: false,
    },
  ]

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'var(--wc-bg)',
        border: '1px solid var(--wc-divider)',
        borderRadius: '12px',
        px: { xs: 2, md: 2.5 },
        py: { xs: 1.75, md: 2 },
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
      }}
    >
      <Stack spacing={{ xs: 1.5, md: 1.75 }}>
        {/* Header */}
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          {/* <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--wc-text-secondary)',
              fontFamily: 'var(--wc-font-display)',
            }}
          >
            Market Snapshot
          </Typography> */}
          {/* <Typography
            sx={{
              fontSize: 11.5,
              color: 'var(--wc-text-secondary)',
              fontFamily: monoFont,
            }}
          >
            {formatDate(date)}
          </Typography> */}
        </Stack>

        {/* Primary metrics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            rowGap: { xs: 1.5, md: 0 },
            columnGap: { xs: 2, md: 0 },
          }}
        >
          {metrics.map((metric) => (
            <Metric key={metric.label} {...metric} />
          ))}
        </Box>

        {/* Breadth footer */}
        <Stack
          direction="row"
          spacing={2.5}
          sx={{
            flexWrap: 'wrap',
            rowGap: 0.75,
            pt: { xs: 1.25, md: 1.5 },
            borderTop: '1px solid var(--wc-divider)',
          }}
        >
          <BreadthEntry
            icon={<ArrowDropUpIcon />}
            label="Advancing"
            value={advancing}
            color="var(--wc-success)"
            monoFont={monoFont}
          />
          <BreadthEntry
            icon={<ArrowDropDownIcon />}
            label="Declining"
            value={declining}
            color="var(--wc-error)"
            monoFont={monoFont}
          />
          <BreadthEntry
            icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important' }} />}
            label="Unchanged"
            value={unchanged}
            color="var(--wc-text-secondary)"
            monoFont={monoFont}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}