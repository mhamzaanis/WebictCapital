import { useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { MotionReveal } from '../animations/MotionReveal'

type SeasonBlock = {
  title: string
  subtopics: string[]
}

const seasonBlocks: SeasonBlock[] = [
  {
    title: 'Season 01: Foundations of Confident Investing',
    subtopics: [
      'Market Structure and How PSX Works',
      'Risk Management and Position Sizing',
      'Fundamental Analysis Essentials',
      'Building a Personal Investment Framework',
    ],
  },
  {
    title: 'Season 02: Portfolio Strategy and Execution',
    subtopics: [
      'Portfolio Construction for Different Goals',
      'Sector Rotation and Macro Signals',
      'Entry and Exit Discipline',
      'Review Systems for Long-Term Consistency',
    ],
  },
]

export function MasterclassesPage() {
  const [openSeason, setOpenSeason] = useState<string | null>(seasonBlocks[0].title)
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 14 },
        bgcolor: '#ffffff',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={{ xs: 5, md: 7 }}>

          {/* ── Header ── */}
          <MotionReveal>
            <Box sx={{ maxWidth: 80 }} />
            <Box sx={{ mt: 3 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1.5 }}>
        
                {/* Status pill */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    border: '1px solid #c8d6ec',
                    borderRadius: 0.7,
                    px: 1.2,
                    py: 0.4,
                  }}
                >
                  <Box sx={{ position: 'relative', width: 6, height: 6 }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        bgcolor: '#0a2463',
                        opacity: 0.2,
                        animation: 'pulse 1.8s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { transform: 'scale(1)', opacity: 0.2 },
                          '50%': { transform: 'scale(2.4)', opacity: 0 },
                        },
                      }}
                    />
                    <Box sx={{ position: 'absolute', inset: '1.5px', borderRadius: '50%', bgcolor: '#0a2463' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontFamily: '"Playfair Display", serif',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#0a2463',
                      fontWeight: 600,
                    }}
                  >
                    Coming Soon
                  </Typography>
                </Box>
              </Stack>

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.6rem', sm: '3.2rem', md: '3.8rem' },
                  lineHeight: 1.04,
                  letterSpacing: '-0.03em',
                  color: '#080e1a',
                  fontWeight: 700,
                  mb: 1.8,
                }}
              >
                Master&shy;classes.
              </Typography>

              <Typography
                sx={{
                  color: '#4a5e78',
                  fontSize: { xs: 15.5, md: 17 },
                  lineHeight: 1.76,
                  maxWidth: 580,
                }}
              >
                A structured seasonal curriculum designed for focused investors. Explore the planned
                season outlines below.
              </Typography>
            </Box>
          </MotionReveal>

          {/* ── Season accordions ── */}
          <Box
            component={motion.section}
            whileInView={reduceMotion ? undefined : { opacity: [0, 1], y: [14, 0] }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box sx={{ borderTop: '1px solid #e2eaf5', pt: 3, mb: 3.2 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  fontFamily: '"Playfair Display", serif',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#0a2463',
                  mb: 1,
                }}
              >
                Season Outlines
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 20, md: 24 },
                  fontWeight: 700,
                  color: '#080e1a',
                  letterSpacing: '-0.02em',
                }}
              >
                What you'll learn.
              </Typography>
            </Box>

            <Stack spacing={0.75}>
              {seasonBlocks.map((season, index) => {
                const isOpen = openSeason === season.title

                return (
                  <MotionReveal key={season.title} delay={Math.min(index * 0.08, 0.2)}>
                    <Accordion
                      disableGutters
                      square
                      expanded={isOpen}
                      onChange={(_, expanded) => setOpenSeason(expanded ? season.title : null)}
                      sx={{
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: isOpen ? '#0a2463' : '#e2eaf5',
                        borderRadius: '6px !important',
                        overflow: 'hidden',
                        '&::before': { display: 'none' },
                        bgcolor: '#ffffff',
                        transition: 'border-color 200ms ease',
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <ExpandMoreRoundedIcon
                            sx={{
                              color: isOpen ? '#0a2463' : '#8097b0',
                              fontSize: 20,
                              transition: 'color 180ms ease',
                            }}
                          />
                        }
                        sx={{
                          px: { xs: 2, md: 2.8 },
                          py: 1.4,
                          minHeight: 0,
                          bgcolor: isOpen ? '#f5f8ff' : '#ffffff',
                          transition: 'background-color 180ms ease',
                          '& .MuiAccordionSummary-content': { my: 0.4 },
                          '&:hover': { bgcolor: '#f5f8ff' },
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 10,
                              fontFamily: '"Playfair Display", serif',
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: isOpen ? '#0a2463' : '#8097b0',
                              mb: 0.4,
                              transition: 'color 180ms ease',
                            }}
                          >
                            {season.title.split(':')[0]}
                          </Typography>
                          <Typography
                            sx={{
                              color: isOpen ? '#0a2463' : '#080e1a',
                              fontSize: { xs: 15, md: 16.5 },
                              fontWeight: 600,
                              letterSpacing: '-0.01em',
                              transition: 'color 180ms ease',
                            }}
                          >
                            {season.title.split(': ')[1]}
                          </Typography>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails
                        sx={{
                          px: { xs: 2, md: 2.8 },
                          py: { xs: 2, md: 2.4 },
                          borderTop: '1px solid #e2eaf5',
                        }}
                      >
                        <Stack spacing={1}>
                          {season.subtopics.map((topic, i) => (
                            <Box
                              key={topic}
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.8,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 10,
                                  fontFamily: '"Playfair Display", serif',
                                  color: '#0a2463',
                                  fontWeight: 700,
                                  mt: 0.25,
                                  minWidth: 20,
                                }}
                              >
                                {String(i + 1).padStart(2, '0')}
                              </Typography>
                              <Box sx={{ flex: 1, borderBottom: '1px solid #f0f4fb', pb: 1 }}>
                                <Typography
                                  sx={{
                                    color: '#253750',
                                    fontSize: 14.5,
                                    lineHeight: 1.65,
                                    fontWeight: 500,
                                  }}
                                >
                                  {topic}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </MotionReveal>
                )
              })}
            </Stack>
          </Box>

        </Stack>
      </Container>
    </Box>
  )
}