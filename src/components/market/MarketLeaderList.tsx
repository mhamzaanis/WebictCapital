import LeaderboardIcon from '@mui/icons-material/Leaderboard'
import ArrowDropDownIcon from '@mui/icons-material/TrendingDown'
import ArrowDropUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Paper, Stack, Typography } from '@mui/material'
import {
	DEFAULT_PALETTE,
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
	monoFont?: string
}

export function MarketLeaderList({
	title,
	subtitle,
	items,
	kind,
	monoFont = 'var(--wc-number-font)',
}: MarketLeaderListProps) {
	const tone: MarketTone = kind === 'gain' ? 'positive' : kind === 'loss' ? 'negative' : 'neutral'
	const color = toneColor(tone, DEFAULT_PALETTE)

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
					{kind === 'gain' && <ArrowDropUpIcon sx={{ fontSize: 18, color }} />}
					{kind === 'loss' && <ArrowDropDownIcon sx={{ fontSize: 18, color }} />}
					{kind === 'volume' && <LeaderboardIcon sx={{ fontSize: 18, color: 'var(--wc-primary)' }} />}
					<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-display)', fontSize: 17, fontWeight: 700 }}>
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
							<Box sx={{ textAlign: 'right', minWidth: 86 }}>
								<Typography sx={{ color: itemColor, fontFamily: monoFont, fontSize: 13, fontWeight: 800 }}>
									{primaryValue}
								</Typography>
								<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 10 }}>
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
