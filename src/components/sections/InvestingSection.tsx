import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Container, Link, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { MotionReveal } from '../animations/MotionReveal'

export function InvestingSection() {
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component="section"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        bgcolor: '#f7fbff',
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 60%, #f7fbff 100%)',
        py: { xs: 7, md: 10 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        component={motion.div}
        aria-hidden
        animate={reduceMotion ? { x: 0, y: 0 } : { x: [0, 18, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: -100,
          left: '10%',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(21,101,192,0.14) 0%, rgba(21,101,192,0) 72%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <MotionReveal>
          <Box
            sx={{
              border: '1px solid',
              borderColor: '#d3e2f7',
              borderRadius: 1.8,
              bgcolor: 'rgba(255,255,255,0.92)',
              p: { xs: 2.2, md: 3 },
              textAlign: 'center',
              mb: { xs: 3.2, md: 4.2 },
            }}
          >
            <Typography variant="h2" sx={{ fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.5rem' }, lineHeight: { xs: 1.22, md: 1.14 }, letterSpacing: '-0.02em', mb: 1.5, animation: 'fadeRise 560ms ease both', color: '#0b1320' }}>
              Investing in companies and the <Box component="em">people building them</Box>
            </Typography>
            <Typography sx={{ maxWidth: 620, mx: 'auto', color: '#31465f', mb: 2, fontSize: { xs: 14.5, md: 16 }, lineHeight: 1.68 }}>
              We care about and support founders as people, not just CEOs or business leaders. Building a strong company requires resilient leadership and disciplined support.
            </Typography>
            <Link href="#" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#204071', fontSize: 13.5 }}>
              Wellbeing Platform <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Link>
          </Box>
        </MotionReveal>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 1.3, md: 2 }, mt: { xs: 0.5, md: 0.8 } }}>
          {[0, 1, 2].map((item) => (
            <MotionReveal key={item} delay={item * 0.08} amount={0.18}>
            <Box
              component={motion.div}
              whileHover={reduceMotion ? undefined : { y: -6, scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              sx={{
                aspectRatio: '3 / 4',
                borderRadius: 1.6,
                overflow: 'hidden',
                display: { xs: item === 2 ? 'none' : 'flex', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  item === 0
                    ? 'linear-gradient(135deg, #dce7f5 0%, #b9cde8 100%)'
                    : item === 1
                      ? 'linear-gradient(135deg, #cfdcf0 0%, #a8bfdc 100%)'
                      : 'linear-gradient(135deg, #e0eaf8 0%, #c6d8ef 100%)',
                border: '1px solid rgba(159,186,223,0.42)',
                transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 14px 26px rgba(12,39,88,0.14)' },
              }}
            >
              <Box component="svg" width="80" height="120" viewBox="0 0 80 120">
                <ellipse cx="40" cy="38" rx="22" ry="25" fill="rgba(255,255,255,0.3)" />
                <path d="M5 120 Q15 75 40 68 Q65 75 75 120 Z" fill="rgba(255,255,255,0.2)" />
              </Box>
            </Box>
            </MotionReveal>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
