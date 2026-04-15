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
        bgcolor: 'background.paper',
        py: { xs: 6.5, md: 10 },
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

      <Container maxWidth="md" sx={{ textAlign: 'center', px: { xs: 2, md: 3 } }}>
        <MotionReveal>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2.6rem' }, lineHeight: { xs: 1.26, md: 1.2 }, letterSpacing: '-0.02em', mb: 2.2, animation: 'fadeRise 560ms ease both' }}>
          Investing in companies and the <Box component="em">people building them</Box>
        </Typography>
        <Typography sx={{ maxWidth: 560, mx: 'auto', color: 'text.secondary', mb: 2, fontSize: { xs: 14.5, md: 16 }, lineHeight: 1.65 }}>
          We care about and support founders as people, not just CEOs or business leaders. Because building a successful company requires more than performance at work.
        </Typography>
        <Link href="#" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 13 }}>
          Wellbeing Platform <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Link>
        </MotionReveal>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 1.3, md: 2 }, mt: { xs: 4, md: 6 } }}>
          {[0, 1, 2].map((item) => (
            <MotionReveal key={item} delay={item * 0.08} amount={0.18}>
            <Box
              component={motion.div}
              whileHover={reduceMotion ? undefined : { y: -6, scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              sx={{
                aspectRatio: '3 / 4',
                borderRadius: 1,
                overflow: 'hidden',
                display: { xs: item === 2 ? 'none' : 'flex', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  item === 0
                    ? 'linear-gradient(135deg, #d6dbe1 0%, #b8c0ca 100%)'
                    : item === 1
                      ? 'linear-gradient(135deg, #ccd3db 0%, #a5b0be 100%)'
                      : 'linear-gradient(135deg, #e0e4e9 0%, #c3cad3 100%)',
                transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 20px rgba(0,0,0,0.1)' },
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
