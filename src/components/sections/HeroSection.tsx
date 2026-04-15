import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { MotionReveal, MotionStagger } from '../animations/MotionReveal'

const TYPING_WORDS = ['Learn.', 'Invest.', 'Lead.']

function TypingHeadline() {
  const [displayed, setDisplayed] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [done, setDone] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed('Learn. Invest. Lead.')
      setDone(true)
      return
    }

    if (done) return

    const fullText = TYPING_WORDS.slice(0, wordIdx + 1).join(' ')
    const isLastWord = wordIdx === TYPING_WORDS.length - 1

    if (!deleting) {
      if (charIdx < fullText.length) {
        const t = setTimeout(() => {
          setDisplayed(fullText.slice(0, charIdx + 1))
          setCharIdx(c => c + 1)
        }, charIdx === 0 ? 300 : 62)
        return () => clearTimeout(t)
      } else {
        if (isLastWord) {
          setDone(true)
          return
        }
        const t = setTimeout(() => setDeleting(true), 820)
        return () => clearTimeout(t)
      }
    } else {
      const currentText = TYPING_WORDS.slice(0, wordIdx).join(' ')
      if (displayed.length > currentText.length) {
        const t = setTimeout(() => {
          setDisplayed(d => d.slice(0, -1))
        }, 38)
        return () => clearTimeout(t)
      } else {
        setDeleting(false)
        setWordIdx(i => i + 1)
        setCharIdx(displayed.length)
      }
    }
  }, [charIdx, deleting, displayed, done, wordIdx, reduceMotion])

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.18em', flexWrap: 'wrap' }}>
      {displayed.split(' ').map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
            height: { xs: '1.55rem', md: '3rem' },
            bgcolor: '#1f5fbf',
            ml: '2px',
            verticalAlign: 'middle',
            borderRadius: '1px',
            animation: 'cursorBlink 0.9s step-end infinite',
            '@keyframes cursorBlink': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0 },
            },
          }}
        />
      )}
    </Box>
  )
}

function FloatingParticle({ x, y, size, delay, duration }: {
  x: number; y: number; size: number; delay: number; duration: number
}) {
  return (
    <Box
      component={motion.div}
      animate={{
        y: [0, -18, 0],
        x: [0, 6, -4, 0],
        opacity: [0.18, 0.42, 0.18],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      sx={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: '#1a5dc8',
        pointerEvents: 'none',
      }}
    />
  )
}

const PARTICLES = [
  { x: 8,  y: 18, size: 5,  delay: 0,    duration: 4.8 },
  { x: 14, y: 72, size: 3,  delay: 1.1,  duration: 5.6 },
  { x: 88, y: 24, size: 4,  delay: 0.6,  duration: 4.2 },
  { x: 82, y: 66, size: 6,  delay: 2.0,  duration: 6.1 },
  { x: 54, y: 88, size: 3,  delay: 1.6,  duration: 5.0 },
  { x: 42, y: 10, size: 4,  delay: 0.3,  duration: 4.5 },
  { x: 72, y: 45, size: 3,  delay: 2.4,  duration: 5.8 },
]

export function HeroSection() {
  const reduceMotion = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const parallaxOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.4])

  return (
    <Box
      ref={sectionRef}
      component="section"
      sx={{
        '@keyframes fadeRise': {
          from: { opacity: 0, transform: 'translateY(28px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes zigLineDraw': {
          from: { opacity: 0, transform: 'scaleX(0.12) translateX(-6px)' },
          to: { opacity: 1, transform: 'scaleX(1) translateX(0)' },
        },
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        '@keyframes pulseGlow': {
          '0%, 100%': { boxShadow: '0 0 0 0px rgba(30, 95, 195, 0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(30, 95, 195, 0.12)' },
        },
        mt: 0,
        pt: { xs: 'calc(64px + 2rem)', md: 'calc(72px + 3.5rem)' },
        pb: { xs: 7, md: 10 },
        bgcolor: '#f2f7ff',
        backgroundImage: 'linear-gradient(170deg, #ffffff 0%, #e8f2ff 55%, #ddeeff 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient blobs */}
      <Box
        component={motion.div}
        animate={reduceMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          width: { xs: 360, md: 560 },
          height: { xs: 360, md: 560 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(31,95,191,0.16) 0%, transparent 70%)',
          top: { xs: -80, md: -120 },
          left: { xs: -100, md: -140 },
          pointerEvents: 'none',
        }}
      />
      <Box
        component={motion.div}
        animate={reduceMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        sx={{
          position: 'absolute',
          width: { xs: 280, md: 440 },
          height: { xs: 280, md: 440 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,42,94,0.14) 0%, transparent 70%)',
          bottom: { xs: -60, md: -80 },
          right: { xs: -80, md: '15%' },
          pointerEvents: 'none',
        }}
      />

      {/* Floating particles */}
      {!reduceMotion && PARTICLES.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* Decorative grid lines */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(30,80,160,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,80,160,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          pointerEvents: 'none',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
        }}
      />

      <Container maxWidth="xl" sx={{ maxWidth: '1280px !important', px: { xs: 2.5, md: 4 }, position: 'relative' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 620px)' },
            alignItems: 'center',
            gap: { xs: 5, md: 7 },
          }}
        >
          {/* LEFT COLUMN */}
          <MotionReveal amount={0.3}>
            <MotionStagger delayChildren={0.08} staggerChildren={0.13} amount={0.32}>
              <Stack spacing={{ xs: 3, md: 3.8 }} sx={{ maxWidth: 640 }}>

                {/* Badge */}
                <Box
                  component={motion.div}
                  variants={{ hidden: { opacity: 0, y: -10, scale: 0.94 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.8,
                      px: 1.5,
                      py: 0.55,
                      borderRadius: '100px',
                      border: '1px solid rgba(31,95,191,0.28)',
                      bgcolor: 'rgba(31,95,191,0.06)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <Box
                      component={motion.div}
                      animate={reduceMotion ? {} : { scale: [1, 1.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#1f5fbf' }}
                    />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#1a4fa0', letterSpacing: '0.02em' }}>
                      PSX-Focused Investment Education
                    </Typography>
                  </Box>
                </Box>

                {/* Headline with typing animation */}
                <Box
                  component={motion.div}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3.8rem' },
                      lineHeight: { xs: 1.1, md: 1.05 },
                      letterSpacing: '-0.034em',
                      fontWeight: 800,
                      color: '#0c1320',
                      minHeight: { xs: '3.2rem', md: '4.2rem' },
                    }}
                  >
                    <TypingHeadline />
                  </Typography>
                </Box>

                {/* Quote */}
                <Box
                  component={motion.div}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Box
                    sx={{
                      pl: { xs: 2, md: 2.5 },
                      borderLeft: '3px solid rgba(31,95,191,0.35)',
                      borderRadius: '0 0 0 0',
                    }}
                  >
                    <Typography
                      sx={{
                        maxWidth: 560,
                        fontSize: { xs: 15.5, sm: 16.5, md: 19.5 },
                        lineHeight: { xs: 1.62, md: 1.56 },
                        color: '#253750',
                        fontStyle: 'italic',
                      }}
                    >
                      {'"Markets reward discipline. '}
                      <Box
                        component="span"
                        sx={{
                          position: 'relative',
                          display: 'inline-block',
                          pb: { xs: 1.3, md: 1.5 },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: { xs: 1, md: 2 },
                            height: { xs: 10, md: 14 },
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '100% 100%',
                            pointerEvents: 'none',
                            transformOrigin: 'left center',
                            animation: 'zigLineDraw 1s cubic-bezier(0.22, 1, 0.5, 1) 800ms both',
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 16' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='ink' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%231a365d' stop-opacity='1'/%3E%3Cstop offset='72%25' stop-color='%231f5fbf' stop-opacity='0.95'/%3E%3Cstop offset='100%25' stop-color='%231f5fbf' stop-opacity='0.18'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M4 10 L28 8 L52 11 L78 8.5 L104 10.8 L130 8.4 L156 10.6 L184 8.3 L212 10.2 L242 8.6 L270 10.1 L296 9' fill='none' stroke='url(%23ink)' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C%2Fsvg%3E\")",
                          },
                        }}
                      >
                        Education is where confident investing begins.
                      </Box>
                      {'"'}
                    </Typography>
                  </Box>
                </Box>

                {/* Author */}
                <Box
                  component={motion.div}
                  variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0 } }}
                  transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Stack direction="row" spacing={1.4} alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'rgba(31,95,191,0.12)',
                        border: '1.5px solid rgba(31,95,191,0.22)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1f5fbf',
                        flexShrink: 0,
                      }}
                    >
                      AS
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#0f2a5f', lineHeight: 1.3 }}>
                        Asaad Sohail
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, color: '#40506a', lineHeight: 1.4 }}>
                        Founder, Webict Capital
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* CTA buttons */}
                <Box
                  component={motion.div}
                  variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.4}
                    sx={{ pt: 0.5, width: { xs: '100%', sm: 'fit-content' } }}
                  >
                    <Box
                      component={motion.div}
                      whileHover={reduceMotion ? undefined : { scale: 1.04, y: -3 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Button
                        href="#"
                        variant="contained"
                        size="large"
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          minWidth: 160,
                          px: 2.8,
                          py: 1.3,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: 15,
                          bgcolor: '#0f2a5f',
                          color: '#fff',
                          boxShadow: '0 4px 18px rgba(15,42,95,0.28)',
                          '&:hover': {
                            bgcolor: '#183870',
                            boxShadow: '0 8px 28px rgba(15,42,95,0.36)',
                          },
                        }}
                      >
                        Get Started
                      </Button>
                    </Box>
                    <Box
                      component={motion.div}
                      whileHover={reduceMotion ? undefined : { scale: 1.04, y: -3 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Button
                        href="#"
                        variant="outlined"
                        size="large"
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          minWidth: 148,
                          px: 2.4,
                          py: 1.3,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: 15,
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
                    </Box>
                  </Stack>
                </Box>

                {/* Trust stats */}
                <Box
                  component={motion.div}
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Stack direction="row" spacing={{ xs: 3, md: 4 }} sx={{ pt: 0.5 }}>
                    {[
                      { value: '500+', label: 'Investors trained' },
                      { value: '12+', label: 'PSX workshops' },
                      { value: '95%', label: 'Satisfaction rate' },
                    ].map((stat, i) => (
                      <Box key={i}>
                        <Typography sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 800, color: '#0f2a5f', lineHeight: 1.1 }}>
                          {stat.value}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#5a6e8a', mt: 0.2 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

              </Stack>
            </MotionStagger>
          </MotionReveal>

          {/* RIGHT COLUMN — image */}
          <MotionReveal delay={0.18} amount={0.3} y={32} scale={0.978}>
            <Box sx={{ mt: { xs: 0.5, md: 0 } }}>
              <Box
                component={motion.div}
                whileHover={reduceMotion ? undefined : { y: -8, scale: 1.016 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                style={{ y: reduceMotion ? undefined : parallaxY, opacity: reduceMotion ? undefined : parallaxOpacity }}
                sx={{
                  position: 'relative',
                  width: '100%',
                  minHeight: { xs: 258, sm: 360, md: 460 },
                  borderRadius: { xs: 2.5, md: 3 },
                  overflow: 'hidden',
                  border: '1px solid rgba(180,210,245,0.7)',
                  backgroundImage:
                    'linear-gradient(15deg, rgba(5, 12, 24, 0.66) 0%, rgba(8, 23, 48, 0.2) 52%, rgba(8, 23, 48, 0.08) 100%), url(/herosection.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 42%',
                  boxShadow: '0 22px 48px rgba(16, 43, 94, 0.24), 0 0 0 0px rgba(30, 95, 195, 0)',
                  animation: 'pulseGlow 4s ease-in-out 1.5s infinite',
                  transition: 'box-shadow 0.38s ease',
                  '&:hover': {
                    boxShadow: '0 32px 60px rgba(16, 43, 94, 0.32)',
                  },
                }}
              >
                {/* Corner accents */}
                {[
                  { top: 12, left: 12, borderTop: '2px solid rgba(120,175,240,0.7)', borderLeft: '2px solid rgba(120,175,240,0.7)' },
                  { top: 12, right: 12, borderTop: '2px solid rgba(120,175,240,0.7)', borderRight: '2px solid rgba(120,175,240,0.7)' },
                  { bottom: 12, left: 12, borderBottom: '2px solid rgba(120,175,240,0.7)', borderLeft: '2px solid rgba(120,175,240,0.7)' },
                  { bottom: 12, right: 12, borderBottom: '2px solid rgba(120,175,240,0.7)', borderRight: '2px solid rgba(120,175,240,0.7)' },
                ].map((style, i) => (
                  <Box
                    key={i}
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    sx={{
                      position: 'absolute',
                      width: 20,
                      height: 20,
                      borderRadius: 0,
                      ...style,
                    }}
                  />
                ))}

                {/* Bottom overlay label */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    px: { xs: 2, md: 2.5 },
                    py: { xs: 1.5, md: 2 },
                    background: 'linear-gradient(to top, rgba(5,14,36,0.82) 0%, transparent 100%)',
                  }}
                >
                  <Typography sx={{ fontSize: { xs: 13, md: 14.5 }, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
                    PSX Training Session
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 11, md: 12 }, color: 'rgba(180,210,255,0.72)', mt: 0.3 }}>
                    Conducted by Webict Capital
                  </Typography>
                </Box>
              </Box>

              <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Typography sx={{ mt: 1.5, fontSize: 12, color: '#4a5e80', lineHeight: 1.5 }}>
                  Group photo from a PSX training session conducted by Webict Capital.
                </Typography>
              </Box>
            </Box>
          </MotionReveal>
        </Box>
      </Container>
    </Box>
  )
}