import { Stack, Typography } from '@mui/material'
import { DISPLAY_FONT } from '../../markets/marketUtils'

export function MarketPageHeader({
  title,
  tradeDateLabel,
  updatedLabel,
}: {
  title: string
  tradeDateLabel: string
  updatedLabel: string | null
}) {
  return (
    <Stack spacing={0.9} sx={{ mb: { xs: 3, md: 4 } }}>
      <Typography
        variant="h1"
        sx={{
          color: 'var(--wc-text-primary)',
          fontFamily: DISPLAY_FONT,
          fontSize: { xs: '2.35rem', md: '2.75rem' },
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: 0,
        }}
      >
        {title}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.35, sm: 1.4 }} sx={{ color: 'var(--wc-text-secondary)' }}>
        {/* <Typography sx={{ fontSize: { xs: 14, md: 15 }, lineHeight: 1.5 }}>
          Closing market snapshot · {tradeDateLabel}
        </Typography> */}
        {/* {updatedLabel && (
          <Typography sx={{ fontSize: { xs: 13, md: 14 }, lineHeight: 1.5 }}>
            Updated {updatedLabel}
          </Typography>
        )} */}
      </Stack>
    </Stack>
  )
}
