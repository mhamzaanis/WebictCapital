import { Box, Button, Container, Grid, Stack, TextField, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
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
    body: 'Webict Capital is an investment education platform focused on helping individuals become confident, independent, and research-driven investors.',
  },
  {
    title: 'What We Do',
    body: 'From foundational market concepts to portfolio construction and risk controls, we design learning paths that are structured and actionable.',
  },
  {
    title: 'Why It Matters',
    body: 'Informed investors contribute to stronger financial outcomes, better capital allocation, and a more resilient investing culture.',
  },
]

export function AboutPage() {
  const reduceMotion = useReducedMotion()
  const [result, setResult] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contactRef = useRef<HTMLDivElement | null>(null)
  const { hash } = useLocation()

  useEffect(() => {
    if (hash !== '#contact') return

    const scrollToContact = () => {
      contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Delay until route transition paint is finished.
    const timeoutId = window.setTimeout(scrollToContact, 120)
    return () => window.clearTimeout(timeoutId)
  }, [hash])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResult('Sending…')
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
        setResult('Message sent successfully.')
        form.reset()
      } else {
        setResult('Something went wrong. Please try again.')
      }
    } catch {
      setResult('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 14 },
        bgcolor: '#ffffff',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={{ xs: 10, md: 16 }}>

          {/* ── ABOUT HERO ─────────────────────────────────────────────── */}
          <MotionReveal>
            <Grid container spacing={{ xs: 4, md: 8 }} sx={{ alignItems: 'flex-end' }}>
              {/* Left — headline */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    borderTop: '2px solid #0a2463',
                    pt: 3,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      display: 'block',
                      fontSize: 11,
                      fontFamily: '"Playfair Display", serif',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#0a2463',
                      mb: 2.5,
                    }}
                  >
                    About Webict Capital
                  </Typography>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.6rem', sm: '3.2rem', md: '3.8rem', lg: '4.4rem' },
                      lineHeight: 1.04,
                      letterSpacing: '-0.03em',
                      color: '#080e1a',
                      fontWeight: 700,
                    }}
                  >
                    Built for serious&nbsp;
                    <Box component="span" sx={{ color: '#0a2463' }}>
                      investors
                    </Box>
                    .
                  </Typography>
                </Box>
              </Grid>

              {/* Right — body copy + meta */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={4}>
                  <Typography
                    sx={{
                      color: '#3a4a60',
                      fontSize: { xs: 16, md: 17.5 },
                      lineHeight: 1.78,
                      maxWidth: 520,
                    }}
                  >
                    We build serious investing education for curious learners and disciplined future
                    investors. Our work combines classical market principles with modern tools to make
                    decision-making clearer, calmer, and more consistent.
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={5}
                    divider={<Box sx={{ width: '1px', bgcolor: '#d8e2f0' }} />}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8097b0', mb: 0.5 }}>
                        Location
                      </Typography>
                      <Typography sx={{ fontSize: 15, color: '#0d1c30', fontWeight: 500 }}>
                        Karachi, Pakistan
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8097b0', mb: 0.5 }}>
                        Focus
                      </Typography>
                      <Typography sx={{ fontSize: 15, color: '#0d1c30', fontWeight: 500 }}>
                        PSX Investing Education
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </MotionReveal>

          {/* ── WHO / WHAT / WHY ───────────────────────────────────────── */}
          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            {teamHighlights.map((item, index) => (
              <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                <MotionReveal delay={Math.min(index * 0.08, 0.2)}>
                  <Box
                    sx={{
                      height: '100%',
                      border: '1px solid #e2eaf5',
                      borderRadius: 1.5,
                      p: { xs: 2.4, md: 3.2 },
                      bgcolor: '#fafbfd',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        borderColor: '#0a2463',
                        boxShadow: '0 4px 24px rgba(10,36,99,0.07)',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontFamily: '"Playfair Display", serif',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: '#0a2463',
                        mb: 1.5,
                      }}
                    >
                      {`0${index + 1}`}
                    </Typography>
                    <Typography sx={{ fontSize: 18, color: '#080e1a', fontWeight: 600, mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ color: '#4a5e78', fontSize: 14.5, lineHeight: 1.78 }}>
                      {item.body}
                    </Typography>
                  </Box>
                </MotionReveal>
              </Grid>
            ))}
          </Grid>

          {/* ── PRINCIPLES ─────────────────────────────────────────────── */}
          <Box
            component={motion.section}
            whileInView={reduceMotion ? undefined : { opacity: [0, 1], y: [20, 0] }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box sx={{ borderTop: '1px solid #e2eaf5', pt: 5, mb: 5 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  fontFamily: '"Playfair Display", serif',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#0a2463',
                  mb: 1.5,
                }}
              >
                Our Principles
              </Typography>
              <Typography sx={{ fontSize: { xs: 24, md: 30 }, color: '#080e1a', fontWeight: 700, letterSpacing: '-0.02em' }}>
                How we think about&nbsp;investing.
              </Typography>
            </Box>

            <Grid container spacing={{ xs: 2, md: 2.5 }}>
              {principles.map((item, index) => (
                <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                  <MotionReveal delay={Math.min(index * 0.08, 0.2)}>
                    <Box sx={{ borderTop: '2px solid #0a2463', pt: 2 }}>
                      <Typography sx={{ fontWeight: 600, color: '#080e1a', mb: 0.9, fontSize: 16 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: '#4a5e78', fontSize: 14.2, lineHeight: 1.75 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </MotionReveal>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* ── CONTACT ────────────────────────────────────────────────── */}
          <Box id="contact" ref={contactRef}>
            <MotionReveal>
              {/* Section header */}
              <Box sx={{ borderTop: '1px solid #e2eaf5', pt: 5, mb: 8 }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontFamily: '"Playfair Display", serif',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#0a2463',
                    mb: 1.5,
                  }}
                >
                  Contact
                </Typography>
                <Grid container spacing={{ xs: 3, md: 8 }} sx={{ alignItems: 'flex-end' }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '2rem', md: '2.8rem' },
                        fontWeight: 700,
                        color: '#080e1a',
                        letterSpacing: '-0.025em',
                        lineHeight: 1.1,
                      }}
                    >
                      Let's talk about&nbsp;
                      <Box component="span" sx={{ color: '#0a2463' }}>
                        your goals
                      </Box>
                      .
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography sx={{ color: '#4a5e78', fontSize: 15.5, lineHeight: 1.72, maxWidth: 460 }}>
                      Have questions about our programs, workshops, or portfolio education tracks?
                      We usually respond within one business day.
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Form + sidebar */}
              <Grid container spacing={{ xs: 5, md: 10 }}>
                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack spacing={5}>
                    <Box>
                      <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8097b0', mb: 1 }}>
                        Email
                      </Typography>
                      <Typography
                        component="a"
                        href="mailto:contact@webictcapital.com"
                        sx={{
                          fontSize: 15,
                          color: '#0a2463',
                          fontWeight: 500,
                          textDecoration: 'none',
                          borderBottom: '1px solid transparent',
                          transition: 'border-color 0.15s',
                          '&:hover': { borderColor: '#0a2463' },
                        }}
                      >
                        contact@webictcapital.com
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8097b0', mb: 1 }}>
                        Office
                      </Typography>
                      <Typography sx={{ fontSize: 15, color: '#0d1c30', fontWeight: 500 }}>
                        Karachi, Pakistan
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 2.8,
                        bgcolor: '#080e1a',
                        borderRadius: 1.5,
                        color: '#ffffff',
                      }}
                    >
                      <Typography sx={{ fontSize: 14, lineHeight: 1.72, color: 'rgba(255,255,255,0.78)' }}>
                        Our team guides you toward the right program — whether you're just starting out
                        or building on existing market knowledge.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Form */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box component="form" onSubmit={onSubmit}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Full name"
                          name="name"
                          required
                          variant="outlined"
                          size="medium"
                          sx={fieldSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Email address"
                          name="email"
                          required
                          variant="outlined"
                          type="email"
                          size="medium"
                          sx={fieldSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Subject"
                          name="subject"
                          variant="outlined"
                          size="medium"
                          sx={fieldSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Message"
                          name="message"
                          required
                          multiline
                          minRows={5}
                          variant="outlined"
                          size="medium"
                          sx={fieldSx}
                        />
                      </Grid>
                    </Grid>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        variant="contained"
                        disableElevation
                        sx={{
                          textTransform: 'none',
                          bgcolor: '#080e1a',
                          color: '#ffffff',
                          px: 3.5,
                          py: 1.2,
                          borderRadius: 1,
                          fontSize: 14.5,
                          fontWeight: 500,
                          letterSpacing: '0.01em',
                          '&:hover': { bgcolor: '#0a2463' },
                          '&:disabled': { bgcolor: '#c0ccd8', color: '#fff' },
                        }}
                      >
                        {isSubmitting ? 'Sending…' : 'Send inquiry'}
                      </Button>
                      {/* <Button
                        variant="outlined"
                        href="mailto:contact@webictcapital.com"
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
                        Email directly
                      </Button> */}
                    </Stack>

                    {result && (
                      <Typography
                        sx={{
                          mt: 2,
                          fontSize: 13.5,
                          color: result.includes('success') ? '#1a6640' : '#4a5e78',
                        }}
                      >
                        {result}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </MotionReveal>
          </Box>

        </Stack>
      </Container>
    </Box>
  )
}

// Shared TextField override for clean minimal look
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1,
    bgcolor: '#fafbfd',
    '& fieldset': { borderColor: '#dde7f4' },
    '&:hover fieldset': { borderColor: '#0a2463' },
    '&.Mui-focused fieldset': { borderColor: '#0a2463', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0a2463' },
}