import { Box, Button, Stack, Typography } from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { useMemo, useState } from 'react'
import type { RankedTicker } from '../../../lib/marketOverview'
import { fmtCompact, fmtNumber, fmtPct, SURFACE_SX } from './viewFormat'
import { SectionHeader } from './viewUtils'
import { projectNumeric } from '../../../lib/numericPresentation'

type HeatmapMode = 'top' | 'all'

type HeatmapPoint = {
  name: string
  value: number
  company: string
  close: number | null
  changePct: number | null
}

type HeatmapTooltipParam = {
  data?: HeatmapPoint
}

const TOP_HEATMAP_LIMIT = 50

function heatmapColor(changePct: number | null): string {
  if (changePct == null || !Number.isFinite(changePct) || changePct === 0) return '#E4E7EC'
  const clamped = Math.min(10, Math.abs(changePct))
  const opacity = 0.36 + (clamped / 10) * 0.52
  const base = changePct > 0 ? '24, 122, 85' : '200, 62, 77'
  return `rgba(${base}, ${opacity})`
}

export function MarketOverviewHeatmap({ ranked }: { ranked: RankedTicker[] }) {
  const [mode, setMode] = useState<HeatmapMode>('top')
  const available = useMemo(
    () =>
      ranked
        .filter((ticker) => ticker.turnover != null && ticker.turnover > 0n)
        .sort((a, b) => {
          const left = a.turnover ?? 0n
          const right = b.turnover ?? 0n
          return right > left ? 1 : right < left ? -1 : 0
        }),
    [ranked],
  )
  const rows = useMemo(() => (mode === 'top' ? available.slice(0, TOP_HEATMAP_LIMIT) : available), [available, mode])
  const totalValue = useMemo(() => rows.reduce((sum, row) => sum + projectNumeric(row.turnover ?? 0n, 'heatmap turnover'), 0), [rows])
  const data = useMemo(
    () =>
      rows.map((ticker) => ({
        name: ticker.symbol,
        value: projectNumeric(ticker.turnover ?? 1n, 'heatmap turnover'),
        company: ticker.companyName ?? ticker.symbol,
        close: ticker.close == null ? null : projectNumeric(ticker.close, 'heatmap close'),
        changePct: ticker.changePct,
      })),
    [rows],
  )

  const option = useMemo(
    () => ({
      animation: true,
      animationDuration: 550,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#E4E7EC',
        borderWidth: 1,
        textStyle: { color: '#101828', fontFamily: 'Inter, sans-serif', fontSize: 12 },
        extraCssText: 'box-shadow:none;border-radius:6px;',
        formatter: (param: HeatmapTooltipParam) => {
          const item = param.data
          if (!item) return ''
          return [
            `<strong>${item.name}</strong>`,
            item.company,
            `Close ${fmtNumber(item.close)}`,
            `Change ${fmtPct(item.changePct)}`,
            `Shares traded ${fmtCompact(item.value)}`,
          ].join('<br/>')
        },
      },
      series: [
        {
          type: 'treemap',
          sort: false,
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          squareRatio: 1.1,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 1,
            gapWidth: 2,
          },
          emphasis: {
            itemStyle: { borderColor: '#0A2E78', borderWidth: 2 },
          },
          label: {
            show: true,
            formatter: (param: { data?: HeatmapPoint }) => {
              const point = param.data
              if (!point || totalValue <= 0) return ''
              return point.value / totalValue >= 0.0045 ? point.name : ''
            },
            color: '#101828',
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            fontWeight: 750,
            overflow: 'truncate',
          },
          upperLabel: {
            show: false,
            height: 22,
            color: '#667085',
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            fontWeight: 800,
            overflow: 'truncate',
          },
          levels: [
            {
              itemStyle: {
                borderColor: '#ffffff',
                borderWidth: 1,
                gapWidth: 2,
              },
              upperLabel: { show: false },
            },
          ],
          data: data.map((item) => ({
            ...item,
            value: Math.max(1, item.value),
            itemStyle: { color: heatmapColor(item.changePct) },
            label: {
              show: item.value / totalValue >= 0.0045,
              color: item.changePct != null && Math.abs(item.changePct) >= 3 ? '#ffffff' : '#101828',
            },
          })),
        },
      ],
    }),
    [data, totalValue],
  )

  return (
    <Box component="section" aria-labelledby="market-heatmap-title">
      <SectionHeader
        title="Market heatmap"
        // detail="Tile size: shares traded · Colour: daily price change"
        // right={<HeatmapLegend />}
      />
      <Box sx={{ ...SURFACE_SX, p: { xs: 1.5, md: 2 }, minWidth: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 1.4 }}>
          {/* <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
            Showing {rows.length.toLocaleString('en-PK')} of {available.length.toLocaleString('en-PK')} securities with valid share turnover.
          </Typography> */}
          <Stack direction="row" spacing={0.5} role="group" aria-label="Heatmap row scope">
            <ScopeButton active={mode === 'top'} onClick={() => setMode('top')}>Top securities</ScopeButton>
            <ScopeButton active={mode === 'all'} onClick={() => setMode('all')}>All securities</ScopeButton>
          </Stack>
        </Stack>
        {data.length === 0 ? (
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, p: 2 }}>Heatmap data is unavailable for this session.</Typography>
        ) : (
          <Box sx={{ height: { xs: 340, md: 460 }, minHeight: { xs: 340, md: 460 }, width: '100%', minWidth: 0 }}>
            <ReactECharts style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} option={option} notMerge lazyUpdate />
          </Box>
        )}
        <AccessibleHeatmapTable rows={rows.slice(0, 20)} />
      </Box>
    </Box>
  )
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <Button
      type="button"
      variant="text"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        minHeight: 32,
        px: 1.2,
        py: 0.45,
        color: active ? 'var(--wc-primary)' : 'var(--wc-text-secondary)',
        bgcolor: active ? 'var(--wc-primary-soft)' : 'transparent',
        borderRadius: '4px',
        fontSize: 12,
        fontWeight: 800,
        '&:focus-visible': { outline: '2px solid var(--wc-primary)', outlineOffset: 2 },
      }}
    >
      {children}
    </Button>
  )
}

function AccessibleHeatmapTable({ rows }: { rows: RankedTicker[] }) {
  return (
    <Box
      component="table"
      aria-label="Text summary of the largest heatmap securities"
      sx={{
        position: 'absolute',
        width: 1,
        height: 1,
        p: 0,
        m: -1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      <thead>
        <tr><th>Symbol</th><th>Company</th><th>Close</th><th>Change percent</th><th>Shares traded</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.symbol}>
            <td>{row.symbol}</td>
            <td>{row.companyName ?? row.symbol}</td>
            <td>{fmtNumber(row.close)}</td>
            <td>{fmtPct(row.changePct)}</td>
            <td>{fmtCompact(row.turnover)}</td>
          </tr>
        ))}
      </tbody>
    </Box>
  )
}
