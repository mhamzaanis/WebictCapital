import { Box, Stack, Typography } from '@mui/material'
import type { MarketAiSummaryDto, MarketIndexDto, MarketSummaryTickersResponse } from '../../../lib/api/types'
import {
  buildBreadthModel,
  commentaryKeyPoints,
  formatTradeDate,
  indexDisplayName,
  toneForValue,
} from '../../../lib/marketOverview'
import { DATA_FONT } from '../../markets/marketUtils'
import { fmtCompact, fmtNumber, fmtPct, fmtSigned, metadataSx, SURFACE_SX, toneColor } from './viewFormat'

export function PrimaryMarketClose({
  primary,
  market,
}: {
  primary: MarketIndexDto | null
  market: MarketSummaryTickersResponse
}) {
  return (
    <Box
      component="section"
      aria-label="Primary market close"
      sx={{
        ...SURFACE_SX,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '5fr 3fr 4fr' },
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: { xs: 2.25, md: 3 }, minWidth: 0 }}>
        {primary ? <Kse100Result index={primary} tradeDate={market.tradeDate} /> : <UnavailablePrimary />}
      </Box>
      <Box
        sx={{
          p: { xs: 2.25, md: 3 },
          borderTop: { xs: '1px solid var(--wc-border)', lg: 0 },
          borderLeft: { xs: 0, lg: '1px solid var(--wc-border)' },
          minWidth: 0,
        }}
      >
        <BreadthSummary market={market} />
      </Box>
      <Box
        sx={{
          p: { xs: 2.25, md: 3 },
          borderTop: { xs: '1px solid var(--wc-border)', lg: 0 },
          borderLeft: { xs: 0, lg: '1px solid var(--wc-border)' },
          minWidth: 0,
        }}
      >
        <MarketCommentary aiSummary={market.aiSummary} />
      </Box>
    </Box>
  )
}

function Kse100Result({ index, tradeDate }: { index: MarketIndexDto; tradeDate: string }) {
  const tone = toneForValue(index.change)
  return (
    <Stack spacing={2.2}>
      <Box>
        <Typography sx={{ color: 'var(--wc-primary)', fontSize: 15, fontWeight: 850 }}>
          {indexDisplayName(index)}
        </Typography>
        <Typography
          sx={{
            mt: 1.1,
            color: 'var(--wc-text-primary)',
            fontFamily: DATA_FONT,
            fontSize: { xs: 34, md: 38 },
            lineHeight: 1,
            fontWeight: 850,
            letterSpacing: 0,
          }}
        >
          {fmtNumber(index.close)}
        </Typography>
        <Stack direction="row" spacing={1.2} sx={{ mt: 1, alignItems: 'baseline', color: toneColor(tone) }}>
          <Typography sx={{ fontFamily: DATA_FONT, fontSize: 18, fontWeight: 850 }}>{fmtSigned(index.change)}</Typography>
          <Typography sx={{ fontFamily: DATA_FONT, fontSize: 18, fontWeight: 850 }}>{fmtPct(index.changePct)}</Typography>
        </Stack>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
          pt: 2,
          borderTop: '1px solid var(--wc-border)',
        }}
      >
        <PrimaryStat label="High" value={fmtNumber(index.high)} />
        <PrimaryStat label="Low" value={fmtNumber(index.low)} />
        <PrimaryStat label="Volume" value={fmtCompact(index.volume)} />
        <PrimaryStat label="Trade date" value={formatTradeDate(tradeDate)} />
      </Box>
    </Stack>
  )
}

function UnavailablePrimary() {
  return (
    <Stack spacing={0.8}>
      <Typography sx={{ color: 'var(--wc-primary)', fontSize: 15, fontWeight: 850 }}>KSE-100</Typography>
      <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: { xs: 34, md: 38 }, fontWeight: 850 }}>N/A</Typography>
      <Typography sx={metadataSx}>Primary index data is unavailable in the latest API response.</Typography>
    </Stack>
  )
}

function PrimaryStat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12, lineHeight: 1.35 }}>{label}</Typography>
      <Typography sx={{ mt: 0.25, color: 'var(--wc-text-primary)', fontFamily: DATA_FONT, fontSize: 14, fontWeight: 750, whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
    </Box>
  )
}

function BreadthSummary({ market }: { market: MarketSummaryTickersResponse }) {
  const breadth = buildBreadthModel(market.summary)
  const hasCompleteCounts = breadth.total != null
  const hasObservations = (breadth.total ?? 0) > 0
  const advances = market.summary.advances
  const declines = market.summary.declines
  const leader = advances == null || declines == null
    ? null
    : declines > advances && advances > 0
      ? `Decliners led advancers ${(declines / advances).toFixed(2)} to 1`
      : advances > declines && declines > 0
        ? `Advancers led decliners ${(advances / declines).toFixed(2)} to 1`
        : advances > declines
          ? 'Advancers led with no declining securities'
          : declines > advances
            ? 'Decliners led with no advancing securities'
            : 'Advancers and decliners were even'

  return (
    <Stack spacing={2}>
      <Box>
        <Typography component="h2" sx={{ color: 'var(--wc-text-primary)', fontSize: 18, fontWeight: 800 }}>
          Market breadth
        </Typography>
        {/* <Typography sx={{ ...metadataSx, mt: 0.35 }}>Advancing share {fmtPct(breadth.advancingShare, false)}</Typography> */}
      </Box>

      <Box
        aria-label="Market breadth segmented bar"
        sx={{
          display: 'flex',
          height: 12,
          overflow: 'hidden',
          borderRadius: '3px',
          bgcolor: '#F2F4F7',
          border: '1px solid var(--wc-border)',
        }}
      >
        {hasObservations ? breadth.segments.map((segment) => (
          <Box
            key={segment.label}
            sx={{
              width: `${segment.pct ?? 0}%`,
              minWidth: segment.pct && segment.pct > 0 ? 3 : 0,
              bgcolor: segment.tone === 'positive' ? 'var(--wc-success)' : segment.tone === 'negative' ? 'var(--wc-error)' : '#98A2B3',
            }}
          />
        )) : <Box sx={{ width: '100%', bgcolor: '#98A2B3' }} />}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.2 }}>
        {breadth.segments.map((segment) => (
          <Box key={segment.label}>
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>{segment.label}</Typography>
            <Typography sx={{ color: toneColor(segment.tone), fontFamily: DATA_FONT, fontSize: 14, fontWeight: 800 }}>
              {segment.value == null ? 'N/A' : segment.value.toLocaleString('en-PK')} · {fmtPct(segment.pct, false)}
            </Typography>
          </Box>
        ))}
      </Box>

      <Stack spacing={0.45} sx={{ pt: 0.4 }}>
        {hasCompleteCounts && hasObservations && leader && <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 13.5, fontWeight: 750 }}>{leader}</Typography>}
        {hasCompleteCounts ? (
          <Typography sx={metadataSx}>{breadth.total?.toLocaleString('en-PK')} securities observed</Typography>
        ) : (
          <Typography sx={metadataSx}>Breadth counts unavailable</Typography>
        )}
      </Stack>
    </Stack>
  )
}

function MarketCommentary({ aiSummary }: { aiSummary: MarketAiSummaryDto | null }) {
  const keyPoints = commentaryKeyPoints(aiSummary)
  const summary = aiSummary?.summary?.trim().replace(/^Ratio:\s*/i, '')
  const paragraphs = summary ? summary.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean) : []
  const lead = paragraphs.length > 1 ? paragraphs[0] : null
  const body = lead ? paragraphs.slice(1).join('\n\n') : summary

  return (
    <Stack spacing={1.4}>
      <Box>
        <Typography component="h2" sx={{ color: 'var(--wc-text-primary)', fontSize: 18, fontWeight: 800 }}>
          Market close summary
        </Typography>
        {/* <Typography sx={{ ...metadataSx, mt: 0.35 }}>
          Source: Webict Capital market summary · Trade date {formatTradeDate(aiSummary?.tradeDate ?? tradeDate)}
        </Typography> */}
      </Box>
      {summary && (
        <Stack spacing={1.15}>
          {lead && (
            <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 15, fontWeight: 750, lineHeight: 1.55 }}>
              {lead}
            </Typography>
          )}
          {body && (
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13.5, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {body}
            </Typography>
          )}
          {keyPoints.length > 0 && (
            <Stack component="ul" spacing={0.65} sx={{ m: 0, pl: 2.2 }}>
              {keyPoints.map((point) => (
                <Typography component="li" key={point} sx={{ color: 'var(--wc-text-primary)', fontSize: 13, lineHeight: 1.55 }}>
                  {point}
                </Typography>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  )
}
