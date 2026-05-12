import {
	Box,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material'
import { PulseSkeleton } from '../PulseSkeleton'

const MONO = '"Playfair Display", serif'

const headCell = {
	bgcolor: 'var(--wc-paper)',
	color: 'var(--wc-text-secondary)',
	fontFamily: MONO,
	fontWeight: 700,
	fontSize: 11,
	letterSpacing: '0.06em',
	borderBottom: '1px solid var(--wc-divider)',
	py: 1.2,
	whiteSpace: 'nowrap' as const,
}

export function TabLabelSkeleton() {
	return <PulseSkeleton shape="rounded" width={72} height={18} />
}

export function StatCardsSkeleton() {
	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
				gap: 1.5,
			}}
		>
			{Array.from({ length: 8 }).map((_, idx) => (
				<Paper
					key={`stat-skeleton-${idx}`}
					sx={{
						p: 1.5,
						bgcolor: 'var(--wc-bg)',
						border: '1px solid var(--wc-divider)',
						borderRadius: 1.2,
					}}
				>
					<PulseSkeleton shape="text" width="62%" height={14} />
					<PulseSkeleton shape="text" width="74%" height={28} sx={{ mt: 0.3 }} />
				</Paper>
			))}
		</Box>
	)
}

export function PriceTableSkeleton() {
	return (
		<Box sx={{ py: 1.2 }}>
			<TableContainer
				component={Paper}
				sx={{
					bgcolor: 'var(--wc-bg)',
					borderRadius: 1.5,
					overflow: 'hidden',
					border: '1px solid var(--wc-divider)',
				}}
			>
				<Table size="small" aria-label="Loading PSX stocks table">
					<TableHead>
						<TableRow>
							{['SYMBOL', 'COMPANY', 'TURNOVER', 'OPEN', 'HIGH', 'LOW', 'LAST', 'CHG'].map((head) => (
								<TableCell key={head} sx={headCell}>
									{head}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{Array.from({ length: 8 }).map((_, idx) => (
							<TableRow key={`skeleton-row-${idx}`}>
								<TableCell sx={{ py: 1.1 }}>
									<PulseSkeleton shape="text" width={56} height={16} />
								</TableCell>
								<TableCell sx={{ py: 1.1 }}>
									<PulseSkeleton shape="text" width="88%" height={16} />
								</TableCell>
								{Array.from({ length: 6 }).map((__, cellIdx) => (
									<TableCell key={`skeleton-cell-${idx}-${cellIdx}`} align="right" sx={{ py: 1.1 }}>
										<PulseSkeleton
											shape="text"
											width={cellIdx === 5 ? 42 : 54}
											height={16}
											sx={{ ml: 'auto' }}
										/>
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<Box
				sx={{
					borderTop: '1px solid var(--wc-divider)',
					bgcolor: 'var(--wc-paper)',
					px: 2,
					py: 1.2,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<PulseSkeleton shape="text" width={110} height={16} />
				<PulseSkeleton shape="text" width={90} height={16} />
			</Box>
		</Box>
	)
}
