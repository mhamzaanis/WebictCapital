import { useMemo, useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Stack, Typography } from '@mui/material'
import { glossaryEntries } from './glossary.js'

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function GlossaryPage() {
  const palette = {
    ink: '#0b1220',
    navy: '#0f2a5f',
    cobalt: '#1f5fbf',
    sky: '#eaf2ff',
    cloud: '#f5f9ff',
    line: '#c8d9f3',
    body: '#2f3f59',
    white: '#ffffff',
  }

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
        pt: { xs: 'calc(64px + 1.35rem)', md: 'calc(72px + 1.75rem)' },
        pb: { xs: 7, md: 11 },
        bgcolor: palette.cloud,
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #eef5ff 62%, #e6f0ff 100%)',
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          maxWidth: '1280px !important',
          px: { xs: 2, md: 3.5 },
        }}
      >
        <Stack
          spacing={3.5}
          sx={{
            py: { xs: 2.5, md: 3.5 },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.75rem', md: '2.35rem' },
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: palette.ink,
            }}
          >
            Glossary
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 0.65,
              pb: 0.5,
              px: { xs: 0.25, md: 0.5 },
            }}
          >
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
                    borderColor: isActive ? palette.navy : palette.line,
                    bgcolor: isActive ? palette.navy : palette.white,
                    color: isActive ? palette.white : isEnabled ? palette.body : '#97a3b8',
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1,
                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                    opacity: isEnabled ? 1 : 0.45,
                    transition: 'all 180ms ease',
                    '&:hover': isEnabled
                      ? {
                          borderColor: palette.cobalt,
                          color: isActive ? palette.white : palette.navy,
                          bgcolor: isActive ? palette.navy : palette.sky,
                        }
                      : undefined,
                  }}
                >
                  {letter}
                </Box>
              )
            })}
          </Box>

          <Box
            sx={{
              // border: '1px solid',
              // borderColor: palette.line,
              // bgcolor: palette.white,
              // borderRadius: 1.5,
              overflow: 'visible',
              // p: { xs: 0.75, md: 1 },
              // boxShadow: '0 10px 28px rgba(12, 39, 88, 0.08)',
            }}
          >
            {filteredTerms.map((item) => {
              const isExpanded = item.term === openTerm
              const entryKey = `${item.letter}-${item.term}`

              return (
                <Accordion
                  key={entryKey}
                  disableGutters
                  square
                  expanded={isExpanded}
                  onChange={(_, expanded) => setOpenTerm(expanded ? item.term : null)}
                  sx={{
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: palette.line,
                    borderRadius: 1.25,
                    overflow: 'hidden',
                    '&::before': { display: 'none' },
                    bgcolor: palette.white,
                    mb: 1,
                    '&:last-of-type': { mb: 0 },
                    '&.Mui-expanded': { m: 0, mb: 1 },
                    '&.Mui-expanded:last-of-type': { mb: 0 },
                    transition: 'background-color 220ms ease',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon sx={{ color: palette.cobalt }} />}
                    aria-controls={`glossary-panel-${entryKey}`}
                    id={`glossary-header-${entryKey}`}
                    sx={{
                      minHeight: 0,
                      px: { xs: 1.5, md: 2 },
                      py: 0.95,
                      bgcolor: isExpanded ? palette.sky : palette.white,
                      transition: 'background-color 180ms ease',
                      '& .MuiAccordionSummary-content': {
                        my: 0.4,
                      },
                      '& .MuiAccordionSummary-expandIconWrapper': {
                        transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
                      },
                      '&:hover': { bgcolor: palette.sky },
                    }}
                  >
                    <Typography
                      sx={{
                        color: palette.ink,
                        fontSize: { xs: 14.5, md: 15.5 },
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
                      borderColor: palette.line,
                      animation: isExpanded ? 'accordionFadeIn 240ms ease' : 'none',
                      '@keyframes accordionFadeIn': {
                        from: { opacity: 0, transform: 'translateY(-4px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                      },
                    }}
                  >
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                      <Box component="thead" sx={{ bgcolor: '#f1f6ff' }}>
                        <Box component="tr">
                          <Box
                            component="th"
                            sx={{
                              width: { xs: '32%', md: '22%' },
                              px: { xs: 1.5, md: 2 },
                              py: 1.2,
                              textAlign: 'left',
                              borderBottom: '1px solid',
                              borderRight: '1px solid',
                              borderColor: palette.line,
                              fontSize: 11,
                              fontWeight: 700,
                              color: palette.navy,
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
                              py: 1.2,
                              textAlign: 'left',
                              borderBottom: '1px solid',
                              borderRight: '1px solid',
                              borderColor: palette.line,
                              fontSize: 11,
                              fontWeight: 700,
                              color: palette.navy,
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
                              py: 1.2,
                              textAlign: 'left',
                              borderBottom: '1px solid',
                              borderColor: palette.line,
                              fontSize: 11,
                              fontWeight: 700,
                              color: palette.navy,
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
                              py: 1.8,
                              verticalAlign: 'top',
                              borderRight: '1px solid',
                              borderColor: palette.line,
                              fontSize: 12,
                              color: palette.ink,
                              fontWeight: 600,
                            }}
                          >
                            {item.term}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              px: { xs: 1.5, md: 2 },
                              py: 1.8,
                              verticalAlign: 'top',
                              borderRight: '1px solid',
                              borderColor: palette.line,
                              fontSize: 12,
                              color: palette.body,
                            }}
                          >
                            {item.meaning}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              px: { xs: 1.5, md: 2 },
                              py: 1.8,
                              verticalAlign: 'top',
                              fontSize: 12,
                              color: palette.body,
                            }}
                          >
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
