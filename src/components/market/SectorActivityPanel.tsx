import AnalyticsIcon from '@mui/icons-material/Analytics'
import { Box, Paper, Stack, Typography } from '@mui/material'
import {
	DEFAULT_PALETTE,
	FONT_FAMILY,
	formatCompactNumber,
	formatPercent,
	toneColor,
} from './chartUtils'
import type { MarketTone, SectorActivityItem } from './types'

type SectorActivityPanelProps = {
	sectors: SectorActivityItem[]
	totalVolume: number
	monoFont?: string
}

export function SectorActivityPanel({
	sectors,
	totalVolume,
	monoFont = FONT_FAMILY.mono,
}: SectorActivityPanelProps) {
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
					<AnalyticsIcon sx={{ fontSize: 18, color: 'var(--wc-primary)' }} />
					<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: FONT_FAMILY.display, fontSize: 17, fontWeight: 700 }}>
						Active Industries
					</Typography>
				</Stack>
				<Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, lineHeight: 1.5 }}>
					Sectors ranked by traded volume in the latest closing file.
				</Typography>
			</Stack>

			<Stack spacing={1.2}>
				{sectors.map((sector) => {
					const share = totalVolume > 0 ? (sector.turnover / totalVolume) * 100 : 0
					const sectorTone: MarketTone =
						(sector.avgChangePct ?? 0) > 0 ? 'positive' : (sector.avgChangePct ?? 0) < 0 ? 'negative' : 'neutral'

					return (
						<Box key={sector.id ?? sector.label}>
							<Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
								<Typography
									title={sector.label}
									sx={{
										color: 'var(--wc-text-primary)',
										fontSize: 12,
										fontWeight: 700,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										maxWidth: '68%',
									}}
								>
									{sector.label}
								</Typography>
								<Typography sx={{ color: 'var(--wc-primary)', fontFamily: monoFont, fontSize: 11, fontWeight: 700 }}>
									{formatCompactNumber(sector.turnover)}
								</Typography>
							</Stack>
							<Box sx={{ mt: 0.8, height: 6, borderRadius: 999, bgcolor: 'var(--wc-primary-light)', overflow: 'hidden' }}>
								<Box
									sx={{
										width: `${Math.min(100, share)}%`,
										height: '100%',
										bgcolor: 'var(--wc-primary)',
									}}
								/>
							</Box>
							<Stack direction="row" spacing={1.4} sx={{ mt: 0.65, flexWrap: 'wrap' }}>
								<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11, fontWeight: 500 }}>
									{sector.count ?? 0} symbols
								</Typography>
								<Typography sx={{ color: 'var(--wc-success)', fontFamily: monoFont, fontSize: 11, fontWeight: 500 }}>
									{sector.gainers ?? 0} up
								</Typography>
								<Typography sx={{ color: 'var(--wc-error)', fontFamily: monoFont, fontSize: 11, fontWeight: 500 }}>
									{sector.losers ?? 0} down
								</Typography>
								<Typography sx={{ color: toneColor(sectorTone, DEFAULT_PALETTE), fontFamily: monoFont, fontSize: 11, fontWeight: 500 }}>
									avg {formatPercent(sector.avgChangePct ?? NaN)}
								</Typography>
							</Stack>
						</Box>
					)
				})}
				{sectors.length === 0 && (
					<Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12 }}>
						Industry volume was not available for this session.
					</Typography>
				)}
			</Stack>
		</Paper>
	)
}
