import { Box, Button, Container, Grid, Link, Stack, TextField, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { MotionReveal } from '../animations/MotionReveal'

const principles = [
  {
    title: 'Clarity Over Noise',
    description:
      'We simplify investing concepts for Pakistan Stock Exchange learners through practical language, realistic examples, and disciplined frameworks.',
  },
  {
    title: 'Long-Term Discipline',
    description:
      'Our education is built around consistency, risk management, and decision-making routines that hold up across market cycles.',
  },
  {
    title: 'Local Context, Global Standards',
    description:
      'We teach with PSX relevance while applying institutional research habits, portfolio logic, and ethical investing principles.',
  },
]

const teamHighlights = [
  {
    title: 'Who We Are',
    body:
      'Webict Capital is an investment education platform focused on helping individuals become confident, independent, and research-driven investors.',
  },
  {
    title: 'What We Do',
    body:
      'From foundational market concepts to portfolio construction and risk controls, we design learning paths that are structured and actionable.',
  },
  {
    title: 'Why It Matters',
    body:
      'Informed investors contribute to stronger financial outcomes, better capital allocation, and a more resilient investing culture.',
  },
]

export function AboutPage() {
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 1.6rem)', md: 'calc(72px + 2rem)' },
        pb: { xs: 7, md: 11 },
        bgcolor: '#f5f9ff',
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #eef5ff 52%, #e8f1ff 100%)',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1240px !important', px: { xs: 2, md: 3.5 } }}>
        <Stack spacing={{ xs: 5, md: 7 }}>
          <MotionReveal>
            <Box
              sx={{
                border: '1px solid',
                borderColor: '#cfdef3',
                bgcolor: 'rgba(255,255,255,0.84)',
                backdropFilter: 'blur(4px)',
                borderRadius: 1.6,
                p: { xs: 2.2, md: 3.5 },
                boxShadow: '0 16px 34px rgba(14, 41, 88, 0.08)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  width: { xs: 180, md: 240 },
                  height: { xs: 180, md: 240 },
                  borderRadius: '50%',
                  right: { xs: -70, md: -90 },
                  top: { xs: -60, md: -80 },
                  background: 'radial-gradient(circle, rgba(21,101,192,0.22) 0%, transparent 72%)',
                  pointerEvents: 'none',
                }}
              />

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.4rem', md: '3rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  color: '#0b1320',
                  maxWidth: 820,
                }}
              >
                About Webict Capital
              </Typography>
              <Typography
                sx={{
                  mt: 1.4,
                  maxWidth: 840,
                  color: '#253750',
                  fontSize: { xs: 15, md: 18 },
                  lineHeight: 1.7,
                }}
              >
                We build serious investing education for curious learners and disciplined future investors. Our work combines
                classical market principles with modern tools to make decision-making clearer, calmer, and more consistent.
              </Typography>
            </Box>
          </MotionReveal>

          <Grid container spacing={{ xs: 1.5, md: 2.4 }}>
            {teamHighlights.map((item, index) => (
              <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                <MotionReveal delay={Math.min(index * 0.07, 0.18)}>
                  <Box
                    sx={{
                      height: '100%',
                      minHeight: 180,
                      border: '1px solid',
                      borderColor: '#d3e0f3',
                      borderRadius: 1.4,
                      bgcolor: '#ffffff',
                      p: { xs: 2, md: 2.4 },
                    }}
                  >
                    <Typography sx={{ fontSize: 19, color: '#0f2a5f', fontWeight: 600, mb: 0.8 }}>{item.title}</Typography>
                    <Typography sx={{ color: '#364861', fontSize: 14.5, lineHeight: 1.75 }}>{item.body}</Typography>
                  </Box>
                </MotionReveal>
              </Grid>
            ))}
          </Grid>

          <Box
            component={motion.section}
            whileInView={reduceMotion ? undefined : { opacity: [0.92, 1], y: [10, 0] }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              border: '1px solid',
              borderColor: '#d4e2f6',
              borderRadius: 1.6,
              p: { xs: 2.2, md: 3.2 },
              bgcolor: '#ffffff',
            }}
          >
            <Typography sx={{ fontSize: { xs: 24, md: 30 }, color: '#0b1320', mb: 2.2 }}>Our Principles</Typography>
            <Grid container spacing={{ xs: 2, md: 2.2 }}>
              {principles.map((item, index) => (
                <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                  <MotionReveal delay={Math.min(index * 0.07, 0.18)}>
                    <Box sx={{ borderTop: '2px solid #1f5fbf', pt: 1.2 }}>
                      <Typography sx={{ fontWeight: 600, color: '#0f2a5f', mb: 0.8 }}>{item.title}</Typography>
                      <Typography sx={{ color: '#374a64', fontSize: 14.2, lineHeight: 1.72 }}>{item.description}</Typography>
                    </Box>
                  </MotionReveal>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box
            id="contact"
            sx={{
              border: '1px solid',
              borderColor: '#c8d9f3',
              borderRadius: 1.6,
              overflow: 'hidden',
              bgcolor: '#ffffff',
              boxShadow: '0 18px 34px rgba(15, 42, 95, 0.08)',
            }}
          >
            <Grid container>
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    height: '100%',
                    p: { xs: 2.2, md: 3.1 },
                    backgroundImage: 'linear-gradient(158deg, #102a54 0%, #0f2a5f 55%, #1a4fa0 100%)',
                    color: '#ffffff',
                  }}
                >
                  <MotionReveal>
                    <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: { xs: 28, md: 34 }, lineHeight: 1.1, mb: 1.2 }}>
                      Contact Us
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.84)', fontSize: 14.5, lineHeight: 1.7, maxWidth: 420 }}>
                      Have questions about our programs, workshops, or portfolio education tracks? Reach out and our team will guide
                      you to the right next step.
                    </Typography>

                    <Stack spacing={1.4} sx={{ mt: 3.1 }}>
                      <Box>
                        <Typography sx={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
                          Email
                        </Typography>
                        <Link href="mailto:contact@webictcapital.com" underline="hover" sx={{ color: '#ffffff', fontSize: 15 }}>
                          contact@webictcapital.com
                        </Link>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
                          Phone
                        </Typography>
                        <Link href="tel:+923001234567" underline="hover" sx={{ color: '#ffffff', fontSize: 15 }}>
                          +92 300 123 4567
                        </Link>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
                          Office
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>
                          Lahore, Pakistan
                        </Typography>
                      </Box>
                    </Stack>
                  </MotionReveal>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ p: { xs: 2.2, md: 3.1 } }}>
                  <MotionReveal>
                    <Typography sx={{ fontSize: { xs: 22, md: 28 }, color: '#0b1320', mb: 0.8 }}>Send a message</Typography>
                    <Typography sx={{ color: '#4a5c74', mb: 2.2, fontSize: 14.5 }}>
                      We usually respond within one business day.
                    </Typography>

                    <Grid container spacing={1.4}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Full name" variant="outlined" />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Email address" variant="outlined" type="email" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Subject" variant="outlined" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label="Message" multiline minRows={4} variant="outlined" />
                      </Grid>
                    </Grid>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        sx={{
                          textTransform: 'none',
                          bgcolor: '#0f2a5f',
                          px: 2.5,
                          py: 1,
                          borderRadius: 1,
                          '&:hover': { bgcolor: '#183a76' },
                        }}
                      >
                        Send inquiry
                      </Button>
                      <Button
                        variant="outlined"
                        href="mailto:contact@webictcapital.com"
                        sx={{
                          textTransform: 'none',
                          borderColor: '#9ebbe8',
                          color: '#0f2a5f',
                          px: 2.2,
                          py: 1,
                          borderRadius: 1,
                          '&:hover': { borderColor: '#0f2a5f', bgcolor: '#eef4ff' },
                        }}
                      >
                        Email directly
                      </Button>
                    </Stack>
                  </MotionReveal>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
