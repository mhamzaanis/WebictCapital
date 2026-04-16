import {
	Alert,
	Box,
	CircularProgress,
	Container,
	Grid,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { MotionReveal } from '../animations/MotionReveal'

type PsxStock = {
	symbol: string
	company: string
	turnover: string
	prev_rate: string
	open: string
	high: string
	low: string
	last_rate: string
	change?: string | null
}

type PsxData = {
	date: string
	indices?: Record<string, string | number>
	stocks?: PsxStock[]
	total_stocks?: number
	source?: string
	raw?: string
}

const REPO_RAW_BASE = 'https://raw.githubusercontent.com/mhamzanis/WebictCapital/main/data'
const LOCAL_TEST_DATE = '2026-04-15'
const LOCAL_TEST_URL = `/data/closing-${LOCAL_TEST_DATE}.json`

export function DataPage() {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<PsxData | null>(null)
	const [loadedFileDate, setLoadedFileDate] = useState<string | null>(null)

	const today = useMemo(() => new Date().toISOString().split('T')[0], [])
	const yesterday = useMemo(() => {
		const now = new Date()
		now.setDate(now.getDate() - 1)
		return now.toISOString().split('T')[0]
	}, [])

	useEffect(() => {
		const controller = new AbortController()

		const loadData = async () => {
			try {
				setLoading(true)
				setError(null)
				setLoadedFileDate(null)

				const candidateDates = [today, yesterday]

				for (const candidateDate of candidateDates) {
					const url = `${REPO_RAW_BASE}/closing-${candidateDate}.json`
					const response = await fetch(url, { signal: controller.signal })

					if (response.ok) {
						const payload = (await response.json()) as PsxData
						console.log(`PSX Data loaded from ${candidateDate}:`, payload)
						setData(payload)
						setLoadedFileDate(candidateDate)
						return
					}

					if (response.status !== 404) {
						throw new Error(`Failed to load closing-${candidateDate}.json (status ${response.status}).`)
					}
				}

				// Temporary local fallback so UI can be tested before GitHub Action publishes data files.
				const localResponse = await fetch(LOCAL_TEST_URL, { signal: controller.signal })
				if (localResponse.ok) {
					const payload = (await localResponse.json()) as PsxData
					console.log(`PSX Data loaded from local fallback ${LOCAL_TEST_DATE}:`, payload)
					setData(payload)
					setLoadedFileDate(LOCAL_TEST_DATE)
					return
				}

				throw new Error(`No data file found for ${today} or ${yesterday}, and local test fallback is missing.`)
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') {
					return
				}
				const message = err instanceof Error ? err.message : 'Failed to load PSX data.'
				setError(message)
			} finally {
				setLoading(false)
			}
		}

		void loadData()

		return () => controller.abort()
	}, [today, yesterday])

	const stocks = data?.stocks ?? []

	return (
		<Box
			component="main"
			sx={{
				pt: { xs: 'calc(64px + 1.6rem)', md: 'calc(72px + 2rem)' },
				pb: { xs: 7, md: 11 },
				bgcolor: '#f6faff',
				backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #edf5ff 52%, #e8f1ff 100%)',
			}}
		>
			<Container maxWidth="xl" sx={{ maxWidth: '1240px !important', px: { xs: 2, md: 3.5 } }}>
				<Stack spacing={{ xs: 2, md: 3 }}>
					<MotionReveal>
						<Box
							sx={{
								border: '1px solid',
								borderColor: '#cddcf2',
								borderRadius: 1.6,
								p: { xs: 2.2, md: 3.2 },
								bgcolor: 'rgba(255,255,255,0.9)',
							}}
						>
							<Typography variant="h1" sx={{ fontSize: { xs: '1.9rem', md: '2.6rem' }, color: '#0b1320' }}>
								PSX Daily Market Data
							</Typography>
							<Typography sx={{ mt: 1, color: '#3d516f', fontSize: { xs: 14, md: 15.5 } }}>
								Source file: <code>data/closing-{loadedFileDate ?? today}.json</code>
							</Typography>
						</Box>
					</MotionReveal>

					{loading && (
						<Paper sx={{ p: 3, borderRadius: 1.4, border: '1px solid #d6e3f7', bgcolor: '#fff' }}>
							  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
								<CircularProgress size={20} />
								<Typography sx={{ color: '#1b2f4f' }}>Loading today&apos;s PSX data...</Typography>
							</Stack>
						</Paper>
					)}

					{!loading && error && <Alert severity="warning">{error}</Alert>}

					{!loading && !error && data && loadedFileDate === yesterday && (
						<Alert severity="info">
							Today&apos;s file is not available yet. Showing yesterday&apos;s data ({yesterday}) for testing.
						</Alert>
					)}

					{!loading && !error && data && (
						<>
							<Grid container spacing={1.4}>
								<Grid size={{ xs: 12, md: 4 }}>
									<Paper sx={{ p: 2, border: '1px solid #d3e0f4', borderRadius: 1.2 }}>
										<Typography sx={{ color: '#4b6282', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
											Trading Date
										</Typography>
										<Typography sx={{ color: '#0f2a5f', fontSize: 22, fontWeight: 600 }}>{data.date || today}</Typography>
									</Paper>
								</Grid>
								<Grid size={{ xs: 12, md: 4 }}>
									<Paper sx={{ p: 2, border: '1px solid #d3e0f4', borderRadius: 1.2 }}>
										<Typography sx={{ color: '#4b6282', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
											Total Stocks
										</Typography>
										<Typography sx={{ color: '#0f2a5f', fontSize: 22, fontWeight: 600 }}>{data.total_stocks ?? stocks.length}</Typography>
									</Paper>
								</Grid>
								<Grid size={{ xs: 12, md: 4 }}>
									<Paper sx={{ p: 2, border: '1px solid #d3e0f4', borderRadius: 1.2 }}>
										<Typography sx={{ color: '#4b6282', fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
											Data Source
										</Typography>
										<Typography sx={{ color: '#0f2a5f', fontSize: 22, fontWeight: 600 }}>{data.source ?? 'PDF fallback'}</Typography>
									</Paper>
								</Grid>
							</Grid>

							{!!data.indices && (
								<Paper sx={{ p: 2, border: '1px solid #d3e0f4', borderRadius: 1.2 }}>
									<Typography sx={{ color: '#0f2a5f', fontWeight: 600, mb: 1.2 }}>Indices</Typography>
									<Grid container spacing={1.2}>
										{Object.entries(data.indices).map(([name, value]) => (
											<Grid key={name} size={{ xs: 6, md: 3 }}>
												<Box sx={{ p: 1.2, border: '1px solid #dfebfb', borderRadius: 1, bgcolor: '#f8fbff' }}>
													<Typography sx={{ color: '#5a7090', fontSize: 12 }}>{name}</Typography>
													<Typography sx={{ color: '#0f2a5f', fontWeight: 700 }}>{value}</Typography>
												</Box>
											</Grid>
										))}
									</Grid>
								</Paper>
							)}

							{stocks.length > 0 && (
								<TableContainer
									component={Paper}
									sx={{
										border: '1px solid #d3e0f4',
										borderRadius: 1.2,
										maxHeight: { xs: 500, md: 620 },
									}}
								>
									<Table stickyHeader size="small" aria-label="PSX stocks table">
										<TableHead>
											<TableRow>
												<TableCell>Symbol</TableCell>
												<TableCell>Company</TableCell>
												<TableCell align="right">Turnover</TableCell>
												<TableCell align="right">Prev</TableCell>
												<TableCell align="right">Open</TableCell>
												<TableCell align="right">High</TableCell>
												<TableCell align="right">Low</TableCell>
												<TableCell align="right">Last</TableCell>
												<TableCell align="right">Change</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{stocks.map((stock) => (
												<TableRow key={`${stock.symbol}-${stock.company}`} hover>
													<TableCell sx={{ fontWeight: 700 }}>{stock.symbol}</TableCell>
													<TableCell>{stock.company}</TableCell>
													<TableCell align="right">{stock.turnover}</TableCell>
													<TableCell align="right">{stock.prev_rate}</TableCell>
													<TableCell align="right">{stock.open}</TableCell>
													<TableCell align="right">{stock.high}</TableCell>
													<TableCell align="right">{stock.low}</TableCell>
													<TableCell align="right">{stock.last_rate}</TableCell>
													<TableCell align="right">{stock.change ?? '-'}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}

							{data.raw && (
								<Paper sx={{ p: 2, border: '1px solid #d3e0f4', borderRadius: 1.2 }}>
									<Typography sx={{ color: '#0f2a5f', fontWeight: 600, mb: 1 }}>Raw Preview</Typography>
									<Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12, color: '#33455f' }}>
										{data.raw}
									</Box>
								</Paper>
							)}
						</>
					)}
				</Stack>
			</Container>
		</Box>
	)
}
