import { Box, Container, Stack, Typography } from '@mui/material'

export function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(22px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        mt: 0,
        pt: { xs: 'calc(64px + 1.25rem)', md: 'calc(72px + 2.25rem)' },
        pb: { xs: 5.5, md: 7 },
        bgcolor: '#f2f7ff',
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #edf5ff 100%)',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1280px !important', px: { xs: 2, md: 3.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 620px)' },
            alignItems: 'center',
            gap: { xs: 3.5, md: 5 },
          }}
        >
          <Stack spacing={3} sx={{ maxWidth: 620, animation: 'fadeRise 680ms ease both' }}>
            <Box
              sx={{
                display: 'inline-flex',
                width: 'fit-content',
                px: 1.35,
                py: 0.45,
                borderRadius: 999,
                bgcolor: '#dcebff',
                border: '1px solid #bad4fb',
              }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#123570' }}>
                PSX Training Session
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', md: '3.3rem' },
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: '#0c1320',
              }}
            >
              "Markets reward discipline. Education is where confident investing begins."
            </Typography>

            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f2a5f' }}>Asaad Sohail</Typography>
              <Typography sx={{ fontSize: 13, color: '#40506a' }}>Founder, Webict Capital</Typography>
            </Box>
          </Stack>

          <Box sx={{ animation: 'fadeRise 760ms ease both', animationDelay: '120ms' }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                minHeight: { xs: 270, sm: 340, md: 430 },
                borderRadius: { xs: 2, md: 2.5 },
                overflow: 'hidden',
                border: '1px solid #b8cff3',
                backgroundImage: 'linear-gradient(15deg, rgba(5, 12, 24, 0.64) 0%, rgba(8, 23, 48, 0.18) 52%, rgba(8, 23, 48, 0.08) 100%), url(/herosection.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center 42%',
                transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                boxShadow: '0 18px 34px rgba(16, 43, 94, 0.2)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 24px 40px rgba(16, 43, 94, 0.28)',
                },
              }}
            />
            <Typography sx={{ mt: 1.25, fontSize: 12, color: '#4a5e80' }}>
              Group photo from a PSX training session conducted by Webict Capital.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
