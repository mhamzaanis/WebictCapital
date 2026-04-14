import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Container, Link, Typography } from '@mui/material'

export function InvestingSection() {
  return (
    <Box
      component="section"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        bgcolor: 'background.paper',
        py: { xs: 8, md: 10 },
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, lineHeight: 1.2, letterSpacing: '-0.02em', mb: 2.5, animation: 'fadeRise 560ms ease both' }}>
          Investing in companies and the <Box component="em">people building them</Box>
        </Typography>
        <Typography sx={{ maxWidth: 560, mx: 'auto', color: 'text.secondary', mb: 2 }}>
          We care about and support founders as people, not just CEOs or business leaders. Because building a successful company requires more than performance at work.
        </Typography>
        <Link href="#" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 13 }}>
          Wellbeing Platform <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Link>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mt: 6 }}>
          {[0, 1, 2].map((item) => (
            <Box
              key={item}
              sx={{
                aspectRatio: '3 / 4',
                borderRadius: 1,
                overflow: 'hidden',
                display: { xs: item === 2 ? 'none' : 'flex', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  item === 0
                    ? 'linear-gradient(135deg, #d6dbe1 0%, #b8c0ca 100%)'
                    : item === 1
                      ? 'linear-gradient(135deg, #ccd3db 0%, #a5b0be 100%)'
                      : 'linear-gradient(135deg, #e0e4e9 0%, #c3cad3 100%)',
                transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 20px rgba(0,0,0,0.1)' },
              }}
            >
              <Box component="svg" width="80" height="120" viewBox="0 0 80 120">
                <ellipse cx="40" cy="38" rx="22" ry="25" fill="rgba(255,255,255,0.3)" />
                <path d="M5 120 Q15 75 40 68 Q65 75 75 120 Z" fill="rgba(255,255,255,0.2)" />
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
