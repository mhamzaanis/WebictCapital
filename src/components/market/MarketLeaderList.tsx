import LeaderboardIcon from '@mui/icons-material/Leaderboard'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { Box, Paper, Stack, Typography } from '@mui/material'
import {
	DEFAULT_PALETTE,
	FONT_FAMILY,
	formatCompactNumber,
	formatNumber,
	formatPercent,
	formatSignedNumber,
	toneColor,
} from './chartUtils'
import type { MarketLeaderItem, MarketTone } from './types'

type MarketLeaderListProps = {
	title: string
	subtitle: string
	items: MarketLeaderItem[]
	kind: 'gain' | 'loss' | 'volume'
	dataFont?: string
}

export function MarketLeaderList({
	title,
	subtitle,
	items,
	kind,
	dataFont = FONT_FAMILY.data,
}: MarketLeaderListProps) {
	const tone: MarketTone = kind === 'gain' ? 'positive' : kind === 'loss' ? 'negative' : 'neutral'
	const color = toneColor(tone, DEFAULT_PALETTE)

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
					{kind === 'gain' && <ArrowDropUpIcon sx={{ fontSize: 18, color }} />}
					{kind === 'loss' && <ArrowDropDownIcon sx={{ fontSize: 18, color }} />}
					{kind === 'volume' && <LeaderboardIcon sx={{ fontSize: 18, color: 'var(--wc-primary)' }} />}
					<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: FONT_FAMILY.body, fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>
						{title}
					</Typography>
				</Stack>
				<Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, lineHeight: 1.5 }}>
					{subtitle}
				</Typography>
			</Stack>

			<Stack spacing={1}>
				{items.length === 0 && (
					<Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
						No qualifying symbols for this session.
					</Typography>
				)}
				{items.map((item, index) => {
					const itemColor = kind === 'volume' ? 'var(--wc-primary)' : item.change > 0 ? 'var(--wc-success)' : item.change < 0 ? 'var(--wc-error)' : 'var(--wc-text-secondary)'
					const primaryValue =
						kind === 'volume'
							? formatCompactNumber(item.volume ?? 0)
							: Number.isFinite(item.changePct)
								? formatPercent(item.changePct ?? NaN)
								: formatSignedNumber(item.change)
					const secondaryValue =
						kind === 'volume'
							? `Last ${formatNumber(item.price)}`
							: `${formatSignedNumber(item.change)} pts at ${formatNumber(item.price)}`

					return (
						<Box
							key={item.id ?? `${title}-${item.symbol}`}
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
							<Box sx={{ textAlign: 'right', minWidth: 86 }}>
								<Typography sx={{ color: itemColor, fontFamily: dataFont, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
									{primaryValue}
								</Typography>
								<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: dataFont, fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' }}>
									{secondaryValue}
								</Typography>
							</Box>
						</Box>
					)
				})}
			</Stack>
		</Paper>
	)
}
