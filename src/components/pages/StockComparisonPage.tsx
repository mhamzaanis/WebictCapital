import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { comparisonAnalytics, normalizedSeries } from '../../lib/api/analytics'
import { fetchTickerComparison } from '../../lib/api/tickers'
import type { TickerComparisonResponse } from '../../lib/api/types'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../markets/StateBlocks'
import { CARD_SX, DATA_FONT, fmtCompact, fmtDate, fmtNumber, fmtPct } from '../markets/marketUtils'

function useComparison(a: string, b: string, from: string, to: string) {
  const [data, setData] = useState<TickerComparisonResponse | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetchTickerComparison({ symbols: [a, b], from, to, financialYears: 5 }, controller.signal)
      .then(setData)
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [a, b, from, to])

  return { data, error, loading }
}

function todayMinusMonths(months: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString().slice(0, 10)
}

export function StockComparisonPage() {
  const [params, setParams] = useSearchParams()
  const a = (params.get('a') ?? 'MEBL').toUpperCase()
  const b = (params.get('b') ?? 'HBL').toUpperCase()
  const from = params.get('from') ?? todayMinusMonths(12)
  const to = params.get('to') ?? new Date().toISOString().slice(0, 10)
  const { data, error, loading } = useComparison(a, b, from, to)

  const first = data?.items[0] ?? null
  const second = data?.items[1] ?? null
  const analytics = useMemo(() => first && second ? comparisonAnalytics(first.quotes, second.quotes) : null, [first, second])
  const normalized = useMemo(() => first && second ? [normalizedSeries(first.quotes), normalizedSeries(second.quotes)] : [[], []], [first, second])
  const option = {
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 54, right: 24, top: 44, bottom: 64 },
    xAxis: { type: 'category', data: normalized[0].map((point) => point.date) },
    yAxis: { type: 'value', name: 'Start = 100' },
    dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 8 }],
    series: [
      { name: first?.symbol ?? a, type: 'line', showSymbol: false, connectNulls: false, data: normalized[0].map((point) => point.value) },
      { name: second?.symbol ?? b, type: 'line', showSymbol: false, connectNulls: false, data: normalized[1].map((point) => point.value) },
    ],
  }

  function update(next: Record<string, string>) {
    setParams({ a, b, from, to, ...next }, { replace: true })
  }

  return (
    <MarketShell title="Stock Comparison" subtitle="Exactly two-symbol comparison from the API. Analytics use common actual trade dates and never forward-fill missing observations.">
      <Stack spacing={2.4}>
        <Box sx={{ ...CARD_SX, p: 2.4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr 160px 160px' }, gap: 1.4, alignItems: 'center' }}>
            <TextField label="Symbol A" value={a} onChange={(event) => update({ a: event.target.value.toUpperCase() })} />
            <Button aria-label="Swap symbols" onClick={() => update({ a: b, b: a })}><SwapHorizIcon /></Button>
            <TextField label="Symbol B" value={b} onChange={(event) => update({ b: event.target.value.toUpperCase() })} />
            <TextField label="From" type="date" value={from} onChange={(event) => update({ from: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="To" type="date" value={to} onChange={(event) => update({ to: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </Box>

        {loading && <LoadingBlock />}
        {Boolean(error) && <ErrorBlock error={error} />}
        {!loading && !error && (!first || !second) && <EmptyBlock title="Comparison unavailable" detail="The API did not return exactly two comparison items." />}
        {first && second && analytics && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              {[first, second].map((item) => (
                <Box key={item.symbol} sx={{ ...CARD_SX, p: 2.4 }}>
                  <Typography sx={{ color: 'var(--wc-primary)', fontWeight: 900 }}>{item.symbol}</Typography>
                  <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 20, fontWeight: 850 }}>{item.companyName ?? item.symbol}</Typography>
                  <Typography sx={{ mt: 1, color: 'var(--wc-text-secondary)', fontFamily: DATA_FONT }}>
                    Close {fmtNumber(item.asOfQuote?.close)} - {fmtDate(item.asOfQuote?.tradeDate)} - shares traded {fmtCompact(item.asOfQuote?.turnover)}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ ...CARD_SX, p: 2.4 }}>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850, mb: 1 }}>Normalized raw performance</Typography>
              <ReactECharts option={option} style={{ height: 430, width: '100%' }} opts={{ renderer: 'svg' }} />
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
                Descriptive market analytics based on raw historical observations; not financial advice.
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(6, 1fr)' }, gap: 1.4 }}>
              <Metric label="Common obs." value={String(analytics.commonObservationCount)} />
              <Metric label={`${first.symbol} return`} value={fmtPct(analytics.returnA)} />
              <Metric label={`${second.symbol} return`} value={fmtPct(analytics.returnB)} />
              <Metric label="Relative diff." value={fmtPct(analytics.relativePerformancePct)} />
              <Metric label="Correlation" value={analytics.correlation == null ? 'Insufficient common history' : analytics.correlation.toFixed(3)} />
              <Metric label="Shared range" value={data?.requestedRange ? `${data.requestedRange.from} to ${data.requestedRange.to}` : '-'} />
            </Box>
          </>
        )}
      </Stack>
    </MarketShell>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Box sx={{ ...CARD_SX, p: 1.8 }}><Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase' }}>{label}</Typography><Typography sx={{ mt: 0.7, color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: 16, fontWeight: 850 }}>{value}</Typography></Box>
}
