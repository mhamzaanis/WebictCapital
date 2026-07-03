import { type FormEvent, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded'
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import { Box, Button, Container, InputBase, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { MotionReveal } from '../animations/MotionReveal'

const WEB3FORMS_ACCESS_KEY = '6f47bd12-e704-4f13-a5ae-63255ad5bfcd'

const FEATURES = [
  {
    title: 'Strategy Sessions',
    body: 'One-on-one consultations to align your goals with practical investment strategies.',
    icon: GroupsOutlinedIcon,
  },
  {
    title: 'Portfolio Reviews',
    body: 'Deep-dive analysis of your portfolio with tailored optimization ideas.',
    icon: PieChartOutlineRoundedIcon,
  },
  {
    title: 'Risk Guidance',
    body: 'Understand and manage risk with clear frameworks suited to your profile.',
    icon: ShieldOutlinedIcon,
  },
  {
    title: 'Market Perspective',
    body: 'Timely insights and data-driven views on the Pakistan market and global trends.',
    icon: QueryStatsRoundedIcon,
  },
]

const EXPECTATIONS = [
  'Personalized strategy sessions tailored to your goals',
  'Actionable recommendations you can implement',
  'Independent guidance with investor-first approach',
  'Confidential and secure engagement',
  'Built for investors focused on long-term wealth',
]

const FAQ_ITEMS = [
  {
    question: 'What will the advisory service include?',
    answer: 'Focused strategy sessions, portfolio reviews, risk guidance, and practical follow-up notes for serious investors.',
  },
  {
    question: 'Who is this service for?',
    answer: 'Investors who want structured, long-term portfolio guidance for the Pakistan market.',
  },
  {
    question: 'How is this different from your other services?',
    answer: 'Advisory is personalized and portfolio-specific, while our learning resources are designed for broad education.',
  },
  {
    question: 'When will advisory launch?',
    answer: 'The service is currently in preparation. Waitlist members will receive early access updates first.',
  },
]

const inputShellSx = {
  height: 52,
  border: '1px solid #dce6f4',
  borderRadius: '5px',
  bgcolor: '#ffffff',
  px: 1.8,
  display: 'flex',
  alignItems: 'center',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  '&:focus-within': {
    borderColor: '#9db6ed',
    boxShadow: '0 0 0 3px rgba(20, 59, 175, 0.08)',
  },
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography sx={{ mb: 1, color: '#071329', fontSize: 12.5, fontWeight: 700 }}>
      {children}
    </Typography>
  )
}

export function AdvisoryPage() {
  const reduceMotion = useReducedMotion()
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [waitlistResult, setWaitlistResult] = useState('')
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setWaitlistResult('Sending…')
    setIsSubmittingWaitlist(true)

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
        setWaitlistResult('Thanks for joining the waitlist.')
        form.reset()
      } else {
        setWaitlistResult('Something went wrong. Please try again.')
      }
    } catch {
      setWaitlistResult('Something went wrong. Please try again.')
    } finally {
      setIsSubmittingWaitlist(false)
    }
  }

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'var(--wc-page-top-xs)', md: 'var(--wc-page-top-md)' },
        pb: { xs: 'var(--wc-page-bottom-xs)', md: 'var(--wc-page-bottom-md)' },
        bgcolor: '#ffffff',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1720px !important', px: { xs: 'var(--wc-page-gutter-xs)', md: 'var(--wc-page-gutter-md)', xl: 'var(--wc-page-gutter-xl)' } }}>
        <Stack spacing={{ xs: 5.5, md: 7 }}>
          <MotionReveal>
            <Box
              component={motion.section}
              id="advisory-details"
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '0.92fr 1.08fr' },
                gap: { xs: 5, lg: 8 },
                alignItems: 'center',
                minHeight: { lg: 620 },
              }}
            >
              <Box sx={{ maxWidth: 650 }}>

                <Typography
                  variant="h1"
                  sx={{
                    mt: { xs: 3.2, md: 4 },
                    color: 'var(--wc-text-primary)',
                    fontSize: { xs: '2.35rem', sm: '2.9rem', md: '3.45rem' },
                    fontWeight: 700,
                    lineHeight: 0.95,
                    letterSpacing: '-0.045em',
                  }}
                >
                  Advisory is
                  <br />
                  <Box component="span" sx={{ color: 'var(--wc-primary)' }}>
                    coming.
                  </Box>
                </Typography>

                <Typography
                  sx={{
                    mt: 3.2,
                    color: '#435981',
                    fontSize: { xs: 15, md: 17 },
                    lineHeight: 1.78,
                    maxWidth: 610,
                  }}
                >
                  We are preparing a focused advisory experience for serious investors — including strategy sessions,
                  personalized market reviews, and actionable portfolio guidance tailored to the Pakistan market.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4.5 }}>
                  <Button
                    component="a"
                    href="#advisory-waitlist"
                    endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      height: 60,
                      px: 3.2,
                      borderRadius: '5px',
                      bgcolor: '#020918',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 800,
                      boxShadow: '0 12px 24px rgba(2, 9, 24, 0.16)',
                      '&:hover': { bgcolor: '#071329' },
                    }}
                  >
                    Join the waitlist
                  </Button>
                  <Button
                    component="a"
                    href="#advisory-faq"
                    sx={{
                      height: 60,
                      px: 3.4,
                      border: '1px solid #dce6f4',
                      borderRadius: '5px',
                      bgcolor: '#ffffff',
                      color: '#071329',
                      fontSize: 14,
                      fontWeight: 800,
                      '&:hover': { bgcolor: '#f7faff', borderColor: '#b9c9e4' },
                    }}
                  >
                    Learn more
                  </Button>
                </Stack>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', lg: 'flex-end' },
                  alignItems: 'center',
                  minHeight: { xs: 300, md: 440 },
                }}
              >
                <Box
                  component={motion.img}
                  src="/advisory-hero.png"
                  alt="Advisory reports and compass"
                  initial={reduceMotion ? false : { opacity: 0, x: 36, rotate: -2 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    width: '100%',
                    maxWidth: { xs: 620, lg: 820 },
                    transform: { lg: 'translateX(18px)' },
                    filter: 'drop-shadow(0 28px 48px rgba(10, 36, 99, 0.08))',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Box>
          </MotionReveal>

          <MotionReveal delay={0.05}>
            <Box
              sx={{
                border: '1px solid #dce6f4',
                borderRadius: '7px',
                bgcolor: '#ffffff',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                overflow: 'hidden',
                boxShadow: '0 18px 42px rgba(10, 36, 99, 0.025)',
              }}
            >
              {FEATURES.map((feature, index) => {
  const FeatureIcon = feature.icon

  return (
    <Box
      key={feature.title}
      sx={{
        minHeight: 200,
        px: { xs: 2.6, md: 3.5 },
        py: { xs: 3, md: 4 },
        borderRight: {
          xs: 'none',
          sm: index % 2 === 0 ? '1px solid #dce6f4' : 'none',
          lg:
            index < FEATURES.length - 1
              ? '1px solid #dce6f4'
              : 'none',
        },
        borderBottom: {
          xs:
            index < FEATURES.length - 1
              ? '1px solid #dce6f4'
              : 'none',
          sm: index < 2 ? '1px solid #dce6f4' : 'none',
          lg: 'none',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <FeatureIcon
          sx={{
            color: '#49648d',
            fontSize: 38,
            flexShrink: 0,
          }}
        />

        <Typography
          sx={{
            color: '#071329',
            fontFamily: 'var(--wc-font-body)',
            fontSize: 21,
            fontWeight: 700,
          }}
        >
          {feature.title}
        </Typography>
      </Box>

      <Typography
        sx={{
          mt: 1.6,
          color: '#435981',
          fontSize: 14.5,
          lineHeight: 1.75,
        }}
      >
        {feature.body}
      </Typography>
    </Box>
  )
})}
            </Box>
          </MotionReveal>

          <MotionReveal delay={0.1}>
            <Box
              id="advisory-waitlist"
              sx={{
                border: '1px solid #dce6f4',
                borderRadius: '7px',
                bgcolor: '#ffffff',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(10, 36, 99, 0.03)',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '0.96fr 1.04fr' },
                  gap: { xs: 3, lg: 7 },
                  p: { xs: 3, md: 5.5, xl: 6 },
                }}
              >
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 680 }}>
                  <Typography
                    variant="h2"
                    sx={{
                      color: '#071329',
                      fontSize: { xs: '2rem', md: '2.55rem' },
                      lineHeight: 1.05,
                      fontWeight: 700,
                    }}
                  >
                    Be the first to know
                  </Typography>
                  <Typography sx={{ mt: 2, color: '#435981', fontSize: 15, lineHeight: 1.75, maxWidth: 480 }}>
                    Join the waitlist to get early access and updates when advisory launches.
                  </Typography>

                  <Stack spacing={2.2} sx={{ mt: 4 }}>
                    <Box>
                      <FieldLabel>Full name</FieldLabel>
                      <Box sx={inputShellSx}>
                        <InputBase
                          name="name"
                          fullWidth
                          placeholder="Enter your full name"
                          inputProps={{ 'aria-label': 'Full name' }}
                          sx={{ color: '#071329', fontSize: 14, '& input::placeholder': { color: '#7c8da8', opacity: 1 } }}
                        />
                      </Box>
                    </Box>

                    <Box>
                      <FieldLabel>Email address</FieldLabel>
                      <Box sx={inputShellSx}>
                        <InputBase
                          name="email"
                          fullWidth
                          type="email"
                          required
                          placeholder="you@example.com"
                          inputProps={{ 'aria-label': 'Email address' }}
                          sx={{ color: '#071329', fontSize: 14, '& input::placeholder': { color: '#7c8da8', opacity: 1 } }}
                        />
                      </Box>
                    </Box>

                    <Box>
                      <FieldLabel>What best describes you?</FieldLabel>
                      <Box sx={{ ...inputShellSx, position: 'relative', px: 0 }}>
                        <Box
                          component="select"
                          name="investor_type"
                          defaultValue=""
                          aria-label="Investor type"
                          sx={{
                            appearance: 'none',
                            width: '100%',
                            height: '100%',
                            border: 0,
                            outline: 0,
                            bgcolor: 'transparent',
                            color: '#7c8da8',
                            fontFamily: 'var(--wc-font-body)',
                            fontSize: 14,
                            px: 1.8,
                            pr: 5,
                          }}
                        >
                          <option value="" disabled>
                            Select an option
                          </option>
                          <option>Individual investor</option>
                          <option>Family portfolio manager</option>
                          <option>Business owner</option>
                          <option>Financial professional</option>
                        </Box>
                        <KeyboardArrowDownRoundedIcon
                          sx={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#48618a',
                            pointerEvents: 'none',
                          }}
                        />
                      </Box>
                    </Box>
                  </Stack>

                  <Box sx={{ mt: 2.8, display: 'flex', alignItems: 'center', gap: 1.1 }}>
                    <Box
                      component="input"
                      type="checkbox"
                      defaultChecked
                      aria-label="Agree to receive updates"
                      sx={{ width: 16, height: 16, accentColor: '#143baf', m: 0 }}
                    />
                    <Typography sx={{ color: '#435981', fontSize: 12.5 }}>
                      I agree to receive updates from Webict Capital.
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    disabled={isSubmittingWaitlist}
                    endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      mt: 2.8,
                      width: '100%',
                      height: 60,
                      borderRadius: '5px',
                      bgcolor: '#020918',
                      color: '#ffffff',
                      fontSize: 14,
                      fontWeight: 800,
                      boxShadow: '0 12px 24px rgba(2, 9, 24, 0.12)',
                      '&:hover': { bgcolor: '#071329' },
                    }}
                  >
                    {isSubmittingWaitlist ? 'Sending…' : 'Join the waitlist'}
                  </Button>

                  {waitlistResult && (
                    <Typography sx={{ mt: 2, color: '#647799', fontSize: 12.5, lineHeight: 1.65 }}>
                      {waitlistResult}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2.6, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <LockOutlinedIcon sx={{ color: '#49648d', fontSize: 18 }} />
                    <Typography sx={{ color: '#647799', fontSize: 12.5 }}>
                      We respect your privacy. Unsubscribe anytime.
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    border: '1px solid #dce6f4',
                    borderRadius: '7px',
                    bgcolor: '#f8fbff',
                    minHeight: { xs: 420, lg: 585 },
                    p: { xs: 3, md: 5 },
                    alignSelf: 'stretch',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarMonthOutlinedIcon sx={{ color: '#143baf', fontSize: 36, mb: 2.4 }} />
                  <Typography
                    sx={{
                      color: '#071329',
                      fontFamily: 'var(--wc-font-body)',
                      fontSize: 24,
                      fontWeight: 700,
                    }}
                  >
                    What to expect
                  </Typography>

                  <Stack spacing={1.8} sx={{ mt: 3 }}>
                    {EXPECTATIONS.map((item) => (
                      <Box key={item} sx={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 1.4 }}>
                        <CheckCircleOutlineRoundedIcon sx={{ color: '#143baf', fontSize: 18, mt: 0.25 }} />
                        <Typography sx={{ color: '#435981', fontSize: 14, lineHeight: 1.55 }}>{item}</Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Box sx={{ my: 5, borderTop: '1px solid #dce6f4' }} />

                  <Box sx={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 1.5 }}>
                    <EmailOutlinedIcon sx={{ color: '#143baf', fontSize: 22, mt: 0.25 }} />
                    <Box>
                      <Typography sx={{ color: '#143baf', fontSize: 14, fontWeight: 800 }}>
                        Early access for waitlist members
                      </Typography>
                      <Typography sx={{ mt: 0.6, color: '#647799', fontSize: 12.5, lineHeight: 1.7 }}>
                        We’ll notify you as soon as advisory services go live.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box
                id="advisory-faq"
                sx={{
                  borderTop: '1px solid #dce6f4',
                  px: { xs: 3, md: 5.5, xl: 6 },
                  py: { xs: 3, md: 4 },
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    color: '#071329',
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    lineHeight: 1.1,
                    fontWeight: 700,
                    mb: 2.2,
                  }}
                >
                  Frequently asked questions
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    columnGap: { md: 5 },
                  }}
                >
                  {[0, 1].map((column) => (
                    <Stack
                      key={column}
                      sx={{
                        borderLeft: { md: column === 1 ? '1px solid #dce6f4' : 'none' },
                        pl: { md: column === 1 ? 5 : 0 },
                      }}
                    >
                      {FAQ_ITEMS.filter((_, index) => index % 2 === column).map((item) => {
                        const isOpen = openFaq === item.question
                        return (
                          <Box key={item.question} sx={{ borderBottom: '1px solid #dce6f4' }}>
                            <Box
                              component="button"
                              type="button"
                              onClick={() => setOpenFaq(isOpen ? null : item.question)}
                              sx={{
                                width: '100%',
                                minHeight: 52,
                                border: 0,
                                bgcolor: '#ffffff',
                                color: '#071329',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                                p: 0,
                                textAlign: 'left',
                                font: 'inherit',
                              }}
                            >
                              <Typography sx={{ color: '#071329', fontSize: 14.5, fontWeight: 700 }}>
                                {item.question}
                              </Typography>
                              <AddRoundedIcon
                                sx={{
                                  color: '#071329',
                                  fontSize: 20,
                                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                                  transition: 'transform 160ms ease',
                                  flexShrink: 0,
                                }}
                              />
                            </Box>
                            {isOpen && (
                              <Typography sx={{ pb: 2, pr: 4, color: '#435981', fontSize: 13.5, lineHeight: 1.65 }}>
                                {item.answer}
                              </Typography>
                            )}
                          </Box>
                        )
                      })}
                    </Stack>
                  ))}
                </Box>
              </Box>
            </Box>
          </MotionReveal>

          {/* <MotionReveal delay={0.12}>
            <Box
              sx={{
                mt: { xs: 0.5, md: 1.5 },
                mb: { xs: 1, md: 0.5 },
                minHeight: { xs: 300, md: 228 },
                borderRadius: '7px',
                bgcolor: '#071329',
                color: '#ffffff',
                overflow: 'hidden',
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '0.9fr 1fr' },
                alignItems: 'center',
                gap: { xs: 4, md: 6 },
                px: { xs: 3, sm: 5, md: 9 },
                py: { xs: 4, md: 4.5 },
                boxShadow: '0 18px 36px rgba(7, 19, 41, 0.16)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(105deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 48%, rgba(20,59,175,0.18))',
                  pointerEvents: 'none',
                }}
              />

              <Box sx={{ position: 'relative' }}>
                <Typography
                  sx={{
                    color: '#90a4c8',
                    fontFamily: 'var(--wc-font-body)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0,
                    textTransform: 'uppercase',
                    mb: 1.5,
                  }}
                >
                  Stay in touch
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    color: '#ffffff',
                    fontSize: { xs: '2rem', md: '2.85rem' },
                    lineHeight: 1.05,
                    fontWeight: 700,
                    letterSpacing: 0,
                    maxWidth: 455,
                  }}
                >
                  Insights that help you invest with{' '}
                  <Box component="span" sx={{ color: '#a8c5ff', fontStyle: 'italic' }}>
                    confidence.
                  </Box>
                </Typography>
                <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 1.75, maxWidth: 410 }}>
                  Receive market insights, education updates, and new tools straight to your inbox.
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit} sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 70px' },
                    border: '1px solid rgba(255,255,255,0.32)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '&:focus-within': { borderColor: '#8fb2ff' },
                  }}
                >
                  <InputBase
                    type="email"
                    placeholder="Enter your email address"
                    inputProps={{ 'aria-label': 'Newsletter email address' }}
                    sx={{
                      minHeight: 64,
                      px: 2.4,
                      color: '#ffffff',
                      fontSize: 14,
                      '& input::placeholder': { color: 'rgba(255,255,255,0.42)', opacity: 1 },
                    }}
                  />
                  <Button
                    type="submit"
                    aria-label="Submit newsletter email"
                    sx={{
                      minWidth: 0,
                      height: { xs: 52, sm: 'auto' },
                      borderRadius: 0,
                      bgcolor: '#2458d7',
                      color: '#ffffff',
                      '&:hover': { bgcolor: '#1b49bd' },
                    }}
                  >
                    <ArrowForwardRoundedIcon sx={{ fontSize: 24 }} />
                  </Button>
                </Box>
                <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.44)', fontSize: 11.5, lineHeight: 1.6 }}>
                  You can unsubscribe at any time. We respect your privacy.
                </Typography>
              </Box>
            </Box>
          </MotionReveal> */}
        </Stack>
      </Container>
    </Box>
  )
}
