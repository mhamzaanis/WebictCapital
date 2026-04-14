import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Button, Container, InputBase, Typography } from '@mui/material'

export function CtaSection() {
  return (
    <Container maxWidth="xl" sx={{ mb: { xs: 6, md: 10 } }}>
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
        }}
      >
        <Typography variant="h2" sx={{ color: 'common.white', fontSize: { xs: '2.2rem', md: '3.2rem' }, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Stay in touch with Webict Capital
        </Typography>

        <Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 3, lineHeight: 1.7 }}>
            Sign up for our newsletter to stay up to date on news from Webict Capital, and our portfolio.
          </Typography>

          <Box sx={{ display: 'flex', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 1, overflow: 'hidden' }}>
            <InputBase
              fullWidth
              placeholder="Enter your email here"
              inputProps={{ 'aria-label': 'Email address' }}
              sx={{ px: 2, py: 1.2, color: 'common.white', '& input::placeholder': { color: 'rgba(255,255,255,0.35)', opacity: 1 } }}
            />
            <Button sx={{ minWidth: 54, borderRadius: 0, bgcolor: 'primary.main', color: 'common.white', '&:hover': { bgcolor: '#0f4f98' } }}>
              <ArrowForwardIcon fontSize="small" />
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
