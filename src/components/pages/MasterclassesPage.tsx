import { useState, type ElementType } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { MotionReveal } from '../animations/MotionReveal'

type Lesson = {
  title: string
  description: string
}

type SeasonBlock = {
  id: string
  eyebrow: string
  title: string
  lessons: Lesson[]
}

type IconItem = {
  title: string
  body: string
  icon: ElementType
}

const SEASONS: SeasonBlock[] = [
  {
    id: '01',
    eyebrow: 'Season 01',
    title: 'Foundations of Confident Investing',
    lessons: [
      {
        title: 'Market Structure and How PSX Works',
        description: 'Understand market participants, instruments, and how the PSX operates.',
      },
      {
        title: 'Risk Management and Position Sizing',
        description: 'Protect capital with position sizing, stop-loss, and risk frameworks.',
      },
      {
        title: 'Fundamental Analysis Essentials',
        description: 'Analyze businesses, read financials, and assess intrinsic value.',
      },
      {
        title: 'Building a Personal Investment Framework',
        description: 'Create a repeatable process aligned with your goals and risk profile.',
      },
    ],
  },
  {
    id: '02',
    eyebrow: 'Season 02',
    title: 'Portfolio Strategy and Execution',
    lessons: [
      {
        title: 'Portfolio Construction for Different Goals',
        description: 'Balance conviction, diversification, liquidity, and investment horizon.',
      },
      {
        title: 'Sector Rotation and Macro Signals',
        description: 'Read sector strength, economic cycles, and capital flow signals.',
      },
      {
        title: 'Entry and Exit Discipline',
        description: 'Plan trade execution with valuation, technical levels, and review rules.',
      },
    ],
  },
  {
    id: '03',
    eyebrow: 'Season 03',
    title: 'Advanced Analysis and Valuation',
    lessons: [
      {
        title: 'Financial Statement Deep Dives',
        description: 'Evaluate earnings quality, balance sheet strength, and cash conversion.',
      },
      {
        title: 'Valuation Methods in Practice',
        description: 'Use multiples, scenarios, and margin-of-safety thinking responsibly.',
      },
      {
        title: 'Research Notes and Investment Memos',
        description: 'Turn analysis into concise, decision-ready investment cases.',
      },
    ],
  },
  {
    id: '04',
    eyebrow: 'Season 04',
    title: 'Market Psychology and Advanced Risk',
    lessons: [
      {
        title: 'Behavioral Biases in Investing',
        description: 'Recognize emotional traps that distort position sizing and exits.',
      },
      {
        title: 'Drawdown Planning',
        description: 'Prepare risk rules for volatile markets before volatility arrives.',
      },
      {
        title: 'Building a Review Cadence',
        description: 'Use journaling, watchlists, and post-trade reviews to improve decisions.',
      },
    ],
  },
]

const FEATURES: IconItem[] = [
  {
    title: 'Structured Learning',
    body: 'Seasonal modules that build your investing foundation.',
    icon: MenuBookOutlinedIcon,
  },
  {
    title: 'Expert Led',
    body: 'Learn from experienced investors and practitioners.',
    icon: PersonOutlineRoundedIcon,
  },
  {
    title: 'Practical and Actionable',
    body: 'Real-world frameworks you can apply with confidence.',
    icon: BarChartRoundedIcon,
  },
  {
    title: 'Certificate of Completion',
    body: 'Recognize your progress with a Webict Capital certificate.',
    icon: WorkspacePremiumOutlinedIcon,
  },
]

const AUDIENCES: IconItem[] = [
  {
    title: 'Serious Investors',
    body: 'For individuals who want to build long-term wealth with clarity and discipline.',
    icon: PersonOutlineRoundedIcon,
  },
  {
    title: 'Professionals',
    body: 'For working professionals looking to upgrade their investment skills.',
    icon: BarChartRoundedIcon,
  },
  {
    title: 'Aspiring Analysts',
    body: 'For those aiming to build a career in finance and investment research.',
    icon: SchoolOutlinedIcon,
  },
]

const EASE = [0.22, 1, 0.36, 1] as const

function FeatureStrip() {
  return (
    <MotionReveal delay={0.08}>
      <Box
        sx={{
          border: '1px solid var(--wc-divider)',
          borderRadius: '7px',
          bgcolor: 'var(--wc-bg)',
          boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          overflow: 'hidden',
        }}
      >
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon

          return (
            <Box
              key={feature.title}
              sx={{
                px: { xs: 2.5, md: 3 },
                py: { xs: 2.6, md: 3.2 },
                textAlign: 'center',
                borderLeft: {
                  lg: index === 0 ? 'none' : '1px solid var(--wc-divider)',
                },
                borderTop: {
                  xs: index === 0 ? 'none' : '1px solid var(--wc-divider)',
                  sm: index < 2 ? 'none' : '1px solid var(--wc-divider)',
                  lg: 'none',
                },
              }}
            >
              <Icon sx={{ color: 'var(--wc-primary)', fontSize: 31, mb: 1.5 }} />
              <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>
                {feature.title}
              </Typography>
              <Typography sx={{ mt: 1, color: 'var(--wc-text-secondary)', fontSize: 12.5, lineHeight: 1.6 }}>
                {feature.body}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </MotionReveal>
  )
}

function CurriculumSeason({
  season,
  isOpen,
  onChange,
}: {
  season: SeasonBlock
  isOpen: boolean
  onChange: (expanded: boolean) => void
}) {
  return (
    <Accordion
      disableGutters
      square
      expanded={isOpen}
      onChange={(_, expanded) => onChange(expanded)}
      sx={{
        border: '1px solid',
        borderColor: isOpen ? 'var(--wc-primary)' : 'var(--wc-divider)',
        borderRadius: '7px !important',
        boxShadow: 'none',
        overflow: 'hidden',
        bgcolor: 'var(--wc-bg)',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={isOpen ? <RemoveRoundedIcon /> : <AddRoundedIcon />}
        aria-controls={`season-${season.id}-content`}
        id={`season-${season.id}-header`}
        sx={{
          minHeight: 0,
          px: { xs: 2, md: 2.5 },
          py: { xs: 1.6, md: 2 },
          bgcolor: isOpen ? 'var(--wc-primary-light)' : 'var(--wc-bg)',
          '& .MuiAccordionSummary-content': { my: 0, alignItems: 'center' },
          '& .MuiAccordionSummary-expandIconWrapper': {
            color: 'var(--wc-primary)',
            transform: 'none',
          },
          '&:hover': { bgcolor: 'var(--wc-primary-light)' },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              bgcolor: isOpen ? 'var(--wc-primary)' : 'var(--wc-bg)',
              border: isOpen ? '1px solid var(--wc-primary)' : '1px solid var(--wc-divider)',
              color: isOpen ? '#ffffff' : 'var(--wc-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--wc-font-mono)',
              fontSize: 11,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {season.id}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: 'var(--wc-primary)',
                fontFamily: 'var(--wc-font-display)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0,
                textTransform: 'uppercase',
              }}
            >
              {season.eyebrow}
            </Typography>
            <Typography
              sx={{
                color: 'var(--wc-text-primary)',
                fontFamily: 'var(--wc-font-display)',
                fontSize: { xs: 17, md: 22 },
                fontWeight: 700,
                lineHeight: 1.18,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {season.title}
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>

      <AccordionDetails
        id={`season-${season.id}-content`}
        sx={{
          px: { xs: 2, md: 3 },
          py: 0,
          borderTop: '1px solid var(--wc-divider)',
        }}
      >
        <Box sx={{ py: { xs: 1.2, md: 1.5 } }}>
          {season.lessons.map((lesson, index) => (
            <Box
              key={lesson.title}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '28px 1fr', md: '42px minmax(210px, 0.62fr) minmax(0, 1fr)' },
                gap: { xs: 1.4, md: 2 },
                alignItems: 'center',
                py: 1.35,
                borderBottom: index === season.lessons.length - 1 ? 'none' : '1px solid var(--wc-divider)',
              }}
            >
              <Typography
                sx={{
                  color: 'var(--wc-primary)',
                  fontFamily: 'var(--wc-font-mono)',
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 800, lineHeight: 1.45 }}>
                {lesson.title}
              </Typography>
              <Typography
                sx={{
                  gridColumn: { xs: '2 / -1', md: 'auto' },
                  color: 'var(--wc-text-secondary)',
                  fontSize: 12.5,
                  lineHeight: 1.55,
                }}
              >
                {lesson.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

function AudienceBand() {
  return (
    <MotionReveal>
      <Box
        sx={{
          maxWidth: 1080,
          mx: 'auto',
          border: '1px solid var(--wc-divider)',
          borderRadius: '7px',
          bgcolor: 'var(--wc-paper)',
          px: { xs: 2.5, md: 4.5 },
          py: { xs: 3.2, md: 4.2 },
          boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: 'var(--wc-text-primary)',
            fontFamily: 'var(--wc-font-display)',
            fontSize: { xs: 24, md: 29 },
            fontWeight: 700,
            lineHeight: 1.15,
            textAlign: 'center',
            mb: { xs: 2.8, md: 3.4 },
          }}
        >
          Who it's for
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: { xs: 2.4, md: 0 },
          }}
        >
          {AUDIENCES.map((audience, index) => {
            const Icon = audience.icon

            return (
              <Stack
                key={audience.title}
                direction="row"
                spacing={1.6}
                sx={{
                  alignItems: 'flex-start',
                  px: { md: index === 0 ? 0 : 3.5 },
                  borderLeft: { md: index === 0 ? 'none' : '1px solid var(--wc-divider)' },
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    border: '1px solid var(--wc-divider)',
                    bgcolor: 'var(--wc-bg)',
                    color: 'var(--wc-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ fontSize: 23 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 14, fontWeight: 800 }}>
                    {audience.title}
                  </Typography>
                  <Typography sx={{ mt: 1, color: 'var(--wc-text-secondary)', fontSize: 12.3, lineHeight: 1.65 }}>
                    {audience.body}
                  </Typography>
                </Box>
              </Stack>
            )
          })}
        </Box>
      </Box>
    </MotionReveal>
  )
}

export function MasterclassesPage() {
  const [openSeason, setOpenSeason] = useState(SEASONS[0].id)
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2.6rem)', md: 'calc(72px + 3.8rem)' },
        pb: { xs: 7, md: 10 },
        bgcolor: 'var(--wc-bg)',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={{ xs: 5.5, md: 6.8 }}>
          <Box
            component={motion.section}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.9fr) minmax(470px, 1fr)' },
              gap: { xs: 4, lg: 7 },
              alignItems: 'center',
            }}
          >
            <Box>
              

              <Typography
                variant="h1"
                sx={{
                  color: 'var(--wc-text-primary)',
                  fontFamily: 'var(--wc-font-display)',
                  fontSize: { xs: '3.1rem', sm: '4.2rem', md: '5.1rem' },
                  fontWeight: 700,
                  lineHeight: 0.98,
                  letterSpacing: 0,
                }}
              >
                Master
                <Box component="span" sx={{ color: 'var(--wc-primary)' }}>
                  classes.
                </Box>
              </Typography>

              <Typography sx={{ mt: 3, color: 'var(--wc-text-secondary)', fontSize: { xs: 15, md: 16.5 }, lineHeight: 1.8, maxWidth: 530 }}>
                A structured seasonal curriculum designed for focused investors. Learn from market experts and gain
                practical frameworks to build conviction, manage risk, and make better investment decisions.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.2} sx={{ mt: 3.7 }}>
               
                <Button
                  component="a"
                  href="#curriculum"
                  variant="outlined"
                  sx={{
                    borderColor: 'var(--wc-divider)',
                    color: 'var(--wc-text-primary)',
                    borderRadius: '5px',
                    minWidth: 176,
                    px: 3,
                    py: 1.3,
                    fontSize: 13,
                    fontWeight: 800,
                    '&:hover': {
                      borderColor: '#b9c9e4',
                      bgcolor: 'var(--wc-primary-light)',
                    },
                  }}
                >
                  View Curriculum
                </Button>
              </Stack>
            </Box>

            <Box
              sx={{
                border: '1px solid var(--wc-divider)',
                borderRadius: '7px',
                overflow: 'hidden',
                bgcolor: 'var(--wc-paper)',
                boxShadow: '0 22px 52px rgba(10,36,99,0.09)',
                aspectRatio: { xs: '1.36 / 1', md: '1.45 / 1' },
                minHeight: { xs: 280, md: 360 },
              }}
            >
              <Box
                component="img"
                src="/herosection.webp"
                alt="Webict Capital education cohort"
                sx={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 47%',
                }}
              />
            </Box>
          </Box>

          <FeatureStrip />

          <Box id="curriculum" component="section" sx={{ scrollMarginTop: { xs: 96, md: 112 } }}>
            <MotionReveal>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.9fr) minmax(280px, 0.7fr)' },
                  gap: { xs: 1.6, md: 7 },
                  alignItems: 'end',
                  maxWidth: 930,
                  mx: 'auto',
                  mb: { xs: 2.6, md: 3.2 },
                }}
              >
                <Box>
                  {/* <SectionKicker>Curriculum</SectionKicker> */}
                  <Typography
                    variant="h2"
                    sx={{
                      mt: 1,
                      color: 'var(--wc-text-primary)',
                      fontFamily: 'var(--wc-font-display)',
                      fontSize: { xs: 29, md: 36 },
                      fontWeight: 700,
                      lineHeight: 1.12,
                    }}
                  >
                    What you'll learn.
                  </Typography>
                </Box>
                
              </Box>
            </MotionReveal>

            <Stack spacing={1.3} sx={{ maxWidth: 930, mx: 'auto' }}>
              {SEASONS.map((season, index) => (
                <MotionReveal key={season.id} delay={Math.min(index * 0.06, 0.18)}>
                  <CurriculumSeason
                    season={season}
                    isOpen={openSeason === season.id}
                    onChange={(expanded) => setOpenSeason(expanded ? season.id : '')}
                  />
                </MotionReveal>
              ))}
            </Stack>
          </Box>

          <AudienceBand />

        </Stack>
      </Container>
    </Box>
  )
}
