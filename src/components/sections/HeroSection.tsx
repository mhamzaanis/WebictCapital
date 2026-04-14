import { Box, Button, Container, Stack, Typography } from '@mui/material'

export function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(22px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes zigLineDraw': {
          from: { opacity: 0, transform: 'scaleX(0.15) translateX(-4px)' },
          to: { opacity: 1, transform: 'scaleX(1) translateX(0)' },
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
                maxWidth: 560,
                fontSize: { xs: 16, md: 19 },
                lineHeight: 1.52,
                color: '#253750',
              }}
            >
              {'"Markets reward discipline. '}
              <Box
                component="span"
                sx={{
                  position: 'relative',
                  display: 'inline-block',
                  pb: { xs: 1.2, md: 1.35 },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: { xs: 1, md: 2 },
                    height: { xs: 12, md: 14 },
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100% 100%',
                    pointerEvents: 'none',
                    transformOrigin: 'left center',
                    animation: 'zigLineDraw 820ms cubic-bezier(0.22, 1, 0.5, 1) 140ms both',
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 16' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='ink' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%231a365d' stop-opacity='1'/%3E%3Cstop offset='72%25' stop-color='%231f5fbf' stop-opacity='0.95'/%3E%3Cstop offset='100%25' stop-color='%231f5fbf' stop-opacity='0.18'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M4 10 L28 8 L52 11 L78 8.5 L104 10.8 L130 8.4 L156 10.6 L184 8.3 L212 10.2 L242 8.6 L270 10.1 L296 9' fill='none' stroke='url(%23ink)' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  },
                }}
              >
                Education is where confident investing begins.
              </Box>
              {'"'}
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
