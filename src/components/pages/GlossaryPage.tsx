import { Box, Chip, Container, Grid, Stack, Typography } from '@mui/material'

const glossaryTerms = [
  {
    term: 'Angel Investor',
    definition: 'An individual who provides early-stage capital in exchange for equity before institutional rounds.',
  },
  {
    term: 'Burn Rate',
    definition: 'The speed at which a startup spends cash each month to run operations before reaching profitability.',
  },
  {
    term: 'Cap Table',
    definition: 'A record of company ownership, showing each stakeholder and the percentage or number of shares held.',
  },
  {
    term: 'Dilution',
    definition: 'Reduction in an existing shareholder\'s ownership percentage when new shares are issued in future rounds.',
  },
  {
    term: 'Exit',
    definition: 'A liquidity event where investors realize returns, usually through acquisition, merger, or public listing.',
  },
  {
    term: 'Term Sheet',
    definition: 'A non-binding document that outlines core investment terms such as valuation, governance, and rights.',
  },
]

const quickLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'I', 'L', 'P', 'S', 'T', 'V']

export function GlossaryPage() {
  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3rem)' },
        pb: { xs: 8, md: 12 },
        bgcolor: '#f7f8fa',
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={5}>
          <Box sx={{ maxWidth: 760 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.15rem', md: '3.4rem' },
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                mb: 1.25,
              }}
            >
              Glossary
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 }, lineHeight: 1.75 }}>
              A practical reference for venture and startup terms used across our investment, founder, and portfolio content.
            </Typography>
          </Box>

          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
            {quickLetters.map((letter) => (
              <Chip
                key={letter}
                label={letter}
                size="small"
                sx={{
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'divider',
                  fontWeight: 600,
                  minWidth: 34,
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                }}
              />
            ))}
          </Stack>

          <Grid container spacing={2.5}>
            {glossaryTerms.map((item) => (
              <Grid key={item.term} size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    height: '100%',
                    bgcolor: 'common.white',
                    border: '1px solid',
                    borderColor: 'divider',
                    p: { xs: 2.5, md: 3 },
                    transition: 'transform 240ms ease, box-shadow 240ms ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 14px 28px rgba(16, 18, 20, 0.08)',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: { xs: 24, md: 28 },
                      lineHeight: 1.2,
                      mb: 1,
                    }}
                  >
                    {item.term}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.75 }}>{item.definition}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}
