import { type FormEvent, useMemo, useState } from 'react'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded'
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded'
import { Box, Button, Container, InputBase, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { glossaryEntries } from './glossary'
import { MotionReveal } from '../animations/MotionReveal'

type GlossaryEntry = (typeof glossaryEntries)[number]
type LetterFilter = 'all' | string
type SortDirection = 'az' | 'za'
type PaginationItem = number | 'ellipsis'

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const TERMS_PER_PAGE = 25

const POPULAR_TERMS = [
  { label: 'EPS (Earnings Per Share)', query: 'EPS' },
  { label: 'P/E Ratio', query: 'P/E' },
  { label: 'Dividend Yield', query: 'Dividend Yield' },
  { label: 'Market Capitalization', query: 'Market Capitalization' },
  { label: 'Beta', query: 'Beta' },
]

const HOW_TO_STEPS = [
  {
    title: 'Search',
    body: 'Find terms quickly using keywords.',
    icon: SearchRoundedIcon,
  },
  {
    title: 'Browse',
    body: 'Use the alphabet filter to explore all terms.',
    icon: FormatListBulletedRoundedIcon,
  },
  {
    title: 'Learn',
    body: 'Tap any term to view its definition and related topics.',
    icon: SchoolOutlinedIcon,
  },
]

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (currentPage <= 3) return [1, 2, 3, 4, 'ellipsis', totalPages]
  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}

function getEntryKey(entry: GlossaryEntry) {
  return `${entry.letter}-${entry.term}`
}

function getRelatedTerms(entry: GlossaryEntry) {
  if (entry.term === 'Ability to Pay') {
    return ['Debt to Equity Ratio', 'Interest Coverage Ratio', 'Cash Flow']
  }

  return glossaryEntries
    .filter((candidate) => candidate.letter === entry.letter && candidate.term !== entry.term)
    .slice(0, 3)
    .map((candidate) => candidate.term)
}

export function GlossaryPage() {
  const reduceMotion = useReducedMotion()
  const [activeLetter, setActiveLetter] = useState<LetterFilter>('all')
  const [query, setQuery] = useState('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('az')
  const [currentPage, setCurrentPage] = useState(1)
  const [openTerm, setOpenTerm] = useState<string | null>(glossaryEntries[0]?.term ?? null)

  const glossaryTerms = glossaryEntries
  const normalizedQuery = query.trim().toLowerCase()

  const availableLetters = useMemo(() => new Set(glossaryTerms.map((item) => item.letter)), [glossaryTerms])

  const filteredTerms = useMemo(() => {
    const letterFiltered =
      activeLetter === 'all' ? glossaryTerms : glossaryTerms.filter((item) => item.letter === activeLetter)

    const searched = normalizedQuery
      ? letterFiltered.filter((item) => {
          const haystack = `${item.term} ${item.meaning} ${item.description}`.toLowerCase()
          return haystack.includes(normalizedQuery)
        })
      : letterFiltered

    return [...searched].sort((a, b) => {
      const result = a.term.localeCompare(b.term)
      return sortDirection === 'az' ? result : -result
    })
  }, [activeLetter, glossaryTerms, normalizedQuery, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredTerms.length / TERMS_PER_PAGE))
  const boundedPage = Math.min(currentPage, totalPages)

  const visibleTerms = useMemo(() => {
    const start = (boundedPage - 1) * TERMS_PER_PAGE
    return filteredTerms.slice(start, start + TERMS_PER_PAGE)
  }, [boundedPage, filteredTerms])

  const paginationItems = useMemo(() => getPaginationItems(boundedPage, totalPages), [boundedPage, totalPages])
  const expandedTerm = visibleTerms.some((item) => item.term === openTerm) ? openTerm : null

  const showingStart = filteredTerms.length === 0 ? 0 : (boundedPage - 1) * TERMS_PER_PAGE + 1
  const showingEnd = Math.min(boundedPage * TERMS_PER_PAGE, filteredTerms.length)

  const handleTermJump = (termQuery: string) => {
    setQuery(termQuery)
    setActiveLetter('all')
    setCurrentPage(1)
    setOpenTerm(termQuery)
  }

  const clearFilters = () => {
    setQuery('')
    setActiveLetter('all')
    setCurrentPage(1)
    setOpenTerm(glossaryEntries[0]?.term ?? null)
  }

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2.4rem)', md: 'calc(72px + 4.2rem)' },
        pb: { xs: 6, md: 3 },
        bgcolor: '#ffffff',
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1720px !important', px: { xs: 2.5, md: 5, xl: 7 } }}>
        <Stack spacing={{ xs: 4, md: 5 }}>
          <MotionReveal>
            <Box sx={{ maxWidth: 1180 }}>
              {/* <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 32,
                  px: 2.2,
                  border: '1px solid #9db6ed',
                  borderRadius: '4px',
                  color: '#0a2463',
                  fontFamily: 'var(--wc-font-display)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0,
                  textTransform: 'uppercase',
                  bgcolor: '#f7faff',
                }}
              >
                Education. Insight. Discipline.
              </Box> */}

              <Typography
                variant="h1"
                sx={{
                  mt: { xs: 3, md: 4 },
                  color: '#071329',
                  fontSize: { xs: '3.4rem', sm: '4.6rem', md: '6.6rem' },
                  fontWeight: 700,
                  lineHeight: 0.98,
                  letterSpacing: 0,
                }}
              >
                Glossary
                <Box component="span" sx={{ color: '#143baf' }}>
                  .
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  color: '#435981',
                  fontSize: { xs: 15, md: 17 },
                  lineHeight: 1.8,
                  maxWidth: 680,
                }}
              >
                Key terms and definitions used across PSX investing, portfolio management, and market analysis.
              </Typography>
            </Box>
          </MotionReveal>

          <MotionReveal delay={0.04}>
            <Box
              sx={{
                maxWidth: 1180,
                height: { xs: 58, md: 70 },
                border: '1px solid #dce6f4',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                gap: 1.8,
                px: { xs: 2, md: 2.8 },
                bgcolor: '#ffffff',
                boxShadow: '0 16px 36px rgba(10, 36, 99, 0.04)',
                transition: 'border-color 180ms ease, box-shadow 180ms ease',
                '&:focus-within': {
                  borderColor: '#9db6ed',
                  boxShadow: '0 18px 42px rgba(10, 36, 99, 0.08)',
                },
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: 23, color: '#7085a7', flexShrink: 0 }} />
              <InputBase
                fullWidth
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setCurrentPage(1)
                  setOpenTerm(null)
                }}
                placeholder="Search for a term..."
                inputProps={{ 'aria-label': 'Search glossary terms' }}
                sx={{
                  color: '#071329',
                  fontSize: { xs: 14, md: 15 },
                  fontWeight: 600,
                  '& input::placeholder': {
                    color: '#7085a7',
                    opacity: 1,
                  },
                }}
              />
            </Box>
          </MotionReveal>

          <MotionReveal delay={0.08}>
            <Box
              sx={{
                border: '1px solid #dce6f4',
                borderRadius: '7px',
                bgcolor: '#ffffff',
                p: 1,
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.65, minWidth: 'max-content' }}>
                {(['all', ...ALL_LETTERS] as LetterFilter[]).map((letter) => {
                  const isAll = letter === 'all'
                  const isActive = activeLetter === letter
                  const isEnabled = isAll || availableLetters.has(letter)
                  const label = isAll ? 'All' : letter

                  return (
                    <Box
                      key={letter}
                      component={motion.button}
                      whileHover={isEnabled && !reduceMotion ? { y: -1 } : undefined}
                      whileTap={isEnabled && !reduceMotion ? { scale: 0.96 } : undefined}
                      type="button"
                      disabled={!isEnabled}
                      onClick={() => {
                        setActiveLetter(letter)
                        setCurrentPage(1)
                        setOpenTerm(null)
                      }}
                      sx={{
                        width: isAll ? 52 : 42,
                        height: 50,
                        border: '1px solid',
                        borderColor: isActive ? '#071329' : '#e8eef8',
                        borderRadius: '5px',
                        bgcolor: isActive ? '#071329' : '#ffffff',
                        color: isActive ? '#ffffff' : isEnabled ? '#334b72' : '#b5c3d7',
                        cursor: isEnabled ? 'pointer' : 'default',
                        fontFamily: 'var(--wc-font-body)',
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1,
                        opacity: isEnabled ? 1 : 0.48,
                        transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
                        '&:hover': isEnabled && !isActive
                          ? {
                              bgcolor: '#f5f8ff',
                              borderColor: '#b9c9e4',
                              color: '#071329',
                            }
                          : undefined,
                      }}
                    >
                      {label}
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </MotionReveal>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 440px' },
              gap: { xs: 3, lg: 4 },
              alignItems: 'start',
            }}
          >
            <Stack spacing={1.5}>
              <MotionReveal delay={0.1}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 1.5,
                  }}
                >
                  <Typography sx={{ color: '#435981', fontSize: 13.5, fontWeight: 600 }}>
                    Showing {showingStart}-{showingEnd} of {filteredTerms.length} terms
                  </Typography>

                  <Box
                    sx={{
                      position: 'relative',
                      width: { xs: '100%', sm: 198 },
                      height: 52,
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      component="select"
                      value={sortDirection}
                      aria-label="Sort glossary terms"
                      onChange={(event) => {
                        setSortDirection(event.target.value as SortDirection)
                        setCurrentPage(1)
                        setOpenTerm(null)
                      }}
                      sx={{
                        appearance: 'none',
                        width: '100%',
                        height: '100%',
                        border: '1px solid #dce6f4',
                        borderRadius: '7px',
                        bgcolor: '#ffffff',
                        color: '#233b64',
                        cursor: 'pointer',
                        fontFamily: 'var(--wc-font-body)',
                        fontSize: 13.5,
                        fontWeight: 700,
                        px: 2.2,
                        pr: 5.2,
                        outline: 'none',
                        transition: 'border-color 180ms ease, box-shadow 180ms ease',
                        '&:focus': {
                          borderColor: '#9db6ed',
                          boxShadow: '0 0 0 3px rgba(20, 59, 175, 0.08)',
                        },
                      }}
                    >
                      <option value="az">Sort A → Z</option>
                      <option value="za">Sort Z → A</option>
                    </Box>
                    <KeyboardArrowDownRoundedIcon
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#48618a',
                        fontSize: 22,
                        pointerEvents: 'none',
                      }}
                    />
                  </Box>
                </Box>
              </MotionReveal>

              <MotionReveal delay={0.12}>
                <Box
                  sx={{
                    border: '1px solid #dce6f4',
                    borderRadius: '7px',
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    boxShadow: '0 20px 45px rgba(10, 36, 99, 0.03)',
                  }}
                >
                  {visibleTerms.length > 0 ? (
                    visibleTerms.map((item, index) => {
                      const isExpanded = expandedTerm === item.term
                      const relatedTerms = getRelatedTerms(item)

                      return (
                        <Box
                          key={getEntryKey(item)}
                          component="article"
                          sx={{
                            borderBottom: index === visibleTerms.length - 1 ? 'none' : '1px solid #dce6f4',
                            bgcolor: isExpanded ? '#ffffff' : '#ffffff',
                          }}
                        >
                          <Box
                            component={motion.button}
                            whileHover={!reduceMotion ? { backgroundColor: '#f8fbff' } : undefined}
                            type="button"
                            aria-expanded={isExpanded}
                            aria-controls={`glossary-definition-${getEntryKey(item)}`}
                            onClick={() => setOpenTerm(isExpanded ? null : item.term)}
                            sx={{
                              width: '100%',
                              minHeight: isExpanded ? 52 : 58,
                              px: { xs: 2, md: 3 },
                              py: isExpanded ? 1.6 : 0,
                              border: 0,
                              bgcolor: 'transparent',
                              color: '#071329',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 2,
                              textAlign: 'left',
                              font: 'inherit',
                            }}
                          >
                            <Typography
                              component="span"
                              sx={{
                                color: '#071329',
                                fontSize: { xs: 14, md: 15 },
                                fontWeight: 800,
                                lineHeight: 1.35,
                              }}
                            >
                              {item.term}
                            </Typography>
                            <KeyboardArrowDownRoundedIcon
                              sx={{
                                color: '#28436d',
                                fontSize: 20,
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 180ms ease',
                                flexShrink: 0,
                              }}
                            />
                          </Box>

                          {isExpanded && (
                            <Box
                              id={`glossary-definition-${getEntryKey(item)}`}
                              sx={{
                                px: { xs: 2, md: 3 },
                                pb: { xs: 2.6, md: 3 },
                              }}
                            >
                              <Typography
                                sx={{
                                  color: '#435981',
                                  fontSize: { xs: 13.5, md: 14.5 },
                                  lineHeight: 1.75,
                                  maxWidth: 920,
                                }}
                              >
                                {item.meaning} {item.description}
                              </Typography>

                              <Box
                                sx={{
                                  mt: 2.2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.1,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography sx={{ color: '#435981', fontSize: 12, fontWeight: 800 }}>
                                  Related:
                                </Typography>
                                {relatedTerms.map((relatedTerm, relatedIndex) => (
                                  <Box
                                    key={relatedTerm}
                                    component="button"
                                    type="button"
                                    onClick={() => handleTermJump(relatedTerm)}
                                    sx={{
                                      p: 0,
                                      border: 0,
                                      bgcolor: 'transparent',
                                      color: '#143baf',
                                      cursor: 'pointer',
                                      fontFamily: 'var(--wc-font-body)',
                                      fontSize: 12,
                                      fontWeight: 800,
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                  >
                                    {relatedIndex > 0 && (
                                      <Box component="span" sx={{ color: '#9aadca', mx: 0.8 }}>
                                        •
                                      </Box>
                                    )}
                                    {relatedTerm}
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )
                    })
                  ) : (
                    <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
                      <Typography sx={{ color: '#071329', fontSize: 18, fontWeight: 800 }}>
                        No terms found.
                      </Typography>
                      <Typography sx={{ mt: 1, color: '#435981', fontSize: 14 }}>
                        Try another keyword or browse all glossary terms.
                      </Typography>
                      <Button
                        type="button"
                        onClick={clearFilters}
                        sx={{
                          mt: 2.5,
                          color: '#143baf',
                          fontWeight: 800,
                          '&:hover': { bgcolor: '#f0f4fb' },
                        }}
                      >
                        View all terms
                      </Button>
                    </Box>
                  )}

                  {visibleTerms.length > 0 && (
                    <Box
                      sx={{
                        px: { xs: 1.4, md: 2 },
                        py: 1.4,
                        borderTop: '1px solid #dce6f4',
                        display: 'flex',
                        justifyContent: { xs: 'center', sm: 'flex-end' },
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      {paginationItems.map((item, index) =>
                        item === 'ellipsis' ? (
                          <Typography
                            key={`ellipsis-${index}`}
                            sx={{
                              width: 38,
                              height: 38,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#435981',
                              fontWeight: 700,
                            }}
                          >
                            ...
                          </Typography>
                        ) : (
                          <Button
                            key={item}
                            type="button"
                            onClick={() => {
                              setCurrentPage(item)
                              setOpenTerm(null)
                            }}
                            sx={{
                              minWidth: 38,
                              width: 38,
                              height: 38,
                              p: 0,
                              border: '1px solid',
                              borderColor: item === boundedPage ? '#071329' : '#dce6f4',
                              borderRadius: '5px',
                              bgcolor: item === boundedPage ? '#071329' : '#ffffff',
                              color: item === boundedPage ? '#ffffff' : '#334b72',
                              fontSize: 12,
                              fontWeight: 800,
                              '&:hover': {
                                bgcolor: item === boundedPage ? '#071329' : '#f5f8ff',
                                borderColor: item === boundedPage ? '#071329' : '#b9c9e4',
                              },
                            }}
                          >
                            {item}
                          </Button>
                        ),
                      )}

                      <Button
                        type="button"
                        disabled={boundedPage >= totalPages}
                        onClick={() => {
                          setCurrentPage((page) => Math.min(totalPages, page + 1))
                          setOpenTerm(null)
                        }}
                        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          height: 38,
                          px: 1.7,
                          border: '1px solid #dce6f4',
                          borderRadius: '5px',
                          color: '#334b72',
                          fontSize: 12,
                          fontWeight: 800,
                          bgcolor: '#ffffff',
                          '&:hover': { bgcolor: '#f5f8ff', borderColor: '#b9c9e4' },
                          '&.Mui-disabled': { color: '#b5c3d7', borderColor: '#edf2f8' },
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                  )}
                </Box>
              </MotionReveal>
            </Stack>

            <Stack spacing={3} sx={{ position: { lg: 'sticky' }, top: { lg: 104 } }}>
              <MotionReveal delay={0.16}>
                <Box
                  sx={{
                    border: '1px solid #dce6f4',
                    borderRadius: '7px',
                    bgcolor: '#ffffff',
                    p: { xs: 2.4, md: 3 },
                    boxShadow: '0 20px 45px rgba(10, 36, 99, 0.03)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: '#eef4ff',
                        color: '#143baf',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <StarBorderRoundedIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography
                      sx={{
                        color: '#071329',
                        fontFamily: 'var(--wc-font-display)',
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      Popular terms
                    </Typography>
                  </Box>

                  <Stack>
                    {POPULAR_TERMS.map((term) => (
                      <Box
                        key={term.label}
                        component="button"
                        type="button"
                        onClick={() => handleTermJump(term.query)}
                        sx={{
                          minHeight: 64,
                          px: 0,
                          border: 0,
                          borderBottom: '1px solid #e8eef8',
                          bgcolor: '#ffffff',
                          color: '#071329',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          textAlign: 'left',
                          font: 'inherit',
                          '&:hover': { color: '#143baf' },
                        }}
                      >
                        <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.4 }}>
                          {term.label}
                        </Typography>
                        <KeyboardArrowRightRoundedIcon sx={{ color: 'currentColor', fontSize: 22 }} />
                      </Box>
                    ))}
                  </Stack>

                  <Button
                    type="button"
                    onClick={clearFilters}
                    endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      mt: 2.6,
                      p: 0,
                      color: '#143baf',
                      fontSize: 14,
                      fontWeight: 800,
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                    }}
                  >
                    View all popular terms
                  </Button>
                </Box>
              </MotionReveal>

              <MotionReveal delay={0.2}>
                <Box
                  sx={{
                    border: '1px solid #dce6f4',
                    borderRadius: '7px',
                    bgcolor: '#ffffff',
                    p: { xs: 2.4, md: 3 },
                    boxShadow: '0 20px 45px rgba(10, 36, 99, 0.03)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.4 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: '#eef4ff',
                        color: '#143baf',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <AutoStoriesRoundedIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography
                      sx={{
                        color: '#071329',
                        fontFamily: 'var(--wc-font-display)',
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      How to use the glossary
                    </Typography>
                  </Box>

                  <Typography sx={{ color: '#334b72', fontSize: 14, lineHeight: 1.8, mb: 3 }}>
                    Browse or search for any term to understand key investing concepts in simple, clear language.
                  </Typography>

                  <Stack spacing={3}>
                    {HOW_TO_STEPS.map((step) => {
                      const StepIcon = step.icon
                      return (
                        <Box key={step.title} sx={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 2 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              bgcolor: '#eef4ff',
                              color: '#143baf',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <StepIcon sx={{ fontSize: 23 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ color: '#071329', fontSize: 14, fontWeight: 800 }}>
                              {step.title}
                            </Typography>
                            <Typography sx={{ mt: 0.4, color: '#435981', fontSize: 13, lineHeight: 1.55 }}>
                              {step.body}
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })}
                  </Stack>

                  <Typography sx={{ mt: 4, color: '#071329', fontSize: 14, lineHeight: 1.7 }}>
                    Invest with knowledge.
                    <br />
                    <Box component="span" sx={{ color: '#143baf', fontWeight: 800 }}>
                      Decide with confidence.
                    </Box>
                  </Typography>
                </Box>
              </MotionReveal>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
