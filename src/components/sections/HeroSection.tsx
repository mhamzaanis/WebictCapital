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
        '@keyframes heroFloat': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        mt: 0,
        pt: { xs: 'calc(64px + 1.25rem)', md: 'calc(72px + 2.25rem)' },
        bgcolor: '#f4f6f8',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 420px' },
            alignItems: 'end',
            gap: 4,
          }}
        >
          <Stack spacing={5} sx={{ pb: { xs: 6, md: 8 }, maxWidth: 560, animation: 'fadeRise 680ms ease both' }}>
            <Typography variant="h1" sx={{ fontSize: { xs: '2.4rem', md: '4rem' }, lineHeight: 1.08, letterSpacing: '-0.03em' }}>
              The best way to change the world is to <Box component="em">build a business</Box>
            </Typography>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Soner Aydemir</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Co-founder & CEO</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Dream Games</Typography>
            </Box>
          </Stack>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', alignItems: 'end', animation: 'fadeRise 760ms ease both', animationDelay: '120ms' }}>
            <Box
              sx={{
                width: 360,
                height: 420,
                borderRadius: '4px 4px 0 0',
                background: 'linear-gradient(160deg, #d9dde3 0%, #bcc4ce 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 30px rgba(0,0,0,0.12)',
                },
                '&:hover svg': {
                  animation: 'heroFloat 2.3s ease-in-out infinite',
                },
              }}
            >
              <Box component="svg" viewBox="0 0 240 380" sx={{ width: 240, height: 380, opacity: 0.85 }}>
                <ellipse cx="120" cy="90" rx="52" ry="58" fill="#8a6a58" opacity="0.9" />
                <ellipse cx="120" cy="50" rx="52" ry="35" fill="#2a1a10" opacity="0.9" />
                <ellipse cx="120" cy="130" rx="40" ry="22" fill="#2a1a10" opacity="0.75" />
                <path d="M40 200 Q50 155 120 148 Q190 155 200 200 L210 380 H30 Z" fill="#1a2433" opacity="0.9" />
                <rect x="104" y="135" width="32" height="28" rx="4" fill="#8a6a58" opacity="0.8" />
                <path d="M85 160 Q120 175 155 160" fill="none" stroke="#162238" strokeWidth="8" strokeLinecap="round" />
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
