import SpeedIcon from '@mui/icons-material/Speed'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { FONT_FAMILY, formatNumber, formatPercent } from './chartUtils'
import type { MarketLeaderItem } from './types'

type RangeLeadersPanelProps = {
	items: MarketLeaderItem[]
	avgRangePct: number
	dataFont?: string
}

export function RangeLeadersPanel({
	items,
	avgRangePct,
	dataFont = FONT_FAMILY.data,
}: RangeLeadersPanelProps) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				bgcolor: 'var(--wc-surface)',
				border: '1px solid var(--wc-border)',
				borderRadius: '12px',
				boxShadow: 'var(--wc-shadow-card)',
				minHeight: 320,
			}}
		>
			<Stack spacing={0.4} sx={{ mb: 2 }}>
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
					<SpeedIcon sx={{ fontSize: 18, color: 'var(--wc-primary)' }} />
					<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: FONT_FAMILY.body, fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>
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
					bgcolor: 'var(--wc-surface-soft)',
					border: '1px solid var(--wc-border)',
					borderRadius: '10px',
				}}
			>
				<Typography sx={{ color: 'var(--wc-text-muted)', fontFamily: FONT_FAMILY.body, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.4 }}>
					AVERAGE RANGE
				</Typography>
				<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: dataFont, fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
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
							borderTop: index === 0 ? '0' : '1px solid #edf2f8',
						}}
					>
						<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: dataFont, fontSize: 11, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
							#{index + 1}
						</Typography>
						<Box sx={{ minWidth: 0 }}>
							<Typography sx={{ color: 'var(--wc-primary)', fontFamily: FONT_FAMILY.body, fontSize: 13, fontWeight: 750, letterSpacing: 0, textTransform: 'uppercase' }}>
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
							<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: dataFont, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
								{formatPercent(item.rangePct ?? NaN, false)}
							</Typography>
							<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: dataFont, fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
								{formatNumber(item.low ?? NaN)}-{formatNumber(item.high ?? NaN)}
							</Typography>
						</Box>
					</Box>
				))}
			</Stack>
		</Paper>
	)
}
