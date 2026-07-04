import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { FONT_FAMILY, mergeSx } from './chartUtils'
import type { MarketChartFrameProps } from './types'

export function MarketChartCard({
	heading,
	detail,
	icon,
	height = 280,
	children,
	sx,
	contentSx,
}: MarketChartFrameProps & {
	children: ReactNode
}) {
	return (
		<Paper
			elevation={0}
			sx={mergeSx(
				{
					p: { xs: 'var(--wc-card-padding-xs)', md: 'var(--wc-card-padding-md)' },
					bgcolor: 'var(--wc-surface)',
					border: '1px solid var(--wc-border)',
					borderRadius: '12px',
					boxShadow: 'var(--wc-shadow-card)',
					minHeight: height + 112,
					minWidth: 0,
					maxWidth: '100%',
					display: 'flex',
					flexDirection: 'column',
				},
				sx,
			)}
		>
			<Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, mb: 2.25 }}>
				<Box sx={{ minWidth: 0 }}>
					<Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.65 }}>
						<Box sx={{ color: 'var(--wc-primary)', display: 'flex', alignItems: 'center' }}>
							{icon}
						</Box>
						<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: FONT_FAMILY.body, fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>
							{heading}
						</Typography>
					</Stack>
					<Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12, lineHeight: 1.65 }}>
						{detail}
					</Typography>
				</Box>
			</Stack>
			<Box sx={mergeSx({ height, minHeight: height, width: '100%', minWidth: 0 }, contentSx)}>
				{children}
			</Box>
		</Paper>
	)
}
