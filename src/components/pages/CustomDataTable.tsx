import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
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
import { useEffect, useMemo, useState } from 'react'

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
	monoFont: string
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

export function CustomDataTable({ rows, searchQuery, monoFont }: CustomDataTableProps) {
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

	const pagedRows = useMemo(() => {
		const start = page * rowsPerPage
		return sortedRows.slice(start, start + rowsPerPage)
	}, [sortedRows, page, rowsPerPage])

	useEffect(() => {
		setPage(0)
	}, [rows, searchQuery, rowsPerPage])

	const headCell = {
		bgcolor: 'var(--wc-paper)',
		color: 'var(--wc-text-secondary)',
		fontFamily: monoFont,
		fontWeight: 700,
		fontSize: 11,
		letterSpacing: '0.06em',
		borderBottom: '1px solid var(--wc-divider)',
		py: 1.2,
		whiteSpace: 'nowrap' as const,
	}

	const SortCell = ({
		id,
		label,
		align = 'right',
	}: {
		id: SortKey
		label: string
		align?: 'left' | 'right'
	}) => (
		<TableCell align={align} sx={headCell}>
			<TableSortLabel
				active={sortKey === id}
				direction={sortKey === id ? sortDir : 'asc'}
				onClick={() => {
					if (id === sortKey) {
						setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
					} else {
						setSortKey(id)
						setSortDir('asc')
					}
				}}
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

	return (
		<>
			<TableContainer
				component={Paper}
				sx={{
					bgcolor: 'var(--wc-bg)',
					borderRadius: 1.5,
					maxHeight: { xs: 560, md: 700 },
					border: '1px solid var(--wc-divider)',
				}}
			>
				<Table stickyHeader size="small" aria-label="PSX stocks table">
					<TableHead>
						<TableRow>
							<SortCell id="symbol" label="SYMBOL" align="left" />
							<SortCell id="company" label="COMPANY" align="left" />
							<SortCell id="turnover" label="TURNOVER" />
							<SortCell id="open" label="OPEN" />
							<SortCell id="high" label="HIGH" />
							<SortCell id="low" label="LOW" />
							<SortCell id="last_rate" label="LAST" />
							<SortCell id="change" label="CHG" />
							<SortCell id="eps" label="EPS" />
							<SortCell id="pe" label="P/E" />
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
										'&:hover': { bgcolor: 'var(--wc-primary-light)' },
										'& td': { borderBottom: '1px solid var(--wc-divider)' },
									}}
								>
									<TableCell
										sx={{
											color: 'var(--wc-primary)',
											fontFamily: monoFont,
											fontWeight: 700,
											fontSize: 12,
											whiteSpace: 'nowrap',
											py: 0.8,
										}}
									>
										{stock.symbol}
									</TableCell>

									<TableCell
										sx={{
											color: 'var(--wc-text-secondary)',
											fontSize: 12,
											maxWidth: { xs: 140, md: 260 },
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
										title={stock.company}
									>
										{stock.company}
									</TableCell>

									<TableCell align="right" sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11 }}>
										{fmtNum(stock.turnover)}
									</TableCell>

									<TableCell align="right" sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 12 }}>
										{stock.open || '—'}
									</TableCell>

									<TableCell align="right" sx={{ color: 'var(--wc-success)', fontFamily: monoFont, fontSize: 12 }}>
										{stock.high || '—'}
									</TableCell>

									<TableCell align="right" sx={{ color: 'var(--wc-error)', fontFamily: monoFont, fontSize: 12 }}>
										{stock.low || '—'}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											color: 'var(--wc-text-primary)',
											fontFamily: monoFont,
											fontWeight: 700,
											fontSize: 13,
											whiteSpace: 'nowrap',
										}}
									>
										{stock.last_rate || '—'}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											color: chgColor,
											fontFamily: monoFont,
											fontWeight: 600,
											fontSize: 12,
											whiteSpace: 'nowrap',
										}}
									>
										<Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
											{!isNaN(chgN) && chgN !== 0 && (chgN > 0 ? <TrendingUpIcon sx={{ fontSize: 12 }} /> : <TrendingDownIcon sx={{ fontSize: 12 }} />)}
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
											fontFamily: monoFont,
											fontSize: 12,
											whiteSpace: 'nowrap',
										}}
									>
										{stock.eps != null ? stock.eps.toFixed(2) : '—'}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											color: 'var(--wc-text-secondary)',
											fontFamily: monoFont,
											fontSize: 12,
											whiteSpace: 'nowrap',
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
									sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 12, py: 5 }}
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
				page={page}
				onPageChange={(_, newPage) => setPage(newPage)}
				rowsPerPage={rowsPerPage}
				onRowsPerPageChange={(e) => {
					setRowsPerPage(parseInt(e.target.value, 10))
					setPage(0)
				}}
				rowsPerPageOptions={[10, 25, 50, 100]}
				sx={{
					borderRadius: '0 0 1.5rem 1.5rem',
					borderTop: '1px solid var(--wc-divider)',
					bgcolor: 'var(--wc-paper)',
					'& .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiInputBase-root': {
						fontFamily: monoFont,
						fontSize: 12,
						color: 'var(--wc-text-secondary)',
					},
				}}
			/>
		</>
	)
}