import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import NorthEastIcon from '@mui/icons-material/NorthEast'
import { Box, Button, Container, InputBase, Stack, Typography } from '@mui/material'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { MotionReveal, MotionStagger } from '../animations/MotionReveal'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPING_WORDS = ['Learn.', 'Invest.', 'Lead.']

const STATS = [
  { value: '500+', label: 'Investors trained' },
  { value: '12+',  label: 'PSX workshops'     },
  { value: '95%',  label: 'Satisfaction rate' },
]

const GLOSSARY_MOCK = [
  { term: 'P/E Ratio',      def: 'Price-to-earnings ratio used to value a company relative to its earnings.' },
  { term: 'Dividend Yield', def: 'Annual dividend payment expressed as a percentage of share price.' },
  { term: 'Market Cap',     def: "Total market value of a company's outstanding shares." },
  { term: 'Bull Market',    def: 'A market trend characterised by rising prices and investor confidence.' },
  { term: 'Liquidity',      def: 'The ease with which an asset can be converted to cash without impacting price.' },
]

const DATA_MOCK = [
  { ticker: 'OGDC',  name: 'Oil & Gas Dev. Co.', price: '158.40',   change: '+2.3%', up: true  },
  { ticker: 'HBL',   name: 'Habib Bank Ltd',     price: '182.75',   change: '-0.8%', up: false },
  { ticker: 'LUCK',  name: 'Lucky Cement',        price: '1,024.50', change: '+1.1%', up: true  },
  { ticker: 'PSO',   name: 'Pakistan State Oil',  price: '312.90',   change: '+0.5%', up: true  },
  { ticker: 'ENGRO', name: 'Engro Corporation',   price: '286.00',   change: '-1.4%', up: false },
]

// ─── Motion variants ──────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
}

const fadeLeft = {
  hidden:  { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
}

const fadeRight = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
}

const rowVariants = {
  hidden:  { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.36, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

// ─── Typing headline ──────────────────────────────────────────────────────────

function TypingHeadline() {
  const [displayed, setDisplayed] = useState('')
  const [wordIdx,   setWordIdx]   = useState(0)
  const [charIdx,   setCharIdx]   = useState(0)
  const [deleting,  setDeleting]  = useState(false)
  const [done,      setDone]      = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) { setDisplayed('Learn. Invest. Lead.'); setDone(true); return }
    if (done) return
    const fullText   = TYPING_WORDS.slice(0, wordIdx + 1).join(' ')
    const isLastWord = wordIdx === TYPING_WORDS.length - 1
    if (!deleting) {
      if (charIdx < fullText.length) {
        const t = setTimeout(() => { setDisplayed(fullText.slice(0, charIdx + 1)); setCharIdx(c => c + 1) }, charIdx === 0 ? 280 : 58)
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
    setDeleting(false); setWordIdx(i => i + 1); setCharIdx(displayed.length)
  }, [charIdx, deleting, displayed, done, wordIdx, reduce])

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.2em', flexWrap: 'wrap' }}>
      <AnimatePresence mode="popLayout">
        {displayed.split(' ').filter(Boolean).map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'inline-block' }}
          >
            {word}{' '}
          </motion.span>
        ))}
      </AnimatePresence>
      {!done && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: { xs: '2px', md: '3px' },
            height: { xs: '1.6rem', md: '3.2rem' },
            bgcolor: '#0a2463',
            ml: '1px',
            verticalAlign: 'middle',
            borderRadius: '1px',
            animation: 'blink 1s step-end infinite',
            '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
          }}
        />
      )}
    </Box>
  )
}

// ── Animated stat counter ─────────────────────────────────────────────────────

function AnimatedStatValue({ value, triggered }: { value: string; triggered: boolean }) {
  const reduce       = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const numericValue = Number.parseFloat(value.replace(/[^\d.]/g, '')) || 0
  const suffix       = value.replace(/[\d.]/g, '')

  useEffect(() => {
    if (!triggered) return
    if (reduce) { setDisplay(numericValue); return }
    let frame = 0
    const duration = 1400
    const start = performance.now()
    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(numericValue * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [triggered, numericValue, reduce])

  const shown = Number.isInteger(numericValue) ? Math.round(display) : Number(display.toFixed(1))
  return <>{shown}{suffix}</>
}

// ── Glossary mock ─────────────────────────────────────────────────────────────

function GlossaryMock({ animate }: { animate: boolean }) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 1.2, pb: 0.6, borderBottom: '1px solid #e2eaf5' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#080e1a', letterSpacing: '-0.01em' }}>
          Glossary
        </Typography>
      </Box>

      {/* Letter strip */}
      <Box sx={{ px: 1.8, py: 0.9, display: 'flex', gap: 0.35, flexWrap: 'wrap', borderBottom: '1px solid #e2eaf5' }}>
        {letters.map((letter, index) => {
          const active = index === 0
          return (
            <Box
              key={letter}
              sx={{
                width: 13,
                height: 13,
                border: '1px solid',
                borderColor: active ? '#0a2463' : '#dde7f4',
                bgcolor: active ? '#0a2463' : '#ffffff',
                color: active ? '#ffffff' : '#8097b0',
                fontSize: 7.5,
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                lineHeight: '11px',
                textAlign: 'center',
                borderRadius: '2px',
              }}
            >
              {letter}
            </Box>
          )
        })}
      </Box>

      {/* Terms */}
      <Box sx={{ flex: 1, overflow: 'hidden', px: 1.2, pt: 0.8, pb: 0.8 }}>
        {GLOSSARY_MOCK.map((item, i) => (
          <motion.div key={i} custom={i} variants={rowVariants} initial="hidden" animate={animate ? 'visible' : 'hidden'}>
            <Box
              sx={{
                border: '1px solid #e2eaf5',
                borderRadius: '4px',
                bgcolor: '#ffffff',
                px: 0.9,
                py: 0.55,
                mb: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#080e1a', fontFamily: '"Playfair Display", serif' }}>
                  {item.term}
                </Typography>
                <Box sx={{ color: '#0a2463', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>+</Box>
              </Box>
              <Typography sx={{ fontSize: 8.2, color: '#4a5e78', lineHeight: 1.45, mt: 0.35 }}>
                {item.def}
              </Typography>
            </Box>
          </motion.div>
        ))}
      </Box>
    </Box>
  )
}

// ── Data mock ─────────────────────────────────────────────────────────────────

function DataMock({ animate }: { animate: boolean }) {
  const mono = '"Playfair Display", serif'

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
      {/* Tabs */}
      <Box sx={{ px: 1.2, pt: 0.7, pb: 0.5, display: 'flex', gap: 0.4, borderBottom: '1px solid #e2eaf5' }}>
        {['Fri 18 Apr', 'Thu 17 Apr', 'Wed 16 Apr'].map((d, idx) => (
          <Box
            key={d}
            sx={{
              px: 0.65,
              py: 0.3,
              borderRadius: '3px',
              fontSize: 7,
              fontFamily: mono,
              color: idx === 0 ? '#0a2463' : '#8097b0',
              bgcolor: idx === 0 ? '#f0f4fb' : 'transparent',
              border: '1px solid',
              borderColor: idx === 0 ? '#c8d6ec' : 'transparent',
            }}
          >
            {d}
          </Box>
        ))}
      </Box>

      {/* Stat cards */}
      <Box sx={{ px: 1.2, pt: 0.65, pb: 0.6, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.4 }}>
        {[['KSE 100', '173,939', false], ['Open', '169,911', false], ['Change', '+4,027', true], ['Volume', '1,440M', false]].map(([label, value, green]) => (
          <Box key={label as string} sx={{ border: '1px solid #e2eaf5', borderRadius: '3px', bgcolor: '#fafbfd', px: 0.5, py: 0.4 }}>
            <Typography sx={{ fontSize: 6.5, color: '#8097b0', textTransform: 'uppercase', fontFamily: mono, letterSpacing: '0.06em' }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 8.5, fontWeight: 700, fontFamily: mono, color: green ? '#1a6640' : '#080e1a', mt: 0.1 }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Filter bar */}
      <Box sx={{ px: 1.2, pb: 0.5, display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 0.4 }}>
        {['Search symbol or company…', 'Movement: All'].map((ph) => (
          <Box key={ph} sx={{ border: '1px solid #dde7f4', borderRadius: '3px', bgcolor: '#ffffff', px: 0.7, py: 0.32 }}>
            <Typography sx={{ fontSize: 7.2, color: '#8097b0', fontFamily: mono }}>{ph}</Typography>
          </Box>
        ))}
      </Box>

      {/* Table header */}
      <Box sx={{ px: 1.2, py: 0.45, borderTop: '1px solid #e2eaf5', borderBottom: '1px solid #e2eaf5', bgcolor: '#fafbfd', display: 'grid', gridTemplateColumns: '1.1fr 1.8fr 1fr 0.9fr', gap: 0.5 }}>
        {['Symbol', 'Company', 'Last', 'Chg'].map((h) => (
          <Typography key={h} sx={{ fontSize: 6.8, fontWeight: 700, color: '#4a5e78', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: mono }}>
            {h}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      <Box sx={{ flex: 1, overflow: 'hidden', px: 1.2, py: 0.4 }}>
        {DATA_MOCK.map((row, i) => (
          <motion.div key={i} custom={i} variants={rowVariants} initial="hidden" animate={animate ? 'visible' : 'hidden'}>
            <Box sx={{
              py: 0.62,
              borderBottom: i < DATA_MOCK.length - 1 ? '1px solid #e2eaf5' : 'none',
              display: 'grid',
              gridTemplateColumns: '1.1fr 1.8fr 1fr 0.9fr',
              gap: 0.5,
              alignItems: 'center',
            }}>
              <Typography sx={{ fontSize: 8.2, fontWeight: 700, color: '#0a2463', fontFamily: mono }}>{row.ticker}</Typography>
              <Typography sx={{ fontSize: 8, color: '#4a5e78', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</Typography>
              <Typography sx={{ fontSize: 8.2, fontWeight: 600, color: '#080e1a', fontFamily: mono }}>{row.price}</Typography>
              <Typography sx={{ fontSize: 8, fontWeight: 700, color: row.up ? '#1a6640' : '#b91c1c', fontFamily: mono }}>{row.change}</Typography>
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 1.2, py: 0.45, borderTop: '1px solid #e2eaf5', display: 'flex', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 6.8, color: '#8097b0', fontFamily: mono }}>Rows per page: 25</Typography>
        <Typography sx={{ fontSize: 6.8, color: '#8097b0', fontFamily: mono }}>1–25 of 542</Typography>
      </Box>
    </Box>
  )
}

// ── Sneak peek window ─────────────────────────────────────────────────────────

function SneakPeekWindow({
  eyebrow, title, caption, href, MockContent,
}: {
  eyebrow: string
  title: string
  caption: string
  href: string
  MockContent: ComponentType<{ animate: boolean }>
}) {
  const reduce  = useReducedMotion()
  const ref     = useRef<HTMLDivElement>(null)
  const inView  = useInView(ref, { once: true, margin: '-60px' })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.7fr' },
          border: '1px solid #e2eaf5',
          borderRadius: 1.5,
          overflow: 'hidden',
          bgcolor: '#ffffff',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
          '&:hover': { boxShadow: '0 8px 32px rgba(10,36,99,0.1)', borderColor: '#0a2463' },
        }}
      >
        {/* Left: info panel */}
        <Box sx={{
          px: { xs: 2.5, md: 3.2 },
          py: { xs: 2.5, md: 3.2 },
          borderRight: { xs: 'none', md: '1px solid #e2eaf5' },
          borderBottom: { xs: '1px solid #e2eaf5', md: 'none' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 3,
          bgcolor: '#fafbfd',
        }}>
          <Box>
            <Typography
              sx={{
                display: 'block',
                fontSize: 10,
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#0a2463',
                mb: 1.4,
              }}
            >
              {eyebrow}
            </Typography>
            <Typography sx={{ fontSize: { xs: 18, md: 20 }, fontWeight: 700, color: '#080e1a', lineHeight: 1.2, mb: 1, letterSpacing: '-0.02em' }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: '#4a5e78', lineHeight: 1.7 }}>
              {caption}
            </Typography>
          </Box>

          <motion.div style={{ alignSelf: 'flex-start' }}>
            <Button
              href={href}
              size="small"
              endIcon={
                <motion.div
                  animate={hovered ? { x: 2, y: -2 } : { x: 0, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'flex' }}
                >
                  <NorthEastIcon sx={{ fontSize: 13 }} />
                </motion.div>
              }
              sx={{
                textTransform: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                px: 1.8,
                py: 0.75,
                color: '#080e1a',
                border: '1px solid #e2eaf5',
                borderRadius: 1,
                bgcolor: '#ffffff',
                minWidth: 0,
                '&:hover': { bgcolor: '#080e1a', borderColor: '#080e1a', color: '#ffffff' },
                transition: 'all 0.2s ease',
              }}
            >
              View Page
            </Button>
          </motion.div>
        </Box>

        {/* Right: mock browser */}
        <Box sx={{ position: 'relative', bgcolor: '#ffffff', minHeight: { xs: 220, md: 260 } }}>
          {/* Window chrome */}
          <Box sx={{
            height: 28,
            bgcolor: '#f5f6f8',
            borderBottom: '1px solid #e2eaf5',
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            gap: 0.6,
          }}>
            {['#fc5f57', '#fdbc2c', '#27c840'].map((c, i) => (
              <Box key={i} sx={{ width: 7.5, height: 7.5, borderRadius: '50%', bgcolor: c, opacity: 0.7 }} />
            ))}
            <Box sx={{
              flex: 1,
              mx: 1.5,
              height: 14,
              bgcolor: '#ebebed',
              borderRadius: 0.5,
              display: 'flex',
              alignItems: 'center',
              px: 1,
            }}>
              <Typography sx={{ fontSize: 7.5, color: '#9ca3af', fontFamily: '"Playfair Display", serif', letterSpacing: '0.02em' }}>
                webictcapital.com{href}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ height: 'calc(100% - 28px)', overflow: 'hidden' }}>
            <MockContent animate={inView} />
          </Box>

          {/* Shimmer on hover */}
          <AnimatePresence>
            {hovered && !reduce && (
              <motion.div
                key="shimmer"
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(105deg, transparent 30%, rgba(10,36,99,0.06) 50%, transparent 70%)',
                  zIndex: 2,
                }}
              />
            )}
          </AnimatePresence>

          {/* Bottom fade */}
          <Box sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 44,
            background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />
        </Box>
      </Box>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HomePage() {
  const reduce  = useReducedMotion()
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const heroOp    = useTransform(scrollYProgress, [0, 0.6], [1, 0.4])

  const statsRef    = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })
  const lineScaleX  = useSpring(statsInView ? 1 : 0, { stiffness: 80, damping: 20 })

  const philRef    = useRef<HTMLDivElement>(null)
  const philInView = useInView(philRef, { once: true, margin: '-60px' })

  const newsRef    = useRef<HTMLDivElement>(null)
  const newsInView = useInView(newsRef, { once: true, margin: '-60px' })

  return (
    <>
      {/* ═══ HERO ════════════════════════════════════════════════════════════ */}
      <Box
        ref={heroRef}
        component="section"
        sx={{
          '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
          mt: 0,
          pt: { xs: 'calc(64px + 2.5rem)', md: 'calc(72px + 4.5rem)' },
          pb: { xs: 8, md: 12 },
          bgcolor: '#ffffff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: '1340px !important', px: { xs: 2.5, md: 5 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,560px)' },
            alignItems: 'center',
            gap: { xs: 6, md: 10 },
          }}>

            {/* ── Left column ── */}
            <MotionReveal amount={0.25}>
              <MotionStagger delayChildren={0.06} staggerChildren={0.12} amount={0.3}>
                <Stack spacing={{ xs: 3, md: 3.8 }} sx={{ maxWidth: 620 }}>
                  {/* Headline */}
                  <Box component={motion.div} variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>

                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2.4rem', sm: '2.9rem', md: '4.2rem' },
                        lineHeight: { xs: 1.08, md: 1.03 },
                        letterSpacing: { xs: '-0.034em', md: '-0.04em' },
                        fontWeight: 900,
                        color: '#080e1a',
                        minHeight: { xs: '3.4rem', md: '5rem' },
                      }}
                    >
                      <TypingHeadline />
                    </Typography>
                  </Box>

                  {/* Quote */}
                  <Box component={motion.div} variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                    <Typography
                      sx={{
                        maxWidth: 560,
                        fontSize: { xs: 15.2, sm: 16.5, md: 18.5 },
                        lineHeight: { xs: 1.62, md: 1.56 },
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
                            left: 0, right: 0,
                            bottom: { xs: 1, md: 2 },
                            height: { xs: 10, md: 14 },
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '100% 100%',
                            pointerEvents: 'none',
                            transformOrigin: 'left center',
                            animation: 'zigLineDraw 820ms cubic-bezier(0.22, 1, 0.5, 1) 140ms both',
                            backgroundImage:
                              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 16' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='ink' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%230a2463' stop-opacity='1'/%3E%3Cstop offset='72%25' stop-color='%231f5fbf' stop-opacity='0.95'/%3E%3Cstop offset='100%25' stop-color='%231f5fbf' stop-opacity='0.15'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M4 10 L28 8 L52 11 L78 8.5 L104 10.8 L130 8.4 L156 10.6 L184 8.3 L212 10.2 L242 8.6 L270 10.1 L296 9' fill='none' stroke='url(%23ink)' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                          },
                        }}
                      >
                        Education is where confident investing begins.
                      </Box>
                      {'"'}
                    </Typography>

                    {/* Author */}
                    <motion.div
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 36, height: 36, borderRadius: '50%',
                          bgcolor: '#080e1a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                          letterSpacing: '0.04em', fontFamily: '"Playfair Display", serif',
                        }}>
                          AS
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#080e1a', lineHeight: 1.3 }}>
                            Asaad Sohail
                          </Typography>
                          <Typography sx={{ fontSize: 11.5, color: '#8097b0', lineHeight: 1.4 }}>
                            Founder, Webict Capital
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  </Box>

                  {/* CTA */}
                  <Box component={motion.div} variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ pt: 0.4, width: { xs: '100%', sm: 'fit-content' } }}>
                      <Box
                        component={motion.div}
                        whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Button
                          component={RouterLink}
                          to="/about#contact"
                          variant="contained"
                          disableElevation
                          size="large"
                          sx={{
                            width: { xs: '100%', sm: 'auto' },
                            minWidth: 140,
                            px: 3,
                            py: 1.35,
                            borderRadius: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 14.5,
                            letterSpacing: '0.01em',
                            bgcolor: '#080e1a',
                            color: '#ffffff',
                            '&:hover': { bgcolor: '#0a2463' },
                            transition: 'background-color 0.22s ease',
                          }}
                        >
                          Contact Us
                        </Button>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Stats */}
                  <Box ref={statsRef} component={motion.div} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                    <motion.div style={{ height: 1, backgroundColor: '#e2eaf5', originX: 0, scaleX: lineScaleX, marginTop: 8, marginBottom: 20 }} />
                    <Box sx={{ display: 'flex' }}>
                      {STATS.map((s, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 14 }}
                          animate={statsInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ delay: 0.1 + i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Box sx={{
                            pr: { xs: 3.5, md: 5 },
                            mr: { xs: 3.5, md: 5 },
                            borderRight: i < STATS.length - 1 ? '1px solid #e2eaf5' : 'none',
                          }}>
                            <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 900, color: '#080e1a', lineHeight: 1, letterSpacing: '-0.03em' }}>
                              <AnimatedStatValue value={s.value} triggered={statsInView} />
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#8097b0', mt: 0.5, fontWeight: 500, letterSpacing: '0.03em', fontFamily: '"Playfair Display", serif' }}>
                              {s.label}
                            </Typography>
                          </Box>
                        </motion.div>
                      ))}
                    </Box>
                  </Box>

                </Stack>
              </MotionStagger>
            </MotionReveal>

            {/* ── Right column: hero image ── */}
            <Box
              component={motion.div}
              style={{ y: reduce ? undefined : parallaxY, opacity: reduce ? undefined : heroOp }}
              sx={{
                position: 'relative',
                borderRadius: 1.5,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.1)',
                backgroundImage:
                  'linear-gradient(10deg, rgba(4,10,24,0.6) 0%, rgba(10,24,56,0.12) 55%, rgba(10,24,56,0.03) 100%),' +
                  'url(/herosection.webp)',
                backgroundSize: 'cover',
                backgroundPosition: 'center 42%',
                minHeight: { xs: 270, sm: 380, md: 480 },
              }}
            >
              <Box sx={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                px: { xs: 2.2, md: 2.8 },
                py: { xs: 1.8, md: 2.4 },
                background: 'linear-gradient(to top, rgba(3,9,26,0.82) 0%, transparent 100%)',
              }}>
                <Typography sx={{ fontSize: { xs: 13.5, md: 15 }, color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>
                  PSX Training Session
                </Typography>
                <Typography sx={{ fontSize: { xs: 11, md: 12 }, color: 'rgba(200,218,255,0.6)', mt: 0.3 }}>
                  Conducted by Webict Capital
                </Typography>
              </Box>
            </Box>

            {/* <Typography sx={{ mt: 1, fontSize: 11, color: '#8097b0', lineHeight: 1.5, letterSpacing: '0.01em', fontFamily: '"Playfair Display", serif' }}>
              Group photo from a PSX training session conducted by Webict Capital.
            </Typography> */}
          </Box>
        </Container>
      </Box>

      {/* ═══ FEATURED TOOLS ════════════════════════════════════════════════ */}
      <Container maxWidth="xl" sx={{ px: { xs: 2.5, md: 5 }, pb: { xs: 8, md: 12 } }}>
        <MotionReveal amount={0.2} y={20}>
          <Box>
            {/* Section header */}
            <Box sx={{ borderTop: '1px solid #e2eaf5', pt: 5, mb: 5 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  fontFamily: '"Playfair Display", serif',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#0a2463',
                  mb: 1,
                }}
              >
                Platform
              </Typography>
              <Box sx={{
                display: 'flex',
                // alignItems: 'flex-start',
                // justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
              }}>
                <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, color: '#080e1a', letterSpacing: '-0.025em'}}>
                  Featured Tools
                </Typography>
                {/* <Typography sx={{ fontSize: 13, color: '#8097b0', maxWidth: 320, textAlign: { xs: 'left', sm: 'right' }, fontFamily: '"Playfair Display", serif' }}>
                  A quick preview of two key experiences on the platform.
                </Typography> */}
              </Box>
            </Box>

            <Stack spacing={{ xs: 1.5, md: 2 }}>
              <SneakPeekWindow
                eyebrow="Market Intelligence"
                title="PSX Data"
                caption="Daily snapshots of market movement with quick sorting and filtering across listed companies."
                href="/data"
                MockContent={DataMock}
              />
              <SneakPeekWindow
                eyebrow="Knowledge Base"
                title="Glossary"
                caption="Clear investing definitions designed for fast learning and reliable reference."
                href="/glossary"
                MockContent={GlossaryMock}
              />
            </Stack>
          </Box>
        </MotionReveal>
      </Container>

      {/* ═══ PHILOSOPHY ════════════════════════════════════════════════════ */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, md: 5 } }}>
          <motion.div ref={philRef} variants={fadeUp} initial="hidden" animate={philInView ? 'visible' : 'hidden'}>
            <Box sx={{
              borderRadius: 1.5,
              border: '1px solid #e2eaf5',
              bgcolor: '#fafbfd',
              p: { xs: 3.5, md: 6 },
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Top accent bar */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={philInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: 0.2, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', top: 0, left: '25%', right: '25%',
                  height: 2, backgroundColor: '#0a2463',
                  borderRadius: '0 0 2px 2px', transformOrigin: 'center',
                }}
              />

              <motion.div variants={fadeUp} initial="hidden" animate={philInView ? 'visible' : 'hidden'} transition={{ delay: 0.1 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '1.7rem', sm: '2rem', md: '2.8rem' },
                    lineHeight: { xs: 1.22, md: 1.14 },
                    letterSpacing: '-0.025em',
                    fontWeight: 800,
                    mb: 2,
                    color: '#080e1a',
                  }}
                >
                  Investing in companies and the{' '}
                  <Box component="span" sx={{ fontStyle: 'italic', fontFamily: '"Georgia", serif', fontWeight: 700, color: '#0a2463' }}>
                    people building them
                  </Box>
                </Typography>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate={philInView ? 'visible' : 'hidden'} transition={{ delay: 0.22 }}>
                <Typography sx={{ maxWidth: 540, mx: 'auto', color: '#4a5e78', fontSize: { xs: 14.5, md: 16 }, lineHeight: 1.76 }}>
                  We care about and support founders as people, not just CEOs or business leaders. Building a strong company requires resilient leadership and disciplined support.
                </Typography>
              </motion.div>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* ═══ NEWSLETTER ════════════════════════════════════════════════════ */}
      <Container maxWidth="xl" sx={{ mb: { xs: 8, md: 14 }, px: { xs: 2.5, md: 5 } }}>
        <motion.div ref={newsRef} variants={fadeUp} initial="hidden" animate={newsInView ? 'visible' : 'hidden'}>
          <Box sx={{
            bgcolor: '#080e1a',
            borderRadius: 1.5,
            border: '1px solid rgba(255,255,255,0.06)',
            px: { xs: 3, md: 9 },
            py: { xs: 5, md: 8 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 4, md: 10 },
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Left accent bar */}
            <motion.div
              initial={{ scaleY: 0, originY: 0 }}
              animate={newsInView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', top: 0, left: 0, width: 2, height: '100%', backgroundColor: '#0a2463' }}
            />

            {/* Left: headline */}
            <motion.div variants={fadeLeft} initial="hidden" animate={newsInView ? 'visible' : 'hidden'} transition={{ delay: 0.15 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                  {/* <Box sx={{ width: 14, height: 1.5, bgcolor: '#0a2463' }} /> */}
                  {/* <Typography sx={{ fontSize: 10, fontFamily: '"Playfair Display", serif', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#0a2463' }}>
                    Newsletter
                  </Typography> */}
                </Box>/
                <Typography
                  variant="h2"
                  sx={{
                    color: '#ffffff',
                    fontSize: { xs: '1.8rem', sm: '2.1rem', md: '3rem' },
                    lineHeight: { xs: 1.2, md: 1.08 },
                    letterSpacing: '-0.028em',
                    fontWeight: 900,
                  }}
                >
                  Stay in touch with{' '}
                  <Box component="span" sx={{ fontStyle: 'italic', fontFamily: '"Georgia", serif', color: 'rgba(150,185,255,0.8)' }}>
                    Webict Capital
                  </Box>
                </Typography>
              </Box>
            </motion.div>

            {/* Right: form */}
            <motion.div variants={fadeRight} initial="hidden" animate={newsInView ? 'visible' : 'hidden'} transition={{ delay: 0.28 }}>
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.42)', mb: 3, lineHeight: 1.76, fontSize: { xs: 14, md: 15.5 } }}>
                  Sign up for our newsletter to stay up to date on news from Webict Capital, and our portfolio companies.
                </Typography>

                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: 'rgba(255,255,255,0.04)',
                  transition: 'border-color 0.22s ease',
                  '&:focus-within': { borderColor: '#0a2463' },
                }}>
                  <InputBase
                    fullWidth
                    placeholder="Enter your email address"
                    inputProps={{ 'aria-label': 'Email address' }}
                    sx={{
                      px: 2, py: 1.4, color: '#fff', fontSize: 14,
                      '& input::placeholder': { color: 'rgba(255,255,255,0.22)', opacity: 1 },
                    }}
                  />
                  <Box
                    component={motion.div}
                    whileHover={reduce ? undefined : { scale: 1.05 }}
                    whileTap={reduce ? undefined : { scale: 0.93 }}
                    style={{ display: 'flex' }}
                  >
                    <Button sx={{
                      minWidth: { xs: '100%', sm: 52 },
                      width: { xs: '100%', sm: 'auto' },
                      height: { xs: 48, sm: 'auto' },
                      borderRadius: 0,
                      bgcolor: '#0a2463',
                      color: '#fff',
                      flexShrink: 0,
                      '&:hover': { bgcolor: '#0d2d78' },
                      transition: 'background-color 0.2s ease',
                    }}>
                      <motion.div
                        whileHover={reduce ? undefined : { x: 3 }}
                        transition={{ duration: 0.18 }}
                        style={{ display: 'flex' }}
                      >
                        <ArrowForwardIcon sx={{ fontSize: 16 }} />
                      </motion.div>
                    </Button>
                  </Box>
                </Box>

                <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.18)', fontSize: 11, lineHeight: 1.65, fontFamily: '"Playfair Display", serif' }}>
                  You may unsubscribe at any time. We respect your privacy.
                </Typography>
              </Box>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </>
  )
}