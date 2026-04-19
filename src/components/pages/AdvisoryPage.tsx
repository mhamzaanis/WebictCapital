import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import { motion, useReducedMotion } from 'motion/react'
import { Link as RouterLink } from 'react-router-dom'
import { MotionReveal } from '../animations/MotionReveal'

export function AdvisoryPage() {
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 1.8rem)', md: 'calc(72px + 2.2rem)' },
        pb: { xs: 8, md: 12 },
        bgcolor: 'background.default',
        backgroundImage:
          'radial-gradient(circle at 12% 16%, rgba(21,101,192,0.16) 0%, transparent 36%), radial-gradient(circle at 86% 84%, rgba(21,101,192,0.12) 0%, transparent 38%), linear-gradient(180deg, #ffffff 0%, #eef4fc 55%, #e8f1fb 100%)',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <MotionReveal>
          <Box
            component={motion.section}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.84)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 20px 46px rgba(16, 42, 84, 0.11)',
              px: { xs: 2.2, sm: 3.2, md: 4.2 },
              py: { xs: 3, md: 4.4 },
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                width: { xs: 170, md: 240 },
                height: { xs: 170, md: 240 },
                borderRadius: '50%',
                top: { xs: -70, md: -95 },
                right: { xs: -65, md: -80 },
                background: 'radial-gradient(circle, rgba(21,101,192,0.32) 0%, rgba(21,101,192,0.08) 45%, transparent 72%)',
                pointerEvents: 'none',
              }}
            />

            <Stack spacing={2.1} sx={{ maxWidth: 760 }}>
              <Chip
                icon={<AccessTimeRoundedIcon />}
                label="Launching Soon"
                sx={{
                  width: 'fit-content',
                  bgcolor: 'rgba(21,101,192,0.12)',
                  color: 'primary.dark',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'primary.main' },
                }}
              />

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.15rem' },
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                }}
              >
                Advisory Is Coming Soon.
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: 15, md: 18 },
                  color: 'text.secondary',
                  lineHeight: 1.75,
                  maxWidth: 640,
                }}
              >
                We are preparing a focused advisory experience for serious investors. It will include strategy sessions,
                personalized market reviews, and actionable portfolio guidance tailored to the Pakistan market.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ pt: 0.8 }}>
                <Button
                  component={RouterLink}
                  to="/"
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    textTransform: 'none',
                    px: 2.4,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: '#0f58aa' },
                  }}
                >
                  Back to home
                </Button>
                <Button
                  component={RouterLink}
                  to="/about"
                  variant="outlined"
                  sx={{ textTransform: 'none', px: 2.4, py: 1, borderRadius: 1 }}
                >
                  Learn about us
                </Button>
              </Stack>
            </Stack>
          </Box>
        </MotionReveal>
      </Container>
    </Box>
  )
}
