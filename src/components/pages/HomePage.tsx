import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import NorthEastIcon from '@mui/icons-material/NorthEast'
import { Box, Button, Container, InputBase, Link, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { featuredNews, newsCards, portfolioItems } from '../../content/siteContent'
import { MotionReveal, MotionStagger } from '../animations/MotionReveal'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPING_WORDS = ['Learn.', 'Invest.', 'Lead.']

// const PARTICLES = [
//   { x: 6,  y: 15, size: 2.5, delay: 0,    dur: 6.2 },
//   { x: 92, y: 22, size: 2,   delay: 1.4,  dur: 5.8 },
//   { x: 18, y: 78, size: 3,   delay: 0.7,  dur: 7.1 },
//   { x: 85, y: 70, size: 2,   delay: 2.2,  dur: 6.5 },
//   { x: 50, y: 90, size: 2.5, delay: 1.0,  dur: 5.4 },
//   { x: 38, y: 8,  size: 2,   delay: 3.0,  dur: 6.8 },
//   { x: 74, y: 48, size: 3,   delay: 0.4,  dur: 7.4 },
//   { x: 62, y: 30, size: 1.5, delay: 1.8,  dur: 5.9 },
// ]

const STATS = [
  { value: '500+', label: 'Investors trained' },
  { value: '12+',  label: 'PSX workshops'     },
  { value: '95%',  label: 'Satisfaction rate' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingHeadline() {
  const [displayed, setDisplayed]   = useState('')
  const [wordIdx,   setWordIdx]     = useState(0)
  const [charIdx,   setCharIdx]     = useState(0)
  const [deleting,  setDeleting]    = useState(false)
  const [done,      setDone]        = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) { setDisplayed('Learn. Invest. Lead.'); setDone(true); return }
    if (done) return

    const fullText   = TYPING_WORDS.slice(0, wordIdx + 1).join(' ')
    const isLastWord = wordIdx === TYPING_WORDS.length - 1

    if (!deleting) {
      if (charIdx < fullText.length) {
        const t = setTimeout(() => {
          setDisplayed(fullText.slice(0, charIdx + 1))
          setCharIdx(c => c + 1)
        }, charIdx === 0 ? 280 : 58)
        return () => clearTimeout(t)
      }
      if (isLastWord) { setDone(true); return }
      const t = setTimeout(() => setDeleting(true), 900)
      return () => clearTimeout(t)
    }

    const currentText = TYPING_WORDS.slice(0, wordIdx).join(' ')
    if (displayed.length > currentText.length) {
      const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 34)
      return () => clearTimeout(t)
    }
    setDeleting(false)
    setWordIdx(i => i + 1)
    setCharIdx(displayed.length)
  }, [charIdx, deleting, displayed, done, wordIdx, reduce])

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.2em', flexWrap: 'wrap' }}>
      {displayed.split(' ').map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-block' }}
        >
          {word}{' '}
        </motion.span>
      ))}
      {!done && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: { xs: '2px', md: '3px' },
            height: { xs: '1.6rem', md: '3.2rem' },
            bgcolor: '#2563eb',
            ml: '1px',
            verticalAlign: 'middle',
            borderRadius: '2px',
            animation: 'blink 1s step-end infinite',
            '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
          }}
        />
      )}
    </Box>
  )
}

// function Particle({ x, y, size, delay, dur }: { x: number; y: number; size: number; delay: number; dur: number }) {
//   return (
//     <Box
//       component={motion.div}
//       animate={{ y: [0, -22, 0], x: [0, 8, -5, 0], opacity: [0.12, 0.35, 0.12] }}
//       transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
//       sx={{
//         position: 'absolute',
//         left: `${x}%`, top: `${y}%`,
//         width: size, height: size,
//         borderRadius: '50%',
//         bgcolor: '#3b82f6',
//         pointerEvents: 'none',
//         filter: 'blur(0.5px)',
//       }}
//     />
//   )
// }

/** Thin horizontal rule with optional label */
// function Divider({ label }: { label?: string }) {
//   return (
//     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: { xs: 4, md: 6 } }}>
//       <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(30,80,160,0.12)' }} />
//       {label && (
//         <Typography sx={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8faac8', fontWeight: 600 }}>
//           {label}
//         </Typography>
//       )}
//       <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(30,80,160,0.12)' }} />
//     </Box>
//   )
// }

/** Reusable pill badge */
// function Badge({ children }: { children: React.ReactNode }) {
//   return (
//     <Box
//       sx={{
//         display: 'inline-flex',
//         alignItems: 'center',
//         gap: 0.8,
//         px: 1.4,
//         py: 0.45,
//         borderRadius: '100px',
//         border: '1px solid rgba(37,99,235,0.28)',
//         bgcolor: 'rgba(37,99,235,0.06)',
//         mb: 2,
//       }}
//     >
//       <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#2563eb', flexShrink: 0 }} />
//       <Typography sx={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1e4fac', fontWeight: 700 }}>
//         {children}
//       </Typography>
//     </Box>
//   )
// }

function getCardStyles(variant?: string) {
  switch (variant) {
    case 'light':   return { fontWeight: 300, fontSize: 24 }
    case 'italic':  return { fontStyle: 'italic', fontSize: 24 }
    case 'wide':    return { letterSpacing: '0.06em', fontWeight: 600, fontSize: 18 }
    case 'stacked': return { fontSize: 12, letterSpacing: '0.04em', lineHeight: 1.2 }
    default:        return { fontSize: 20 }
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HomePage() {
  const reduce    = useReducedMotion()
  const heroRef   = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const heroOp    = useTransform(scrollYProgress, [0, 0.55], [1, 0.35])

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <Box
        ref={heroRef}
        component="section"
        sx={{
          '@keyframes blink':      { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
          '@keyframes lineGrow':   { from: { transform: 'scaleX(0)', opacity: 0 }, to: { transform: 'scaleX(1)', opacity: 1 } },
          '@keyframes floatCard':  { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
          '@keyframes glowPulse':  { '0%,100%': { opacity: 0.18 }, '50%': { opacity: 0.35 } },
          mt: 0,
          pt: { xs: 'calc(64px + 2.5rem)', md: 'calc(72px + 4rem)' },
          pb: { xs: 8, md: 12 },
          bgcolor: '#f9fbff',
          background: 'linear-gradient(168deg, #ffffff 0%, #eef5ff 48%, #e0edff 100%)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Ambient glow orbs */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <Box
            component={motion.div}
            animate={reduce ? {} : { scale: [1, 1.1, 1], opacity: [0.22, 0.38, 0.22] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            sx={{
              position: 'absolute',
              width: { xs: 480, md: 720 }, height: { xs: 480, md: 720 },
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
              top: { xs: -180, md: -240 }, left: { xs: -160, md: -200 },
            }}
          />
          <Box
            component={motion.div}
            animate={reduce ? {} : { scale: [1, 1.12, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            sx={{
              position: 'absolute',
              width: { xs: 360, md: 560 }, height: { xs: 360, md: 560 },
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(10,30,80,0.16) 0%, transparent 70%)',
              bottom: { xs: -100, md: -120 }, right: { xs: -100, md: '10%' },
            }}
          />
        </Box>

        {/* Refined grid */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(rgba(30,80,160,0.035) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(30,80,160,0.035) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)',
          }}
        />

        {/* Floating dots */}
        {/* {!reduce && PARTICLES.map((p, i) => <Particle key={i} {...p} />)} */}

        <Container maxWidth="xl" sx={{ maxWidth: '1340px !important', px: { xs: 2.5, md: 5 }, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,600px)' },
              alignItems: 'center',
              gap: { xs: 6, md: 10 },
            }}
          >
            {/* ── Left column ── */}
            <MotionReveal amount={0.25}>
              <MotionStagger delayChildren={0.06} staggerChildren={0.12} amount={0.3}>
                <Stack spacing={{ xs: 3.2, md: 4 }} sx={{ maxWidth: 660 }}>

                  {/* Badge */}
                  {/* <Box component={motion.div} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                    <Badge>Webict Capital · Since 2021</Badge>
                  </Box> */}

                  {/* Headline */}
                  <Box component={motion.div} variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2.2rem', sm: '2.75rem', md: '4rem' },
                        lineHeight: { xs: 1.1, md: 1.04 },
                        letterSpacing: { xs: '-0.03em', md: '-0.038em' },
                        fontWeight: 900,
                        color: '#08142b',
                        minHeight: { xs: '3.4rem', md: '4.8rem' },
                      }}
                    >
                      <TypingHeadline />
                    </Typography>
                  </Box>

                  {/* Quote */}
                  <Box
                    component={motion.div}
                    variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Box
                      sx={{
                        pl: { xs: 2.2, md: 2.8 },
                        borderLeft: '2px solid rgba(37,99,235,0.4)',
                        position: 'relative',
                        '&::before': {
                          content: '"\\201C"',
                          position: 'absolute',
                          top: -4, left: 8,
                          fontSize: 48,
                          lineHeight: 1,
                          color: 'rgba(37,99,235,0.15)',
                          fontFamily: 'Georgia, serif',
                          pointerEvents: 'none',
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          maxWidth: 540,
                          fontSize: { xs: 15, sm: 16, md: 18.5 },
                          lineHeight: { xs: 1.66, md: 1.6 },
                          color: '#1e3252',
                          fontStyle: 'italic',
                          fontWeight: 400,
                        }}
                      >
                        Markets reward discipline.{' '}
                        <Box component="span" sx={{ fontWeight: 600, color: '#0f2a5f', fontStyle: 'normal' }}>
                          Education is where confident investing begins.
                        </Box>
                        {' '}
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            width: '100%',
                            height: '2px',
                            mt: 1,
                            background: 'linear-gradient(90deg, rgba(37,99,235,0.6) 0%, transparent 100%)',
                            borderRadius: 4,
                            transformOrigin: 'left',
                            animation: 'lineGrow 1.2s cubic-bezier(0.22, 1, 0.5, 1) 600ms both',
                          }}
                        />
                      </Typography>
                    </Box>
                  </Box>

                  {/* Author chip */}
                  <Box component={motion.div} variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 42, height: 42, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0f2a5f 0%, #1e4fac 100%)',
                          border: '1.5px solid rgba(37,99,235,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#fff',
                          flexShrink: 0, letterSpacing: '0.04em',
                          boxShadow: '0 4px 14px rgba(15,42,95,0.3)',
                        }}
                      >
                        AS
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: '#0b1f3d', lineHeight: 1.3 }}>
                          Asaad Sohail
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#4b6278', lineHeight: 1.4 }}>
                          Founder, Webict Capital
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* CTA buttons */}
                  <Box component={motion.div} variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ pt: 0.4, width: { xs: '100%', sm: 'fit-content' } }}>
                      {/* Primary */}
                      <Box
                        component={motion.div}
                        whileHover={reduce ? undefined : { scale: 1.04, y: -3 }}
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Button
                          href="#"
                          variant="contained"
                          size="large"
                          sx={{
                            width: { xs: '100%', sm: 'auto' },
                            minWidth: 166,
                            px: 3, py: 1.45,
                            borderRadius: 1.2,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: 15,
                            background: 'linear-gradient(135deg, #0c2247 0%, #1349a8 100%)',
                            color: '#fff',
                            boxShadow: '0 6px 22px rgba(10,30,80,0.36)',
                            letterSpacing: '0.01em',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #122d5a 0%, #1a5ac0 100%)',
                              boxShadow: '0 10px 32px rgba(10,30,80,0.46)',
                            },
                          }}
                        >
                          Get Started
                        </Button>
                      </Box>

                      {/* Secondary */}
                      <Box
                        component={motion.div}
                        whileHover={reduce ? undefined : { scale: 1.04, y: -3 }}
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Button
                          href="#"
                          variant="outlined"
                          size="large"
                          sx={{
                            width: { xs: '100%', sm: 'auto' },
                            minWidth: 150,
                            px: 2.6, py: 1.45,
                            borderRadius: 1.2,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 15,
                            color: '#0c2247',
                            borderColor: 'rgba(37,99,235,0.36)',
                            letterSpacing: '0.01em',
                            '&:hover': {
                              borderColor: '#0c2247',
                              bgcolor: 'rgba(37,99,235,0.06)',
                            },
                          }}
                        >
                          Contact Us
                        </Button>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Stats */}
                  <Box component={motion.div} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: { xs: 0, md: 0 },
                        mt: 1,
                        pt: 2,
                        borderTop: '1px solid rgba(30,80,160,0.1)',
                        width: 'fit-content',
                      }}
                    >
                      {STATS.map((s, i) => (
                        <Box
                          key={i}
                          sx={{
                            pr: { xs: 3, md: 4.5 },
                            mr: { xs: 3, md: 4.5 },
                            borderRight: i < STATS.length - 1 ? '1px solid rgba(30,80,160,0.12)' : 'none',
                          }}
                        >
                          <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800, color: '#08142b', lineHeight: 1, letterSpacing: '-0.02em' }}>
                            {s.value}
                          </Typography>
                          <Typography sx={{ fontSize: 11.5, color: '#617898', mt: 0.4, fontWeight: 500 }}>
                            {s.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                </Stack>
              </MotionStagger>
            </MotionReveal>

            {/* ── Right column: hero image card ── */}
            <MotionReveal delay={0.2} amount={0.25} y={36} scale={0.975}>
              <Box
                component={motion.div}
                whileHover={reduce ? undefined : { y: -10, scale: 1.018 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                style={{ y: reduce ? undefined : parallaxY, opacity: reduce ? undefined : heroOp }}
                sx={{
                  position: 'relative',
                  borderRadius: { xs: 2.5, md: 3 },
                  overflow: 'hidden',
                  border: '1px solid rgba(160,200,255,0.55)',
                  backgroundImage:
                    'linear-gradient(10deg, rgba(4,10,24,0.72) 0%, rgba(10,24,56,0.22) 55%, rgba(10,24,56,0.06) 100%),' +
                    'url(/herosection.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 42%',
                  minHeight: { xs: 270, sm: 380, md: 490 },
                  boxShadow: '0 28px 56px rgba(8,20,50,0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
                  transition: 'box-shadow 0.4s ease',
                  '&:hover': {
                    boxShadow: '0 40px 72px rgba(8,20,50,0.38)',
                  },
                  animation: reduce ? undefined : 'floatCard 7s ease-in-out 2s infinite',
                }}
              >
                {/* Corner accents */}
                {[
                  { top: 14, left: 14,   borderTop: '1.5px solid rgba(100,160,240,0.65)', borderLeft: '1.5px solid rgba(100,160,240,0.65)' },
                  { top: 14, right: 14,  borderTop: '1.5px solid rgba(100,160,240,0.65)', borderRight: '1.5px solid rgba(100,160,240,0.65)' },
                  { bottom: 14, left: 14,  borderBottom: '1.5px solid rgba(100,160,240,0.65)', borderLeft: '1.5px solid rgba(100,160,240,0.65)' },
                  { bottom: 14, right: 14, borderBottom: '1.5px solid rgba(100,160,240,0.65)', borderRight: '1.5px solid rgba(100,160,240,0.65)' },
                ].map((s, i) => (
                  <Box
                    key={i}
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    sx={{ position: 'absolute', width: 22, height: 22, ...s }}
                  />
                ))}

                {/* Floating badge on image */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    position: 'absolute',
                    top: { xs: 16, md: 22 },
                    right: { xs: 16, md: 22 },
                    px: 1.6, py: 0.7,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}
                >
                  <Typography sx={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Live Session
                  </Typography>
                </Box>

                {/* Bottom label */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    px: { xs: 2.2, md: 2.8 }, py: { xs: 1.8, md: 2.4 },
                    background: 'linear-gradient(to top, rgba(3,9,26,0.9) 0%, transparent 100%)',
                  }}
                >
                  <Typography sx={{ fontSize: { xs: 13.5, md: 15 }, color: 'rgba(255,255,255,0.92)', fontWeight: 600 }}>
                    PSX Training Session
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 11, md: 12.5 }, color: 'rgba(160,200,255,0.7)', mt: 0.4 }}>
                    Conducted by Webict Capital
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ mt: 1.8, fontSize: 11.5, color: '#5a7090', lineHeight: 1.55, letterSpacing: '0.01em' }}>
                Group photo from a PSX training session conducted by Webict Capital.
              </Typography>
            </MotionReveal>
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════
          PORTFOLIO HIGHLIGHTS
      ═══════════════════════════════════════════════════════ */}
      <Box
        component="section"
        sx={{
          '@keyframes cardIn': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
          '@keyframes dotPulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.3)' } },
          py: { xs: 9, md: 13 },
          position: 'relative',
          overflow: 'hidden',
          bgcolor: '#fafcff',
          backgroundImage: 'linear-gradient(180deg, #edf5ff 0%, #ffffff 20%, #f7fbff 100%)',
        }}
      >
        {/* Grid bg */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(rgba(30,80,160,0.04) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(30,80,160,0.04) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          }}
        />

        <Container maxWidth="xl" sx={{ px: { xs: 2.5, md: 5 }, position: 'relative', zIndex: 1 }}>
          <MotionReveal amount={0.2}>
            <Box sx={{ mb: { xs: 4, md: 6 } }}>
              {/* <Badge>Portfolio</Badge> */}
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
                  lineHeight: 1.08,
                  letterSpacing: '-0.025em',
                  fontWeight: 800,
                  color: '#08142b',
                  mt: 0.5,
                }}
              >
                Portfolio Highlights
              </Typography>
              <Typography sx={{ mt: 1.2, color: '#34506e', fontSize: { xs: 14.5, md: 17 }, lineHeight: 1.7, maxWidth: 580 }}>
                Companies backed with long-term conviction, operator empathy, and disciplined capital.
              </Typography>
            </Box>
          </MotionReveal>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: { xs: 2, md: 2.5 },
              perspective: '1600px',
            }}
          >
            {portfolioItems.map((item, index) => (
              <MotionReveal key={item.name} delay={index * 0.05} amount={0.1} y={24} scale={0.984} blur={1.2}>
                <Box
                  component={motion.a}
                  whileHover={reduce ? undefined : { y: -8, scale: 1.015 }}
                  whileTap={reduce ? undefined : { scale: 0.993 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  href={item.href ?? '#'}
                  sx={{
                    bgcolor: '#ffffff',
                    minHeight: { xs: 180, sm: 240, md: 296 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    px: 2.5,
                    textAlign: 'center',
                    textDecoration: 'none',
                    borderRadius: 2.4,
                    border: '1px solid rgba(160,195,240,0.38)',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(10,30,80,0.06)',
                    transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                    animation: `cardIn 520ms ease ${index * 48}ms both`,
                    '&:hover': {
                      boxShadow: '0 24px 42px rgba(8,24,70,0.16)',
                      borderColor: 'rgba(37,99,235,0.22)',
                    },
                    '&:hover .p-dot': { animation: 'dotPulse 600ms ease' },
                    '&:hover .p-overlay, &:focus-visible .p-overlay': { opacity: 1, transform: 'translateY(0)' },
                    '&:hover .p-name, &:focus-visible .p-name':       { opacity: 0, transform: 'translateY(-10px) scale(0.97)' },
                    '&:focus-visible': { outline: '2px solid #2563eb', outlineOffset: 2 },
                  }}
                >
                  {/* Status dot */}
                  <Box
                    className="p-dot"
                    sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      bgcolor: '#2563eb',
                      position: 'absolute', top: 14, right: 14,
                      boxShadow: '0 0 0 3px rgba(37,99,235,0.14)',
                    }}
                  />

                  <Typography
                    className="p-name"
                    sx={{
                      color: '#0a1c38',
                      transition: 'opacity 0.24s ease, transform 0.28s ease',
                      ...getCardStyles(item.variant),
                    }}
                  >
                    {item.name}
                  </Typography>

                  {/* Hover overlay */}
                  <Box
                    className="p-overlay"
                    sx={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(150deg, #0a1d38 0%, #0c2247 100%)',
                      color: '#fff',
                      p: 2.8,
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start',
                      textAlign: 'left',
                      opacity: 0,
                      transform: 'translateY(12px)',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}
                  >
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
                        {item.location ?? 'Global'}
                      </Typography>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1e4fac, #2563eb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
                      }}>
                        <NorthEastIcon sx={{ fontSize: 14, color: '#fff' }} />
                      </Box>
                    </Box>

                    <Box>
                      <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: { xs: 30, md: 38 }, lineHeight: 1.08, mb: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography sx={{ fontSize: 15.5, lineHeight: 1.42, color: 'rgba(255,255,255,0.86)', mb: 2.5 }}>
                        {item.description}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'rgba(140,185,255,0.8)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {item.stage}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </MotionReveal>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════
          PEOPLE SECTION
      ═══════════════════════════════════════════════════════ */}
      <Box
        component="section"
        sx={{
          '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
          bgcolor: '#f6faff',
          backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #eef5ff 55%, #f6faff 100%)',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient */}
        <Box
          component={motion.div}
          aria-hidden
          animate={reduce ? {} : { x: [0, 20, 0], y: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            position: 'absolute', top: -100, left: '8%',
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(21,101,192,0.12) 0%, transparent 72%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ px: { xs: 2.5, md: 5 }, position: 'relative', zIndex: 1 }}>
          <MotionReveal>
            <Box
              sx={{
                borderRadius: 2.2,
                border: '1px solid rgba(160,200,255,0.35)',
                bgcolor: 'rgba(255,255,255,0.96)',
                p: { xs: 3, md: 5 },
                textAlign: 'center',
                mb: { xs: 4, md: 6 },
                boxShadow: '0 8px 32px rgba(10,30,80,0.07)',
                animation: 'slideUp 580ms ease both',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0, left: '10%', right: '10%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)',
                },
              }}
            >
              {/* <Badge>Our Philosophy</Badge> */}
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '1.65rem', sm: '2rem', md: '2.7rem' },
                  lineHeight: { xs: 1.22, md: 1.14 },
                  letterSpacing: '-0.022em',
                  fontWeight: 800,
                  mb: 1.8,
                  color: '#08142b',
                  mt: 0.5,
                }}
              >
                Investing in companies and the{' '}
                <Box
                  component="span"
                  sx={{
                    fontStyle: 'italic',
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 700,
                    color: '#1349a8',
                  }}
                >
                  people building them
                </Box>
              </Typography>
              <Typography sx={{ maxWidth: 580, mx: 'auto', color: '#344f6e', mb: 2.5, fontSize: { xs: 14.5, md: 16.5 }, lineHeight: 1.72 }}>
                We care about and support founders as people, not just CEOs or business leaders. Building a strong company requires resilient leadership and disciplined support.
              </Typography>
              <Link
                href="#"
                underline="none"
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.8,
                  color: '#1349a8', fontSize: 13.5, fontWeight: 600,
                  borderBottom: '1px solid rgba(19,73,168,0.3)',
                  pb: '2px',
                  transition: 'gap 0.22s ease, border-color 0.22s ease',
                  '&:hover': { gap: 1.4, borderColor: '#1349a8' },
                }}
              >
                Wellbeing Platform <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </Link>
            </Box>
          </MotionReveal>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: { xs: 1.5, md: 2.5 } }}>
            {[0, 1, 2].map((i) => (
              <MotionReveal key={i} delay={i * 0.09} amount={0.16}>
                <Box
                  component={motion.div}
                  whileHover={reduce ? undefined : { y: -8, scale: 1.022 }}
                  whileTap={reduce ? undefined : { scale: 0.99 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    aspectRatio: '3/4',
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: { xs: i === 2 ? 'none' : 'flex', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: [
                      'linear-gradient(145deg, #d0dff5 0%, #a8c0e0 100%)',
                      'linear-gradient(145deg, #c8d9f2 0%, #9ebada 100%)',
                      'linear-gradient(145deg, #d8e7fa 0%, #b2ccec 100%)',
                    ][i],
                    border: '1px solid rgba(140,180,230,0.38)',
                    boxShadow: '0 4px 18px rgba(10,30,80,0.08)',
                    transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                    '&:hover': { boxShadow: '0 18px 36px rgba(8,24,70,0.16)' },
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to bottom, transparent 60%, rgba(8,24,70,0.12) 100%)',
                    },
                  }}
                >
                  <Box component="svg" width="80" height="120" viewBox="0 0 80 120">
                    <ellipse cx="40" cy="38" rx="22" ry="25" fill="rgba(255,255,255,0.28)" />
                    <path d="M5 120 Q15 75 40 68 Q65 75 75 120 Z" fill="rgba(255,255,255,0.18)" />
                  </Box>
                </Box>
              </MotionReveal>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════
          NEWS & INSIGHTS
      ═══════════════════════════════════════════════════════ */}
      <Box
        component="section"
        sx={{
          '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
          py: { xs: 8, md: 13 },
          backgroundImage: 'linear-gradient(180deg, #f7fbff 0%, #ffffff 28%, #f7fbff 100%)',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2.5, md: 5 } }}>
          <MotionReveal amount={0.18}>
            <Box sx={{ mb: { xs: 4, md: 6 }, maxWidth: 680 }}>
              {/* <Badge>Editorial</Badge> */}
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '1.7rem', md: '2.75rem' },
                  lineHeight: 1.1,
                  letterSpacing: '-0.025em',
                  fontWeight: 800,
                  color: '#08142b',
                  mt: 0.5,
                }}
              >
                News &amp; Insights
              </Typography>
              <Typography sx={{ mt: 1.2, color: '#344f6e', fontSize: { xs: 14.5, md: 16.5 }, lineHeight: 1.72 }}>
                Portfolio milestones, ecosystem updates, and institutional perspectives from Webict Capital.
              </Typography>
            </Box>
          </MotionReveal>

          {/* Featured article */}
          <MotionReveal y={22} duration={0.65}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 3, md: 6 },
                alignItems: 'center',
                bgcolor: '#ffffff',
                borderRadius: 2.2,
                border: '1px solid rgba(160,195,240,0.4)',
                boxShadow: '0 8px 28px rgba(10,30,80,0.07)',
                p: { xs: 2.5, md: 4 },
                mb: { xs: 4, md: 7 },
                animation: 'fadeIn 640ms ease both',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0, width: '4px',
                  background: 'linear-gradient(180deg, #1349a8, #2563eb)',
                  borderRadius: '0 0 0 2px',
                },
              }}
            >
              <Box sx={{ pl: { md: 1 } }}>
                <Typography sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10.5, color: '#8aabcc', mb: 1.4, fontWeight: 700 }}>
                  {featuredNews.category} · {featuredNews.date}
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: '1.35rem', sm: '1.6rem', md: '2.1rem' },
                    lineHeight: { xs: 1.3, md: 1.22 },
                    letterSpacing: '-0.018em',
                    fontWeight: 800,
                    mb: 2,
                    color: '#08142b',
                  }}
                >
                  {featuredNews.title}
                </Typography>
                <Typography sx={{ color: '#4a6278', lineHeight: 1.74, mb: 3, fontSize: { xs: 14.5, md: 16 } }}>
                  {featuredNews.description}
                </Typography>
                <Link
                  href="#"
                  underline="none"
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.8,
                    color: '#1349a8', fontSize: 13.5, fontWeight: 600,
                    borderBottom: '1px solid rgba(19,73,168,0.28)',
                    pb: '2px',
                    transition: 'gap 0.22s ease',
                    '&:hover': { gap: 1.4 },
                  }}
                >
                  Read article <ArrowForwardIcon sx={{ fontSize: 15 }} />
                </Link>
              </Box>

              <Box
                component={motion.div}
                whileHover={reduce ? undefined : { y: -6, scale: 1.012 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                sx={{
                  aspectRatio: { xs: '16/10', md: '4/3' },
                  borderRadius: 1.8,
                  border: '1px solid rgba(140,180,230,0.32)',
                  background: 'linear-gradient(140deg, #0a1e3c 0%, #0e3f80 100%)',
                  display: 'flex', alignItems: 'flex-end',
                  p: 2.8,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(8,24,70,0.18)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': { boxShadow: '0 18px 36px rgba(8,24,70,0.26)' },
                  '&::after': {
                    content: '""',
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at 30% 30%, rgba(37,99,235,0.2) 0%, transparent 65%)',
                    pointerEvents: 'none',
                  },
                }}
              >
                <Typography sx={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                  {featuredNews.imageCaption}
                </Typography>
              </Box>
            </Box>
          </MotionReveal>

          {/* News grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: { xs: 2, md: 3 } }}>
            {newsCards.map((card, index) => (
              <MotionReveal key={card.title} delay={index * 0.07} amount={0.14} y={20}>
                <Box
                  component={motion.div}
                  whileHover={reduce ? undefined : { y: -5 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    p: { xs: 2, md: 2.8 },
                    borderRadius: 1.8,
                    border: '1px solid rgba(160,195,240,0.35)',
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 10px rgba(10,30,80,0.05)',
                    animation: `fadeIn 540ms ease ${index * 80}ms both`,
                    transition: 'transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 16px 30px rgba(10,30,80,0.12)',
                      borderColor: 'rgba(37,99,235,0.24)',
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                      background: 'linear-gradient(180deg, #1349a8, #2563eb)',
                      opacity: 0,
                      transition: 'opacity 0.24s ease',
                      borderRadius: '0 0 0 1px',
                    },
                    '&:hover::after': { opacity: 1 },
                  }}
                >
                  <Typography sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10.5, color: '#8aabcc', mb: 1.2, fontWeight: 700 }}>
                    {card.category} · {card.date}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: '1.08rem', md: '1.28rem' },
                      lineHeight: 1.36,
                      letterSpacing: '-0.016em',
                      fontWeight: 700,
                      mb: 2,
                      color: '#08142b',
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Link
                    href={card.href}
                    underline="none"
                    sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.6,
                      color: '#1349a8', fontSize: 13, fontWeight: 600,
                      borderBottom: '1px solid rgba(19,73,168,0.24)',
                      pb: '1px',
                      transition: 'gap 0.22s ease',
                      '&:hover': { gap: 1.2 },
                    }}
                  >
                    {card.linkLabel} <ArrowForwardIcon sx={{ fontSize: 14 }} />
                  </Link>
                </Box>
              </MotionReveal>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════
          NEWSLETTER CTA
      ═══════════════════════════════════════════════════════ */}
      <Container
        maxWidth="xl"
        sx={{
          '@keyframes ctaGlow': {
            '0%,100%': { transform: 'translateX(-10%) scale(1)' },
            '50%':      { transform: 'translateX(10%) scale(1.06)' },
          },
          mb: { xs: 7, md: 12 },
          px: { xs: 2.5, md: 5 },
        }}
      >
        <MotionReveal amount={0.18} duration={0.65} y={28}>
          <Box
            component={motion.div}
            whileHover={reduce ? undefined : { y: -6 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              background: 'linear-gradient(140deg, #091a36 0%, #0d2754 50%, #0e3272 100%)',
              borderRadius: 2.5,
              border: '1px solid rgba(120,170,240,0.3)',
              px: { xs: 3, md: 9 },
              py: { xs: 5, md: 8 },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 5, md: 10 },
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(5,12,36,0.38)',
              transition: 'box-shadow 0.34s ease',
              '&:hover': { boxShadow: '0 40px 80px rgba(5,12,36,0.48)' },

              // Glow sweep
              '&::before': {
                content: '""',
                position: 'absolute', inset: -4,
                background: 'linear-gradient(115deg, rgba(37,99,235,0.4), transparent, rgba(37,99,235,0.28))',
                filter: 'blur(32px)',
                opacity: 0.7,
                animation: 'ctaGlow 6s ease-in-out infinite',
                pointerEvents: 'none',
              },
              // Top line
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0, left: '10%', right: '10%', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(100,160,255,0.5), transparent)',
                pointerEvents: 'none',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* <Badge>Newsletter</Badge> */}
              <Typography
                variant="h2"
                sx={{
                  color: '#ffffff',
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '3.4rem' },
                  lineHeight: { xs: 1.2, md: 1.08 },
                  letterSpacing: '-0.025em',
                  fontWeight: 900,
                  mt: 0.5,
                }}
              >
                Stay in touch with{' '}
                <Box
                  component="span"
                  sx={{
                    fontStyle: 'italic',
                    fontFamily: '"Playfair Display", Georgia, serif',
                    color: 'rgba(140,190,255,0.95)',
                  }}
                >
                  Webict Capital
                </Box>
              </Typography>
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography sx={{ color: 'rgba(200,220,255,0.7)', mb: 3.2, lineHeight: 1.74, fontSize: { xs: 14.5, md: 16 } }}>
                Sign up for our newsletter to stay up to date on news from Webict Capital, and our portfolio companies.
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 1.4,
                  overflow: 'hidden',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(8px)',
                  transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                  '&:focus-within': {
                    borderColor: 'rgba(37,99,235,0.7)',
                    boxShadow: '0 0 0 3px rgba(37,99,235,0.18)',
                  },
                }}
              >
                <InputBase
                  fullWidth
                  placeholder="Enter your email address"
                  inputProps={{ 'aria-label': 'Email address' }}
                  sx={{
                    px: 2.2, py: 1.4,
                    color: '#fff',
                    fontSize: 14.5,
                    '& input::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 },
                  }}
                />
                <Box
                  component={motion.div}
                  whileHover={reduce ? undefined : { scale: 1.05 }}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                >
                  <Button
                    sx={{
                      minWidth: { xs: '100%', sm: 58 },
                      py: { xs: 1.2, sm: 0 },
                      px: { xs: 0, sm: 2 },
                      borderRadius: 0,
                      background: 'linear-gradient(135deg, #1349a8, #2563eb)',
                      color: '#fff',
                      flexShrink: 0,
                      transition: 'filter 0.24s ease',
                      '&:hover': { filter: 'brightness(1.12)' },
                      '&:hover .cta-arr': { transform: 'translateX(3px)' },
                    }}
                  >
                    <ArrowForwardIcon className="cta-arr" sx={{ fontSize: 18, transition: 'transform 0.24s ease' }} />
                  </Button>
                </Box>
              </Box>

              <Typography sx={{ mt: 2.2, color: 'rgba(255,255,255,0.28)', fontSize: 11, lineHeight: 1.65 }}>
                You may unsubscribe at any time. We respect your privacy — see our Privacy Policy for details.
              </Typography>
            </Box>
          </Box>
        </MotionReveal>
      </Container>
    </>
  )
}