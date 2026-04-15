import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Container, Link, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { featuredNews, newsCards } from '../../content/siteContent'
import { MotionReveal, MotionStagger } from '../animations/MotionReveal'

export function NewsSection() {
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component="section"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        py: { xs: 7, md: 10 },
        backgroundImage: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 30%, #f8fbff 100%)',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <MotionReveal amount={0.2}>
          <Box sx={{ mb: { xs: 3.2, md: 4.2 }, maxWidth: 740 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.65rem', md: '2.6rem' }, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0b1320' }}>
              News and Insights
            </Typography>
            <Typography sx={{ mt: 1, color: '#324760', fontSize: { xs: 14.5, md: 16 }, lineHeight: 1.7 }}>
              Portfolio milestones, ecosystem updates, and institutional perspectives from Webict Capital.
            </Typography>
          </Box>
        </MotionReveal>

        <MotionReveal y={20} duration={0.62}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 2.8, md: 5 },
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: '#d7e4f8',
            pb: { xs: 4, md: 6 },
            mb: { xs: 4, md: 6 },
            animation: 'fadeRise 620ms ease both',
            borderRadius: 1.5,
            p: { xs: 2, md: 2.5 },
            bgcolor: 'rgba(255,255,255,0.82)',
            boxShadow: '0 10px 26px rgba(12,39,88,0.06)',
          }}
        >
          <Box>
            <Typography sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11, color: '#9a9a9a', mb: 1.25 }}>
              {featuredNews.category} {featuredNews.date}
            </Typography>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem', md: '2rem' }, lineHeight: { xs: 1.3, md: 1.25 }, letterSpacing: '-0.015em', mb: 1.8 }}>
              {featuredNews.title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 2.5 }}>{featuredNews.description}</Typography>
            <Link href="#" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 13 }}>
              Read article <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Link>
          </Box>

          <Box
              component={motion.div}
              whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              sx={{
                aspectRatio: { xs: '16 / 10', md: '4 / 3' },
              borderRadius: 1,
              border: '1px solid rgba(155,186,230,0.4)',
              background: 'linear-gradient(135deg, #0f243f 0%, #114887 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              p: 2.5,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                boxShadow: '0 14px 24px rgba(0,0,0,0.16)',
              },
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {featuredNews.imageCaption}
            </Typography>
          </Box>
        </Box>
        </MotionReveal>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2.2, md: 4 } }}>
          <MotionStagger delayChildren={0.04} staggerChildren={0.08} amount={0.1}>
          {newsCards.map((card, index) => (
            <MotionReveal key={card.title} delay={index * 0.08} amount={0.16} y={20}>
            <Box
              component={motion.div}
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 1.4,
                border: '1px solid #dce8f8',
                bgcolor: '#ffffff',
                transition: 'transform 0.25s ease, border-color 0.25s ease, background-color 0.25s ease',
                animation: 'fadeRise 540ms ease both',
                animationDelay: `${index * 80}ms`,
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: '#adc8eb',
                  bgcolor: '#f7fbff',
                },
              }}
            >
              <Typography sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, color: '#9a9a9a', mb: 1.25 }}>
                {card.category} {card.date}
              </Typography>
              <Typography variant="h4" sx={{ fontSize: { xs: '1.06rem', md: '1.25rem' }, lineHeight: 1.35, letterSpacing: '-0.015em', mb: 1.55 }}>
                {card.title}
              </Typography>
              <Link href={card.href} underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: 13 }}>
                {card.linkLabel} <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </Link>
            </Box>
            </MotionReveal>
          ))}
          </MotionStagger>
        </Box>
      </Container>
    </Box>
  )
}
