import {
	Alert,
	Box,
	CircularProgress,
	Container,
	InputAdornment,
	Paper,
	Stack,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TableSortLabel,
	Tabs,
	TextField,
	Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type PsxStock = {
	symbol: string
	company: string
	turnover: string
	prev_rate: string
	open: string
	high: string
	low: string
	last_rate: string
	change: string | null
}

type PsxData = {
	date: string
	source: string
	total_stocks: number
	stocks: PsxStock[]
}

type SlotKey = 'day1' | 'day2' | 'day3'
type SortKey = keyof PsxStock
type SortDir = 'asc' | 'desc'
type MovementFilter = 'all' | 'gainers' | 'losers' | 'unchanged'

// ── Constants ─────────────────────────────────────────────────────────────────

// Adjust this base path to wherever your data folder is served from.
// If using Vite, place files in src/data/psx/ and import them, OR serve
// from /public/data/psx/ and fetch from the URL below.
const DATA_BASE = '/data/psx'

const SLOTS: SlotKey[] = ['day1', 'day2', 'day3']

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNum(val: string | null | undefined): number {
	if (!val) return NaN
	return parseFloat(val.replace(/,/g, ''))
}

function fmtNum(val: string | null | undefined): string {
	if (!val) return '—'
	const n = toNum(val)
	return isNaN(n) ? val : n.toLocaleString()
}

function changeVal(change: string | null | undefined): number {
	return toNum(change)
}

function changeColor(change: string | null | undefined): string {
	const n = changeVal(change)
	if (isNaN(n) || n === 0) return '#64748b'
	return n > 0 ? '#22c55e' : '#ef4444'
}

function changeSign(change: string | null | undefined): string {
	const n = changeVal(change)
	if (isNaN(n) || n === 0) return ''
	return n > 0 ? '+' : ''
}

function compareCells(a: PsxStock, b: PsxStock, key: SortKey): number {
	const numericKeys: SortKey[] = ['turnover', 'prev_rate', 'open', 'high', 'low', 'last_rate', 'change']
	if (numericKeys.includes(key)) {
		const an = toNum(a[key] as string)
		const bn = toNum(b[key] as string)
		if (!isNaN(an) && !isNaN(bn)) return an - bn
	}
	return (a[key] ?? '').toString().localeCompare((b[key] ?? '').toString())
}

function formatTabLabel(data: PsxData | null, slot: SlotKey): string {
	if (!data) return slot.toUpperCase()
	// e.g. "Mon 14 Apr"
	try {
		const d = new Date(data.date + 'T00:00:00')
		return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
	} catch {
		return data.date
	}
}

// ── Shared cell styles ────────────────────────────────────────────────────────

const MONO = '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace'

const headCell = {
	bgcolor: '#f4f8ff',
	color: '#4b6282',
	fontFamily: MONO,
	fontWeight: 700,
	fontSize: 11,
	letterSpacing: '0.06em',
	borderBottom: '1px solid #d8e4f5',
	py: 1.2,
	whiteSpace: 'nowrap' as const,
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DataPage() {
	const [slotData, setSlotData] = useState<Record<SlotKey, PsxData | null>>({
		day1: null,
		day2: null,
		day3: null,
	})
	const [slotStatus, setSlotStatus] = useState<Record<SlotKey, 'idle' | 'loading' | 'ok' | 'error'>>({
		day1: 'loading',
		day2: 'loading',
		day3: 'loading',
	})
	const [activeTab, setActiveTab] = useState<SlotKey>('day1')
	const [search, setSearch] = useState('')
	const [sortKey, setSortKey] = useState<SortKey>('symbol')
	const [sortDir, setSortDir] = useState<SortDir>('asc')
	const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
	const [minTurnover, setMinTurnover] = useState('')
	const [minLastRate, setMinLastRate] = useState('')
	const [maxLastRate, setMaxLastRate] = useState('')
	const [page, setPage] = useState(0)
	const [rowsPerPage, setRowsPerPage] = useState(25)

	// Fetch all 3 slots in parallel on mount
	useEffect(() => {
		const controller = new AbortController()

		SLOTS.forEach((slot) => {
			fetch(`${DATA_BASE}/${slot}.json`, { signal: controller.signal })
				.then((res) => {
					if (!res.ok) throw new Error(`HTTP ${res.status}`)
					return res.json() as Promise<PsxData>
				})
				.then((data) => {
					setSlotData((prev) => ({ ...prev, [slot]: data }))
					setSlotStatus((prev) => ({ ...prev, [slot]: 'ok' }))
				})
				.catch((err) => {
					if (err instanceof DOMException && err.name === 'AbortError') return
					setSlotStatus((prev) => ({ ...prev, [slot]: 'error' }))
				})
		})

		return () => controller.abort()
	}, [])

	// Reset search + sort when switching tabs
	const handleTabChange = (_: SyntheticEvent, val: SlotKey) => {
		setActiveTab(val)
		setSearch('')
		setSortKey('symbol')
		setSortDir('asc')
		setMovementFilter('all')
		setMinTurnover('')
		setMinLastRate('')
		setMaxLastRate('')
		setPage(0)
	}

	const handleSort = (key: SortKey) => {
		if (key === sortKey) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
		} else {
			setSortKey(key)
			setSortDir('asc')
		}
	}

	const activeData = slotData[activeTab]
	const stocks = activeData?.stocks ?? []

	const displayedStocks = useMemo(() => {
		const q = search.trim().toLowerCase()
		const minTurnoverNum = minTurnover.trim() === '' ? NaN : parseFloat(minTurnover)
		const minLastNum = minLastRate.trim() === '' ? NaN : parseFloat(minLastRate)
		const maxLastNum = maxLastRate.trim() === '' ? NaN : parseFloat(maxLastRate)

		const filtered = q
			? stocks.filter((s) => s.symbol.toLowerCase().includes(q) || s.company.toLowerCase().includes(q))
			: stocks

		const filteredByMovement = filtered.filter((s) => {
			const chg = changeVal(s.change)
			if (movementFilter === 'all') return true
			if (movementFilter === 'gainers') return chg > 0
			if (movementFilter === 'losers') return chg < 0
			return !isNaN(chg) && chg === 0
		})

		const filteredByRange = filteredByMovement.filter((s) => {
			const turnover = toNum(s.turnover)
			const last = toNum(s.last_rate)

			if (!isNaN(minTurnoverNum) && !isNaN(turnover) && turnover < minTurnoverNum) return false
			if (!isNaN(minLastNum) && !isNaN(last) && last < minLastNum) return false
			if (!isNaN(maxLastNum) && !isNaN(last) && last > maxLastNum) return false
			return true
		})

		return [...filteredByRange].sort((a, b) => {
			const cmp = compareCells(a, b, sortKey)
			return sortDir === 'asc' ? cmp : -cmp
		})
	}, [stocks, search, sortKey, sortDir, movementFilter, minTurnover, minLastRate, maxLastRate])

	const pagedStocks = useMemo(() => {
		const start = page * rowsPerPage
		return displayedStocks.slice(start, start + rowsPerPage)
	}, [displayedStocks, page, rowsPerPage])

	useEffect(() => {
		setPage(0)
	}, [search, movementFilter, minTurnover, minLastRate, maxLastRate, rowsPerPage, activeTab])

	const stats = useMemo(() => {
		const gainers = stocks.filter((s) => changeVal(s.change) > 0).length
		const losers = stocks.filter((s) => changeVal(s.change) < 0).length
		const unchanged = stocks.filter((s) => {
			const n = changeVal(s.change)
			return !isNaN(n) && n === 0
		}).length
		return { gainers, losers, unchanged }
	}, [stocks])

	const marketSummary = useMemo(() => {
		let totalOpenPoints = 0
		let totalClosePoints = 0
		let totalVolume = 0

		stocks.forEach((s) => {
			const open = toNum(s.open)
			const close = toNum(s.last_rate)
			const turnover = toNum(s.turnover)
			if (!isNaN(open)) totalOpenPoints += open
			if (!isNaN(close)) totalClosePoints += close
			if (!isNaN(turnover)) totalVolume += turnover
		})

		return {
			openPoints: totalOpenPoints,
			closePoints: totalClosePoints,
			volumeTraded: totalVolume,
		}
	}, [stocks])

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
				onClick={() => handleSort(id)}
				sx={{
					color: `${sortKey === id ? '#94a3b8' : '#475569'} !important`,
					'& .MuiTableSortLabel-icon': { color: '#334155 !important' },
					'&.Mui-active': { color: '#94a3b8 !important' },
				}}
			>
				{label}
			</TableSortLabel>
		</TableCell>
	)

	return (
		<Box
			component="main"
			sx={{
				pt: { xs: 'calc(64px + 1.2rem)', md: 'calc(72px + 1.8rem)' },
				pb: { xs: 6, md: 10 },
				minHeight: '100vh',
				bgcolor: '#f5f9ff',
				backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #eef5ff 52%, #e8f1ff 100%)',
			}}
		>
			<Container maxWidth="xl" sx={{ maxWidth: '1400px !important', px: { xs: 1.5, md: 3 } }}>
				<Stack spacing={2.5}>

					{/* ── Header ── */}
					<Box>
						<Typography
							sx={{
								fontFamily: MONO,
								fontSize: { xs: '1.3rem', md: '1.8rem' },
								fontWeight: 700,
									color: '#0b1320',
								letterSpacing: '-0.02em',
							}}
						>
							PSX Closing Rates
						</Typography>
							<Typography sx={{ fontFamily: MONO, fontSize: 11, color: '#5a7090', mt: 0.4 }}>
							Pakistan Stock Exchange · daily closing data · 3 most recent trading days
						</Typography>
					</Box>

					{/* ── Tabs ── */}
					<Box sx={{ borderBottom: '1px solid #d8e4f5' }}>
						<Tabs
							value={activeTab}
							onChange={handleTabChange}
							sx={{
								minHeight: 40,
								'& .MuiTabs-indicator': { bgcolor: '#1f5fbf', height: 2 },
								'& .MuiTab-root': {
									fontFamily: MONO,
									fontSize: 12,
									fontWeight: 600,
									color: '#5a7090',
									textTransform: 'none',
									minHeight: 40,
									px: 2,
									'&.Mui-selected': { color: '#0f2a5f' },
								},
							}}
						>
							{SLOTS.map((slot) => {
								const d = slotData[slot]
								const status = slotStatus[slot]
								return (
									<Tab
										key={slot}
										value={slot}
										label={
											<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
												<span>{formatTabLabel(d, slot)}</span>
												{status === 'loading' && (
													<CircularProgress size={10} sx={{ color: '#6b84aa' }} />
												)}
												{status === 'ok' && d && (
													<Box
														component="span"
														sx={{
															fontSize: 10,
															color: '#6b84aa',
															fontFamily: MONO,
														}}
													>
														{d.total_stocks}
													</Box>
												)}
												{status === 'error' && (
													<Box component="span" sx={{ fontSize: 10, color: '#ef4444' }}>
														✕
													</Box>
												)}
											</Stack>
										}
									/>
								)
							})}
						</Tabs>
					</Box>

					{/* ── Tab content ── */}
					{slotStatus[activeTab] === 'loading' && (
						<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 6 }}>
							<CircularProgress size={16} sx={{ color: '#1f5fbf' }} />
							<Typography sx={{ fontFamily: MONO, fontSize: 12, color: '#5a7090' }}>
								Loading {activeTab}.json…
							</Typography>
						</Stack>
					)}

					{slotStatus[activeTab] === 'error' && (
						<Alert
							severity="error"
							sx={{
								bgcolor: '#fff5f5',
								border: '1px solid #f3c7c7',
								color: '#8b2d2d',
								fontFamily: MONO,
								fontSize: 12,
							}}
						>
							Could not load {activeTab}.json — the GitHub Action may not have run yet, or the file path is wrong.
							<br />
							Expected: <code>{DATA_BASE}/{activeTab}.json</code>
						</Alert>
					)}

					{slotStatus[activeTab] === 'ok' && activeData && (
						<>
							{/* ── Stat cards ── */}
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
									gap: 1.5,
								}}
							>
								{[
									{ label: 'Date', value: activeData.date, mono: true, color: '#94a3b8' },
									{ label: 'Total Stocks', value: activeData.total_stocks.toLocaleString(), color: '#94a3b8' },
									{ label: 'Source', value: activeData.source, mono: true, color: '#94a3b8' },
									{ label: 'Open Points', value: marketSummary.openPoints.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: '#f59e0b' },
									{ label: 'Close Points', value: marketSummary.closePoints.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: '#1f5fbf' },
									{ label: 'Volume Traded', value: marketSummary.volumeTraded.toLocaleString(), color: '#7c3aed' },
									{ label: 'Advancing', value: stats.gainers.toLocaleString(), color: '#22c55e' },
									{ label: 'Declining', value: stats.losers.toLocaleString(), color: '#ef4444' },
									{ label: 'Unchanged', value: stats.unchanged.toLocaleString(), color: '#64748b' },
								].map(({ label, value, mono, color }) => (
									<Paper
										key={label}
										sx={{
											p: 1.5,
											bgcolor: '#ffffff',
											border: '1px solid #d3e0f4',
											borderRadius: 1.2,
										}}
									>
										<Typography sx={{ color: '#6b84aa', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.4 }}>
											{label}
										</Typography>
										<Typography sx={{ color, fontSize: { xs: 16, md: 20 }, fontWeight: 700, fontFamily: mono ? MONO : 'inherit' }}>
											{value}
										</Typography>
									</Paper>
								))}
							</Box>

							{/* ── Search ── */}
							<TextField
								placeholder="Search symbol or company name…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								size="small"
								fullWidth
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<SearchIcon sx={{ color: '#6b84aa', fontSize: 16 }} />
											</InputAdornment>
										),
									},
								}}
								sx={{
									'& .MuiOutlinedInput-root': {
										bgcolor: '#ffffff',
										color: '#253750',
										fontFamily: MONO,
										fontSize: 12,
										borderRadius: 1,
										'& fieldset': { borderColor: '#c9d9f2' },
										'&:hover fieldset': { borderColor: '#87a6d3' },
										'&.Mui-focused fieldset': { borderColor: '#1f5fbf' },
									},
									'& input::placeholder': { color: '#7d95b8', opacity: 1 },
								}}
							/>

							<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
								<TextField
									select
									size="small"
									label="Movement"
									value={movementFilter}
									onChange={(e) => setMovementFilter(e.target.value as MovementFilter)}
									slotProps={{ select: { native: true } }}
									sx={{
										minWidth: { xs: '100%', md: 180 },
										'& .MuiOutlinedInput-root': {
											bgcolor: '#ffffff',
											fontFamily: MONO,
											fontSize: 12,
											'& fieldset': { borderColor: '#c9d9f2' },
											'&:hover fieldset': { borderColor: '#87a6d3' },
											'&.Mui-focused fieldset': { borderColor: '#1f5fbf' },
										},
									}}
								>
									<option value="all">All</option>
									<option value="gainers">Gainers</option>
									<option value="losers">Losers</option>
									<option value="unchanged">Unchanged</option>
								</TextField>

								<TextField
									size="small"
									label="Min Turnover"
									type="number"
									value={minTurnover}
									onChange={(e) => setMinTurnover(e.target.value)}
									sx={{
										minWidth: { xs: '100%', md: 160 },
										'& .MuiOutlinedInput-root': {
											bgcolor: '#ffffff',
											fontFamily: MONO,
											fontSize: 12,
											'& fieldset': { borderColor: '#c9d9f2' },
											'&:hover fieldset': { borderColor: '#87a6d3' },
											'&.Mui-focused fieldset': { borderColor: '#1f5fbf' },
										},
									}}
								/>

								<TextField
									size="small"
									label="Min Last"
									type="number"
									value={minLastRate}
									onChange={(e) => setMinLastRate(e.target.value)}
									sx={{
										minWidth: { xs: '100%', md: 130 },
										'& .MuiOutlinedInput-root': {
											bgcolor: '#ffffff',
											fontFamily: MONO,
											fontSize: 12,
											'& fieldset': { borderColor: '#c9d9f2' },
											'&:hover fieldset': { borderColor: '#87a6d3' },
											'&.Mui-focused fieldset': { borderColor: '#1f5fbf' },
										},
									}}
								/>

								<TextField
									size="small"
									label="Max Last"
									type="number"
									value={maxLastRate}
									onChange={(e) => setMaxLastRate(e.target.value)}
									sx={{
										minWidth: { xs: '100%', md: 130 },
										'& .MuiOutlinedInput-root': {
											bgcolor: '#ffffff',
											fontFamily: MONO,
											fontSize: 12,
											'& fieldset': { borderColor: '#c9d9f2' },
											'&:hover fieldset': { borderColor: '#87a6d3' },
											'&.Mui-focused fieldset': { borderColor: '#1f5fbf' },
										},
									}}
								/>
							</Stack>

							{search && (
								<Typography sx={{ fontFamily: MONO, fontSize: 11, color: '#5a7090' }}>
									{displayedStocks.length} of {stocks.length} symbols
								</Typography>
							)}

							{/* ── Table ── */}
							<TableContainer
								component={Paper}
								sx={{
									bgcolor: '#ffffff',
									border: '1px solid #d3e0f4',
									borderRadius: 1.5,
									maxHeight: { xs: 560, md: 700 },
								}}
							>
								<Table stickyHeader size="small" aria-label="PSX stocks table">
									<TableHead>
										<TableRow>
											<SortCell id="symbol"    label="SYMBOL"   align="left" />
											<SortCell id="company"   label="COMPANY"  align="left" />
											<SortCell id="turnover"  label="TURNOVER"  />
											<SortCell id="prev_rate" label="PREV"      />
											<SortCell id="open"      label="OPEN"      />
											<SortCell id="high"      label="HIGH"      />
											<SortCell id="low"       label="LOW"       />
											<SortCell id="last_rate" label="LAST"      />
											<SortCell id="change"    label="CHG"       />
										</TableRow>
									</TableHead>

									<TableBody>
										{pagedStocks.map((stock, i) => {
											const chgColor = changeColor(stock.change)
											const chgN = changeVal(stock.change)
											return (
												<TableRow
													key={`${stock.symbol}-${page}-${i}`}
													hover
													sx={{
														'&:hover': { bgcolor: '#f3f8ff' },
														'& td': { borderBottom: '1px solid #e5eefb' },
													}}
												>
													{/* Symbol */}
													<TableCell
														sx={{
															color: '#1f5fbf',
															fontFamily: MONO,
															fontWeight: 700,
															fontSize: 12,
															whiteSpace: 'nowrap',
															py: 0.8,
														}}
													>
														{stock.symbol}
													</TableCell>

													{/* Company */}
													<TableCell
														sx={{
															color: '#4f6688',
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

													{/* Turnover */}
													<TableCell align="right" sx={{ color: '#4f6688', fontFamily: MONO, fontSize: 11 }}>
														{fmtNum(stock.turnover)}
													</TableCell>

													{/* Prev */}
													<TableCell align="right" sx={{ color: '#4f6688', fontFamily: MONO, fontSize: 12 }}>
														{stock.prev_rate || '—'}
													</TableCell>

													{/* Open */}
													<TableCell align="right" sx={{ color: '#4f6688', fontFamily: MONO, fontSize: 12 }}>
														{stock.open || '—'}
													</TableCell>

													{/* High */}
													<TableCell align="right" sx={{ color: '#22c55e', fontFamily: MONO, fontSize: 12 }}>
														{stock.high || '—'}
													</TableCell>

													{/* Low */}
													<TableCell align="right" sx={{ color: '#ef4444', fontFamily: MONO, fontSize: 12 }}>
														{stock.low || '—'}
													</TableCell>

													{/* Last */}
													<TableCell
														align="right"
														sx={{
															color: '#0f2a5f',
															fontFamily: MONO,
															fontWeight: 700,
															fontSize: 13,
															whiteSpace: 'nowrap',
														}}
													>
														{stock.last_rate || '—'}
													</TableCell>

													{/* Change */}
													<TableCell
														align="right"
														sx={{
															color: chgColor,
															fontFamily: MONO,
															fontWeight: 600,
															fontSize: 12,
															whiteSpace: 'nowrap',
														}}
													>
														<Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
															{!isNaN(chgN) && chgN !== 0 && (
																chgN > 0
																	? <TrendingUpIcon sx={{ fontSize: 12 }} />
																	: <TrendingDownIcon sx={{ fontSize: 12 }} />
															)}
															{!isNaN(chgN) && chgN === 0 && (
																<RemoveIcon sx={{ fontSize: 12 }} />
															)}
															<span>
																{stock.change
																	? `${changeSign(stock.change)}${stock.change}`
																	: '—'}
															</span>
														</Stack>
													</TableCell>
												</TableRow>
											)
										})}

										{displayedStocks.length === 0 && search && (
											<TableRow>
												<TableCell
													colSpan={9}
													align="center"
															sx={{ color: '#6b84aa', fontFamily: MONO, fontSize: 12, py: 5 }}
												>
													No symbols match &quot;{search}&quot;
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
								<TablePagination
									component="div"
									count={displayedStocks.length}
									page={page}
									onPageChange={(_, newPage) => setPage(newPage)}
									rowsPerPage={rowsPerPage}
									onRowsPerPageChange={(e) => {
										setRowsPerPage(parseInt(e.target.value, 10))
										setPage(0)
									}}
									rowsPerPageOptions={[10, 25, 50, 100]}
									sx={{
										borderTop: '1px solid #e5eefb',
										bgcolor: '#f8fbff',
										'& .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiInputBase-root': {
											fontFamily: MONO,
											fontSize: 12,
											color: '#4f6688',
										},
									}}
								/>
							</TableContainer>
						</>
					)}
				</Stack>
			</Container>
		</Box>
	)
}