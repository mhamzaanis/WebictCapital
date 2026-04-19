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
	if (isNaN(n) || n === 0) return '#6f829d'
	return n > 0 ? '#1a6640' : '#b4283a'
}

function changeSign(change: string | number | null | undefined): string {
	const n = changeVal(change)
	if (isNaN(n) || n === 0) return ''
	return n > 0 ? '+' : ''
}

function compareCells(a: DataTableRow, b: DataTableRow, key: SortKey): number {
	const numericKeys: SortKey[] = ['turnover', 'open', 'high', 'low', 'last_rate', 'change']
	if (numericKeys.includes(key)) {
		const an = toNum(a[key])
		const bn = toNum(b[key])
		if (!isNaN(an) && !isNaN(bn)) return an - bn
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
		bgcolor: '#fafbfd',
		color: '#4a5e78',
		fontFamily: monoFont,
		fontWeight: 700,
		fontSize: 11,
		letterSpacing: '0.06em',
		borderBottom: '1px solid #e2eaf5',
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
					color: `${sortKey === id ? '#0a2463' : '#4a5e78'} !important`,
					'& .MuiTableSortLabel-icon': { color: '#0a2463 !important' },
					'&.Mui-active': { color: '#0a2463 !important' },
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
					bgcolor: '#ffffff',
					borderRadius: 1.5,
					maxHeight: { xs: 560, md: 700 },
					border: '1px solid #e2eaf5',
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
										'&:hover': { bgcolor: '#f5f8ff' },
										'& td': { borderBottom: '1px solid #e2eaf5' },
									}}
								>
									<TableCell
										sx={{
											color: '#0a2463',
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
											color: '#4a5e78',
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

									<TableCell align="right" sx={{ color: '#4a5e78', fontFamily: monoFont, fontSize: 11 }}>
										{fmtNum(stock.turnover)}
									</TableCell>

									<TableCell align="right" sx={{ color: '#4a5e78', fontFamily: monoFont, fontSize: 12 }}>
										{stock.open || '—'}
									</TableCell>

									<TableCell align="right" sx={{ color: '#1a6640', fontFamily: monoFont, fontSize: 12 }}>
										{stock.high || '—'}
									</TableCell>

									<TableCell align="right" sx={{ color: '#b4283a', fontFamily: monoFont, fontSize: 12 }}>
										{stock.low || '—'}
									</TableCell>

									<TableCell
										align="right"
										sx={{
											color: '#080e1a',
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
								</TableRow>
							)
						})}

						{sortedRows.length === 0 && searchQuery && (
							<TableRow>
								<TableCell
									colSpan={8}
									align="center"
									sx={{ color: '#8097b0', fontFamily: monoFont, fontSize: 12, py: 5 }}
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
					borderTop: '1px solid #e2eaf5',
					bgcolor: '#fafbfd',
					'& .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiInputBase-root': {
						fontFamily: monoFont,
						fontSize: 12,
						color: '#4a5e78',
					},
				}}
			/>
		</>
	)
}
