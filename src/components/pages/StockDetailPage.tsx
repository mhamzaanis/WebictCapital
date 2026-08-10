import AddchartIcon from '@mui/icons-material/Addchart'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { snapshotAnalytics } from '../../lib/api/analytics'
import { fetchTickerDetail } from '../../lib/api/tickers'
import type { TickerDetailResponse, TickerQuoteDto } from '../../lib/api/types'
import { addSymbolToWatchlist } from '../../lib/platformWatchlist'
import { useAuth } from '../../context/AuthContext'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../markets/StateBlocks'
import { CARD_SX, DATA_FONT, fmtCompact, fmtDate, fmtNumber, fmtPct, fmtSigned, toneColor } from '../markets/marketUtils'
import Decimal from 'decimal.js'
import { projectNumeric } from '../../lib/numericPresentation'
import { buildTickerSeo } from '../../lib/seo'
import { PageMetadata } from '../../app/AppLayout'

const RANGES = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'Max'] as const
type Range = typeof RANGES[number]

function rangeFromTo(range: Range): string | undefined {
  if (range === 'Max') return undefined
  const months: Record<Exclude<Range, 'Max'>, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, '3Y': 36, '5Y': 60 }
  const date = new Date()
  date.setMonth(date.getMonth() - months[range])
  return date.toISOString().slice(0, 10)
}

function useTicker(symbol: string, range: Range) {
  const requestKey = `${symbol}|${range}`
  const [state, setState] = useState<{
    key: string
    data: TickerDetailResponse | null
    error: unknown
    loading: boolean
  }>({ key: requestKey, data: null, error: null, loading: true })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    fetchTickerDetail({
      symbol,
      from: rangeFromTo(range),
      include: ['quotes', 'profile', 'equity', 'valuation', 'financials', 'ratios', 'announcements', 'payouts', 'reports', 'technicals'],
      financialYears: 5,
      eventLimit: 30,
    }, controller.signal)
      .then((response) => {
        if (active) setState({ key: requestKey, data: response, error: null, loading: false })
      })
      .catch((caught) => {
        if (active && !(caught instanceof DOMException && caught.name === 'AbortError')) {
          setState((current) => ({ key: requestKey, data: current.data, error: caught, loading: false }))
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [range, requestKey, symbol])

  return {
    data: state.data,
    error: state.key === requestKey ? state.error : null,
    loading: state.key !== requestKey || state.loading,
  }
}

function hasFiniteValue(value: Decimal | null | undefined): value is Decimal {
  return value != null && value.isFinite()
}

function chartValue(value: Decimal | bigint | null | undefined, label: string): number | null {
  return value == null ? null : projectNumeric(value, label)
}

function priceChartOption(quotes: TickerQuoteDto[], technicals: TickerDetailResponse['technicals'], overlays: { sma20: boolean; sma50: boolean; sma200: boolean; rsi: boolean }) {
  const hasCompleteOhlc = quotes.length > 0 && quotes.every((quote) => (
    hasFiniteValue(quote.open) &&
    hasFiniteValue(quote.high) &&
    hasFiniteValue(quote.low) &&
    hasFiniteValue(quote.close)
  ))
  const techByDate = new Map((technicals?.points ?? []).map((point) => [point.tradeDate, point]))
  const dates = quotes.map((quote) => quote.tradeDate)
  const series: Record<string, unknown>[] = [{
    name: hasCompleteOhlc ? 'Raw OHLC' : 'Raw close',
    type: hasCompleteOhlc ? 'candlestick' : 'line',
    connectNulls: false,
    data: hasCompleteOhlc
      ? quotes.map((quote) => [
          chartValue(quote.open, 'open'),
          chartValue(quote.close, 'close'),
          chartValue(quote.low, 'low'),
          chartValue(quote.high, 'high'),
        ])
      : quotes.map((quote) => chartValue(quote.close, 'close')),
  }]
  if (overlays.sma20) series.push({ name: 'SMA 20', type: 'line', connectNulls: false, showSymbol: false, data: dates.map((date) => chartValue(techByDate.get(date)?.sma20, 'SMA20')) })
  if (overlays.sma50) series.push({ name: 'SMA 50', type: 'line', connectNulls: false, showSymbol: false, data: dates.map((date) => chartValue(techByDate.get(date)?.sma50, 'SMA50')) })
  if (overlays.sma200) series.push({ name: 'SMA 200', type: 'line', connectNulls: false, showSymbol: false, data: dates.map((date) => chartValue(techByDate.get(date)?.sma200, 'SMA200')) })
  series.push({ name: 'Shares traded', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: quotes.map((quote) => chartValue(quote.turnover, 'turnover')), itemStyle: { color: '#7b8da8' } })
  if (overlays.rsi) series.push({ name: 'RSI 14', type: 'line', xAxisIndex: 2, yAxisIndex: 2, connectNulls: false, showSymbol: false, data: dates.map((date) => chartValue(techByDate.get(date)?.rsi14, 'RSI14')) })

  return {
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: [{ left: 56, right: 56, top: 44, height: '48%' }, { left: 56, right: 56, top: '62%', height: '14%' }, { left: 56, right: 56, top: '81%', height: '12%' }],
    xAxis: [{ type: 'category', data: dates }, { type: 'category', data: dates, gridIndex: 1 }, { type: 'category', data: dates, gridIndex: 2 }],
    yAxis: [{ scale: true }, { scale: true, gridIndex: 1, name: 'Shares traded' }, { scale: true, gridIndex: 2, min: 0, max: 100 }],
    dataZoom: [{ type: 'inside', xAxisIndex: [0, 1, 2] }, { type: 'slider', xAxisIndex: [0, 1, 2], bottom: 4 }],
    series,
  }
}

export function StockDetailPage() {
  const symbol = (useParams().symbol ?? '').toUpperCase()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const range = (params.get('range') as Range | null) ?? '1Y'
  const { data, error, loading } = useTicker(symbol, RANGES.includes(range) ? range : '1Y')
  const [tab, setTab] = useState('profile')
  const [overlays, setOverlays] = useState({ sma20: true, sma50: false, sma200: false, rsi: true })
  const analytics = useMemo(() => snapshotAnalytics(data?.quotes ?? []), [data])
  const tickerSeo = useMemo(
    () => buildTickerSeo(data?.symbol ?? symbol, data?.companyName),
    [data?.companyName, data?.symbol, symbol],
  )

  if (loading && !data) return <><PageMetadata seo={tickerSeo} /><MarketShell title={symbol} subtitle="Loading ticker detail from the WebICTCapital API."><LoadingBlock /></MarketShell></>
  if (error && !data) return <><PageMetadata seo={tickerSeo} /><MarketShell title={symbol} subtitle="Ticker detail"><ErrorBlock error={error} /></MarketShell></>
  if (!data) return <><PageMetadata seo={tickerSeo} /><MarketShell title={symbol} subtitle="Ticker detail"><EmptyBlock title="Ticker not found" detail="The API returned no ticker detail." /></MarketShell></>

  const asOf = data.asOfQuote
  const option = priceChartOption(data.quotes, data.technicals, overlays)

  return (
    <>
      <PageMetadata seo={tickerSeo} />
      <MarketShell title={`${data.symbol} - ${data.companyName ?? data.symbol}`} subtitle="Full ticker detail from API quotes, company facts, raw technical indicators, and persisted event data.">
      <Stack spacing={2.4}>
        <Box sx={{ ...CARD_SX, p: 2.4 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ color: 'var(--wc-primary)', fontWeight: 900 }}>{data.symbol}</Typography>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: { xs: 36, md: 52 }, fontWeight: 900 }}>{fmtNumber(asOf?.close)}</Typography>
              <Typography sx={{ color: toneColor(asOf?.change), fontFamily: DATA_FONT, fontWeight: 850 }}>{fmtSigned(asOf?.change)} - {fmtDate(asOf?.tradeDate)}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.4, flexWrap: 'wrap', rowGap: 1 }}>
                <Chip label={data.profile?.sector ?? 'Sector unavailable'} />
                <Chip label={`Available ${data.availableQuoteRange ? `${data.availableQuoteRange.from} to ${data.availableQuoteRange.to}` : '-'}`} />
                <Chip label="Raw data" />
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Button startIcon={<StarBorderIcon />} onClick={() => user ? void addSymbolToWatchlist(data.symbol) : undefined} sx={{ border: '1px solid var(--wc-border)' }}>Watch</Button>
              <Button component={Link} to={`/data/compare?a=${data.symbol}&b=HBL`} startIcon={<AddchartIcon />} sx={{ border: '1px solid var(--wc-border)' }}>Compare</Button>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ ...CARD_SX, p: 2.4 }}>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1, mb: 2, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {RANGES.map((item) => <Button key={item} variant={range === item ? 'contained' : 'outlined'} onClick={() => setParams({ range: item })}>{item}</Button>)}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {(['sma20', 'sma50', 'sma200', 'rsi'] as const).map((key) => (
                <FormControlLabel key={key} control={<Switch size="small" checked={overlays[key]} onChange={(event) => setOverlays((current) => ({ ...current, [key]: event.target.checked }))} />} label={key.toUpperCase()} />
              ))}
            </Stack>
          </Stack>
          <ReactECharts option={option} style={{ height: 560, width: '100%' }} opts={{ renderer: 'svg' }} />
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12, mt: 1 }}>
            Technical metadata: price basis raw; calculation version ta_raw_v1. Raw prices are not adjusted for splits, rights, bonus shares, or dividends. ATR is quality-sensitive where source high/low values are unusable. Missing warm-up values remain null.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          <Metric label="Period return" value={fmtPct(analytics.periodReturnPct)} />
          <Metric label="20-session ann. vol" value={fmtPct(analytics.annualizedVolatilityPct, false)} />
          <Metric label="Max drawdown" value={fmtPct(analytics.maxDrawdownPct)} />
          <Metric label="Avg shares traded" value={fmtCompact(analytics.averageSharesTraded)} />
          <Metric label="Est. avg traded value" value={fmtCompact(analytics.estimatedAverageTradedValue)} />
        </Box>

        <Box sx={{ ...CARD_SX }}>
          <Tabs value={tab} onChange={(_, value: string) => setTab(value)} variant="scrollable" scrollButtons="auto">
            <Tab value="profile" label="Overview/Profile" />
            <Tab value="equity" label="Equity and valuation" />
            <Tab value="financials" label="Financial statements" />
            <Tab value="ratios" label="Ratios" />
            <Tab value="events" label="Announcements and payouts" />
            <Tab value="reports" label="Financial reports" />
            <Tab value="technicals" label="Technicals" />
          </Tabs>
          <Box sx={{ p: 2.4 }}>
            {tab === 'profile' && <Typography sx={{ color: 'var(--wc-text-secondary)', lineHeight: 1.7 }}>{data.profile?.businessDescription ?? 'Profile data unavailable.'}</Typography>}
            {tab === 'equity' && <SimpleRows rows={[['Shares', fmtCompact(data.equity?.shares)], ['Free float shares', fmtCompact(data.equity?.freeFloatShares)], ['Free float %', fmtPct(data.equity?.freeFloatPct, false)], ['Market cap', fmtCompact(data.valuation?.marketCap)], ['P/E TTM', fmtNumber(data.valuation?.peRatioTtm)], ['Valuation as of', fmtDate(data.valuation?.asOf)]]} />}
            {tab === 'financials' && <FinancialRows rows={data.financialStatements.map((row) => [String(row.fiscalYear), row.period, fmtCompact(row.sales), fmtCompact(row.profitAfterTax), fmtNumber(row.eps), row.isCurrent == null ? '-' : String(row.isCurrent)])} headers={['Year', 'Period', 'Sales', 'PAT', 'EPS', 'Current']} />}
            {tab === 'ratios' && <FinancialRows rows={data.ratios.map((row) => [String(row.fiscalYear), JSON.stringify(row.values), row.isCurrent == null ? '-' : String(row.isCurrent)])} headers={['Year', 'Values', 'Current']} />}
            {tab === 'events' && <FinancialRows rows={[...data.announcements.map((row) => [row.announcementDate ?? '-', row.title, row.category ?? '-']), ...data.payouts.map((row) => [row.periodEnded ?? row.announcedAt, row.resultType ?? 'Payout', row.details ?? '-'])]} headers={['Date', 'Title/type', 'Detail']} />}
            {tab === 'reports' && <FinancialRows rows={data.financialReports.map((row) => [row.postingDate ?? '-', row.reportType, row.periodEndedRaw, row.url ?? '-'])} headers={['Posting date', 'Type', 'Period', 'URL']} />}
            {tab === 'technicals' && <FinancialRows rows={(data.technicals?.points ?? []).slice(-30).reverse().map((row) => [row.tradeDate, fmtNumber(row.sma20), fmtNumber(row.sma50), fmtNumber(row.rsi14), fmtNumber(row.macd), fmtNumber(row.atr14)])} headers={['Date', 'SMA20', 'SMA50', 'RSI14', 'MACD', 'ATR14']} />}
          </Box>
        </Box>
      </Stack>
      </MarketShell>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Box sx={{ ...CARD_SX, p: 2 }}><Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase' }}>{label}</Typography><Typography sx={{ mt: 0.7, color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: 19, fontWeight: 850 }}>{value === '-' ? 'Insufficient data' : value}</Typography></Box>
}

function SimpleRows({ rows }: { rows: string[][] }) {
  return <FinancialRows headers={['Field', 'Value']} rows={rows} />
}

function FinancialRows({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return <EmptyBlock title="Data unavailable" detail="The requested section was empty." />
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead><TableRow>{headers.map((header) => <TableCell key={header} sx={{ fontWeight: 900 }}>{header}</TableCell>)}</TableRow></TableHead>
        <TableBody>{rows.map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={`${index}-${cellIndex}`}>{cell}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </TableContainer>
  )
}
