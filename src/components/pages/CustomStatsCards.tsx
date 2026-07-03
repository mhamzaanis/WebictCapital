import { Box, Paper, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'

export type StatCardTone = 'positive' | 'negative' | 'neutral'

export type StatCardProps = {
	label: string
	value: string
	detail: string
	icon: ReactNode
	monoFont?: string
	tone?: StatCardTone
	color?: string
	sx?: SxProps<Theme>
	iconBoxSx?: SxProps<Theme>
	labelSx?: SxProps<Theme>
	valueSx?: SxProps<Theme>
	detailSx?: SxProps<Theme>
}

function toneColor(tone: StatCardTone): string {
	if (tone === 'positive') return 'var(--wc-success)'
	if (tone === 'negative') return 'var(--wc-error)'
	return 'var(--wc-text-primary)'
}

function toneBackground(color: string): string {
	if (color === 'var(--wc-success)') return 'var(--wc-success-soft)'
	if (color === 'var(--wc-error)') return 'var(--wc-error-soft)'
	return 'var(--wc-primary-light)'
}

export type CustomStatsCardsProps = {
	children: ReactNode
	sx?: SxProps<Theme>
}

function mergeSx(base: SxProps<Theme>, sx?: SxProps<Theme>): SxProps<Theme> {
	if (!sx) return base
	return [base, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>
}

export function StatCard({
	label,
	value,
	detail,
	icon,
	monoFont = 'var(--wc-font-data)',
	tone = 'neutral',
	color,
	sx,
	iconBoxSx,
	labelSx,
	valueSx,
	detailSx,
}: StatCardProps) {
	const resolvedColor = color ?? toneColor(tone)

	return (
		<Paper
			elevation={0}
			sx={mergeSx(
				{
					minHeight: 132,
					p: 2,
					bgcolor: 'var(--wc-surface)',
					border: '1px solid var(--wc-border)',
					borderRadius: '12px',
					boxShadow: 'var(--wc-shadow-card)',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
				},
				sx,
			)}
		>
			<Stack direction="row" spacing={1.1} sx={{ alignItems: 'center', color: resolvedColor }}>
				<Box
					sx={mergeSx(
						{
							width: 30,
							height: 30,
							borderRadius: 1,
							bgcolor: toneBackground(resolvedColor),
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
						},
						iconBoxSx,
					)}
				>
					{icon}
				</Box>
				<Typography
					sx={mergeSx(
							{
							color: 'var(--wc-text-muted)',
							fontFamily: 'var(--wc-font-body)',
							fontSize: 11,
							fontWeight: 700,
							letterSpacing: '0.08em',
							textTransform: 'uppercase',
						},
						labelSx,
					)}
				>
					{label}
				</Typography>
			</Stack>
			<Box>
				<Typography
					sx={mergeSx(
						{
							color: resolvedColor,
							fontSize: { xs: 20, md: 24 },
							fontWeight: 700,
							fontFamily: monoFont,
							lineHeight: 1.2,
							fontVariantNumeric: 'tabular-nums',
							fontFeatureSettings: '"tnum" 1',
							overflowWrap: 'anywhere',
						},
						valueSx,
					)}
				>
					{value}
				</Typography>
				<Typography
					sx={mergeSx(
						{ mt: 0.5, color: 'var(--wc-text-secondary)', fontSize: 13, lineHeight: 1.55 },
						detailSx,
					)}
				>
					{detail}
				</Typography>
			</Box>
		</Paper>
	)
}

export function CustomStatsCards({ children, sx }: CustomStatsCardsProps) {
	return (
		<Box
			sx={mergeSx(
				{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
					gap: 1.5,
				},
				sx,
			)}
		>
			{children}
		</Box>
	)
}
