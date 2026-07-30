import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, Tooltip, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import {
  sectorRows,
  sortSectors,
  type RankedTicker,
  type SectorRow,
  type SectorSortKey,
} from '../../../lib/marketOverview'
import { fmtCompact, SURFACE_SX } from './viewFormat'
import { SectionHeader } from './viewUtils'

const INITIAL_SECTOR_COUNT = 12

const SORTABLE_LABELS: Partial<Record<string, SectorSortKey>> = {
  Issues: 'issues',
  Declines: 'declines',
  'Shares traded': 'shares',
  'Est. value': 'estimated',
}

export function SectorPerformanceTable({ ranked }: { ranked: RankedTicker[] }) {
  const [sortKey, setSortKey] = useState<SectorSortKey>('estimated')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState(false)
  const rows = useMemo(() => sortSectors(sectorRows(ranked), sortKey, direction), [ranked, sortKey, direction])
  const visibleRows = expanded ? rows : rows.slice(0, INITIAL_SECTOR_COUNT)

  const onSort = (key: SectorSortKey) => {
    if (key === sortKey) setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setDirection('desc')
    }
  }

  return (
    <Box component="section" aria-labelledby="sector-performance-title">
      <SectionHeader
        title="Sector performance"
        // detail="Estimated value is included only where close and turnover are valid."
      />
      <Box sx={{ ...SURFACE_SX, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto', maxWidth: '100%', maxHeight: expanded ? 620 : 'none' }}>
          {rows.length === 0 ? (
            <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, p: 2.5 }}>Sector data is unavailable for this session.</Typography>
          ) : (
            <Table stickyHeader size="small" aria-label="Sector performance table" sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow>
                  {['Sector', 'Issues', 'Advances', 'Declines', 'Unchanged', 'Shares traded', 'Est. value'].map((label, index) => {
                    const key = SORTABLE_LABELS[label]
                    return (
                      <TableCell
                        key={label}
                        align={index === 0 ? 'left' : 'right'}
                        sortDirection={key === sortKey ? direction : false}
                        sx={{
                          bgcolor: 'var(--wc-surface)',
                          color: 'var(--wc-text-secondary)',
                          fontSize: 12,
                          fontWeight: 800,
                          py: 1.15,
                          borderBottom: '1px solid var(--wc-border)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {key ? (
                          <TableSortLabel
                            active={key === sortKey}
                            direction={key === sortKey ? direction : 'desc'}
                            onClick={() => onSort(key)}
                            sx={{
                              color: 'inherit',
                              '&.Mui-active': { color: 'var(--wc-primary)' },
                              '& .MuiTableSortLabel-icon': { color: 'var(--wc-primary) !important' },
                            }}
                          >
                            {label}
                          </TableSortLabel>
                        ) : label}
                      </TableCell>
                    )
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map((row) => <SectorTableRow key={row.sector} row={row} />)}
              </TableBody>
            </Table>
          )}
        </Box>
        {rows.length > INITIAL_SECTOR_COUNT && (
          <Box sx={{ borderTop: '1px solid var(--wc-border)', p: 1.2, textAlign: 'center' }}>
            <Button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              sx={{
                color: 'var(--wc-primary)',
                fontSize: 12.5,
                fontWeight: 800,
                '&:focus-visible': { outline: '2px solid var(--wc-primary)', outlineOffset: 2 },
              }}
            >
              {expanded ? 'Show top sectors' : 'View all sectors'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}

function SectorTableRow({ row }: { row: SectorRow }) {
  return (
    <TableRow
      hover
      sx={{
        height: 46,
        '& .MuiTableCell-root': { borderBottom: '1px solid var(--wc-divider-soft)' },
        '&:last-child .MuiTableCell-root': { borderBottom: 0 },
      }}
    >
      <TableCell sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 750, minWidth: 260 }}>
        {row.sector}
      </TableCell>
      <RightCell>{row.issues.toLocaleString('en-PK')}</RightCell>
      <RightCell>{row.advances.toLocaleString('en-PK')}</RightCell>
      <RightCell>{row.declines.toLocaleString('en-PK')}</RightCell>
      <RightCell>{row.unchanged.toLocaleString('en-PK')}</RightCell>
      <RightCell title={row.shares.toLocaleString('en-PK')}>{fmtCompact(row.shares)}</RightCell>
      <RightCell title={row.estimated.toLocaleString('en-PK')}>{fmtCompact(row.estimated)}</RightCell>
    </TableRow>
  )
}

function RightCell({ children, title }: { children: string; title?: string }) {
  const cell = (
    <TableCell
      align="right"
      sx={{
        color: 'var(--wc-text-primary)',
        fontFamily: 'var(--wc-font-data)',
        fontSize: 13,
        fontWeight: 650,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </TableCell>
  )
  return title ? <Tooltip title={title}>{cell}</Tooltip> : cell
}
