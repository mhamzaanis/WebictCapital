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
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { useCallback, useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type PsxStock = {
	symbol: string
	company: string
	section: string | null
	industry: string | null
	turnover: string | number | null
	prev_rate: string | number | null
	open: string | number | null
	high: string | number | null
	low: string | number | null
	last_rate: string | number | null
	change: string | number | null
}

type PsxData = {
	date: string
	source: 'Supabase'
	market?: {
		open_kse100?: number
		close_kse100?: number
		curr_volume?: number
		advances?: number
		declines?: number
		unchanged?: number
		kse100_change?: number
	}
	total_stocks: number
	stocks: PsxStock[]
}

type DbStockRow = {
	symbol: string
	company: string
	section: string | null
	open: number | null
	high: number | null
	low: number | null
	close: number | null
	turnover: number | null
	change: number | null
}

type DbSummaryRow = {
	trade_date: string
	kse100_prev: number | null
	kse100_close: number | null
	kse100_change: number | null
	curr_volume: number | null
	advances: number | null
	declines: number | null
	unchanged: number | null
}

type SlotKey = string
type SortKey = keyof PsxStock
type SortDir = 'asc' | 'desc'
type MovementFilter = 'all' | 'gainers' | 'losers' | 'unchanged'

// ── Constants ─────────────────────────────────────────────────────────────────

const TAB_COUNT = 10
const SLOTS: SlotKey[] = Array.from({ length: TAB_COUNT }, (_, idx) => `day${idx + 1}`)

function buildSlotRecord<T>(initialValue: T): Record<SlotKey, T> {
	return Object.fromEntries(SLOTS.map((slot) => [slot, initialValue])) as Record<SlotKey, T>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
	if (isNaN(n) || n === 0) return '#64748b'
	return n > 0 ? '#22c55e' : '#ef4444'
}

function changeSign(change: string | number | null | undefined): string {
	const n = changeVal(change)
	if (isNaN(n) || n === 0) return ''
	return n > 0 ? '+' : ''
}

function mapDbStockToPsxStock(stock: DbStockRow): PsxStock {
	return {
		symbol: stock.symbol,
		company: stock.company,
		section: stock.section,
		industry: stock.section,
		turnover: stock.turnover,
		prev_rate:
			stock.close !== null && stock.change !== null
				? Number(stock.close) - Number(stock.change)
				: null,
		open: stock.open,
		high: stock.high,
		low: stock.low,
		last_rate: stock.close,
		change: stock.change,
	}
}

async function fetchSupabaseTradeDay(tradeDate: string): Promise<PsxData> {
	if (!supabase) {
		throw new Error('Supabase client is not configured')
	}

	const [summaryResult, stocksResult] = await Promise.all([
		supabase
			.from('market_daily_summary')
			.select('trade_date,kse100_prev,kse100_close,kse100_change,curr_volume,advances,declines,unchanged')
			.eq('trade_date', tradeDate)
			.single<DbSummaryRow>(),
		supabase
			.from('datatable')
			.select('symbol,company,section,open,high,low,close,turnover,change')
			.eq('trade_date', tradeDate)
			.order('symbol', { ascending: true }),
	])

	if (summaryResult.error) {
		throw summaryResult.error
	}
	if (stocksResult.error) {
		throw stocksResult.error
	}

	const rows = ((stocksResult.data ?? []) as DbStockRow[]).map(mapDbStockToPsxStock)

	return {
		date: tradeDate,
		source: 'Supabase',
		market: summaryResult.data
			? {
					open_kse100: summaryResult.data.kse100_prev ?? undefined,
					close_kse100: summaryResult.data.kse100_close ?? undefined,
					kse100_change: summaryResult.data.kse100_change ?? undefined,
					curr_volume: summaryResult.data.curr_volume ?? undefined,
					advances: summaryResult.data.advances ?? undefined,
					declines: summaryResult.data.declines ?? undefined,
					unchanged: summaryResult.data.unchanged ?? undefined,
			  }
			: undefined,
		total_stocks: rows.length,
		stocks: rows,
	}
}

function compareCells(a: PsxStock, b: PsxStock, key: SortKey): number {
	const numericKeys: SortKey[] = ['turnover', 'prev_rate', 'open', 'high', 'low', 'last_rate', 'change']
	if (numericKeys.includes(key)) {
		const an = toNum(a[key])
		const bn = toNum(b[key])
		if (!isNaN(an) && !isNaN(bn)) return an - bn
	}
	return (a[key] ?? '').toString().localeCompare((b[key] ?? '').toString())
}

function formatTabLabel(data: PsxData | null, slot: SlotKey, tradeDate?: string): string {
	if (!data && !tradeDate) return slot.toUpperCase()
	// e.g. "Mon 14 Apr"
	try {
		const src = data?.date ?? tradeDate
		if (!src) return slot.toUpperCase()
		const d = new Date(src + 'T00:00:00')
		return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
	} catch {
		return data?.date ?? tradeDate ?? slot.toUpperCase()
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
	const [slotData, setSlotData] = useState<Record<SlotKey, PsxData | null>>(() => buildSlotRecord<PsxData | null>(null))
	const [slotStatus, setSlotStatus] = useState<Record<SlotKey, 'idle' | 'loading' | 'ok' | 'error'>>(() => buildSlotRecord<'idle' | 'loading' | 'ok' | 'error'>('loading'))
	const [slotTradeDate, setSlotTradeDate] = useState<Record<SlotKey, string | null>>(() => buildSlotRecord<string | null>(null))
	const [activeTab, setActiveTab] = useState<SlotKey>('day1')
	const [search, setSearch] = useState('')
	const [sortKey, setSortKey] = useState<SortKey>('symbol')
	const [sortDir, setSortDir] = useState<SortDir>('asc')
	const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
	// const [sectionFilter, setSectionFilter] = useState('all')
	const [industryFilter, setIndustryFilter] = useState('all')
	// const [minTurnover, setMinTurnover] = useState('')
	// const [minLastRate, setMinLastRate] = useState('')
	// const [maxLastRate, setMaxLastRate] = useState('')
	const [page, setPage] = useState(0)
	const [rowsPerPage, setRowsPerPage] = useState(25)

	const loadSlotData = useCallback(async (slot: SlotKey, tradeDate: string) => {
		setSlotStatus((prev) => ({ ...prev, [slot]: 'loading' }))
		try {
			const data = await fetchSupabaseTradeDay(tradeDate)
			setSlotData((prev) => ({ ...prev, [slot]: data }))
			setSlotStatus((prev) => ({ ...prev, [slot]: 'ok' }))
		} catch {
			setSlotStatus((prev) => ({ ...prev, [slot]: 'error' }))
		}
	}, [])

	// Fetch latest trade dates list from Supabase on mount and lazy-load first tab only.
	useEffect(() => {
		let cancelled = false

		async function loadSupabaseData() {
			if (!hasSupabaseConfig || !supabase) {
				setSlotStatus(buildSlotRecord<'idle' | 'loading' | 'ok' | 'error'>('error'))
				return
			}

			const datesResult = await supabase
				.from('market_daily_summary')
				.select('trade_date')
				.order('trade_date', { ascending: false })
				.limit(SLOTS.length)

			if (datesResult.error || !datesResult.data) {
				if (!cancelled) {
					setSlotStatus(buildSlotRecord<'idle' | 'loading' | 'ok' | 'error'>('error'))
				}
				return
			}

			if (cancelled) return

			const nextDates = buildSlotRecord<string | null>(null)
			const nextStatus = buildSlotRecord<'idle' | 'loading' | 'ok' | 'error'>('error')
			SLOTS.forEach((slot, idx) => {
				const tradeDate = datesResult.data[idx]?.trade_date ?? null
				nextDates[slot] = tradeDate
				nextStatus[slot] = tradeDate ? 'idle' : 'error'
			})

			setSlotTradeDate(nextDates)
			setSlotData(buildSlotRecord<PsxData | null>(null))
			setSlotStatus(nextStatus)

			const firstSlot = SLOTS.find((slot) => nextDates[slot]) ?? SLOTS[0]
			setActiveTab(firstSlot)

			const firstDate = nextDates[firstSlot]
			if (firstDate) {
				await loadSlotData(firstSlot, firstDate)
			}
		}

		loadSupabaseData()

		return () => {
			cancelled = true
		}
	}, [loadSlotData])

	// Reset search + sort when switching tabs
	const handleTabChange = (_: SyntheticEvent, val: SlotKey) => {
		setActiveTab(val)
		setSearch('')
		setSortKey('symbol')
		setSortDir('asc')
		setMovementFilter('all')
		// setSectionFilter('all')
		setIndustryFilter('all')
		// setMinTurnover('')
		// setMinLastRate('')
		// setMaxLastRate('')
		setPage(0)

		if (slotStatus[val] === 'idle' && slotTradeDate[val]) {
			void loadSlotData(val, slotTradeDate[val] as string)
		}
	}

	const handleSort = (key: SortKey) => {
		if (key === sortKey) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
		} else {
			setSortKey(key)
			setSortDir('asc')
		}
	}

	const activeData = slotData[activeTab] ?? null
	const stocks = activeData?.stocks ?? []

	const industryOptions = useMemo(
		() => Array.from(new Set(stocks.map((s) => s.industry).filter((s): s is string => Boolean(s)))).sort(),
		[stocks],
	)

	const displayedStocks = useMemo(() => {
		const q = search.trim().toLowerCase()
		// const minTurnoverNum = minTurnover.trim() === '' ? NaN : parseFloat(minTurnover)
		// const minLastNum = minLastRate.trim() === '' ? NaN : parseFloat(minLastRate)
		// const maxLastNum = maxLastRate.trim() === '' ? NaN : parseFloat(maxLastRate)

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

		const filteredByMeta = filteredByMovement.filter((s) => {
			// if (sectionFilter !== 'all' && s.section !== sectionFilter) return false
			if (industryFilter !== 'all' && s.industry !== industryFilter) return false
			return true
		})

		const filteredByRange = filteredByMeta

		return [...filteredByRange].sort((a, b) => {
			const cmp = compareCells(a, b, sortKey)
			return sortDir === 'asc' ? cmp : -cmp
		})
	}, [stocks, search, sortKey, sortDir, movementFilter, industryFilter, ])

	const pagedStocks = useMemo(() => {
		const start = page * rowsPerPage
		return displayedStocks.slice(start, start + rowsPerPage)
	}, [displayedStocks, page, rowsPerPage])

	useEffect(() => {
		setPage(0)
	}, [search, movementFilter, industryFilter, rowsPerPage, activeTab])

	const stats = useMemo(() => {
		const market = activeData?.market
		if (market) {
			return {
				gainers: market.advances ?? 0,
				losers: market.declines ?? 0,
				unchanged: market.unchanged ?? 0,
			}
		}

		const gainers = stocks.filter((s) => changeVal(s.change) > 0).length
		const losers = stocks.filter((s) => changeVal(s.change) < 0).length
		const unchanged = stocks.filter((s) => {
			const n = changeVal(s.change)
			return !isNaN(n) && n === 0
		}).length
		return { gainers, losers, unchanged }
	}, [stocks, activeData])

	const marketSummary = useMemo(() => {
		const market = activeData?.market
		if (market) {
			return {
				KSE100_Open: market.open_kse100 ?? 0,
				KSE100_Close: market.close_kse100 ?? 0,
				Volume_Traded: market.curr_volume ?? 0,
				KSE100_Change: market.kse100_change ?? (market.close_kse100 ?? 0) - (market.open_kse100 ?? 0),
			}
		}

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
			KSE100_Open: totalOpenPoints,
			KSE100_Close: totalClosePoints,
			Volume_Traded: totalVolume,
			KSE100_Change: totalClosePoints - totalOpenPoints,
		}
	}, [stocks, activeData])

	const kseChangeColor =
		marketSummary.KSE100_Change > 0
			? '#22c55e'
			: marketSummary.KSE100_Change < 0
				? '#ef4444'
				: '#64748b'

	const statValueColor = '#0f2a5f'

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
								Pakistan Stock Exchange · daily closing data · 10 most recent trading days
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
								const tradeDate = slotTradeDate[slot] ?? undefined
								return (
									<Tab
										key={slot}
										value={slot}
										label={
											<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
												<span>{formatTabLabel(d, slot, tradeDate)}</span>
												{status === 'loading' && (
													<CircularProgress size={10} sx={{ color: '#6b84aa' }} />
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
								Loading selected trade date…
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
							Could not load {activeTab} from Supabase. Please verify DB access and env vars.
							<br />
							Expected envs: <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>
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
										{ label: 'Date', value: activeData.date, color: statValueColor },
										{ label: 'KSE 100 Open Points', value: marketSummary.KSE100_Open.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: statValueColor },
										{ label: 'KSE 100 Close Points', value: marketSummary.KSE100_Close.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: statValueColor },
										{
											label: 'KSE 100 Change',
											value: `${changeSign(marketSummary.KSE100_Change)}${marketSummary.KSE100_Change.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
											color: kseChangeColor,
											icon:
												marketSummary.KSE100_Change > 0
													? <TrendingUpIcon sx={{ fontSize: 18, color: kseChangeColor }} />
													: marketSummary.KSE100_Change < 0
														? <TrendingDownIcon sx={{ fontSize: 18, color: kseChangeColor }} />
														: <RemoveIcon sx={{ fontSize: 18, color: kseChangeColor }} />,
										},
										{ label: 'Volume Traded', value: marketSummary.Volume_Traded.toLocaleString(), color: statValueColor },
										{ label: 'Advancing', value: stats.gainers.toLocaleString(), color: statValueColor },
										{ label: 'Declining', value: stats.losers.toLocaleString(), color: statValueColor },
										{ label: 'Unchanged', value: stats.unchanged.toLocaleString(), color: statValueColor },
									
									].map(({ label, value, color, icon }: { label: string; value: string | number; color: string; icon?: ReactNode }) => (
									<Paper
										key={label}
										sx={{
											p: 1.5,
											bgcolor: '#ffffff',
											border: '1px solid #d3e0f4',
											borderRadius: 1.2,
										}}
									>
										<Typography sx={{ color: '#6b84aa', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.4, fontFamily: MONO }}>
											{label}
										</Typography>
										<Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
											{icon}
											<Typography sx={{ color, fontSize: { xs: 16, md: 20 }, fontWeight: 700, fontFamily: MONO }}>
												{value}
											</Typography>
										</Stack>
									</Paper>
								))}
							</Box>

							{/* ── Filters ── */}
							<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
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
										width: { xs: '100%', md: '50%' },
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

								<TextField
									select
									size="small"
									label="Movement"
									value={movementFilter}
									onChange={(e) => setMovementFilter(e.target.value as MovementFilter)}
									slotProps={{ select: { native: true } }}
									sx={{
										width: { xs: '100%', md: '25%' },
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
									select
									size="small"
									label="Industry"
									value={industryFilter}
									onChange={(e) => setIndustryFilter(e.target.value)}
									slotProps={{ select: { native: true } }}
									sx={{
										width: { xs: '100%', md: '25%' },
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
									<option value="all">All Industries</option>
									{industryOptions.map((industry) => (
										<option key={industry} value={industry}>{industry}</option>
									))}
								</TextField>

								
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
																{stock.change === null || stock.change === undefined || stock.change === ''
																	? '—'
																	: `${changeSign(stock.change)}${stock.change}`}
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