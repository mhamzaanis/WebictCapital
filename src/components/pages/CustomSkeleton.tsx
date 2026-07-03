import {
	Box,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Skeleton
} from '@mui/material'
import { PulseSkeleton } from '../PulseSkeleton'

const DISPLAY_FONT = 'var(--wc-font-display)'

const headCell = {
	bgcolor: 'var(--wc-paper)',
	color: 'var(--wc-text-secondary)',
	fontFamily: DISPLAY_FONT,
	fontWeight: 600,
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
				gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
				gap: 1.5,
			}}
		>
			{Array.from({ length: 8 }).map((_, idx) => (
				<Paper
					key={`stat-skeleton-${idx}`}
					sx={{
						minHeight: 132,
						p: 2,
						bgcolor: 'var(--wc-bg)',
						border: '1px solid var(--wc-divider)',
						borderRadius: 1.5,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
						<PulseSkeleton shape="rounded" width={30} height={30} borderRadius={4} />
						<PulseSkeleton shape="text" width="52%" height={14} />
					</Box>
					<Box>
						<PulseSkeleton shape="text" width="68%" height={34} />
						<PulseSkeleton shape="text" width="88%" height={16} sx={{ mt: 0.4 }} />
					</Box>
				</Paper>
			))}
		</Box>
	)
}

export function MarketSnapshotSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'var(--wc-bg)',
        border: '1px solid var(--wc-divider)',
        borderRadius: '12px',
        px: { xs: 2, md: 2.5 },
        py: { xs: 1.75, md: 2 },
      }}
    >
      <Stack spacing={{ xs: 1.5, md: 1.75 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Skeleton variant="text" width={110} height={16} />
          <Skeleton variant="text" width={90} height={16} />
        </Stack>
 
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            rowGap: { xs: 1.5, md: 0 },
            columnGap: 2,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i}>
              <Skeleton variant="text" width={80} height={12} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={100} height={30} />
            </Box>
          ))}
        </Box>
 
        <Stack
          direction="row"
          spacing={2.5}
          sx={{ pt: { xs: 1.25, md: 1.5 }, borderTop: '1px solid var(--wc-divider)' }}
        >
          <Skeleton variant="text" width={90} height={18} />
          <Skeleton variant="text" width={90} height={18} />
          <Skeleton variant="text" width={90} height={18} />
        </Stack>
      </Stack>
    </Paper>
  )
}


function SectionTitleSkeleton() {
	return (
		<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
			<Box sx={{ minWidth: 220 }}>
				<PulseSkeleton shape="text" width={92} height={14} />
				<PulseSkeleton shape="text" width={260} height={28} sx={{ mt: 0.4 }} />
			</Box>
			<PulseSkeleton shape="text" width={150} height={16} />
		</Box>
	)
}

function MetricTileSkeleton() {
	return (
		<Paper
			sx={{
				minHeight: 132,
				p: 2,
				bgcolor: 'var(--wc-bg)',
				border: '1px solid var(--wc-divider)',
				borderRadius: 1.5,
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
				<PulseSkeleton shape="rounded" width={30} height={30} borderRadius={4} />
				<PulseSkeleton shape="text" width={110} height={14} />
			</Box>
			<PulseSkeleton shape="text" width="68%" height={34} sx={{ mt: 3.1 }} />
			<PulseSkeleton shape="text" width="92%" height={16} sx={{ mt: 0.4 }} />
		</Paper>
	)
}

function ChartPanelSkeleton({ height = 270 }: { height?: number }) {
	return (
		<Paper
			sx={{
				p: 2,
				bgcolor: 'var(--wc-bg)',
				border: '1px solid var(--wc-divider)',
				borderRadius: 1.5,
				minHeight: height + 82,
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
				<PulseSkeleton shape="circular" width={18} height={18} />
				<Box sx={{ flex: 1 }}>
					<PulseSkeleton shape="text" width="46%" height={22} />
					<PulseSkeleton shape="text" width="72%" height={14} />
				</Box>
			</Box>
			<PulseSkeleton shape="rounded" width="100%" height={height} borderRadius={6} />
		</Paper>
	)
}

function LeaderboardSkeleton() {
	return (
		<Paper
			sx={{
				p: 2,
				bgcolor: 'var(--wc-bg)',
				border: '1px solid var(--wc-divider)',
				borderRadius: 1.5,
				minHeight: 320,
			}}
		>
			<PulseSkeleton shape="text" width="48%" height={24} />
			<PulseSkeleton shape="text" width="76%" height={14} sx={{ mb: 1.2 }} />
			{Array.from({ length: 5 }).map((_, idx) => (
				<Box
					key={`leaderboard-skeleton-${idx}`}
					sx={{
						display: 'grid',
						gridTemplateColumns: '32px minmax(0, 1fr) 86px',
						gap: 1,
						alignItems: 'center',
						py: 1,
						borderTop: idx === 0 ? '0' : '1px solid var(--wc-divider)',
					}}
				>
					<PulseSkeleton shape="text" width={24} height={16} />
					<Box>
						<PulseSkeleton shape="text" width={52} height={18} />
						<PulseSkeleton shape="text" width="90%" height={14} />
					</Box>
					<Box>
						<PulseSkeleton shape="text" width={76} height={18} sx={{ ml: 'auto' }} />
						<PulseSkeleton shape="text" width={64} height={13} sx={{ ml: 'auto' }} />
					</Box>
				</Box>
			))}
		</Paper>
	)
}

export function MarketDashboardSkeleton() {
	return (
		<Stack spacing={3}>
			<Stack spacing={2}>
				<SectionTitleSkeleton />
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
						gap: 1.5,
					}}
				>
					{Array.from({ length: 6 }).map((_, idx) => (
						<MetricTileSkeleton key={`metric-tile-skeleton-${idx}`} />
					))}
				</Box>
			</Stack>

			<Stack spacing={2}>
				<SectionTitleSkeleton />
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', lg: '0.85fr 1.05fr 1.1fr' },
						gap: 1.5,
					}}
				>
					{Array.from({ length: 3 }).map((_, idx) => (
						<ChartPanelSkeleton key={`chart-panel-skeleton-${idx}`} />
					))}
				</Box>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.35fr) minmax(0, 0.85fr)' },
						gap: 1.5,
					}}
				>
					<ChartPanelSkeleton height={360} />
					<ChartPanelSkeleton height={360} />
				</Box>
			</Stack>

			<Stack spacing={2}>
				<SectionTitleSkeleton />
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
						gap: 1.5,
					}}
				>
					{Array.from({ length: 3 }).map((_, idx) => (
						<LeaderboardSkeleton key={`leaderboard-panel-skeleton-${idx}`} />
					))}
				</Box>
			</Stack>
		</Stack>
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
