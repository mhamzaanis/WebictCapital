import NorthEastIcon from '@mui/icons-material/NorthEast'
import { Box, Container, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { portfolioItems } from '../../content/siteContent'
import { MotionReveal } from '../animations/MotionReveal'

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
  const reduceMotion = useReducedMotion()

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
        py: { xs: 8, md: 11 },
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'linear-gradient(180deg, #edf5ff 0%, #ffffff 24%, #f7fbff 100%)',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(30,80,160,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,80,160,0.045) 1px, transparent 1px)',
          backgroundSize: '68px 68px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 80%, transparent 100%)',
        }}
      />

      <Box
        component={motion.div}
        animate={reduceMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          width: { xs: 320, md: 500 },
          height: { xs: 320, md: 500 },
          borderRadius: '50%',
          top: { xs: -120, md: -180 },
          right: { xs: -120, md: -180 },
          background: 'radial-gradient(circle, rgba(31,95,191,0.16) 0%, transparent 72%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <MotionReveal amount={0.24}>
          <Box sx={{ mb: { xs: 3.2, md: 4.4 }, maxWidth: 700 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.7rem', sm: '2rem', md: '2.8rem' },
                lineHeight: { xs: 1.15, md: 1.08 },
                letterSpacing: '-0.02em',
                color: '#0b1320',
              }}
            >
              Portfolio Highlights
            </Typography>
            <Typography sx={{ mt: 1, color: '#30445f', fontSize: { xs: 14.5, md: 16.5 }, lineHeight: 1.7 }}>
              Companies backed with long-term conviction, operator empathy, and disciplined capital.
            </Typography>
          </Box>
        </MotionReveal>

        <Box
          sx={{
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
            perspective: '1400px',
          }}
        >
          {portfolioItems.map((item, index) => (
            <MotionReveal key={item.name} delay={index * 0.04} amount={0.12} y={22} scale={0.985} blur={1.4}>
            <Box
              component={motion.a}
              whileHover={reduceMotion ? undefined : { y: -6, rotateX: 1.1, rotateY: -1.1, scale: 1.012 }}
              whileTap={reduceMotion ? undefined : { scale: 0.992 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              href={item.href ?? '#'}
              sx={{
                bgcolor: '#ffffff',
                minHeight: { xs: 180, sm: 230, md: 280 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                px: 2,
                textAlign: 'center',
                textDecoration: 'none',
                borderRadius: 2.2,
                border: '1px solid rgba(162,190,230,0.42)',
                overflow: 'hidden',
                transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                animation: 'cardReveal 540ms ease both',
                animationDelay: `${index * 45}ms`,
                '&:hover': { boxShadow: '0 20px 34px rgba(12, 36, 80, 0.18)' },
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
            </MotionReveal>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
