import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Container, Link, Typography } from '@mui/material'
import { portfolioItems } from '../../content/siteContent'

function getCardStyles(variant?: string) {
  switch (variant) {
    case 'light':
      return { fontWeight: 300, fontSize: 24 }
    case 'italic':
      return { fontStyle: 'italic', fontSize: 24 }
    case 'wide':
      return { letterSpacing: '0.06em', fontWeight: 600, fontSize: 18 }
    case 'stacked':
      return { fontSize: 12, letterSpacing: '0.04em', lineHeight: 1.2 }
    default:
      return { fontSize: 20 }
  }
}

export function PortfolioSection() {
  return (
    <Box component="section" sx={{ py: { xs: 7, md: 10 } }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, lineHeight: 1.15, letterSpacing: '-0.02em', mb: 2.5 }}>
            Two decades.
            <br />
            Hundreds of Europe&apos;s <Box component="em" sx={{ textDecoration: 'underline', textDecorationColor: 'primary.main' }}>best founders</Box>
          </Typography>
          <Link href="#" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 13 }}>
            Meet the portfolio <ArrowForwardIcon sx={{ fontSize: 16 }} />
          </Link>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: '1px',
            bgcolor: 'divider',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {portfolioItems.map((item) => (
            <Box
              key={item.name}
              sx={{
                bgcolor: 'background.paper',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                px: 2,
                textAlign: 'center',
                transition: 'background-color 0.2s ease',
                '&:hover': { bgcolor: 'common.white' },
              }}
            >
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', position: 'absolute', top: 12, right: 12 }} />
              <Typography sx={{ color: 'text.primary', ...getCardStyles(item.variant) }}>{item.name}</Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
