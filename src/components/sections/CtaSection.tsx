import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Button, Container, InputBase, Typography } from '@mui/material'

export function CtaSection() {
  return (
    <Container
      maxWidth="xl"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        mb: { xs: 6, md: 10 },
      }}
    >
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          borderRadius: 1,
          px: { xs: 3, md: 8 },
          py: { xs: 5, md: 7 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 4, md: 8 },
          alignItems: 'center',
          animation: 'fadeRise 620ms ease both',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 18px 30px rgba(0,0,0,0.22)',
          },
        }}
      >
        <Typography variant="h2" sx={{ color: 'common.white', fontSize: { xs: '2.2rem', md: '3.2rem' }, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Stay in touch with Webict Capital
        </Typography>

        <Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 3, lineHeight: 1.7 }}>
            Sign up for our newsletter to stay up to date on news from Webict Capital, and our portfolio.
          </Typography>

          <Box sx={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 1, overflow: 'hidden', transition: 'border-color 0.25s ease', '&:focus-within': { borderColor: 'rgba(21,101,192,0.85)' } }}>
            <InputBase
              fullWidth
              placeholder="Enter your email here"
              inputProps={{ 'aria-label': 'Email address' }}
              sx={{ px: 2, py: 1.2, color: 'common.white', '& input::placeholder': { color: 'rgba(255,255,255,0.35)', opacity: 1 } }}
            />
            <Button
              sx={{
                minWidth: 54,
                borderRadius: 0,
                bgcolor: 'primary.main',
                color: 'common.white',
                transition: 'background-color 0.25s ease, transform 0.25s ease',
                '&:hover': { bgcolor: '#0f4f98', transform: 'translateX(2px)' },
                '&:hover .cta-arrow': { transform: 'translateX(2px)' },
              }}
            >
              <ArrowForwardIcon className="cta-arrow" fontSize="small" sx={{ transition: 'transform 0.25s ease' }} />
            </Button>
          </Box>

          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.6 }}>
            You may unsubscribe from these communications at any time. For information on how to unsubscribe,
            as well as our privacy practices and commitment to protecting your privacy, check out our Privacy Policy.
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
