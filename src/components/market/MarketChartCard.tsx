import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { mergeSx } from './chartUtils'
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
					p: 2,
					bgcolor: 'var(--wc-bg)',
					border: '1px solid var(--wc-divider)',
					borderRadius: 1.5,
					minHeight: height + 82,
					display: 'flex',
					flexDirection: 'column',
				},
				sx,
			)}
		>
			<Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
				<Box sx={{ minWidth: 0 }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.35 }}>
						<Box sx={{ color: 'var(--wc-primary)', display: 'flex', alignItems: 'center' }}>
							{icon}
						</Box>
						<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-display)', fontSize: 17, fontWeight: 700 }}>
							{heading}
						</Typography>
					</Stack>
					<Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, lineHeight: 1.45 }}>
						{detail}
					</Typography>
				</Box>
			</Stack>
			<Box sx={mergeSx({ height, minHeight: height, width: '100%' }, contentSx)}>
				{children}
			</Box>
		</Paper>
	)
}
