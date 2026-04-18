import {
	Alert,
	Box,
	Container,
	InputAdornment,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { hasSupabaseConfig, supabase } from '../../lib/supabase'
import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { PriceTableSkeleton, StatCardsSkeleton, TabLabelSkeleton } from './CustomSkeleton'
import { CustomDataTable } from './CustomDataTable'
import { CustomStatsCards } from './CustomStatsCards'

// ── Types ────────────────────────────────────────────────────────────────────

type PsxStock = {
	symbol: string
	company: string
	section: string | null
	industry: string | null
	turnover: string | number | null
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

function changeVal(change: string | number | null | undefined): number {
	return toNum(change)
}

function mapDbStockToPsxStock(stock: DbStockRow): PsxStock {
	return {
		symbol: stock.symbol,
		company: stock.company,
		section: stock.section,
		industry: stock.section,
		turnover: stock.turnover,
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

// ── Component ─────────────────────────────────────────────────────────────────

export function DataPage() {
	const [slotData, setSlotData] = useState<Record<SlotKey, PsxData | null>>(() => buildSlotRecord<PsxData | null>(null))
	const [slotStatus, setSlotStatus] = useState<Record<SlotKey, 'idle' | 'loading' | 'ok' | 'error'>>(() => buildSlotRecord<'idle' | 'loading' | 'ok' | 'error'>('loading'))
	const [slotError, setSlotError] = useState<Record<SlotKey, string | null>>(() => buildSlotRecord<string | null>(null))
	const [slotTradeDate, setSlotTradeDate] = useState<Record<SlotKey, string | null>>(() => buildSlotRecord<string | null>(null))
	const [activeTab, setActiveTab] = useState<SlotKey>('day1')
	const [search, setSearch] = useState('')
	const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
	// const [sectionFilter, setSectionFilter] = useState('all')
	const [industryFilter, setIndustryFilter] = useState('all')
	// const [minTurnover, setMinTurnover] = useState('')
	// const [minLastRate, setMinLastRate] = useState('')
	// const [maxLastRate, setMaxLastRate] = useState('')

	const loadSlotData = useCallback(async (slot: SlotKey, tradeDate: string) => {
		setSlotStatus((prev) => ({ ...prev, [slot]: 'loading' }))
		setSlotError((prev) => ({ ...prev, [slot]: null }))
		try {
			const data = await fetchSupabaseTradeDay(tradeDate)
			setSlotData((prev) => ({ ...prev, [slot]: data }))
			setSlotStatus((prev) => ({ ...prev, [slot]: 'ok' }))
		} catch (error: unknown) {
			const message =
			typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
				? error.message
				: 'Unknown error while querying Supabase.'
			setSlotError((prev) => ({ ...prev, [slot]: message }))
			setSlotStatus((prev) => ({ ...prev, [slot]: 'error' }))
		}
	}, [])

	// Fetch latest trade dates list from Supabase on mount and lazy-load first tab only.
	useEffect(() => {
		let cancelled = false

		async function loadSupabaseData() {
			if (!hasSupabaseConfig || !supabase) {
				setSlotError(buildSlotRecord<string | null>('Supabase env vars are missing.'))
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
					const message = datesResult.error?.message ?? 'Failed to fetch trade dates from Supabase.'
					setSlotError(buildSlotRecord<string | null>(message))
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
			setSlotError(buildSlotRecord<string | null>(null))
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
		setMovementFilter('all')
		// setSectionFilter('all')
		setIndustryFilter('all')
		// setMinTurnover('')
		// setMinLastRate('')
		// setMaxLastRate('')

		if (slotStatus[val] === 'idle' && slotTradeDate[val]) {
			void loadSlotData(val, slotTradeDate[val] as string)
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

		return filteredByMeta
	}, [stocks, search, movementFilter, industryFilter])

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

	const FiltersBar = ({ disabled }: { disabled: boolean }) => (
		<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
			<TextField
				placeholder="Search symbol or company name…"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				disabled={disabled}
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
				disabled={disabled}
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
				disabled={disabled}
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
												{status === 'loading' ? (
													<TabLabelSkeleton />
												) : (
													<span>{formatTabLabel(d, slot, tradeDate)}</span>
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
						<>
							<StatCardsSkeleton />
							<FiltersBar disabled />
							<PriceTableSkeleton />
						</>
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
								{slotError[activeTab] && (
									<>
										<br />
										Supabase error: <code>{slotError[activeTab]}</code>
										<br />
										If RLS is enabled, add <code>SELECT</code> policies for the <code>anon</code> role on
										 <code>market_daily_summary</code> and <code>datatable</code>.
									</>
								)}
						</Alert>
					)}

					{slotStatus[activeTab] === 'ok' && activeData && (
						<>
							{/* ── Stat cards ── */}
							<CustomStatsCards
								date={activeData.date}
								kse100Open={marketSummary.KSE100_Open}
								kse100Close={marketSummary.KSE100_Close}
								kse100Change={marketSummary.KSE100_Change}
								volumeTraded={marketSummary.Volume_Traded}
								advances={stats.gainers}
								declines={stats.losers}
								unchanged={stats.unchanged}
								monoFont={MONO}
							/>

							{/* ── Filters ── */}
							<FiltersBar disabled={false} />

							{search && (
								<Typography sx={{ fontFamily: MONO, fontSize: 11, color: '#5a7090' }}>
									{displayedStocks.length} of {stocks.length} symbols
								</Typography>
							)}

							{/* ── Table ── */}
							<CustomDataTable rows={displayedStocks} searchQuery={search} monoFont={MONO} />
						</>
					)}
				</Stack>
			</Container>
		</Box>
	)
}