import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Button, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchKiborRates, fetchUsdPkrRates } from '../../lib/api/rates'
import type { KiborResponseDto, UsdPkrResponseDto } from '../../lib/api/types'
import { downloadCsv } from '../../lib/csv'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../markets/StateBlocks'
import { CARD_SX, DATA_FONT, fmtDate, fmtInstant, fmtNumber, fmtSigned } from '../markets/marketUtils'

function useRates() {
  const [kibor, setKibor] = useState<KiborResponseDto | null>(null)
  const [usdPkr, setUsdPkr] = useState<UsdPkrResponseDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetchKiborRates(controller.signal),
      fetchUsdPkrRates(controller.signal),
    ])
      .then(([nextKibor, nextUsdPkr]) => {
        setKibor(nextKibor)
        setUsdPkr(nextUsdPkr)
      })
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return { kibor, usdPkr, error, loading }
}

export function RatesMacroPage() {
  const [tab, setTab] = useState('kibor')
  const { kibor, usdPkr, error, loading } = useRates()

  return (
    <MarketShell title="Rates & Macro" subtitle="Canonical SBP KIBOR and USD/PKR series from the WebICTCapital API. Full available history is returned; publication gaps remain gaps.">
      <Stack spacing={2.4}>
        <Tabs value={tab} onChange={(_, value: string) => setTab(value)} variant="scrollable" scrollButtons="auto">
          <Tab value="kibor" label="KIBOR" />
          <Tab value="usd-pkr" label="USD/PKR" />
        </Tabs>
        {loading && <LoadingBlock />}
        {Boolean(error) && <ErrorBlock error={error} />}
        {!loading && !error && tab === 'kibor' && kibor && <KiborSection data={kibor} />}
        {!loading && !error && tab === 'usd-pkr' && usdPkr && <UsdPkrSection data={usdPkr} />}
      </Stack>
    </MarketShell>
  )
}

function KiborSection({ data }: { data: KiborResponseDto }) {
  const selectedTenor = data.tenorOrder.includes('6M') ? '6M' : data.tenorOrder[0] ?? data.latestCurve[0]?.tenor ?? ''
  const history = data.points.filter((point) => point.tenor === selectedTenor)
  const previous = history.length > 1 ? history[history.length - 2] : null
  const latest = history.length > 0 ? history[history.length - 1] : null
  const availableRange = useMemo(() => {
    const dates = data.points.map((point) => point.quoteDate).filter(Boolean).sort()
    if (dates.length === 0) return '-'
    return `${dates[0]} to ${dates[dates.length - 1]}`
  }, [data.points])
  const curveOption = {
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 52, right: 24, top: 44, bottom: 38 },
    xAxis: { type: 'category', data: data.tenorOrder },
    yAxis: { type: 'value', name: 'Percent' },
    series: [
      { name: 'Bid', type: 'line', data: data.tenorOrder.map((tenor) => data.latestCurve.find((point) => point.tenor === tenor)?.bid ?? null), connectNulls: false },
      { name: 'Offer', type: 'line', data: data.tenorOrder.map((tenor) => data.latestCurve.find((point) => point.tenor === tenor)?.offer ?? null), connectNulls: false },
    ],
  }
  const historyOption = {
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 52, right: 24, top: 44, bottom: 64 },
    xAxis: { type: 'category', data: history.map((point) => point.quoteDate) },
    yAxis: { type: 'value', name: 'Percent' },
    dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 8 }],
    series: [
      { name: `${selectedTenor} bid`, type: 'line', data: history.map((point) => point.bid), connectNulls: false },
      { name: `${selectedTenor} offer`, type: 'line', data: history.map((point) => point.offer), connectNulls: false },
    ],
  }

  return (
    <Stack spacing={2.4}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.4 }}>
        <Metric label="As of" value={fmtDate(data.asOfDate)} />
        <Metric label="Available range" value={availableRange} />
        <Metric label={`${selectedTenor} bid change`} value={fmtSigned(latest?.bid != null && previous?.bid != null ? latest.bid - previous.bid : null)} />
        <Metric label={`${selectedTenor} offer change`} value={fmtSigned(latest?.offer != null && previous?.offer != null ? latest.offer - previous.offer : null)} />
      </Box>
      <Box sx={{ ...CARD_SX, p: 2.4 }}>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Latest common-date KIBOR curve</Typography>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>Bid and offer remain separate. Canonical tenor order: 1W, 2W, 1M, 3M, 6M, 9M, 1Y.</Typography>
        <ReactECharts option={curveOption} style={{ height: 360 }} opts={{ renderer: 'svg' }} />
      </Box>
      <Box sx={{ ...CARD_SX, p: 2.4 }}>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>{selectedTenor} history</Typography>
        {history.length === 0 ? <EmptyBlock title="No KIBOR history" detail="The returned KIBOR history is empty." /> : <ReactECharts option={historyOption} style={{ height: 360 }} opts={{ renderer: 'svg' }} />}
      </Box>
      <RatesTable
        headers={['Quote date', 'Tenor', 'Bid', 'Offer']}
        rows={data.points.map((point) => [point.quoteDate, point.tenor, fmtNumber(point.bid), fmtNumber(point.offer)])}
        onExport={() => downloadCsv('kibor.csv', ['Quote date', 'Tenor', 'Bid', 'Offer'], data.points.map((point) => [point.quoteDate, point.tenor, point.bid, point.offer]))}
      />
    </Stack>
  )
}

function UsdPkrSection({ data }: { data: UsdPkrResponseDto }) {
  const points = data.points
  const previous = points.length > 1 ? points[points.length - 2] : null
  const latest = data.asOf
  const first = points[0]
  const option = {
    animation: false,
    tooltip: { trigger: 'axis' },
    grid: { left: 54, right: 24, top: 32, bottom: 64 },
    xAxis: { type: 'category', data: points.map((point) => point.quoteDate) },
    yAxis: { type: 'value', name: data.unit, scale: true },
    dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 8 }],
    series: [{ name: data.label, type: 'line', showSymbol: false, connectNulls: false, data: points.map((point) => point.rate) }],
  }

  return (
    <Stack spacing={2.4}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 1.4 }}>
        <Metric label="Pair" value={data.pair} />
        <Metric label="Rate type" value={data.label} />
        <Metric label="Unit" value={data.unit} />
        <Metric label="Prev publication change" value={fmtSigned(latest && previous ? latest.rate - previous.rate : null)} />
        <Metric label="Period change" value={fmtSigned(latest && first ? latest.rate - first.rate : null)} />
      </Box>
      <Box sx={{ ...CARD_SX, p: 2.4 }}>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>USD/PKR - SBP Mark-to-Market - Ready</Typography>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
          Quote date {fmtDate(latest?.quoteDate)} - effective date {fmtDate(latest?.effectiveDate)} - source updated {fmtInstant(latest?.updatedAt)}
        </Typography>
        {points.length === 0 ? <EmptyBlock title="No USD/PKR points" detail="The requested canonical range is empty." /> : <ReactECharts option={option} style={{ height: 420 }} opts={{ renderer: 'svg' }} />}
      </Box>
      <RatesTable
        headers={['Quote date', 'Rate', 'Effective date', 'Source updated']}
        rows={points.map((point) => [point.quoteDate, fmtNumber(point.rate, 4), point.effectiveDate ?? '-', fmtInstant(point.updatedAt)])}
        onExport={() => downloadCsv('usd-pkr.csv', ['Quote date', 'Rate', 'Effective date', 'Source updated'], points.map((point) => [point.quoteDate, point.rate, point.effectiveDate, point.updatedAt]))}
      />
    </Stack>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Box sx={{ ...CARD_SX, p: 1.8 }}><Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase' }}>{label}</Typography><Typography sx={{ mt: 0.7, color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: 15, fontWeight: 850 }}>{value}</Typography></Box>
}

function RatesTable({ headers, rows, onExport }: { headers: string[]; rows: string[][]; onExport: () => void }) {
  const visibleRows = useMemo(() => rows.slice(-80).reverse(), [rows])
  if (rows.length === 0) return <EmptyBlock title="No rows" detail="The requested range returned no rows." />
  return (
    <Box sx={{ ...CARD_SX, overflow: 'hidden' }}>
      <Stack direction="row" sx={{ p: 2, justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--wc-border)' }}>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Table view</Typography>
        <Button startIcon={<FileDownloadOutlinedIcon />} onClick={onExport}>CSV</Button>
      </Stack>
      <TableContainer sx={{ overflowX: 'auto', maxHeight: 560 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 720 }}>
          <TableHead><TableRow>{headers.map((header) => <TableCell key={header} sx={{ fontWeight: 900 }}>{header}</TableCell>)}</TableRow></TableHead>
          <TableBody>{visibleRows.map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={`${index}-${cellIndex}`}>{cell}</TableCell>)}</TableRow>)}</TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
