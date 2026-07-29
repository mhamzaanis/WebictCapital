import AnalyticsIcon from '@mui/icons-material/Analytics'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import BubbleChartIcon from '@mui/icons-material/BubbleChart'
import GridViewIcon from '@mui/icons-material/GridView'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import {
  Box,
  Button,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLatestMarketSummary } from '../../lib/api/market'
import type { MarketSummaryTickersResponse, MarketTickerDto } from '../../lib/api/types'
import { StockHeatmap } from '../market/StockHeatmap'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock, ErrorBlock } from '../markets/StateBlocks'
import {
  BODY_FONT,
  CARD_SX,
  DATA_FONT,
  changePctFromQuote,
  estimatedValue,
  fmtCompact,
  fmtDate,
  fmtNumber,
  fmtPct,
  fmtSigned,
  jsonStringList,
  toneColor,
} from '../markets/marketUtils'

const INDEX_ORDER = ['KSE100', 'KSE30', 'ALLSHR', 'KMI30', 'KMIALLSHR', 'KSE100PR']

type RankedTicker = MarketTickerDto & {
  changePct: number | null
  estimatedTradedValue: number | null
}

function rankTickers(tickers: MarketTickerDto[]): RankedTicker[] {
  return tickers.map((ticker) => ({
    ...ticker,
    changePct: changePctFromQuote(ticker),
    estimatedTradedValue: estimatedValue(ticker),
  }))
}

function useLatestMarket() {
  const [data, setData] = useState<MarketSummaryTickersResponse | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetchLatestMarketSummary(controller.signal)
      .then(setData)
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return { data, error, loading }
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: number | null }) {
  return (
    <Box sx={{ ...CARD_SX, p: 2.2 }}>
      <Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.8, color: tone == null ? 'var(--wc-text-primary)' : toneColor(tone), fontFamily: DATA_FONT, fontSize: 25, fontWeight: 850, lineHeight: 1 }}>
        {value}
      </Typography>
      {detail && <Typography sx={{ mt: 0.8, color: 'var(--wc-text-secondary)', fontSize: 12.5 }}>{detail}</Typography>}
    </Box>
  )
}

function IndexCards({ market }: { market: MarketSummaryTickersResponse }) {
  const indices = [...(market.indexSnapshot?.indices ?? [])].sort(
    (a, b) => INDEX_ORDER.indexOf(a.code) - INDEX_ORDER.indexOf(b.code),
  )
  if (indices.length === 0) return <EmptyBlock title="Index snapshot unavailable" />

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
      {indices.map((index) => (
        <Box key={index.code} sx={{ ...CARD_SX, p: 2.2 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
            <Typography sx={{ color: 'var(--wc-primary)', fontWeight: 900 }}>{index.code}</Typography>
            {/* <Chip size="small" label={fmtInstant(index.asOf) === '-' ? fmtDate(market.tradeDate) : fmtInstant(index.asOf)} sx={{ fontSize: 10, fontFamily: DATA_FONT }} /> */}
          </Stack>
          <Typography sx={{ mt: 1.4, color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: 30, fontWeight: 850 }}>
            {fmtNumber(index.close)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.8, color: toneColor(index.change) }}>
            {index.change != null && index.change > 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
            <Typography sx={{ fontFamily: DATA_FONT, fontWeight: 800 }}>{fmtSigned(index.change)} ({fmtPct(index.changePct)})</Typography>
          </Stack>
          <Box sx={{ mt: 1.8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            <MetricMini label="High" value={fmtNumber(index.high)} />
            <MetricMini label="Low" value={fmtNumber(index.low)} />
            <MetricMini label="Volume" value={fmtCompact(index.volume)} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{label}</Typography>
      <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: 12.5, fontWeight: 800 }}>{value}</Typography>
    </Box>
  )
}

function BreadthPanel({ market }: { market: MarketSummaryTickersResponse }) {
  const advances = market.summary.advances ?? 0
  const declines = market.summary.declines ?? 0
  const unchanged = market.summary.unchanged ?? 0
  const total = advances + declines + unchanged
  const breadthPct = total > 0 ? (advances / total) * 100 : null
  const option = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['55%', '78%'],
      avoidLabelOverlap: true,
      label: { color: '#243247' },
      data: [
        { value: advances, name: 'Advances', itemStyle: { color: '#147a4d' } },
        { value: declines, name: 'Declines', itemStyle: { color: '#c53346' } },
        { value: unchanged, name: 'Unchanged', itemStyle: { color: '#7b8da8' } },
      ],
    }],
  }

  return (
    <Box sx={{ ...CARD_SX, p: 2.4, minHeight: 335 }}>
      <PanelTitle icon={<AnalyticsIcon />} title="Market Breadth" detail="Advances, declines, and unchanged observations from the same trade date." />
      {total === 0 ? <EmptyBlock title="Breadth unavailable" detail="The API returned no breadth counts." /> : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 2, alignItems: 'center' }}>
          <ReactECharts option={option} style={{ height: 220, width: '100%' }} opts={{ renderer: 'svg' }} />
          <Stack spacing={1.2}>
            <MetricCard label="Breadth %" value={fmtPct(breadthPct, false)} detail={`${total.toLocaleString('en-PK')} observations`} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              <MetricMini label="Adv" value={advances.toLocaleString('en-PK')} />
              <MetricMini label="Dec" value={declines.toLocaleString('en-PK')} />
              <MetricMini label="Unch" value={unchanged.toLocaleString('en-PK')} />
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

function PanelTitle({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 2 }}>
      <Box sx={{ color: 'var(--wc-primary)', display: 'flex', '& svg': { fontSize: 20 } }}>{icon}</Box>
      <Box>
        <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>{title}</Typography>
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12.5, mt: 0.3 }}>{detail}</Typography>
      </Box>
    </Stack>
  )
}

function MoversPanel({ ranked }: { ranked: RankedTicker[] }) {
  const gainers = ranked.filter((ticker) => ticker.changePct != null && ticker.changePct > 0).sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0)).slice(0, 6)
  const losers = ranked.filter((ticker) => ticker.changePct != null && ticker.changePct < 0).sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0)).slice(0, 6)
  const active = ranked.filter((ticker) => ticker.turnover != null).sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0)).slice(0, 6)
  const value = ranked.filter((ticker) => ticker.estimatedTradedValue != null).sort((a, b) => (b.estimatedTradedValue ?? 0) - (a.estimatedTradedValue ?? 0)).slice(0, 6)

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
      <LeaderList title="Top Gainers" rows={gainers} value={(row) => fmtPct(row.changePct)} />
      <LeaderList title="Top Losers" rows={losers} value={(row) => fmtPct(row.changePct)} />
      <LeaderList title="Most Active" rows={active} value={(row) => fmtCompact(row.turnover)} detail="Shares traded" />
      <LeaderList title="Estimated Value" rows={value} value={(row) => fmtCompact(row.estimatedTradedValue)} detail="close x shares traded" />
    </Box>
  )
}

function LeaderList({ title, rows, value, detail }: { title: string; rows: RankedTicker[]; value: (row: RankedTicker) => string; detail?: string }) {
  return (
    <Box sx={{ ...CARD_SX, p: 2.2, minWidth: 0 }}>
      <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 850 }}>{title}</Typography>
      {detail && <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5, mt: 0.2 }}>{detail}</Typography>}
      <Stack spacing={1.15} sx={{ mt: 1.6 }}>
        {rows.map((row) => (
          <Button key={`${title}-${row.symbol}`} component={Link} to={`/stocks/${row.symbol}`} sx={{ justifyContent: 'space-between', textTransform: 'none', px: 0, color: 'inherit' }}>
            <Box sx={{ minWidth: 0, textAlign: 'left' }}>
              <Typography sx={{ color: 'var(--wc-primary)', fontWeight: 900, fontSize: 13 }}>{row.symbol}</Typography>
              <Typography noWrap sx={{ color: 'var(--wc-text-secondary)', fontSize: 11.5, maxWidth: 150 }}>{row.companyName ?? row.symbol}</Typography>
            </Box>
            <Typography sx={{ color: toneColor(row.change), fontFamily: DATA_FONT, fontWeight: 850 }}>{value(row)}</Typography>
          </Button>
        ))}
      </Stack>
    </Box>
  )
}

function SectorPanel({ ranked }: { ranked: RankedTicker[] }) {
  const sectorRows = Object.values(ranked.reduce<Record<string, { sector: string; count: number; advances: number; declines: number; unchanged: number; shares: number; estimated: number }>>((acc, ticker) => {
    const sector = ticker.section || 'Unclassified'
    acc[sector] ??= { sector, count: 0, advances: 0, declines: 0, unchanged: 0, shares: 0, estimated: 0 }
    acc[sector].count += 1
    if (ticker.change == null || ticker.change === 0) acc[sector].unchanged += 1
    else if (ticker.change > 0) acc[sector].advances += 1
    else acc[sector].declines += 1
    acc[sector].shares += ticker.turnover ?? 0
    acc[sector].estimated += ticker.estimatedTradedValue ?? 0
    return acc
  }, {})).sort((a, b) => b.estimated - a.estimated).slice(0, 12)

  return (
    <Box sx={{ ...CARD_SX, p: 2.4 }}>
      <PanelTitle icon={<BubbleChartIcon />} title="Sector Analytics" detail="Shares traded are summed as share quantities; estimated traded value is shown only when close and turnover are both valid." />
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 760 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) repeat(5,110px)', gap: 1.4, pb: 1, borderBottom: '1px solid var(--wc-border)' }}>
            {['Sector', 'Issues', 'Adv/Dec', 'Shares', 'Est. value', 'Unchanged'].map((label) => <Head key={label}>{label}</Head>)}
          </Box>
          {sectorRows.map((row) => (
            <Box key={row.sector} sx={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) repeat(5,110px)', gap: 1.4, py: 1.2, borderBottom: '1px solid var(--wc-divider-soft)' }}>
              <Cell strong>{row.sector}</Cell>
              <Cell>{row.count}</Cell>
              <Cell>{row.advances}/{row.declines}</Cell>
              <Cell>{fmtCompact(row.shares)}</Cell>
              <Cell>{fmtCompact(row.estimated)}</Cell>
              <Cell>{row.unchanged}</Cell>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function Head({ children }: { children: React.ReactNode }) {
  return <Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase' }}>{children}</Typography>
}

function Cell({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <Typography sx={{ color: strong ? 'var(--wc-text-primary)' : 'var(--wc-text-secondary)', fontFamily: strong ? BODY_FONT : DATA_FONT, fontSize: 12.5, fontWeight: strong ? 800 : 700 }}>{children}</Typography>
}

// ─── Skeleton Primitives ─────────────────────────────────────────────────────

function SkeletonCard({ height = 80, sx }: { height?: number; sx?: object }) {
  return (
    <Box sx={{ ...CARD_SX, p: 2.2, ...sx }}>
      <Skeleton variant="text" width="45%" height={14} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="65%" height={32} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="40%" height={14} />
    </Box>
  )
}

function OverviewPageSkeleton() {
  return (
    <Stack spacing={3}>
      {/* Index Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} sx={{ ...CARD_SX, p: 2.2 }}>
            <Skeleton variant="text" width="40%" height={14} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="70%" height={36} sx={{ mb: 0.8 }} />
            <Skeleton variant="text" width="55%" height={14} sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              <Skeleton variant="rounded" height={32} />
              <Skeleton variant="rounded" height={32} />
              <Skeleton variant="rounded" height={32} />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Breadth + Commentary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 2 }}>
        <Box sx={{ ...CARD_SX, p: 2.4, minHeight: 335 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={22} height={22} />
            <Skeleton variant="text" width={140} height={18} />
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 2, alignItems: 'center' }}>
            <Skeleton variant="circular" width={180} height={180} sx={{ mx: 'auto' }} />
            <Stack spacing={1.4}>
              <SkeletonCard height={80} />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                <Skeleton variant="rounded" height={36} />
                <Skeleton variant="rounded" height={36} />
                <Skeleton variant="rounded" height={36} />
              </Box>
            </Stack>
          </Box>
        </Box>
        <Box sx={{ ...CARD_SX, p: 2.4 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={22} height={22} />
            <Skeleton variant="text" width={160} height={18} />
          </Stack>
          <Stack spacing={1.2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="text" width={`${75 + Math.sin(i) * 20}%`} height={16} />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Movers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {Array.from({ length: 4 }).map((_, col) => (
          <Box key={col} sx={{ ...CARD_SX, p: 2.2 }}>
            <Skeleton variant="text" width="60%" height={18} sx={{ mb: 1.4 }} />
            <Stack spacing={1.15}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Skeleton variant="text" width={55} height={14} />
                    <Skeleton variant="text" width={90} height={12} />
                  </Box>
                  <Skeleton variant="text" width={50} height={14} />
                </Stack>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>

      {/* Heatmap */}
      <Box sx={{ ...CARD_SX, p: 2.4, minHeight: 420 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={22} height={22} />
          <Skeleton variant="text" width={150} height={18} />
        </Stack>
        <Skeleton variant="rounded" width="100%" height={340} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Sector Table */}
      <Box sx={{ ...CARD_SX, p: 2.4 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={22} height={22} />
          <Skeleton variant="text" width={130} height={18} />
        </Stack>
        <Stack spacing={1.2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) repeat(5,110px)', gap: 1.4, py: 1 }}>
              <Skeleton variant="text" height={14} width="80%" />
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} variant="text" height={14} width="60%" />
              ))}
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function MarketsOverviewPage() {
  const { data, error, loading } = useLatestMarket()
  const [search, setSearch] = useState('')

  const ranked = useMemo(() => rankTickers(data?.tickers ?? []), [data])
  const filtered = useMemo(() => {
    const query = search.trim().toUpperCase()
    if (!query) return ranked
    return ranked.filter((ticker) => ticker.symbol.includes(query) || (ticker.companyName ?? '').toUpperCase().includes(query))
  }, [ranked, search])

  const heatmapData = useMemo(
    () =>
      ranked
        .filter((t) => t.turnover != null && t.turnover > 0)
        .map((t) => ({
          label: t.symbol,
          value: t.turnover ?? 1,
          company: t.companyName ?? t.symbol,
          changePct: t.changePct ?? undefined,
        })),
    [ranked],
  )

  if (loading)
    return (
      <MarketShell title="Pakistan Stock Exchange">
        <OverviewPageSkeleton />
      </MarketShell>
    )
  if (error) return <MarketShell title="Pakistan Stock Exchange"><ErrorBlock error={error} /></MarketShell>
  if (!data) return <MarketShell title="Pakistan Stock Exchange"><EmptyBlock title="No market data" detail="The API returned no latest market summary." /></MarketShell>

  const keyPoints = jsonStringList(data.aiSummary?.keyPoints)

  return (
    <MarketShell title="Pakistan Stock Exchange">
      <Stack spacing={3}>
        <IndexCards market={data} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 2 }}>
          <BreadthPanel market={data} />
          <Box sx={{ ...CARD_SX, p: 2.4 }}>
            <PanelTitle icon={<AutoAwesomeOutlinedIcon />} title="Market commentary" detail={`Source trade date ${fmtDate(data.aiSummary?.tradeDate ?? data.tradeDate)}`} />
            {data.aiSummary?.summary ? (
              <Stack spacing={1.4}>
                <Typography sx={{ color: 'var(--wc-text-primary)', lineHeight: 1.7 }}>{data.aiSummary.summary}</Typography>
                {keyPoints.map((point) => <Typography key={point} sx={{ color: 'var(--wc-text-secondary)', fontSize: 13 }}>- {point}</Typography>)}
              </Stack>
            ) : <EmptyBlock title="Commentary unavailable" detail="Market facts remain visible because AI commentary is not authoritative." />}
          </Box>
        </Box>

        <MoversPanel ranked={filtered} />

        <StockHeatmap
          heading="Market Heatmap"
          detail="Treemap sized by share turnover, coloured by price move. Hover a tile for full details."
          icon={<GridViewIcon />}
          height={380}
          data={heatmapData}
          emptyLabel="Heatmap data is unavailable for this session."
        />

        <SectorPanel ranked={filtered} />
      </Stack>
    </MarketShell>
  )
}
