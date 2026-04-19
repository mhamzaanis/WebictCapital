import { useMemo, useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { glossaryEntries } from './glossary'
import { MotionReveal } from '../animations/MotionReveal'

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function GlossaryPage() {
  const reduceMotion = useReducedMotion()

  const glossaryTerms = glossaryEntries
  const [activeLetter, setActiveLetter] = useState<string>('A')
  const [openTerm, setOpenTerm] = useState<string | null>(null)

  const availableLetters = useMemo(() => new Set(glossaryTerms.map((item) => item.letter)), [glossaryTerms])

  const filteredTerms = useMemo(
    () => glossaryTerms.filter((item) => item.letter === activeLetter),
    [activeLetter, glossaryTerms],
  )

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
        <Stack spacing={{ xs: 6, md: 9 }}>

          {/* ── Header ── */}
          <MotionReveal>
            <Box sx={{ maxWidth: 80 }} />
            <Box sx={{ mt: 3 }}>
              
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.6rem', sm: '3.2rem', md: '3.8rem' },
                  lineHeight: 1.04,
                  letterSpacing: '-0.03em',
                  color: '#080e1a',
                  fontWeight: 700,
                }}
              >
                Glossary.
              </Typography>
              <Typography
                sx={{
                  mt: 1.5,
                  color: '#4a5e78',
                  fontSize: { xs: 15, md: 16.5 },
                  lineHeight: 1.72,
                  maxWidth: 520,
                }}
              >
                Key terms and definitions used across PSX investing, portfolio management, and market analysis.
              </Typography>
            </Box>
          </MotionReveal>

          {/* ── Letter picker ── */}
          <MotionReveal delay={0.06}>
            <Box
              sx={{
                borderTop: '1px solid #e8eef8',
                borderBottom: '1px solid #e8eef8',
                py: 2.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.6,
                }}
              >
                {ALL_LETTERS.map((letter) => {
                  const isActive = letter === activeLetter
                  const isEnabled = availableLetters.has(letter)

                  return (
                    <Box
                      key={letter}
                      component={motion.button}
                      whileHover={isEnabled && !reduceMotion ? { y: -1 } : undefined}
                      whileTap={isEnabled && !reduceMotion ? { scale: 0.94 } : undefined}
                      type="button"
                      disabled={!isEnabled}
                      onClick={() => {
                        setActiveLetter(letter)
                        setOpenTerm(null)
                      }}
                      sx={{
                        width: 32,
                        height: 32,
                        border: '1px solid',
                        borderColor: isActive ? '#0a2463' : '#dde7f4',
                        bgcolor: isActive ? '#0a2463' : 'transparent',
                        color: isActive ? '#ffffff' : isEnabled ? '#253750' : '#b8c8dc',
                        fontSize: 12,
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 600,
                        lineHeight: 1,
                        cursor: isEnabled ? 'pointer' : 'default',
                        opacity: isEnabled ? 1 : 0.4,
                        transition: 'all 160ms ease',
                        borderRadius: 0.6,
                        '&:hover': isEnabled && !isActive
                          ? { borderColor: '#0a2463', color: '#0a2463', bgcolor: '#f0f4fb' }
                          : undefined,
                      }}
                    >
                      {letter}
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </MotionReveal>

          {/* ── Accordion list ── */}
          <Box
            component={motion.div}
            whileInView={reduceMotion ? undefined : { opacity: [0, 1], y: [12, 0] }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Stack spacing={0.75}>
              {filteredTerms.map((item, index) => {
                const isExpanded = item.term === openTerm
                const entryKey = `${item.letter}-${item.term}`

                return (
                  <MotionReveal key={entryKey} delay={Math.min(index * 0.025, 0.2)} amount={0.05}>
                    <Accordion
                      disableGutters
                      square
                      expanded={isExpanded}
                      onChange={(_, expanded) => setOpenTerm(expanded ? item.term : null)}
                      sx={{
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: isExpanded ? '#0a2463' : '#e2eaf5',
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
                              color: isExpanded ? '#0a2463' : '#8097b0',
                              fontSize: 20,
                              transition: 'color 180ms ease',
                            }}
                          />
                        }
                        aria-controls={`glossary-panel-${entryKey}`}
                        id={`glossary-header-${entryKey}`}
                        sx={{
                          minHeight: 0,
                          px: { xs: 2, md: 2.5 },
                          py: 1.2,
                          bgcolor: isExpanded ? '#f5f8ff' : '#ffffff',
                          transition: 'background-color 180ms ease',
                          '& .MuiAccordionSummary-content': { my: 0.5 },
                          '&:hover': { bgcolor: '#f5f8ff' },
                        }}
                      >
                        <Typography
                          sx={{
                            color: isExpanded ? '#0a2463' : '#080e1a',
                            fontSize: { xs: 14.5, md: 15.5 },
                            fontWeight: isExpanded ? 600 : 500,
                            letterSpacing: '-0.01em',
                            transition: 'color 180ms ease',
                          }}
                        >
                          {item.term}
                        </Typography>
                      </AccordionSummary>

                      <AccordionDetails
                        sx={{
                          px: 0,
                          py: 0,
                          borderTop: '1px solid #e2eaf5',
                        }}
                      >
                        <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <Box
                            component="table"
                            sx={{ width: '100%', minWidth: { xs: 580, md: 0 }, borderCollapse: 'collapse' }}
                          >
                            <Box component="thead" sx={{ bgcolor: '#fafbfd' }}>
                              <Box component="tr">
                                {['Term', 'Meaning', 'Description'].map((col, i) => (
                                  <Box
                                    key={col}
                                    component="th"
                                    sx={{
                                      width: i === 0 ? '22%' : i === 1 ? '26%' : 'auto',
                                      px: { xs: 1.8, md: 2.5 },
                                      py: 1.2,
                                      textAlign: 'left',
                                      borderBottom: '1px solid #e2eaf5',
                                      borderRight: i < 2 ? '1px solid #e2eaf5' : 'none',
                                      fontSize: 10,
                                      fontFamily: '"Playfair Display", serif',
                                      fontWeight: 700,
                                      color: '#0a2463',
                                      letterSpacing: '0.12em',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {col}
                                  </Box>
                                ))}
                              </Box>
                            </Box>

                            <Box component="tbody">
                              <Box component="tr">
                                <Box
                                  component="td"
                                  sx={{
                                    px: { xs: 1.8, md: 2.5 },
                                    py: 2,
                                    verticalAlign: 'top',
                                    borderRight: '1px solid #e2eaf5',
                                    fontSize: 13,
                                    color: '#080e1a',
                                    fontWeight: 600,
                                    fontFamily: '"Playfair Display", serif',
                                  }}
                                >
                                  {item.term}
                                </Box>
                                <Box
                                  component="td"
                                  sx={{
                                    px: { xs: 1.8, md: 2.5 },
                                    py: 2,
                                    verticalAlign: 'top',
                                    borderRight: '1px solid #e2eaf5',
                                    fontSize: 13.5,
                                    color: '#253750',
                                    lineHeight: 1.65,
                                  }}
                                >
                                  {item.meaning}
                                </Box>
                                <Box
                                  component="td"
                                  sx={{
                                    px: { xs: 1.8, md: 2.5 },
                                    py: 2,
                                    verticalAlign: 'top',
                                    fontSize: 13.5,
                                    color: '#4a5e78',
                                    lineHeight: 1.72,
                                  }}
                                >
                                  {item.description}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
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