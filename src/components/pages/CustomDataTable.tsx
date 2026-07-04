import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import RemoveIcon from '@mui/icons-material/Remove'
import {
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TableSortLabel,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useCallback, useMemo, useState } from 'react'

export type DataTableRow = {
	symbol: string
	company: string
	turnover: string | number | null
	open: string | number | null
	high: string | number | null
	low: string | number | null
	last_rate: string | number | null
	change: string | number | null
	eps: number | null
	pe: number | null
}

type SortKey = keyof DataTableRow
type SortDir = 'asc' | 'desc'

type CustomDataTableProps = {
	rows: DataTableRow[]
	searchQuery: string
	dataFont?: string
}

const UI_FONT = 'var(--wc-font-body)'
const DATA_FONT = 'var(--wc-font-data)'

const numericSx = {
	fontFamily: DATA_FONT,
	fontVariantNumeric: 'tabular-nums',
	fontFeatureSettings: '"tnum" 1',
}

function toNum(val: unknown): number {
	if (val === null || val === undefined || val === '') return NaN
	if (typeof val === 'number') return Number.isFinite(val) ? val : NaN
	if (typeof val === 'string') return parseFloat(val.replace(/,/g, '').trim())

	const n = Number(val)
	return Number.isFinite(n) ? n : NaN
}

function fmtNum(val: string | number | null | undefined): string {
	if (val === null || val === undefined || val === '') return '—'
	const n = toNum(val)
	return isNaN(n) ? String(val) : n.toLocaleString()
}

function changeVal(change: string | number | null | undefined): number {
	return toNum(change)
}

function changeColor(change: string | number | null | undefined): string {
	const n = changeVal(change)
	if (isNaN(n) || n === 0) return 'var(--wc-text-secondary)'
	return n > 0 ? 'var(--wc-success)' : 'var(--wc-error)'
}

function changeSign(change: string | number | null | undefined): string {
	const n = changeVal(change)
	if (isNaN(n) || n === 0) return ''
	return n > 0 ? '+' : ''
}

function compareCells(a: DataTableRow, b: DataTableRow, key: SortKey): number {
	const numericKeys: SortKey[] = ['turnover', 'open', 'high', 'low', 'last_rate', 'change', 'eps', 'pe']
	if (numericKeys.includes(key)) {
		const an = toNum(a[key])
		const bn = toNum(b[key])
		// Push nulls to the bottom regardless of sort direction
		if (isNaN(an) && isNaN(bn)) return 0
		if (isNaN(an)) return 1
		if (isNaN(bn)) return -1
		return an - bn
	}
	return (a[key] ?? '').toString().localeCompare((b[key] ?? '').toString())
}

type SortCellProps = {
	id: SortKey
	label: string
	align?: 'left' | 'right'
	headCell: SxProps<Theme>
	sortKey: SortKey
	sortDir: SortDir
	onSort: (id: SortKey) => void
}

function SortCell({
	id,
	label,
	align = 'right',
	headCell,
	sortKey,
	sortDir,
	onSort,
}: SortCellProps) {
	return (
		<TableCell align={align} sx={headCell}>
			<TableSortLabel
				active={sortKey === id}
				direction={sortKey === id ? sortDir : 'asc'}
				onClick={() => onSort(id)}
				sx={{
					color: `${sortKey === id ? 'var(--wc-primary)' : 'var(--wc-text-secondary)'} !important`,
					'& .MuiTableSortLabel-icon': { color: 'var(--wc-primary) !important' },
					'&.Mui-active': { color: 'var(--wc-primary) !important' },
				}}
			>
				{label}
			</TableSortLabel>
		</TableCell>
	)
}

export function CustomDataTable({ rows, searchQuery }: CustomDataTableProps) {
	const [sortKey, setSortKey] = useState<SortKey>('symbol')
	const [sortDir, setSortDir] = useState<SortDir>('asc')
	const [page, setPage] = useState(0)
	const [rowsPerPage, setRowsPerPage] = useState(25)

	const sortedRows = useMemo(() => {
		return [...rows].sort((a, b) => {
			const cmp = compareCells(a, b, sortKey)
			return sortDir === 'asc' ? cmp : -cmp
		})
	}, [rows, sortKey, sortDir])

	const maxPage = Math.max(0, Math.ceil(sortedRows.length / rowsPerPage) - 1)
	const currentPage = Math.min(page, maxPage)

	const pagedRows = useMemo(() => {
		const start = currentPage * rowsPerPage
		return sortedRows.slice(start, start + rowsPerPage)
	}, [sortedRows, currentPage, rowsPerPage])

	const handleSort = useCallback((id: SortKey) => {
		if (id === sortKey) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
		} else {
			setSortKey(id)
			setSortDir('asc')
		}
		setPage(0)
	}, [sortKey])

	const headCell = {
		bgcolor: 'var(--wc-surface-soft)',
		color: 'var(--wc-text-muted)',
		fontFamily: UI_FONT,
		fontWeight: 700,
		fontSize: 11,
		letterSpacing: '0.08em',
		textTransform: 'uppercase',
		borderBottom: '1px solid var(--wc-border)',
		py: 1.35,
		whiteSpace: 'nowrap' as const,
	}

	const sortCellProps = { headCell, sortKey, sortDir, onSort: handleSort }

	return (
		<>
			<TableContainer
				component={Paper}
				sx={{
					bgcolor: 'var(--wc-surface)',
					borderRadius: '12px',
					maxHeight: { xs: 560, md: 700 },
					border: '1px solid var(--wc-border)',
					boxShadow: 'none',
					overflow: 'hidden',
				}}
			>
				<Table stickyHeader size="small" aria-label="PSX stocks table">
					<TableHead>
						<TableRow>
							<SortCell id="symbol" label="SYMBOL" align="left" {...sortCellProps} />
							<SortCell id="company" label="COMPANY" align="left" {...sortCellProps} />
							<SortCell id="turnover" label="TURNOVER" {...sortCellProps} />
							<SortCell id="open" label="OPEN" {...sortCellProps} />
							<SortCell id="high" label="HIGH" {...sortCellProps} />
							<SortCell id="low" label="LOW" {...sortCellProps} />
							<SortCell id="last_rate" label="LAST" {...sortCellProps} />
							<SortCell id="change" label="CHG" {...sortCellProps} />
							<SortCell id="eps" label="EPS" {...sortCellProps} />
							<SortCell id="pe" label="P/E" {...sortCellProps} />
						</TableRow>
					</TableHead>

					<TableBody>
						{pagedRows.map((stock, i) => {
							const chgColor = changeColor(stock.change)
							const chgN = changeVal(stock.change)
							return (
								<TableRow
									key={`${stock.symbol}-${page}-${i}`}
									hover
									sx={{
										'&:hover': { bgcolor: 'var(--wc-surface-soft)' },
										'& td': { borderBottom: '1px solid #edf2f8' },
									}}
								>
									<TableCell
										sx={{
											color: 'var(--wc-primary)',
											fontFamily: UI_FONT,
											fontWeight: 750,
											fontSize: 13,
											letterSpacing: 0,
											textTransform: 'uppercase',
											whiteSpace: 'nowrap',
											py: 1.1,
										}}
									>
										{stock.symbol}
									</TableCell>

									<TableCell
										sx={{
											color: 'var(--wc-text-secondary)',
											fontFamily: UI_FONT,
											fontSize: 13,
											fontWeight: 500,
											maxWidth: { xs: 140, md: 260 },
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
										title={stock.company}
									>
										{stock.company}
									</TableCell>

									<TableCell align="right" sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, ...numericSx }}>
										{fmtNum(stock.turnover)}
									</TableCell>

									<TableCell align="right" sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, ...numericSx }}>
										{stock.open || '—'}
									</TableCell>

									<TableCell align="right" sx={{ color: 'var(--wc-success)', fontSize: 13, ...numericSx }}>
										{stock.high || '—'}
									</TableCell>

									<TableCell align="right" sx={{ color: 'var(--wc-error)', fontSize: 13, ...numericSx }}>
										{stock.low || '—'}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											color: 'var(--wc-text-primary)',
											fontWeight: 700,
											fontSize: 13,
											whiteSpace: 'nowrap',
											...numericSx,
										}}
									>
										{stock.last_rate || '—'}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											color: chgColor,
											fontWeight: 600,
											fontSize: 12,
											whiteSpace: 'nowrap',
											...numericSx,
										}}
									>
										<Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
											{!isNaN(chgN) && chgN !== 0 && (chgN > 0 ? <ArrowDropUpIcon sx={{ fontSize: 12 }} /> : <ArrowDropDownIcon sx={{ fontSize: 12 }} />)}
											{!isNaN(chgN) && chgN === 0 && <RemoveIcon sx={{ fontSize: 12 }} />}
											<span>
												{stock.change === null || stock.change === undefined || stock.change === ''
													? '—'
													: `${changeSign(stock.change)}${stock.change}`}
											</span>
										</Stack>
									</TableCell>

									<TableCell
										align="right"
										sx={{
											color: 'var(--wc-text-secondary)',
											fontSize: 12,
											whiteSpace: 'nowrap',
											...numericSx,
										}}
									>
										{stock.eps != null ? stock.eps.toFixed(2) : '—'}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											color: 'var(--wc-text-secondary)',
											fontSize: 12,
											whiteSpace: 'nowrap',
											...numericSx,
										}}
									>
										{stock.pe != null ? `${stock.pe.toFixed(1)}x` : '—'}
									</TableCell>
								</TableRow>
							)
						})}

						{sortedRows.length === 0 && searchQuery && (
							<TableRow>
								<TableCell
									colSpan={10}
									align="center"
									sx={{ color: 'var(--wc-text-secondary)', fontFamily: UI_FONT, fontSize: 13, py: 5 }}
								>
									No symbols match &quot;{searchQuery}&quot;
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>

			<TablePagination
				component="div"
				count={sortedRows.length}
				page={currentPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				rowsPerPage={rowsPerPage}
				onRowsPerPageChange={(e) => {
					setRowsPerPage(parseInt(e.target.value, 10))
					setPage(0)
				}}
				rowsPerPageOptions={[10, 25, 50, 100]}
				sx={{
					borderRadius: '0 0 12px 12px',
					borderTop: '1px solid var(--wc-border)',
					bgcolor: 'var(--wc-surface-soft)',
					'& .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiInputBase-root': {
						fontFamily: UI_FONT,
						fontSize: 12,
						color: 'var(--wc-text-secondary)',
					},
				}}
			/>
		</>
	)
}
