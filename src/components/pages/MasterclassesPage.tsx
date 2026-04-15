import { useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Container, Stack, Typography } from '@mui/material'
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
        pt: { xs: 'calc(64px + 1.35rem)', md: 'calc(72px + 1.9rem)' },
        pb: { xs: 7, md: 11 },
        bgcolor: '#f5f9ff',
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #eef5ff 62%, #e8f1ff 100%)',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1200px !important', px: { xs: 2, md: 3.5 } }}>
        <Stack spacing={{ xs: 3, md: 4 }}>
          <MotionReveal>
            <Box
              sx={{
                border: '1px solid',
                borderColor: '#cfdef3',
                borderRadius: 1.5,
                p: { xs: 2.2, md: 3 },
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: '0 14px 30px rgba(11, 36, 80, 0.08)',
              }}
            >
              <Chip
                label="Coming Soon"
                sx={{
                  mb: 1.2,
                  bgcolor: '#eaf2ff',
                  color: '#0f2a5f',
                  border: '1px solid #c8dbf7',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '1.95rem', md: '2.9rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  color: '#0b1320',
                }}
              >
                Masterclasses
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 760,
                  color: '#2f415c',
                  fontSize: { xs: 15, md: 17 },
                  lineHeight: 1.7,
                }}
              >
                We are preparing a structured seasonal curriculum designed for focused investors. Explore the planned season
                outlines below.
              </Typography>
            </Box>
          </MotionReveal>

          <Box
            component={motion.section}
            whileInView={reduceMotion ? undefined : { opacity: [0.92, 1], y: [10, 0] }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              border: '1px solid',
              borderColor: '#cfdef3',
              borderRadius: 1.5,
              bgcolor: '#ffffff',
              p: { xs: 0.9, md: 1.1 },
            }}
          >
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
                      borderColor: '#d7e4f8',
                      borderRadius: 1.2,
                      overflow: 'hidden',
                      '&::before': { display: 'none' },
                      bgcolor: '#ffffff',
                      mb: 1,
                      '&:last-of-type': { mb: 0 },
                      '&.Mui-expanded': { mb: 1 },
                      '&.Mui-expanded:last-of-type': { mb: 0 },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreRoundedIcon sx={{ color: '#1f5fbf' }} />}
                      sx={{
                        px: { xs: 1.6, md: 2.2 },
                        py: 1,
                        minHeight: 0,
                        bgcolor: isOpen ? '#eaf2ff' : '#ffffff',
                        '& .MuiAccordionSummary-content': { my: 0.35 },
                        '&:hover': { bgcolor: '#f3f8ff' },
                      }}
                    >
                      <Typography sx={{ color: '#0f2a5f', fontSize: { xs: 15, md: 17 }, fontWeight: 600 }}>
                        {season.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: { xs: 1.6, md: 2.2 }, py: { xs: 1.5, md: 1.8 }, borderTop: '1px solid #d7e4f8' }}>
                      <Stack spacing={1.2}>
                        {season.subtopics.map((topic) => (
                          <Box
                            key={topic}
                            sx={{
                              borderLeft: '2px solid #1f5fbf',
                              pl: 1.2,
                              py: 0.2,
                            }}
                          >
                            <Typography sx={{ color: '#22354f', fontSize: 14.2, lineHeight: 1.65 }}>{topic}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </MotionReveal>
              )
            })}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
