import { Box, Stack } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { fetchLatestMarketSummary } from '../../lib/api/market'
import type { MarketSummaryTickersResponse } from '../../lib/api/types'
import {
  formatPktTime,
  formatTradeDate,
  latestIndexTimestamp,
  primaryIndex,
  rankTickers,
} from '../../lib/marketOverview'
import { MarketShell } from '../markets/MarketShell'
import { EmptyBlock, ErrorBlock } from '../markets/StateBlocks'
import { MarketOverviewHeatmap } from './markets-overview/MarketOverviewHeatmap'
import { MarketPageHeader } from './markets-overview/MarketPageHeader'
import { MoversTable } from './markets-overview/MoversTable'
import { OverviewPageSkeleton } from './markets-overview/OverviewPageSkeleton'
import { PrimaryMarketClose } from './markets-overview/PrimaryMarketClose'
import { SecondaryIndexTable } from './markets-overview/SecondaryIndexTable'
import { SectorPerformanceTable } from './markets-overview/SectorPerformanceTable'

function useLatestMarket(retryKey: number) {
  const [data, setData] = useState<MarketSummaryTickersResponse | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    fetchLatestMarketSummary(controller.signal)
      .then((response) => {
        if (!active) return
        setData(response)
        setError(null)
      })
      .catch((caught) => {
        if (!active) return
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError(caught)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [retryKey])

  return { data, error, loading }
}

export function MarketsOverviewPage() {
  const [retryKey, setRetryKey] = useState(0)
  const { data, error, loading } = useLatestMarket(retryKey)
  const indices = data?.indexSnapshot?.indices ?? []
  const primary = primaryIndex(indices)
  const ranked = useMemo(() => rankTickers(data?.tickers ?? []), [data?.tickers])
  const tradeDateLabel = formatTradeDate(data?.tradeDate)
  const updatedLabel = formatPktTime(latestIndexTimestamp(indices))

  return (
    <MarketShell title="Pakistan Stock Exchange" showHeading={false}>
      <MarketPageHeader
        title="Pakistan Stock Exchange"
        tradeDateLabel={loading && !data ? 'Loading latest close' : tradeDateLabel}
        updatedLabel={updatedLabel}
      />

      {loading && !data ? (
        <OverviewPageSkeleton />
      ) : error ? (
        <ErrorBlock error={error} onRetry={() => setRetryKey((key) => key + 1)} />
      ) : !data ? (
        <EmptyBlock title="No market data" detail="The API returned no latest market summary." />
      ) : (
        <Stack spacing={{ xs: 3.5, md: 4.5 }}>
          <PrimaryMarketClose primary={primary} market={data} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 3fr)' },
              gap: { xs: 3.5, md: 2.4 },
              alignItems: 'stretch',
              minWidth: 0,
            }}
          >
            <SecondaryIndexTable indices={indices} />
            <MoversTable ranked={ranked} />
          </Box>
          <MarketOverviewHeatmap ranked={ranked} />
          <SectorPerformanceTable ranked={ranked} />
        </Stack>
      )}
    </MarketShell>
  )
}
