import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Button, Checkbox, FormControlLabel, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { memo, useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { fetchKiborRates, fetchUsdPkrRates } from '../../lib/api/rates'
import type { KiborObservationDto, KiborResponseDto, UsdPkrResponseDto } from '../../lib/api/types'
import { downloadCsv } from '../../lib/csv'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../markets/StateBlocks'
import { CARD_SX, fmtDate, fmtNumber } from '../markets/marketUtils'

const KIBOR_TENORS = ['1W', '2W', '1M', '3M', '6M', '9M', '1Y'] as const
const DEFAULT_CHART_TENORS = ['3M', '6M', '1Y'] as const
const KIBOR_TABLE_HEADERS = ['Quote date', 'Tenor', 'Bid', 'Offer']
const KIBOR_LATEST_HEADERS = ['Tenor', 'Bid', 'Offer', 'Spread (bps)']
const USD_PKR_TABLE_HEADERS = ['Quote date', 'Rate', 'Effective date']
const DEFAULT_TABLE_PAGE_SIZE = 50
const CHART_STYLE = { height: 380 }
const USD_CHART_STYLE = { height: 420 }
const CANVAS_OPTS = { renderer: 'canvas' as const, useDirtyRect: true }
const REPLACE_SERIES_MERGE = ['series']
const KIBOR_COLORS: Record<string, string> = {
  '1W': '#2563eb',
  '2W': '#16a34a',
  '1M': '#dc2626',
  '3M': '#9333ea',
  '6M': '#ea580c',
  '9M': '#0891b2',
  '1Y': '#4f46e5',
}
const RATE_TABLE_PAGE_SIZE_OPTIONS = [25, 50, 100, 250]
const KIBOR_MIN_DATE = '2021-01-04'
const USD_PKR_MIN_DATE = '2021-01-01'
const RATE_RANGE_PRESETS = [
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'All' },
] as const
const UNAVAILABLE_VALUE = '—'

type KiborTenor = typeof KIBOR_TENORS[number]
type RateRangePreset = typeof RATE_RANGE_PRESETS[number]['value']
type DateRange = {
  startDate: string
  endDate: string
}
type DisplayRow = {
  key: string
  cells: string[]
}
type ExportCell = string | number | null | undefined
type KiborChartDatum = {
  value: number | null
  quoteDate: string
  tenor: KiborTenor
  bid: number | null
  offer: number | null
}
type KiborChartSeriesData = Record<KiborTenor, {
  bid: KiborChartDatum[]
  offer: KiborChartDatum[]
}>
type KiborTooltipParam = {
  marker?: string
  data?: Partial<KiborChartDatum>
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function clampStartDate(value: string, minDate: string): string {
  return value < minDate ? minDate : value
}

function currentDateOnly(): string {
  return formatDateOnly(new Date())
}

function rangeForRatePreset(preset: RateRangePreset, minDate: string, endDate = currentDateOnly()): DateRange {
  if (preset === 'ALL') return { startDate: minDate, endDate }
  const end = parseDateOnly(endDate)
  const months = preset === '3M' ? -3 : preset === '6M' ? -6 : -12
  return { startDate: clampStartDate(formatDateOnly(addMonths(end, months)), minDate), endDate }
}

function kiborObservations(data: KiborResponseDto): KiborObservationDto[] {
  return data.observations ?? data.points ?? []
}

function usdPkrObservations(data: UsdPkrResponseDto): NonNullable<UsdPkrResponseDto['points']> {
  return data.observations ?? data.points ?? []
}

function isKiborTenor(value: string): value is KiborTenor {
  return KIBOR_TENORS.includes(value as KiborTenor)
}

function normalizeTenorOrder(tenorOrder: string[]): KiborTenor[] {
  const orderedTenors = tenorOrder.filter(isKiborTenor)
  return orderedTenors.length > 0 ? orderedTenors : [...KIBOR_TENORS]
}

function kiborSpreadBps(bid: number | null | undefined, offer: number | null | undefined): number | null {
  return bid == null || offer == null ? null : (offer - bid) * 100
}

function fmtKiborValue(value: number | null | undefined, digits = 2): string {
  return value == null ? UNAVAILABLE_VALUE : value.toFixed(digits)
}

function fmtKiborPercent(value: number | null | undefined): string {
  return value == null ? UNAVAILABLE_VALUE : `${value.toFixed(2)}%`
}

function formatPercentAxisLabel(value: number | string): string {
  return `${value}%`
}

function kiborTooltipFormatter(params: KiborTooltipParam | KiborTooltipParam[]): string {
  const item = Array.isArray(params) ? params[0] : params
  const data = item?.data
  if (!data?.tenor) return ''
  return [
    `<div><strong>${data.quoteDate ?? ''}</strong></div>`,
    '<div style="margin-top:6px">',
    `${item.marker ?? ''}<strong>${data.tenor}</strong>`,
    `<div>Bid: ${fmtKiborPercent(data.bid)}</div>`,
    `<div>Offer: ${fmtKiborPercent(data.offer)}</div>`,
    '</div>',
  ].join('')
}

export function RatesMacroPage() {
  return (
    <MarketShell title="KIBOR Rates" 
    // subtitle="Canonical SBP KIBOR bid/offer observations from the WebICTCapital API."
    >
      <KiborSection />
    </MarketShell>
  )
}

export function UsdPkrRatesPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => rangeForRatePreset('1Y', USD_PKR_MIN_DATE))
  const [rangePreset, setRangePreset] = useState<RateRangePreset>('1Y')
  const [data, setData] = useState<UsdPkrResponseDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const handleRangePresetChange = useCallback((nextPreset: RateRangePreset) => {
    setRangePreset(nextPreset)
    setLoading(true)
    setError(null)
    setDateRange(rangeForRatePreset(nextPreset, USD_PKR_MIN_DATE))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchUsdPkrRates(dateRange, controller.signal)
      .then((nextData) => setData(nextData))
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [dateRange])

  return (
    <MarketShell title="USD/PKR Rates" subtitle="SBP Mark-to-Market Ready USD/PKR observations from the WebICTCapital API.">
      {!data && loading && <LoadingBlock />}
      {!data && Boolean(error) && <ErrorBlock error={error} />}
      {data && (
        <UsdPkrSection
          data={data}
          dateRange={dateRange}
          rangePreset={rangePreset}
          loading={loading}
          error={error}
          onRangePresetChange={handleRangePresetChange}
        />
      )}
    </MarketShell>
  )
}

const KiborSection = memo(function KiborSection() {
  const [dateRange, setDateRange] = useState<DateRange>(() => rangeForRatePreset('1Y', KIBOR_MIN_DATE))
  const [data, setData] = useState<KiborResponseDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const observations = useMemo(() => data ? kiborObservations(data) : [], [data])
  const tenorOrder = useMemo(() => normalizeTenorOrder(data?.tenorOrder ?? []), [data?.tenorOrder])
  const handleRangePresetChange = useCallback((nextPreset: RateRangePreset) => {
    setLoading(true)
    setError(null)
    setDateRange(rangeForRatePreset(nextPreset, KIBOR_MIN_DATE))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchKiborRates(dateRange, controller.signal)
      .then((nextData) => setData(nextData))
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [dateRange])

  if (!data && loading) return <LoadingBlock />
  if (!data && error) return <ErrorBlock error={error} />

  return (
    <Stack spacing={2.4}>
      {data && <LatestCurveSection asOfDate={data.asOfDate} latestCurve={data.latestCurve} tenorOrder={tenorOrder} />}
      <KiborChartSection
        points={observations}
        tenorOrder={tenorOrder}
        dateRange={dateRange}
        loading={loading}
        error={error}
        onRangePresetChange={handleRangePresetChange}
      />
      <RatesTableSection points={observations} tenorOrder={tenorOrder} />
    </Stack>
  )
})

const LatestCurveSection = memo(function LatestCurveSection({ asOfDate, latestCurve, tenorOrder }: Pick<KiborResponseDto, 'asOfDate' | 'latestCurve'> & { tenorOrder: readonly KiborTenor[] }) {
  const rows = useMemo(() => tenorOrder.map((tenor) => {
    const point = latestCurve.find((curvePoint) => curvePoint.tenor === tenor)
    const spread = kiborSpreadBps(point?.bid, point?.offer)
    return [tenor, fmtKiborValue(point?.bid), fmtKiborValue(point?.offer), fmtKiborValue(spread, 1)]
  }), [latestCurve, tenorOrder])
  const handleExport = useCallback(() => {
    downloadCsv('kibor-latest.csv', KIBOR_LATEST_HEADERS, rows)
  }, [rows])

  return (
    <Box sx={{ ...CARD_SX, overflow: 'hidden' }}>
      <Stack direction="row" sx={{ p: 2, justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--wc-border)' }}>
        <Box>
          <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Today's KIBOR rates</Typography>
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>Latest available date: {fmtDate(asOfDate)}</Typography>
        </Box>
        <Button startIcon={<FileDownloadOutlinedIcon />} onClick={handleExport}>CSV</Button>
      </Stack>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 520 }}>
          <TableHead>
            <TableRow>
              {KIBOR_LATEST_HEADERS.map((header) => <TableCell key={header} sx={{ fontWeight: 900 }}>{header}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => <TableRow key={row[0]}>{row.map((cell, cellIndex) => <TableCell key={`${row[0]}-${cellIndex}`}>{cell}</TableCell>)}</TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
})

const KiborChartSection = memo(function KiborChartSection({
  points,
  tenorOrder,
  dateRange,
  loading,
  error,
  onRangePresetChange,
}: {
  points: KiborObservationDto[]
  tenorOrder: readonly KiborTenor[]
  dateRange: DateRange
  loading: boolean
  error: unknown
  onRangePresetChange: (preset: RateRangePreset) => void
}) {
  const [selectedTenors, setSelectedTenors] = useState<readonly KiborTenor[]>(DEFAULT_CHART_TENORS)
  const [rangePreset, setRangePreset] = useState<RateRangePreset>('1Y')
  const visibleTenors = useMemo(() => tenorOrder.filter((tenor) => selectedTenors.includes(tenor)), [selectedTenors, tenorOrder])
  const quoteDates = useMemo(() => Array.from(new Set(points.map((point) => point.quoteDate))).sort(), [points])
  const pointsByTenorDate = useMemo(() => {
    const next = new Map<string, { bid: number | null; offer: number | null }>()
    points.forEach((point) => next.set(`${point.tenor}|${point.quoteDate}`, { bid: point.bid, offer: point.offer }))
    return next
  }, [points])
  const seriesData = useMemo<KiborChartSeriesData>(() => {
    return KIBOR_TENORS.reduce((next, tenor) => {
      const fullData = quoteDates.map((quoteDate) => {
        const point = pointsByTenorDate.get(`${tenor}|${quoteDate}`)
        const bid = point?.bid ?? null
        const offer = point?.offer ?? null
        return {
          quoteDate,
          tenor,
          bid,
          offer,
        }
      })
      next[tenor] = {
        bid: fullData.map((point) => ({ ...point, value: point.bid })),
        offer: fullData.map((point) => ({ ...point, value: point.offer })),
      }
      return next
    }, {} as KiborChartSeriesData)
  }, [pointsByTenorDate, quoteDates])
  const toggleTenor = useCallback((tenor: KiborTenor) => {
    setSelectedTenors((current) => current.includes(tenor) ? current.filter((item) => item !== tenor) : [...current, tenor])
  }, [])
  const handleRangePresetClick = useCallback((preset: RateRangePreset) => {
    setRangePreset(preset)
    onRangePresetChange(preset)
  }, [onRangePresetChange])
  const comparisonOption = useMemo(() => {
    return {
      animation: false,
      useDirtyRect: true,
      tooltip: {
        trigger: 'item',
        transitionDuration: 0,
        axisPointer: { animation: false },
        formatter: kiborTooltipFormatter,
      },
      axisPointer: { animation: false },
      legend: { show: false },
      grid: { left: 46, right: 18, top: 22, bottom: 48 },
      xAxis: { type: 'category', data: quoteDates, axisLabel: { hideOverlap: true }, axisPointer: { animation: false } },
      yAxis: {
        type: 'value',
        name: 'Percent',
        scale: true,
        axisLabel: { formatter: formatPercentAxisLabel },
        axisPointer: { animation: false },
      },
      dataZoom: [{ type: 'inside', throttle: 100 }],
      series: visibleTenors.flatMap((tenor) => {
        const color = KIBOR_COLORS[tenor]
        return [
          {
            name: `${tenor} bid`,
            type: 'line',
            step: 'end',
            animation: false,
            sampling: 'lttb',
            showSymbol: false,
            symbol: 'none',
            data: seriesData[tenor].bid,
            connectNulls: false,
            lineStyle: { color, width: 1.25, opacity: 0.9 },
            itemStyle: { color },
            emphasis: { disabled: true },
          },
          {
            name: `${tenor} offer`,
            type: 'line',
            step: 'end',
            animation: false,
            sampling: 'lttb',
            showSymbol: false,
            symbol: 'none',
            data: seriesData[tenor].offer,
            connectNulls: false,
            lineStyle: { color, type: 'dashed', width: 1.05, opacity: 0.62 },
            itemStyle: { color },
            emphasis: { disabled: true },
          },
        ]
      }),
    }
  }, [quoteDates, seriesData, visibleTenors])

  return (
    <Box sx={{ ...CARD_SX, p: 2.4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-start' } }}>
        <Box>
          <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>KIBOR tenor comparison</Typography>
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
            {dateRange.startDate} to {dateRange.endDate}{loading ? ' - updating' : ''}
          </Typography>
          {Boolean(error) && <Typography sx={{ color: 'var(--wc-error)', fontSize: 12 }}>Could not refresh the selected range. Showing the previous response.</Typography>}
        </Box>
        <Stack spacing={1} sx={{ alignItems: { xs: 'stretch', md: 'flex-end' } }}>
          <ChartControlGroup label="Date range">
            {RATE_RANGE_PRESETS.map((preset) => (
              <RangePresetButton
                key={preset.value}
                label={preset.label}
                value={preset.value}
                selected={rangePreset === preset.value}
                onSelect={handleRangePresetClick}
              />
            ))}
          </ChartControlGroup>
          <ChartControlGroup label="Tenors">
            {tenorOrder.map((tenor) => (
              <TenorCheckbox
                key={tenor}
                label={tenor}
                checked={selectedTenors.includes(tenor)}
                onChange={toggleTenor}
                color={KIBOR_COLORS[tenor]}
              />
            ))}
          </ChartControlGroup>
        </Stack>
      </Stack>
      {points.length === 0 ? <EmptyBlock title="No KIBOR history" detail="The returned KIBOR history is empty." /> : visibleTenors.length === 0 ? <EmptyBlock title="No tenors selected" detail="Select one or more tenors to compare." /> : <ReactECharts option={comparisonOption} style={CHART_STYLE} opts={CANVAS_OPTS} notMerge={false} replaceMerge={REPLACE_SERIES_MERGE} lazyUpdate />}
    </Box>
  )
})

const ChartControlGroup = memo(function ChartControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack spacing={0.55} sx={{ alignItems: { xs: 'stretch', md: 'flex-end' } }}>
      <Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>{label}</Typography>
      <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', rowGap: 0.8, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
        {children}
      </Stack>
    </Stack>
  )
})

const RatesTableSection = memo(function RatesTableSection({ points, tenorOrder }: { points: KiborObservationDto[]; tenorOrder: readonly KiborTenor[] }) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [filter, setFilter] = useState('')
  const normalizedFilter = filter.trim().toLowerCase()
  const tenorRank = useMemo(() => new Map<string, number>(tenorOrder.map((tenor, index) => [tenor, index])), [tenorOrder])
  const indexedRows = useMemo(() => points
    .map((point) => ({
      key: `${point.quoteDate}-${point.tenor}`,
      quoteDate: point.quoteDate,
      tenor: point.tenor,
      cells: [point.quoteDate, point.tenor, fmtKiborValue(point.bid), fmtKiborValue(point.offer)],
      exportRow: [point.quoteDate, point.tenor, point.bid, point.offer] as ExportCell[],
      searchText: `${point.quoteDate} ${point.tenor}`.toLowerCase(),
    }))
    .sort((a, b) => {
      if (a.quoteDate !== b.quoteDate) return b.quoteDate.localeCompare(a.quoteDate)
      return (tenorRank.get(a.tenor) ?? 99) - (tenorRank.get(b.tenor) ?? 99)
    }), [points, tenorRank])
  const filteredRows = useMemo(() => {
    if (!normalizedFilter) return indexedRows
    return indexedRows.filter((row) => row.searchText.includes(normalizedFilter))
  }, [indexedRows, normalizedFilter])
  const boundedPage = Math.min(page, Math.max(0, Math.ceil(filteredRows.length / pageSize) - 1))
  const pagedRows = useMemo(() => {
    const start = boundedPage * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [boundedPage, filteredRows, pageSize])
  const displayRows = useMemo<DisplayRow[]>(() => pagedRows.map((row) => ({ key: row.key, cells: row.cells })), [pagedRows])
  const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value)
    setPage(0)
  }, [])
  const handlePageChange = useCallback((_: unknown, nextPage: number) => setPage(nextPage), [])
  const handleRowsPerPageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPageSize(Number(event.target.value))
    setPage(0)
  }, [])
  const handleExport = useCallback(() => {
    downloadCsv('kibor.csv', KIBOR_TABLE_HEADERS, filteredRows.map((row) => row.exportRow))
  }, [filteredRows])

  return (
    <RatesTable
      headers={KIBOR_TABLE_HEADERS}
      rows={displayRows}
      totalRows={filteredRows.length}
      page={boundedPage}
      pageSize={pageSize}
      filter={filter}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onExport={handleExport}
    />
  )
})

const RangePresetButton = memo(function RangePresetButton({ label, value, selected, onSelect }: { label: string; value: RateRangePreset; selected: boolean; onSelect: (preset: RateRangePreset) => void }) {
  const handleClick = useCallback(() => onSelect(value), [onSelect, value])

  return (
    <Button
      variant={selected ? 'contained' : 'outlined'}
      size="small"
      onClick={handleClick}
      sx={{
        minWidth: 48,
        borderRadius: 1,
        fontWeight: 850,
        textTransform: 'none',
      }}
    >
      {label}
    </Button>
  )
})

const TenorCheckbox = memo(function TenorCheckbox({ label, checked, onChange, color }: { label: KiborTenor; checked: boolean; onChange: (tenor: KiborTenor) => void; color: string }) {
  const handleChange = useCallback(() => onChange(label), [label, onChange])

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          onChange={handleChange}
          size="small"
          sx={{
            p: 0.35,
            color,
            '&.Mui-checked': { color },
          }}
        />
      }
      label={label}
      sx={{
        m: 0,
        px: 0.85,
        py: 0.55,
        border: '1px solid var(--wc-border)',
        borderRadius: 1,
        backgroundColor: checked ? 'rgba(37,99,235,0.07)' : 'rgba(255,255,255,0.7)',
        '.MuiFormControlLabel-label': { color: 'var(--wc-text-secondary)', fontSize: 12, fontWeight: 850 },
      }}
    />
  )
})

function UsdPkrSection({
  data,
  dateRange,
  rangePreset,
  loading,
  error,
  onRangePresetChange,
}: {
  data: UsdPkrResponseDto
  dateRange: DateRange
  rangePreset: RateRangePreset
  loading: boolean
  error: unknown
  onRangePresetChange: (preset: RateRangePreset) => void
}) {
  const points = useMemo(() => usdPkrObservations(data), [data])
  const latest = data.asOf ?? points[points.length - 1] ?? null
  const handleRangePresetClick = useCallback((preset: RateRangePreset) => {
    onRangePresetChange(preset)
  }, [onRangePresetChange])
  const option = useMemo(() => ({
    animation: false,
    useDirtyRect: true,
    tooltip: { trigger: 'axis', transitionDuration: 0, axisPointer: { animation: false } },
    axisPointer: { animation: false },
    grid: { left: 54, right: 20, top: 32, bottom: 42 },
    xAxis: { type: 'category', data: points.map((point) => point.quoteDate), axisPointer: { animation: false } },
    yAxis: { type: 'value', name: data.unit, scale: true, axisPointer: { animation: false } },
    dataZoom: [{ type: 'inside', throttle: 100 }],
    series: [{
      name: data.label,
      type: 'line',
      animation: false,
      sampling: 'lttb',
      showSymbol: false,
      symbol: 'none',
      connectNulls: false,
      data: points.map((point) => point.rate),
      lineStyle: { width: 1.4, color: '#2563eb' },
      itemStyle: { color: '#2563eb' },
      emphasis: { disabled: true },
    }],
  }), [data.label, data.unit, points])

  return (
    <Stack spacing={2.4}>
      <Box sx={{ ...CARD_SX, p: 2.4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-start' } }}>
          <Box>
            <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>{data.label}</Typography>
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
              {dateRange.startDate} to {dateRange.endDate}{loading ? ' - updating' : ''} · latest quote {fmtDate(latest?.quoteDate)} · effective {fmtDate(latest?.effectiveDate)}
            </Typography>
            {Boolean(error) && <Typography sx={{ color: 'var(--wc-error)', fontSize: 12 }}>Could not refresh the selected range. Showing the previous response.</Typography>}
          </Box>
          <ChartControlGroup label="Date range">
            {RATE_RANGE_PRESETS.map((preset) => (
              <RangePresetButton
                key={preset.value}
                label={preset.label}
                value={preset.value}
                selected={rangePreset === preset.value}
                onSelect={handleRangePresetClick}
              />
            ))}
          </ChartControlGroup>
        </Stack>
        {points.length === 0 ? <EmptyBlock title="No USD/PKR points" detail="The returned USD/PKR history is empty." /> : <ReactECharts option={option} style={USD_CHART_STYLE} opts={CANVAS_OPTS} notMerge={false} lazyUpdate />}
      </Box>
      <UsdPkrRatesTableSection points={points} />
    </Stack>
  )
}

const UsdPkrRatesTableSection = memo(function UsdPkrRatesTableSection({ points }: { points: NonNullable<UsdPkrResponseDto['points']> }) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [filter, setFilter] = useState('')
  const normalizedFilter = filter.trim().toLowerCase()
  const indexedRows = useMemo(() => points
    .map((point) => ({
      key: `${point.quoteDate}-usd-pkr`,
      quoteDate: point.quoteDate,
      cells: [point.quoteDate, fmtNumber(point.rate, 4), point.effectiveDate ?? UNAVAILABLE_VALUE],
      exportRow: [point.quoteDate, point.rate, point.effectiveDate] as ExportCell[],
      searchText: `${point.quoteDate} ${point.effectiveDate ?? ''}`.toLowerCase(),
    }))
    .sort((a, b) => b.quoteDate.localeCompare(a.quoteDate)), [points])
  const filteredRows = useMemo(() => {
    if (!normalizedFilter) return indexedRows
    return indexedRows.filter((row) => row.searchText.includes(normalizedFilter))
  }, [indexedRows, normalizedFilter])
  const boundedPage = Math.min(page, Math.max(0, Math.ceil(filteredRows.length / pageSize) - 1))
  const pagedRows = useMemo(() => {
    const start = boundedPage * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [boundedPage, filteredRows, pageSize])
  const displayRows = useMemo<DisplayRow[]>(() => pagedRows.map((row) => ({ key: row.key, cells: row.cells })), [pagedRows])
  const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value)
    setPage(0)
  }, [])
  const handlePageChange = useCallback((_: unknown, nextPage: number) => setPage(nextPage), [])
  const handleRowsPerPageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPageSize(Number(event.target.value))
    setPage(0)
  }, [])
  const handleExport = useCallback(() => {
    downloadCsv('usd-pkr.csv', USD_PKR_TABLE_HEADERS, filteredRows.map((row) => row.exportRow))
  }, [filteredRows])

  return (
    <RatesTable
      headers={USD_PKR_TABLE_HEADERS}
      rows={displayRows}
      totalRows={filteredRows.length}
      page={boundedPage}
      pageSize={pageSize}
      filter={filter}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onExport={handleExport}
    />
  )
})

const RatesTable = memo(function RatesTable({
  headers,
  rows,
  totalRows,
  page,
  pageSize,
  filter,
  onFilterChange,
  onPageChange,
  onRowsPerPageChange,
  onExport,
}: {
  headers: readonly string[]
  rows: readonly DisplayRow[]
  totalRows: number
  page: number
  pageSize: number
  filter: string
  onFilterChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPageChange: (_: unknown, nextPage: number) => void
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
}) {
  return (
    <Box sx={{ ...CARD_SX, overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ p: 2, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, borderBottom: '1px solid var(--wc-border)' }}>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>Table view</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
          <TextField
            value={filter}
            onChange={onFilterChange}
            placeholder="Filter date or tenor"
            size="small"
            sx={{ width: { xs: '100%', sm: 220 } }}
            slotProps={{ htmlInput: { 'aria-label': 'Filter table rows' } }}
          />
          <Button startIcon={<FileDownloadOutlinedIcon />} onClick={onExport}>CSV</Button>
        </Stack>
      </Stack>
      <TableContainer sx={{ overflowX: 'auto', maxHeight: 560 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 720 }}>
          <TableHead><TableRow>{headers.map((header) => <TableCell key={header} sx={{ fontWeight: 900 }}>{header}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                {row.cells.map((cell, cellIndex) => <TableCell key={`${row.key}-${cellIndex}`}>{cell}</TableCell>)}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={headers.length} align="center" sx={{ py: 5, color: 'var(--wc-text-secondary)' }}>
                  No rows
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        rowsPerPage={pageSize}
        rowsPerPageOptions={RATE_TABLE_PAGE_SIZE_OPTIONS}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        sx={{
          borderTop: '1px solid var(--wc-border)',
          '& .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiInputBase-root': {
            color: 'var(--wc-text-secondary)',
            fontSize: 12,
          },
        }}
      />
    </Box>
  )
})
