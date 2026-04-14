import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

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

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.1rem', md: '3.5rem' },
                lineHeight: 1.06,
                letterSpacing: '-0.03em',
                color: '#0c1320',
              }}
            >
              Learn. Invest. Lead.
            </Typography>

            <Typography
              sx={{
                position: 'relative',
                display: 'inline-block',
                maxWidth: 560,
                pb: { xs: 1.6, md: 1.9 },
                fontSize: { xs: 16, md: 19 },
                lineHeight: 1.52,
                color: '#253750',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: { xs: 2, md: 4 },
                  height: { xs: 14, md: 18 },
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '100% 100%',
                  pointerEvents: 'none',
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 28' preserveAspectRatio='none'%3E%3Cpath d='M4 20 C 44 12, 76 26, 112 18 C 150 10, 182 25, 222 16 C 246 10, 268 18, 296 12' fill='none' stroke='%230f2a5f' stroke-width='6' stroke-linecap='round'/%3E%3Cpath d='M6 24 C 46 16, 78 30, 114 22 C 152 14, 184 29, 224 20 C 248 14, 270 22, 294 16' fill='none' stroke='%231f5fbf' stroke-width='3.2' stroke-linecap='round' opacity='0.95'/%3E%3C/svg%3E\")",
                },
              }}
            >
              "Markets reward discipline. Education is where confident investing begins."
            </Typography>

            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f2a5f' }}>Asaad Sohail</Typography>
              <Typography sx={{ fontSize: 13, color: '#40506a' }}>Founder, Webict Capital</Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ pt: 0.5, width: 'fit-content' }}>
              <Button
                href="#"
                variant="outlined"
                size="large"
                sx={{
                  minWidth: 148,
                  px: 2.1,
                  py: 1.15,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 700,
                  color: '#0f2a5f',
                  borderColor: '#9ab8ea',
                  '&:hover': {
                    borderColor: '#0f2a5f',
                    bgcolor: '#eaf2ff',
                  },
                }}
              >
                Contact Us
              </Button>
            </Stack>
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
