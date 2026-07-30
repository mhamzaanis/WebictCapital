import { Box, Container, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { MarketsNav } from './MarketsNav'
import { DISPLAY_FONT } from './marketUtils'

export function MarketShell({
  title,
  subtitle,
  showHeading = true,
  children,
}: {
  title: string
  subtitle?: string
  showHeading?: boolean
  children: ReactNode
}) {
  return (
    <Box component="main" sx={{ bgcolor: 'var(--wc-bg)', minHeight: '72vh' }}>
      <MarketsNav />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {showHeading && (
          <Stack spacing={0.8} sx={{ mb: { xs: 2.4, md: 3.2 } }}>
            <Typography
              variant="h1"
              sx={{
                color: 'var(--wc-text-primary)',
                fontFamily: DISPLAY_FONT,
                fontSize: { xs: '2rem', md: '3rem' },
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: 0,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: { xs: 14, md: 15 }, maxWidth: 860, lineHeight: 1.65 }}>
                {subtitle}
              </Typography>
            )}
          </Stack>
        )}
        {children}
      </Container>
    </Box>
  )
}
