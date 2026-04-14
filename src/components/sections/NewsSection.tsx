import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Container, Link, Typography } from '@mui/material'
import { featuredNews, newsCards } from '../../content/siteContent'

export function NewsSection() {
  return (
    <Box
      component="section"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        py: { xs: 8, md: 10 },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 5,
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 6,
            mb: 6,
            animation: 'fadeRise 620ms ease both',
          }}
        >
          <Box>
            <Typography sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12, color: '#9a9a9a', mb: 1.5 }}>
              {featuredNews.category} {featuredNews.date}
            </Typography>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2rem' }, lineHeight: 1.25, letterSpacing: '-0.015em', mb: 2 }}>
              {featuredNews.title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 2.5 }}>{featuredNews.description}</Typography>
            <Link href="#" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 13 }}>
              Read article <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Link>
          </Box>

          <Box
            sx={{
              aspectRatio: '4 / 3',
              borderRadius: 1,
              background: 'linear-gradient(135deg, #1a1f26 0%, #0f3f78 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              p: 2.5,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 14px 24px rgba(0,0,0,0.16)',
              },
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {featuredNews.imageCaption}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          {newsCards.map((card, index) => (
            <Box
              key={card.title}
              sx={{
                p: 2,
                borderRadius: 1,
                border: '1px solid transparent',
                transition: 'transform 0.25s ease, border-color 0.25s ease, background-color 0.25s ease',
                animation: 'fadeRise 540ms ease both',
                animationDelay: `${index * 80}ms`,
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: 'divider',
                  bgcolor: '#fbfcfe',
                },
              }}
            >
              <Typography sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, color: '#9a9a9a', mb: 1.25 }}>
                {card.category} {card.date}
              </Typography>
              <Typography variant="h4" sx={{ fontSize: '1.25rem', lineHeight: 1.35, letterSpacing: '-0.015em', mb: 1.75 }}>
                {card.title}
              </Typography>
              <Link href={card.href} underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 13 }}>
                {card.linkLabel} <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </Link>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
