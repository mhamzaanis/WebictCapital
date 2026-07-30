import { Box, Skeleton, Stack } from '@mui/material'
import { SURFACE_SX } from './viewFormat'

export function OverviewPageSkeleton() {
  return (
    <Stack spacing={{ xs: 3.5, md: 4.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '5fr 3fr 4fr' }, ...SURFACE_SX, overflow: 'hidden' }}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              p: { xs: 2.25, md: 3 },
              borderTop: { xs: index === 0 ? 0 : '1px solid var(--wc-border)', lg: 0 },
              borderLeft: { xs: 0, lg: index === 0 ? 0 : '1px solid var(--wc-border)' },
            }}
          >
            <Skeleton variant="text" width="35%" height={18} />
            <Skeleton variant="text" width={index === 0 ? '62%' : '75%'} height={index === 0 ? 48 : 26} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="55%" height={18} />
            <Stack direction="row" spacing={1.2} sx={{ mt: 2 }}>
              <Skeleton variant="rounded" height={42} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" height={42} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" height={42} sx={{ flex: 1 }} />
            </Stack>
          </Box>
        ))}
      </Box>

      <SkeletonTable rows={5} />
      <SkeletonTable rows={8} />

      <Box sx={{ ...SURFACE_SX, p: { xs: 1.5, md: 2 } }}>
        <Skeleton variant="text" width="42%" height={18} sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" width="100%" height={420} sx={{ borderRadius: '4px' }} />
      </Box>

      <SkeletonTable rows={12} />
    </Stack>
  )
}

function SkeletonTable({ rows }: { rows: number }) {
  return (
    <Box sx={{ ...SURFACE_SX, p: 2 }}>
      <Skeleton variant="text" width="28%" height={20} sx={{ mb: 1.5 }} />
      <Stack spacing={1}>
        {Array.from({ length: rows }).map((_, index) => (
          <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(5, 1fr)', gap: 1.5, py: 0.5 }}>
            {Array.from({ length: 6 }).map((__, cell) => (
              <Skeleton key={cell} variant="text" height={18} />
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
