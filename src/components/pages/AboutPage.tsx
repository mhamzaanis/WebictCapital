import { Box, Button, Container, Grid, Stack, TextField, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { type FormEvent, useState } from 'react'
import { MotionReveal } from '../animations/MotionReveal'

const WEB3FORMS_ACCESS_KEY = '6f47bd12-e704-4f13-a5ae-63255ad5bfcd'

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
  const [result, setResult] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResult('Sending....')
    setIsSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.append('access_key', WEB3FORMS_ACCESS_KEY)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json()) as { success?: boolean }
      if (data.success) {
        setResult('Form Submitted Successfully')
        form.reset()
      } else {
        setResult('Error')
      }
    } catch {
      setResult('Error')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <Grid container spacing={{ xs: 1.7, md: 2.4 }} sx={{ alignItems: 'stretch' }}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <MotionReveal>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: '#cfdef3',
                    bgcolor: 'rgba(255,255,255,0.86)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 1.6,
                    p: { xs: 2.2, md: 3.2 },
                    boxShadow: '0 16px 34px rgba(14, 41, 88, 0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    minHeight: { xs: 280, lg: 420 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
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

                  <Box>
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2rem', sm: '2.4rem', md: '2.8rem' },
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
                        fontSize: { xs: 15, md: 17 },
                        lineHeight: 1.72,
                      }}
                    >
                      We build serious investing education for curious learners and disciplined future investors. Our work
                      combines classical market principles with modern tools to make decision-making clearer, calmer, and
                      more consistent.
                    </Typography>
                  </Box>

                  <Stack spacing={0.8} sx={{ mt: 2.2 }}>
                    <Typography sx={{ fontSize: 12, color: '#567090', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Office
                    </Typography>
                    <Typography sx={{ color: '#1c2f48', fontSize: 15.5 }}>Karachi, Pakistan</Typography>
                  </Stack>
                </Box>
              </MotionReveal>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <Box
                id="contact"
                sx={{
                  border: '1px solid',
                  borderColor: '#c8d9f3',
                  borderRadius: 1.6,
                  overflow: 'hidden',
                  bgcolor: '#ffffff',
                  boxShadow: '0 18px 34px rgba(15, 42, 95, 0.08)',
                  height: '100%',
                }}
              >
                <Grid container sx={{ height: '100%' }}>
                  <Grid size={{ xs: 12, md: 4.5 }}>
                    <Box
                      sx={{
                        height: '100%',
                        p: { xs: 2.2, md: 2.6 },
                        backgroundImage: 'linear-gradient(158deg, #102a54 0%, #0f2a5f 55%, #1a4fa0 100%)',
                        color: '#ffffff',
                      }}
                    >
                      <MotionReveal>
                        <Typography variant="h3" sx={{ fontSize: { xs: 24, md: 30 }, lineHeight: 1.1, mb: 1.1 }}>
                          Contact Us
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.84)', fontSize: 14, lineHeight: 1.68 }}>
                          Have questions about our programs, workshops, or portfolio education tracks? Reach out and our
                          team will guide you to the right next step.
                        </Typography>
                      </MotionReveal>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 7.5 }}>
                    <Box sx={{ p: { xs: 2.2, md: 2.6 } }}>
                      <MotionReveal>
                        <Typography sx={{ fontSize: { xs: 20, md: 25 }, color: '#0b1320', mb: 0.8 }}>Send a message</Typography>
                        <Typography sx={{ color: '#4a5c74', mb: 1.8, fontSize: 14 }}>
                          We usually respond within one business day.
                        </Typography>

                        <Box component="form" onSubmit={onSubmit}>
                          <Grid container spacing={1.2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth label="Full name" name="name" required variant="outlined" size="small" />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                label="Email address"
                                name="email"
                                required
                                variant="outlined"
                                type="email"
                                size="small"
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <TextField fullWidth label="Subject" name="subject" variant="outlined" size="small" />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <TextField
                                fullWidth
                                label="Message"
                                name="message"
                                required
                                multiline
                                minRows={4}
                                variant="outlined"
                                size="small"
                              />
                            </Grid>
                          </Grid>

                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1} sx={{ mt: 1.8 }}>
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              variant="contained"
                              sx={{
                                textTransform: 'none',
                                bgcolor: '#0f2a5f',
                                px: 2.5,
                                py: 0.9,
                                borderRadius: 1,
                                '&:hover': { bgcolor: '#183a76' },
                              }}
                            >
                              {isSubmitting ? 'Sending....' : 'Send inquiry'}
                            </Button>
                            <Button
                              variant="outlined"
                              href="mailto:contact@webictcapital.com"
                              sx={{
                                textTransform: 'none',
                                borderColor: '#9ebbe8',
                                color: '#0f2a5f',
                                px: 2.2,
                                py: 0.9,
                                borderRadius: 1,
                                '&:hover': { borderColor: '#0f2a5f', bgcolor: '#eef4ff' },
                              }}
                            >
                              Email directly
                            </Button>
                          </Stack>

                          {result ? (
                            <Typography sx={{ mt: 1.2, fontSize: 13, color: '#4a5c74' }}>
                              {result}
                            </Typography>
                          ) : null}
                        </Box>
                      </MotionReveal>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>

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

        </Stack>
      </Container>
    </Box>
  )
}
