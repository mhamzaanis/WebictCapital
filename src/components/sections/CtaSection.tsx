import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Button, Container, InputBase, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { MotionReveal } from '../animations/MotionReveal'

export function CtaSection() {
  const reduceMotion = useReducedMotion()

  return (
    <Container
      maxWidth="xl"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        mb: { xs: 6, md: 10 },
        px: { xs: 2, md: 3 },
      }}
    >
      <MotionReveal amount={0.2} duration={0.62} y={24}>
      <Box
        component={motion.div}
        whileHover={reduceMotion ? undefined : { y: -5 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        sx={{
          bgcolor: '#132a4f',
          borderRadius: 2,
          border: '1px solid rgba(140,176,225,0.42)',
          px: { xs: 2.2, md: 8 },
          py: { xs: 4.2, md: 7 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 4, md: 8 },
          alignItems: 'center',
          animation: 'fadeRise 620ms ease both',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: -2,
            background: 'linear-gradient(115deg, rgba(45,115,206,0.46), rgba(45,115,206,0), rgba(45,115,206,0.36))',
            filter: 'blur(26px)',
            opacity: 0.6,
            animation: 'ctaGlow 5.4s ease-in-out infinite',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(145deg, rgba(7,15,30,0.55) 0%, rgba(15,42,95,0.2) 56%, rgba(22,74,144,0.32) 100%)',
            pointerEvents: 'none',
          },
          '@keyframes ctaGlow': {
            '0%, 100%': { transform: 'translateX(-8%) scale(1)' },
            '50%': { transform: 'translateX(8%) scale(1.04)' },
          },
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 22px 38px rgba(8, 26, 59, 0.35)',
          },
        }}
      >
        <Typography variant="h2" sx={{ position: 'relative', zIndex: 1, color: 'common.white', fontSize: { xs: '1.7rem', sm: '1.9rem', md: '3.2rem' }, lineHeight: { xs: 1.2, md: 1.1 }, letterSpacing: '-0.02em' }}>
          Stay in touch with Webict Capital
        </Typography>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 3, lineHeight: 1.7 }}>
            Sign up for our newsletter to stay up to date on news from Webict Capital, and our portfolio.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 1, overflow: 'hidden', transition: 'border-color 0.25s ease', '&:focus-within': { borderColor: 'rgba(21,101,192,0.85)' } }}>
            <InputBase
              fullWidth
              placeholder="Enter your email here"
              inputProps={{ 'aria-label': 'Email address' }}
              sx={{ px: 2, py: 1.2, color: 'common.white', '& input::placeholder': { color: 'rgba(255,255,255,0.35)', opacity: 1 } }}
            />
            <Button
              component={motion.button}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              sx={{
                minWidth: { xs: '100%', sm: 54 },
                py: { xs: 1, sm: 0 },
                borderRadius: 0,
                bgcolor: 'primary.main',
                color: 'common.white',
                transition: 'background-color 0.25s ease, transform 0.25s ease',
                '&:hover': { bgcolor: '#0f4f98', transform: 'translateX(2px)' },
                '&:hover .cta-arrow': { transform: 'translateX(2px)' },
              }}
            >
              <ArrowForwardIcon className="cta-arrow" fontSize="small" sx={{ transition: 'transform 0.25s ease' }} />
            </Button>
          </Box>

          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.6 }}>
            You may unsubscribe from these communications at any time. For information on how to unsubscribe,
            as well as our privacy practices and commitment to protecting your privacy, check out our Privacy Policy.
          </Typography>
        </Box>
      </Box>
      </MotionReveal>
    </Container>
  )
}
