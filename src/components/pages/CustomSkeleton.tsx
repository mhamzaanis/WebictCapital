import {
	Box,
	Paper,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material'

const MONO = '"Playfair Display", serif'

const headCell = {
	bgcolor: '#fafbfd',
	color: '#4a5e78',
	fontFamily: MONO,
	fontWeight: 700,
	fontSize: 11,
	letterSpacing: '0.06em',
	borderBottom: '1px solid #e2eaf5',
	py: 1.2,
	whiteSpace: 'nowrap' as const,
}

const skeletonPulseSx = {
	bgcolor: '#edf3fb',
	'&::after': {
		background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent)',
	},
}

export function TabLabelSkeleton() {
	return <Skeleton variant="rounded" animation="wave" width={72} height={18} sx={skeletonPulseSx} />
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
						bgcolor: '#ffffff',
						border: '1px solid #e2eaf5',
						borderRadius: 1.2,
					}}
				>
					<Skeleton variant="text" width="62%" height={14} animation="wave" sx={skeletonPulseSx} />
					<Skeleton variant="text" width="74%" height={28} animation="wave" sx={{ ...skeletonPulseSx, mt: 0.3 }} />
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
					bgcolor: '#ffffff',
					borderRadius: 1.5,
					overflow: 'hidden',
					border: '1px solid #e2eaf5',
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
									<Skeleton variant="text" width={56} height={16} animation="wave" sx={skeletonPulseSx} />
								</TableCell>
								<TableCell sx={{ py: 1.1 }}>
									<Skeleton variant="text" width="88%" height={16} animation="wave" sx={skeletonPulseSx} />
								</TableCell>
								{Array.from({ length: 6 }).map((__, cellIdx) => (
									<TableCell key={`skeleton-cell-${idx}-${cellIdx}`} align="right" sx={{ py: 1.1 }}>
										<Skeleton
											variant="text"
											width={cellIdx === 5 ? 42 : 54}
											height={16}
											animation="wave"
											sx={{ ...skeletonPulseSx, ml: 'auto' }}
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
					borderTop: '1px solid #e2eaf5',
					bgcolor: '#fafbfd',
					px: 2,
					py: 1.2,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<Skeleton variant="text" width={110} height={16} animation="wave" sx={skeletonPulseSx} />
				<Skeleton variant="text" width={90} height={16} animation="wave" sx={skeletonPulseSx} />
			</Box>
		</Box>
	)
}
