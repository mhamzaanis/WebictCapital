import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import NorthEastIcon from '@mui/icons-material/NorthEast'
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
    <Box
      component="section"
      sx={{
        '@keyframes cardReveal': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes pulseDot': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.18)' },
        },
        py: { xs: 7, md: 10 },
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 6, animation: 'cardReveal 620ms ease both' }}>
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
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {portfolioItems.map((item, index) => (
            <Box
              key={item.name}
              component="a"
              href={item.href ?? '#'}
              sx={{
                bgcolor: 'background.paper',
                minHeight: 280,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                px: 2,
                textAlign: 'center',
                textDecoration: 'none',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                animation: 'cardReveal 540ms ease both',
                animationDelay: `${index * 45}ms`,
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 24px rgba(0,0,0,0.14)' },
                '&:hover .portfolio-dot': { animation: 'pulseDot 650ms ease' },
                '&:hover .portfolio-overlay, &:focus-visible .portfolio-overlay': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
                '&:hover .portfolio-logo, &:focus-visible .portfolio-logo': {
                  opacity: 0,
                  transform: 'translateY(-8px) scale(0.98)',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                },
              }}
            >
              <Box className="portfolio-dot" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', position: 'absolute', top: 12, right: 12 }} />
              <Typography className="portfolio-logo" sx={{ color: 'text.primary', transition: 'opacity 0.25s ease, transform 0.28s ease', ...getCardStyles(item.variant) }}>
                {item.name}
              </Typography>

              <Box
                className="portfolio-overlay"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: '#0f2230',
                  backgroundImage: 'linear-gradient(145deg, #0f2230 0%, #0b1a25 100%)',
                  color: 'common.white',
                  p: 2.75,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  opacity: 0,
                  transform: 'translateY(10px)',
                  transition: 'opacity 0.28s ease, transform 0.28s ease',
                }}
              >
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 16 }}>{item.location ?? 'Europe'}</Typography>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <NorthEastIcon sx={{ fontSize: 14, color: 'common.white' }} />
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: { xs: 32, md: 40 }, lineHeight: 1.1, mb: 1 }}>
                    {item.name}
                  </Typography>
                  <Typography sx={{ fontSize: 17, lineHeight: 1.35, color: 'rgba(255,255,255,0.92)', mb: 2.5 }}>
                    {item.description}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{item.stage}</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
