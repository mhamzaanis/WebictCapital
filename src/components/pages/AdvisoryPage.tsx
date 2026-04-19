import { Box, Button, Container, Stack, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { motion, useReducedMotion } from 'motion/react'
import { Link as RouterLink } from 'react-router-dom'
import { MotionReveal } from '../animations/MotionReveal'

export function AdvisoryPage() {
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 3rem)', md: 'calc(72px + 5rem)' },
        pb: { xs: 10, md: 16 },
        bgcolor: '#ffffff',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2.5, md: 5 } }}>
        <MotionReveal>
          <Box
            component={motion.section}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Top rule + label */}
            <Box sx={{ maxWidth: 80 }} />

            <Stack spacing={5} sx={{ maxWidth: 720 }}>
              {/* Status pill */}
              <Box sx={{ display: 'flex' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    border: '1px solid #c8d6ec',
                    borderRadius: 0.8,
                    px: 1.6,
                    py: 0.6,
                  }}
                >
                  {/* Pulse dot */}
                  <Box sx={{ position: 'relative', width: 8, height: 8 }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        bgcolor: '#0a2463',
                        opacity: 0.25,
                        animation: 'pulse 1.8s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { transform: 'scale(1)', opacity: 0.25 },
                          '50%': { transform: 'scale(2.2)', opacity: 0 },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: '2px',
                        borderRadius: '50%',
                        bgcolor: '#0a2463',
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontFamily: '"Playfair Display", serif',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#0a2463',
                      fontWeight: 600,
                    }}
                  >
                    Launching Soon
                  </Typography>
                </Box>
              </Box>

              {/* Headline */}
              <Box>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.8rem', sm: '3.6rem', md: '4.4rem', lg: '5rem' },
                    lineHeight: 1.03,
                    letterSpacing: '-0.03em',
                    color: '#080e1a',
                    fontWeight: 700,
                  }}
                >
                  Advisory is{' '}
                  <Box component="span" sx={{ color: '#0a2463' }}>
                    coming.
                  </Box>
                </Typography>
              </Box>

              {/* Body */}
              <Typography
                sx={{
                  fontSize: { xs: 16, md: 18 },
                  color: '#4a5e78',
                  lineHeight: 1.78,
                  maxWidth: 580,
                }}
              >
                We are preparing a focused advisory experience for serious investors — including
                strategy sessions, personalized market reviews, and actionable portfolio guidance
                tailored to the Pakistan market.
              </Typography>

              {/* Divider detail */}
              <Box sx={{ borderTop: '1px solid #e8eef8', pt: 4 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    component={RouterLink}
                    to="/"
                    variant="contained"
                    disableElevation
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{
                      textTransform: 'none',
                      bgcolor: '#080e1a',
                      color: '#ffffff',
                      px: 3.2,
                      py: 1.2,
                      borderRadius: 1,
                      fontSize: 14.5,
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      '&:hover': { bgcolor: '#0a2463' },
                    }}
                  >
                    Back to home
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/about"
                    variant="outlined"
                    disableElevation
                    sx={{
                      textTransform: 'none',
                      borderColor: '#c8d6ec',
                      color: '#0a2463',
                      px: 3,
                      py: 1.2,
                      borderRadius: 1,
                      fontSize: 14.5,
                      fontWeight: 500,
                      '&:hover': { borderColor: '#0a2463', bgcolor: '#f0f4fb' },
                    }}
                  >
                    Learn about us
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </MotionReveal>
      </Container>
    </Box>
  )
}