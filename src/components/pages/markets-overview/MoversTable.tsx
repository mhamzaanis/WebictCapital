import { Box, Link as MuiLink, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { moverGroups, type MoverTab, type RankedTicker, toneForValue } from '../../../lib/marketOverview'
import { DATA_FONT } from '../../markets/marketUtils'
import { fmtCompact, fmtNumber, fmtPct, SURFACE_SX } from './viewFormat'
import { NumericCell, SectionHeader } from './viewUtils'

const MOVER_COLUMNS: Record<MoverTab, string[]> = {
  gainers: ['Symbol', 'Company', 'Close', 'Change %', 'Volume'],
  losers: ['Symbol', 'Company', 'Close', 'Change %', 'Volume'],
  active: ['Symbol', 'Company', 'Volume', 'Close', 'Change %'],
  value: ['Symbol', 'Company', 'Estimated value', 'Volume', 'Change %'],
}

export function MoversTable({ ranked }: { ranked: RankedTicker[] }) {
  const groups = useMemo(() => moverGroups(ranked, 8), [ranked])
  const [active, setActive] = useState<MoverTab>('gainers')
  const activeGroup = groups.find((group) => group.id === active) ?? groups[0]
  const columns = MOVER_COLUMNS[activeGroup.id]

  return (
    <Box component="section" aria-labelledby="market-movers-title" sx={{ height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      {/* <SectionHeader
        title="Market movers"
        detail={active === 'value' ? 'Estimated value is calculated as close x shares traded.' : undefined}
      /> */}
      <Box sx={{ ...SURFACE_SX, flex: 1, minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
        <Tabs
          value={active}
          onChange={(_, value: MoverTab) => setActive(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Market movers categories"
          sx={{
            minHeight: 44,
            px: 1,
            borderBottom: '1px solid var(--wc-border)',
            '& .MuiTabs-indicator': { bgcolor: 'var(--wc-primary)', height: 2 },
            '& .MuiTab-root': {
              minHeight: 44,
              minWidth: 'auto',
              px: 1.6,
              color: 'var(--wc-text-secondary)',
              fontSize: 13,
              fontWeight: 750,
              textTransform: 'none',
              '&.Mui-selected': { color: 'var(--wc-primary)' },
            },
          }}
        >
          {groups.map((group) => (
            <Tab key={group.id} value={group.id} label={group.label} />
          ))}
        </Tabs>
        <Box sx={{ maxWidth: '100%', minWidth: 0 }}>
          {activeGroup.rows.length === 0 ? (
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, p: 2.5 }}>No rows are available for this mover category.</Typography>
          ) : (
            <Table size="small" aria-label={`${activeGroup.label} movers table`} sx={{ width: '100%', tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  {columns.map((label, index) => (
                    <TableCell
                      key={label}
                      align={index <= 1 ? 'left' : 'right'}
                      sx={{
                        color: 'var(--wc-text-secondary)',
                        fontSize: 12,
                        fontWeight: 800,
                        py: 1.15,
                        borderBottom: '1px solid var(--wc-border)',
                        whiteSpace: 'nowrap',
                        width: index === 0 ? '13%' : index === 1 ? '43%' : `${44 / (columns.length - 2)}%`,
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {activeGroup.rows.map((row) => <MoverRow key={`${activeGroup.id}-${row.symbol}`} tab={activeGroup.id} row={row} />)}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>
    </Box>
  )
}

function MoverRow({ tab, row }: { tab: MoverTab; row: RankedTicker }) {
  const tone = toneForValue(row.changePct)
  return (
    <TableRow
      hover
      sx={{
        height: 46,
        '& .MuiTableCell-root': { borderBottom: '1px solid var(--wc-divider-soft)' },
        '&:last-child .MuiTableCell-root': { borderBottom: 0 },
      }}
    >
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <MuiLink component={Link} to={`/stocks/${row.symbol}`} underline="hover" sx={{ color: 'var(--wc-primary)', fontSize: 13, fontWeight: 850 }}>
          {row.symbol}
        </MuiLink>
      </TableCell>
      <TableCell sx={{ color: 'var(--wc-text-primary)', fontSize: 13, minWidth: 0, overflowWrap: 'anywhere', lineHeight: 1.35 }}>
        {row.companyName?.trim() || row.symbol}
      </TableCell>
      {tab === 'active' ? (
        <>
          <NumericCell title={row.turnover == null ? undefined : row.turnover.toLocaleString('en-PK')}>{fmtCompact(row.turnover)}</NumericCell>
          <NumericCell>{fmtNumber(row.close)}</NumericCell>
          <NumericCell tone={tone}>{fmtPct(row.changePct)}</NumericCell>
        </>
      ) : tab === 'value' ? (
        <>
          <NumericCell title={row.estimatedTradedValue == null ? undefined : row.estimatedTradedValue.toLocaleString('en-PK')}>
            <Typography component="span" sx={{ fontFamily: DATA_FONT, fontSize: 13, fontWeight: 650 }}>
              {fmtCompact(row.estimatedTradedValue)}
            </Typography>
          </NumericCell>
          <NumericCell title={row.turnover == null ? undefined : row.turnover.toLocaleString('en-PK')}>{fmtCompact(row.turnover)}</NumericCell>
          <NumericCell tone={tone}>{fmtPct(row.changePct)}</NumericCell>
        </>
      ) : (
        <>
          <NumericCell>{fmtNumber(row.close)}</NumericCell>
          <NumericCell tone={tone}>{fmtPct(row.changePct)}</NumericCell>
          <NumericCell title={row.turnover == null ? undefined : row.turnover.toLocaleString('en-PK')}>{fmtCompact(row.turnover)}</NumericCell>
        </>
      )}
    </TableRow>
  )
}
