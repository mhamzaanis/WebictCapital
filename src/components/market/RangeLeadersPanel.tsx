import SpeedIcon from '@mui/icons-material/Speed'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { formatNumber, formatPercent } from './chartUtils'
import type { MarketLeaderItem } from './types'

type RangeLeadersPanelProps = {
	items: MarketLeaderItem[]
	avgRangePct: number
	monoFont?: string
}

export function RangeLeadersPanel({
	items,
	avgRangePct,
	monoFont = 'var(--wc-number-font)',
}: RangeLeadersPanelProps) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				bgcolor: 'var(--wc-bg)',
				border: '1px solid var(--wc-divider)',
				borderRadius: 1.5,
				minHeight: 320,
			}}
		>
			<Stack spacing={0.4} sx={{ mb: 2 }}>
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
					<SpeedIcon sx={{ fontSize: 18, color: 'var(--wc-primary)' }} />
					<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-display)', fontSize: 17, fontWeight: 700 }}>
						Widest Daily Ranges
					</Typography>
				</Stack>
				<Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, lineHeight: 1.5 }}>
					Symbols with the largest high-low spread during the session.
				</Typography>
			</Stack>

			<Box
				sx={{
					mb: 1.5,
					p: 1.4,
					bgcolor: 'var(--wc-paper)',
					border: '1px solid var(--wc-divider)',
					borderRadius: 1,
				}}
			>
				<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 10, mb: 0.4 }}>
					AVERAGE RANGE
				</Typography>
				<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: monoFont, fontSize: 20, fontWeight: 800 }}>
					{formatPercent(avgRangePct, false)}
				</Typography>
			</Box>

			<Stack spacing={1}>
				{items.map((item, index) => (
					<Box
						key={item.id ?? `range-${item.symbol}`}
						sx={{
							display: 'grid',
							gridTemplateColumns: '32px minmax(0, 1fr) auto',
							gap: 1,
							alignItems: 'center',
							py: 1,
							borderTop: index === 0 ? '0' : '1px solid var(--wc-divider)',
						}}
					>
						<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11 }}>
							#{index + 1}
						</Typography>
						<Box sx={{ minWidth: 0 }}>
							<Typography sx={{ color: 'var(--wc-primary)', fontFamily: monoFont, fontSize: 13, fontWeight: 800 }}>
								{item.symbol}
							</Typography>
							<Typography
								title={item.company}
								sx={{
									color: 'var(--wc-text-secondary)',
									fontSize: 11,
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{item.company}
							</Typography>
						</Box>
						<Box sx={{ textAlign: 'right', minWidth: 88 }}>
							<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: monoFont, fontSize: 13, fontWeight: 800 }}>
								{formatPercent(item.rangePct ?? NaN, false)}
							</Typography>
							<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 10 }}>
								{formatNumber(item.low ?? NaN)}-{formatNumber(item.high ?? NaN)}
							</Typography>
						</Box>
					</Box>
				))}
			</Stack>
		</Paper>
	)
}
