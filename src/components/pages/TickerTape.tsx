import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useReducedMotion } from 'motion/react'
import { PulseSkeleton } from '../PulseSkeleton'

export type TickerTapeItem = {
	symbol: string
	company: string
	price: string
	change: string
	changePct: string
	volume: string
	tone: 'positive' | 'negative' | 'neutral'
}

type TickerTapeProps = {
	items: TickerTapeItem[]
	date?: string
	monoFont?: string
}

function toneColor(tone: TickerTapeItem['tone']): string {
	if (tone === 'positive') return 'var(--wc-success)'
	if (tone === 'negative') return 'var(--wc-error)'
	return 'var(--wc-text-secondary)'
}

function TapeMoveIcon({ tone }: { tone: TickerTapeItem['tone'] }) {
	if (tone === 'positive') return <ArrowDropUpIcon sx={{ fontSize: 16, color: 'inherit' }} />
	if (tone === 'negative') return <ArrowDropDownIcon sx={{ fontSize: 16, color: 'inherit' }} />
	return <RemoveIcon sx={{ fontSize: 14, color: 'inherit' }} />
}

function TapeItem({ item, monoFont }: { item: TickerTapeItem; monoFont: string }) {
	const color = toneColor(item.tone)

	return (
		<Box
			component="li"
			sx={{
				listStyle: 'none',
				flex: '0 0 auto',
				display: 'flex',
				alignItems: 'center',
				gap: 1.1,
				minHeight: 44,
				px: 1.4,
				borderRight: '1px solid var(--wc-divider)',
			}}
		>
			<Box sx={{ minWidth: 0 }}>
				<Stack direction="row" spacing={0.8} sx={{ alignItems: 'baseline' }}>
					<Typography sx={{ color: 'var(--wc-primary)', fontFamily: monoFont, fontSize: 13, fontWeight: 700 }}>
						{item.symbol}
					</Typography>
					<Typography
						title={item.company}
						sx={{
							color: 'var(--wc-text-secondary)',
							fontSize: 11,
							maxWidth: 150,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{item.company}
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.15 }}>
					<Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: monoFont, fontSize: 11, fontWeight: 700 }}>
						{item.price}
					</Typography>
					<Stack direction="row" spacing={0.1} sx={{ alignItems: 'center', color }}>
						<TapeMoveIcon tone={item.tone} />
						<Typography sx={{ color: 'inherit', fontFamily: monoFont, fontSize: 11, fontWeight: 700 }}>
							{item.change}
						</Typography>
						<Typography sx={{ color: 'inherit', fontFamily: monoFont, fontSize: 11, fontWeight: 600 }}>
							{item.changePct}
						</Typography>
					</Stack>
				</Stack>
			</Box>
			<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
				Vol {item.volume}
			</Typography>
		</Box>
	)
}

export function TickerTape({ items, date, monoFont = 'var(--wc-font-mono)' }: TickerTapeProps) {
	const reduce = useReducedMotion()
	const shouldScroll = !reduce && items.length > 5
	const tapeItems = shouldScroll ? [...items, ...items] : items

	if (items.length === 0) return null

	return (
		<Paper
			elevation={0}
			sx={{
				bgcolor: 'var(--wc-bg)',
				border: '1px solid var(--wc-divider)',
				borderRadius: 1.5,
				overflow: 'hidden',
			}}
		>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', md: '190px minmax(0, 1fr)' },
					minHeight: 48,
				}}
			>
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'row', md: 'column' },
						alignItems: { xs: 'center', md: 'flex-start' },
						justifyContent: 'center',
						gap: { xs: 1.2, md: 0.15 },
						px: 1.6,
						py: 1,
						bgcolor: 'var(--wc-paper)',
						borderRight: { md: '1px solid var(--wc-divider)' },
						borderBottom: { xs: '1px solid var(--wc-divider)', md: 0 },
					}}
				>
					<Typography
						sx={{
							color: 'var(--wc-primary)',
							fontFamily: monoFont,
							fontSize: 11,
							fontWeight: 700,
							letterSpacing: '0.12em',
							textTransform: 'uppercase',
							whiteSpace: 'nowrap',
						}}
					>
						PSX Tape
					</Typography>
					{date && (
						<Typography sx={{ color: 'var(--wc-text-secondary)', fontFamily: monoFont, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
							{date}
						</Typography>
					)}
				</Box>

				<Box
					sx={{
						position: 'relative',
						overflow: 'hidden',
						'&::before, &::after': {
							content: '""',
							position: 'absolute',
							top: 0,
							bottom: 0,
							width: 28,
							zIndex: 2,
							pointerEvents: 'none',
						},
						'&::before': {
							left: 0,
							background: 'linear-gradient(90deg, var(--wc-bg), rgba(255,255,255,0))',
						},
						'&::after': {
							right: 0,
							background: 'linear-gradient(270deg, var(--wc-bg), rgba(255,255,255,0))',
						},
					}}
				>
					<Box
						component="ul"
						sx={{
							m: 0,
							p: 0,
							display: 'flex',
							width: 'max-content',
							animation: shouldScroll ? 'wc-ticker-scroll 46s linear infinite' : 'none',
							'&:hover': { animationPlayState: 'paused' },
							'@keyframes wc-ticker-scroll': {
								'0%': { transform: 'translateX(0)' },
								'100%': { transform: 'translateX(-50%)' },
							},
						}}
					>
						{tapeItems.map((item, index) => (
							<TapeItem key={`${item.symbol}-${index}`} item={item} monoFont={monoFont} />
						))}
					</Box>
				</Box>
			</Box>
		</Paper>
	)
}

export function TickerTapeSkeleton() {
	return (
		<Paper
			elevation={0}
			sx={{
				bgcolor: 'var(--wc-bg)',
				border: '1px solid var(--wc-divider)',
				borderRadius: 1.5,
				overflow: 'hidden',
			}}
		>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '190px minmax(0, 1fr)' }, minHeight: 48 }}>
				<Box sx={{ px: 1.6, py: 1, bgcolor: 'var(--wc-paper)', borderRight: { md: '1px solid var(--wc-divider)' } }}>
					<PulseSkeleton shape="text" width={82} height={14} />
					<PulseSkeleton shape="text" width={96} height={12} />
				</Box>
				<Stack direction="row" spacing={2} sx={{ alignItems: 'center', overflow: 'hidden', px: 1.5 }}>
					{Array.from({ length: 6 }).map((_, idx) => (
						<Box key={`ticker-skeleton-${idx}`} sx={{ flex: '0 0 auto', width: 170 }}>
							<PulseSkeleton shape="text" width={64} height={16} />
							<PulseSkeleton shape="text" width="88%" height={14} />
						</Box>
					))}
				</Stack>
			</Box>
		</Paper>
	)
}
