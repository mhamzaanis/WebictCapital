import { useMemo, useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Stack, Typography } from '@mui/material'
import { glossaryEntries } from '../../content/glossaryData'

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function GlossaryPage() {
  const glossaryTerms = glossaryEntries
  const [activeLetter, setActiveLetter] = useState<string>('A')
  const [openTerm, setOpenTerm] = useState<string | null>(null)

  const availableLetters = useMemo(() => new Set(glossaryTerms.map((item) => item.letter)), [glossaryTerms])

  const filteredTerms = useMemo(
    () => glossaryTerms.filter((item) => item.letter === activeLetter),
    [activeLetter, glossaryTerms],
  )

  const expandedTerm = useMemo(() => {
    if (openTerm && filteredTerms.some((item) => item.term === openTerm)) {
      return openTerm
    }
    return filteredTerms[0]?.term ?? null
  }, [filteredTerms, openTerm])

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 1.35rem)', md: 'calc(72px + 1.75rem)' },
        pb: { xs: 7, md: 11 },
        bgcolor: '#f2f3f5',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1280px !important' }}>
        <Stack spacing={3}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.75rem', md: '2.35rem' },
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Glossary
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pb: 0.5 }}>
            {ALL_LETTERS.map((letter) => {
              const isActive = letter === activeLetter
              const isEnabled = availableLetters.has(letter)

              return (
                <Box
                  key={letter}
                  component="button"
                  type="button"
                  disabled={!isEnabled}
                  onClick={() => {
                    setActiveLetter(letter)
                    setOpenTerm(null)
                  }}
                  sx={{
                    width: 30,
                    height: 30,
                    border: '1px solid',
                    borderColor: isActive ? '#101214' : '#cfd5dd',
                    bgcolor: isActive ? '#101214' : 'common.white',
                    color: isActive ? 'common.white' : isEnabled ? '#4c535b' : '#9ca3ad',
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1,
                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                    opacity: isEnabled ? 1 : 0.45,
                    transition: 'all 180ms ease',
                    '&:hover': isEnabled
                      ? {
                          borderColor: '#101214',
                          color: isActive ? 'common.white' : '#101214',
                        }
                      : undefined,
                  }}
                >
                  {letter}
                </Box>
              )
            })}
          </Box>

          <Box sx={{ border: '1px solid', borderColor: '#d2d7df', bgcolor: 'common.white' }}>
            {filteredTerms.map((item, index) => {
              const isExpanded = item.term === expandedTerm

              return (
                <Accordion
                  key={item.term}
                  disableGutters
                  square
                  expanded={isExpanded}
                  onChange={(_, expanded) => setOpenTerm(expanded ? item.term : null)}
                  sx={{
                    boxShadow: 'none',
                    borderTop: index === 0 ? 'none' : '1px solid',
                    borderColor: '#e0e5eb',
                    '&::before': { display: 'none' },
                    bgcolor: 'common.white',
                    transition: 'background-color 220ms ease',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon sx={{ color: '#5d6670' }} />}
                    aria-controls={`glossary-panel-${index}`}
                    id={`glossary-header-${index}`}
                    sx={{
                      minHeight: 0,
                      px: { xs: 1.5, md: 2 },
                      py: 0.6,
                      bgcolor: isExpanded ? '#f7f8fa' : 'common.white',
                      transition: 'background-color 180ms ease',
                      '& .MuiAccordionSummary-content': {
                        my: 0.4,
                      },
                      '& .MuiAccordionSummary-expandIconWrapper': {
                        transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
                      },
                      '&:hover': { bgcolor: '#f7f8fa' },
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#20252b',
                        fontSize: { xs: 14, md: 15 },
                        fontWeight: isExpanded ? 600 : 500,
                        transition: 'font-weight 180ms ease',
                      }}
                    >
                      {item.term}
                    </Typography>
                  </AccordionSummary>

                  <AccordionDetails
                    sx={{
                      px: 0,
                      py: 0,
                      borderTop: '1px solid',
                      borderColor: '#e0e5eb',
                      animation: isExpanded ? 'accordionFadeIn 240ms ease' : 'none',
                      '@keyframes accordionFadeIn': {
                        from: { opacity: 0, transform: 'translateY(-4px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                      },
                    }}
                  >
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                      <Box component="thead" sx={{ bgcolor: '#fafbfc' }}>
                        <Box component="tr">
                          <Box
                            component="th"
                            sx={{
                              width: { xs: '32%', md: '22%' },
                              px: { xs: 1.5, md: 2 },
                              py: 1,
                              textAlign: 'left',
                              borderBottom: '1px solid',
                              borderRight: '1px solid',
                              borderColor: '#e0e5eb',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#3a4048',
                              letterSpacing: '0.02em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Term
                          </Box>
                          <Box
                            component="th"
                            sx={{
                              width: { xs: '30%', md: '28%' },
                              px: { xs: 1.5, md: 2 },
                              py: 1,
                              textAlign: 'left',
                              borderBottom: '1px solid',
                              borderRight: '1px solid',
                              borderColor: '#e0e5eb',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#3a4048',
                              letterSpacing: '0.02em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Meaning
                          </Box>
                          <Box
                            component="th"
                            sx={{
                              px: { xs: 1.5, md: 2 },
                              py: 1,
                              textAlign: 'left',
                              borderBottom: '1px solid',
                              borderColor: '#e0e5eb',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#3a4048',
                              letterSpacing: '0.02em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Description
                          </Box>
                        </Box>
                      </Box>

                      <Box component="tbody">
                        <Box component="tr">
                          <Box
                            component="td"
                            sx={{
                              px: { xs: 1.5, md: 2 },
                              py: 1.5,
                              verticalAlign: 'top',
                              borderRight: '1px solid',
                              borderColor: '#e0e5eb',
                              fontSize: 12,
                              color: '#20252b',
                              fontWeight: 600,
                            }}
                          >
                            {item.term}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              px: { xs: 1.5, md: 2 },
                              py: 1.5,
                              verticalAlign: 'top',
                              borderRight: '1px solid',
                              borderColor: '#e0e5eb',
                              fontSize: 12,
                              color: '#4c535b',
                            }}
                          >
                            {item.meaning}
                          </Box>
                          <Box component="td" sx={{ px: { xs: 1.5, md: 2 }, py: 1.5, verticalAlign: 'top', fontSize: 12, color: '#4c535b' }}>
                            {item.description}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
