import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import type { MarketIndexDto } from '../../../lib/api/types'
import { formatTradeDate, indexDisplayName, secondaryIndices, toneForValue } from '../../../lib/marketOverview'
import { DATA_FONT } from '../../markets/marketUtils'
import { fmtCompact, fmtNumber, fmtPct, fmtSigned, SURFACE_SX } from './viewFormat'
import { NumericCell, SectionHeader } from './viewUtils'

export function SecondaryIndexTable({ indices, tradeDate }: { indices: MarketIndexDto[]; tradeDate: string }) {
  const rows = secondaryIndices(indices)

  return (
    <Box component="section" aria-labelledby="secondary-index-title">
      <SectionHeader
        title="Secondary indexes"
        detail={`All non-primary indexes returned by the API · ${formatTradeDate(tradeDate)}`}
      />
      <Box sx={{ ...SURFACE_SX, overflowX: 'auto', maxWidth: '100%' }}>
        {rows.length === 0 ? (
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, p: 2.5 }}>No secondary index rows were returned.</Typography>
        ) : (
          <Table size="small" aria-label="Secondary PSX index close table" sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                {['Index', 'Close', 'Change', 'Change %', 'High', 'Low', 'Volume'].map((label, index) => (
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
                    <TableCell sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {indexDisplayName(index)}
                    </TableCell>
                    <NumericCell>{fmtNumber(index.close)}</NumericCell>
                    <NumericCell tone={tone}>{fmtSigned(index.change)}</NumericCell>
                    <NumericCell tone={tone}>{fmtPct(index.changePct)}</NumericCell>
                    <NumericCell>{fmtNumber(index.high)}</NumericCell>
                    <NumericCell>{fmtNumber(index.low)}</NumericCell>
                    <NumericCell title={index.volume == null ? undefined : index.volume.toLocaleString('en-PK')}>
                      <Typography component="span" sx={{ fontFamily: DATA_FONT, fontSize: 13, fontWeight: 650 }}>
                        {fmtCompact(index.volume)}
                      </Typography>
                    </NumericCell>
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
