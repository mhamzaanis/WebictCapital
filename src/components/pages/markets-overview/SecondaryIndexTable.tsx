import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { MarketIndexDto } from '../../../lib/api/types'
import { indexDisplayName, secondaryIndices, toneForValue } from '../../../lib/marketOverview'
import { DATA_FONT } from '../../markets/marketUtils'
import { fmtCompact, fmtNumber, fmtPct, fmtSigned, SURFACE_SX } from './viewFormat'

export function SecondaryIndexTable({ indices }: { indices: MarketIndexDto[] }) {
  const rows = secondaryIndices(indices)

  return (
    <Box component="section" aria-labelledby="secondary-index-title" sx={{ height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      {/* <SectionHeader
        title="Secondary indexes"
        detail={`All non-primary indexes returned by the API · ${formatTradeDate(tradeDate)}`}
      /> */}
      <Box sx={{ ...SURFACE_SX, flex: 1, minWidth: 0, maxWidth: '100%', overflowX: 'auto' }}>
        {rows.length === 0 ? (
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, p: 2.5 }}>No secondary index rows were returned.</Typography>
        ) : (
          <Table size="small" aria-label="Secondary PSX index close table" sx={{ width: '100%', tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                {['Index', 'Close', 'Change', 'Volume'].map((label, index) => (
                  <TableCell
                    key={label}
                    align={index === 0 ? 'left' : 'right'}
                    sx={{
                      color: 'var(--wc-text-secondary)',
                      fontSize: 12,
                      fontWeight: 800,
                      borderBottom: '1px solid var(--wc-border)',
                      py: 1.2,
                      whiteSpace: 'nowrap',
                      width: index === 0 ? '40%' : index === 1 ? '21%' : index === 2 ? '22%' : '17%',
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((index) => {
                const tone = toneForValue(index.change)
                return (
                  <TableRow
                    key={index.code}
                    hover
                    sx={{
                      height: 46,
                      '& .MuiTableCell-root': { borderBottom: '1px solid var(--wc-divider-soft)' },
                      '&:last-child .MuiTableCell-root': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 800, minWidth: 0 }}>
                      <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>
                        {indexDisplayName(index)}
                      </Typography>
                      <Typography sx={{ mt: 0.45, color: 'var(--wc-text-secondary)', fontFamily: DATA_FONT, fontSize: 11, lineHeight: 1.35 }}>
                        H {fmtNumber(index.high)} · L {fmtNumber(index.low)}
                      </Typography>
                    </TableCell>
                    <CompactNumber>{fmtNumber(index.close)}</CompactNumber>
                    <CompactNumber tone={tone}>
                      <Typography component="span" sx={{ display: 'block', color: 'inherit', fontFamily: DATA_FONT, fontSize: 12.5, fontWeight: 800, lineHeight: 1.35 }}>
                        {fmtSigned(index.change)}
                      </Typography>
                      <Typography component="span" sx={{ display: 'block', color: 'inherit', fontFamily: DATA_FONT, fontSize: 12.5, fontWeight: 800, lineHeight: 1.35 }}>
                        {fmtPct(index.changePct)}
                      </Typography>
                    </CompactNumber>
                    <CompactNumber title={index.volume == null ? undefined : index.volume.toLocaleString('en-PK')}>{fmtCompact(index.volume)}</CompactNumber>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  )
}

function CompactNumber({ children, tone, title }: { children: ReactNode; tone?: 'positive' | 'negative' | 'neutral'; title?: string }) {
  const color = tone === 'positive'
    ? 'var(--wc-success)'
    : tone === 'negative'
      ? 'var(--wc-error)'
      : 'var(--wc-text-primary)'

  return (
    <TableCell
      align="right"
      title={title}
      sx={{
        color,
        fontFamily: DATA_FONT,
        fontSize: 12.5,
        fontWeight: tone ? 800 : 650,
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      }}
    >
      {children}
    </TableCell>
  )
}
