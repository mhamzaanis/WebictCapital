import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Paper, Stack, Typography } from '@mui/material'

type CustomStatsCardsProps = {
	date: string
	kse100Open: number
	kse100Close: number
	kse100Change: number
	volumeTraded: number
	advances: number
	declines: number
	unchanged: number
	monoFont: string
}

function changeColor(change: number): string {
	if (!Number.isFinite(change) || change === 0) return '#64748b'
	return change > 0 ? '#22c55e' : '#ef4444'
}

function changeSign(change: number): string {
	if (!Number.isFinite(change) || change === 0) return ''
	return change > 0 ? '+' : ''
}

export function CustomStatsCards({
	date,
	kse100Open,
	kse100Close,
	kse100Change,
	volumeTraded,
	advances,
	declines,
	unchanged,
	monoFont,
}: CustomStatsCardsProps) {
	const statValueColor = '#0f2a5f'
	const kseChangeColor = changeColor(kse100Change)

	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
				gap: 1.5,
			}}
		>
			{[
				{ label: 'Date', value: date, color: statValueColor },
				{
					label: 'KSE 100 Open Points',
					value: kse100Open.toLocaleString(undefined, { maximumFractionDigits: 2 }),
					color: statValueColor,
				},
				{
					label: 'KSE 100 Close Points',
					value: kse100Close.toLocaleString(undefined, { maximumFractionDigits: 2 }),
					color: statValueColor,
				},
				{
					label: 'KSE 100 Change',
					value: `${changeSign(kse100Change)}${kse100Change.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
					color: kseChangeColor,
					icon:
						kse100Change > 0 ? (
							<TrendingUpIcon sx={{ fontSize: 18, color: kseChangeColor }} />
						) : kse100Change < 0 ? (
							<TrendingDownIcon sx={{ fontSize: 18, color: kseChangeColor }} />
						) : (
							<RemoveIcon sx={{ fontSize: 18, color: kseChangeColor }} />
						),
				},
				{ label: 'Volume Traded', value: volumeTraded.toLocaleString(), color: statValueColor },
				{ label: 'Advancing', value: advances.toLocaleString(), color: statValueColor },
				{ label: 'Declining', value: declines.toLocaleString(), color: statValueColor },
				{ label: 'Unchanged', value: unchanged.toLocaleString(), color: statValueColor },
			].map(({ label, value, color, icon }) => (
				<Paper
					key={label}
					sx={{
						p: 1.5,
						bgcolor: '#ffffff',
						border: '1px solid #d3e0f4',
						borderRadius: 1.2,
					}}
				>
					<Typography
						sx={{
							color: '#6b84aa',
							fontSize: 10,
							textTransform: 'uppercase',
							letterSpacing: '0.1em',
							mb: 0.4,
							fontFamily: monoFont,
						}}
					>
						{label}
					</Typography>
					<Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
						{icon}
						<Typography sx={{ color, fontSize: { xs: 16, md: 20 }, fontWeight: 700, fontFamily: monoFont }}>
							{value}
						</Typography>
					</Stack>
				</Paper>
			))}
		</Box>
	)
}
