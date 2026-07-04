import { useRef, useState, type FormEvent } from 'react'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import { Box, Button, Container, InputBase, Stack, Typography } from '@mui/material'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'
import { Link as RouterLink } from 'react-router-dom'
import { MotionReveal } from '../animations/MotionReveal'

const WEB3FORMS_ACCESS_KEY = '6f47bd12-e704-4f13-a5ae-63255ad5bfcd'

const STATS = [
  { value: '300+', label: 'Investors trained', icon: GroupsOutlinedIcon },
  { value: '12+', label: 'PSX workshops', icon: SchoolOutlinedIcon },
  { value: '95%', label: 'Satisfaction rate', icon: BarChartRoundedIcon },
  // { value: '7+', label: 'Years of impact', icon: StarBorderRoundedIcon },
]

const PRODUCTS = [
  {
    title: 'Markets / PSX Overview',
    body: 'Real-time market data, heatmaps, movers, and advanced dashboards to track opportunities.',
    action: 'Explore Markets',
    href: '/data',
    preview: 'markets',
  },
  {
    title: 'Glossary',
    body: 'Clear, reliable definitions of key investing terms across PSX, finance, and portfolio management.',
    action: 'Explore Glossary',
    href: '/glossary',
    preview: 'glossary',
  },
  {
    title: 'SIP Calculator',
    body: 'Plan your investments, project returns, and visualize long-term wealth through compounding.',
    action: 'Open Calculator',
    href: '/sip-calculator',
    preview: 'sip',
  },
] as const

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] as const } },
}

function AnimatedCursor() {
  const reduceMotion = useReducedMotion()
  const enabled = !reduceMotion && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  const pointerX = useMotionValue(-100)
  const pointerY = useMotionValue(-100)
  const springX = useSpring(pointerX, { stiffness: 360, damping: 34 })
  const springY = useSpring(pointerY, { stiffness: 360, damping: 34 })


  if (!enabled) return null

  return (
    <>
      <Box
        component={motion.div}
        aria-hidden
        style={{ x: springX, y: springY }}
        // animate={{ scale: active ? 1.85 : 1, opacity: active ? 0.18 : 0.28 }}
        transition={{ duration: 0.18 }}
        sx={{
          position: 'fixed',
          left: -18,
          top: -18,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid #143baf',
          pointerEvents: 'none',
          zIndex: 2000,
          mixBlendMode: 'multiply',
        }}
      />
      <Box
        component={motion.div}
        aria-hidden
        style={{ x: pointerX, y: pointerY }}
        sx={{
          position: 'fixed',
          left: -3,
          top: -3,
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: '#143baf',
          pointerEvents: 'none',
          zIndex: 2001,
        }}
      />
    </>
  )
}

function StatGrid() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 2.2, md: 0 } }}>
      {STATS.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Box
            key={stat.label}
            component={motion.div}
            variants={fadeUp}
            // whileHover={{ y: -3 }}
            sx={{
              pr: { md: 4 },
              pl: { md: index === 0 ? 0 : 4 },
              borderLeft: { md: index === 0 ? 'none' : '1px solid #dce6f4' },
            }}
          >
            <Icon sx={{ color: '#6b7fa3', fontSize: 28, mb: 1.4 }} />
            <Typography sx={{ color: '#071329', fontSize: { xs: 26, md: 30 }, fontWeight: 900, lineHeight: 1 }}>
              {stat.value}
            </Typography>
            <Typography sx={{ mt: 1, color: '#435981', fontSize: 13 }}>
              {stat.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

function MarketGlance() {
  return (
    <MotionReveal delay={0.08}>
      <Box
        sx={{
          border: '1px solid #dce6f4',
          borderRadius: '7px',
          bgcolor: '#ffffff',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.3fr repeat(4, 1fr)' },
          alignItems: 'center',
          overflow: 'hidden',
          boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
        }}
      >
       
       
      </Box>
    </MotionReveal>
  )
}

function MarketPreview() {
  const cells = ['TPLP', 'SBP', 'CNERGY', 'BNLK', 'TRG', 'WTL', 'BECO', 'KEL', 'DCL', 'ABL', 'TELE', 'PAEL']
  return (
    <Box sx={{ height: 206, border: '1px solid #dce6f4', borderRadius: '5px', overflow: 'hidden', bgcolor: '#f9fbff', p: 1.2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridAutoRows: 45, gap: 0.55, height: '100%' }}>
        {cells.map((cell, index) => {
          const positive = !['BNLK', 'WTL', 'KEL'].includes(cell)
          const big = index < 2
          return (
            <Box
              key={cell}
              component={motion.div}
              // whileHover={{ scale: 1.04 }}
              sx={{
                gridColumn: big ? 'span 2' : 'span 1',
                gridRow: big ? 'span 2' : 'span 1',
                bgcolor: positive ? `rgba(31,139,85,${big ? 0.78 : 0.35})` : `rgba(199,47,67,${big ? 0.8 : 0.35})`,
                color: big || !positive ? '#ffffff' : '#071329',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--wc-font-data)',
                fontSize: big ? 13 : 9,
                fontWeight: 900,
              }}
            >
              {cell}
              <Box component="span" sx={{ mt: 0.4, fontSize: big ? 11 : 7, fontWeight: 700 }}>
                {positive ? '+' : '-'}{big ? '1.85' : '0.62'}%
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

function GlossaryPreview() {
  const terms = ['Ability to Pay', 'Abnormal Returns', 'Accelerated depreciation', 'Accommodative Monetary Policy', 'Account Day', 'Account Statement']
  return (
    <Box sx={{ height: 206, border: '1px solid #dce6f4', borderRadius: '5px', overflow: 'hidden', bgcolor: '#ffffff', p: 1.4 }}>
      <Box sx={{ display: 'flex', gap: 0.45, mb: 1.4 }}>
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((letter, index) => (
          <Box
            key={letter}
            sx={{
              width: 18,
              height: 18,
              border: '1px solid #dce6f4',
              borderRadius: '3px',
              bgcolor: index === 0 ? '#071329' : '#ffffff',
              color: index === 0 ? '#ffffff' : '#435981',
              fontSize: 8,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {letter}
          </Box>
        ))}
      </Box>
      <Stack spacing={0.75}>
        {terms.map((term, index) => (
          <Box
            key={term}
            component={motion.div}
            // whileHover={{ x: 3 }}
            sx={{
              height: 22,
              px: 1.2,
              border: '1px solid #dce6f4',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#071329',
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            {term}
            <Box component="span" sx={{ color: '#6b7fa3' }}>{index === 0 ? '⌃' : '⌄'}</Box>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

function SipPreview() {
  return (
    <Box sx={{ height: 206, border: '1px solid #dce6f4', borderRadius: '5px', overflow: 'hidden', bgcolor: '#ffffff', p: 1.6 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1.6 }}>
        {['Rs 12.00 L', 'Rs 18.57 L', 'Rs 27.07 L'].map((value, index) => (
          <Box key={value} sx={{ border: '1px solid #dce6f4', borderRadius: '4px', p: 0.9, bgcolor: index === 1 ? '#f4fbf7' : '#f8fbff' }}>
            <Typography sx={{ color: '#6b7fa3', fontSize: 8 }}>Total {index === 0 ? 'Invested' : index === 1 ? 'Returns' : 'Value'}</Typography>
            <Typography sx={{ mt: 0.3, color: index === 1 ? 'var(--wc-success)' : '#071329', fontFamily: 'var(--wc-font-data)', fontSize: 10, fontWeight: 900 }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '0.9fr 1.2fr', gap: 1.4, height: 118 }}>
        <Stack spacing={1.1}>
          {[78, 54, 86, 62].map((width, index) => (
            <Box key={index}>
              <Box sx={{ width: '100%', height: 4, bgcolor: '#eef4ff', borderRadius: 999 }}>
                <Box sx={{ width: `${width}%`, height: '100%', bgcolor: '#143baf', borderRadius: 999 }} />
              </Box>
            </Box>
          ))}
        </Stack>
        <Box sx={{ position: 'relative', borderLeft: '1px solid #dce6f4', borderBottom: '1px solid #dce6f4' }}>
          <Box
            component="svg"
            viewBox="0 0 160 100"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <motion.path
              d="M4 90 C36 76 58 70 82 52 C106 34 130 24 156 8"
              fill="none"
              stroke="#1f8b55"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <path d="M4 92 C44 84 74 79 102 70 C128 61 144 56 156 50" fill="none" stroke="#143baf" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function ProductCard({ product, index }: { product: (typeof PRODUCTS)[number]; index: number }) {
  const Preview = product.preview === 'markets' ? MarketPreview : product.preview === 'glossary' ? GlossaryPreview : SipPreview
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component={motion.div}
      variants={fadeUp}
      custom={index}
      // whileHover={reduceMotion ? undefined : { y: -8 }}
      transition={{ duration: 0.25 }}
      data-cursor="active"
      sx={{
        border: '1px solid #dce6f4',
        borderRadius: '7px',
        bgcolor: '#ffffff',
        p: 2.2,
        minHeight: 526,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 18px 42px rgba(10,36,99,0.025)',
        overflow: 'hidden',
        position: 'relative',
        // '&:hover': {
        //   borderColor: '#b9c9e4',
        //   boxShadow: '0 26px 54px rgba(10,36,99,0.08)',
        // },
      }}
    >
      <Preview />
      <Typography sx={{ mt: 3, color: '#071329', fontSize: 21, fontWeight: 800 }}>
        {product.title}
      </Typography>
      <Typography sx={{ mt: 1.5, color: '#435981', fontSize: 14.5, lineHeight: 1.75 }}>
        {product.body}
      </Typography>
      <Button
        component={RouterLink}
        to={product.href}
        endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
        sx={{ mt: 'auto', pt: 3, p: 0, color: '#143baf', fontSize: 13.5, fontWeight: 800, alignSelf: 'flex-start', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
      >
        {product.action}
      </Button>
    </Box>
  )
}

function NewsletterBand() {
  const [newsletterResult, setNewsletterResult] = useState('')
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false)

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNewsletterResult('Sending...')
    setIsSubmittingNewsletter(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.append('access_key', WEB3FORMS_ACCESS_KEY)

    try {
      const response = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
      const data = (await response.json()) as { success?: boolean }
      if (data.success) {
        setNewsletterResult('Thanks for subscribing.')
        form.reset()
      } else {
        setNewsletterResult('Something went wrong. Please try again.')
      }
    } catch {
      setNewsletterResult('Something went wrong. Please try again.')
    } finally {
      setIsSubmittingNewsletter(false)
    }
  }

  return (
    <MotionReveal delay={0.12}>
      <Box
        sx={{
          minHeight: { xs: 300, md: 228 },
          borderRadius: '7px',
          bgcolor: '#071329',
          color: '#ffffff',
          overflow: 'hidden',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '0.9fr 1fr' },
          alignItems: 'center',
          gap: { xs: 4, md: 6 },
          px: { xs: 3, sm: 5, md: 9 },
          py: { xs: 4, md: 4.5 },
          boxShadow: '0 18px 36px rgba(7, 19, 41, 0.16)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(105deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 48%, rgba(20,59,175,0.18))',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'relative' }}>
          <Typography sx={{ color: '#90a4c8', fontFamily: 'var(--wc-font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5 }}>
            Stay in touch
          </Typography>
          <Typography variant="h2" sx={{ color: '#ffffff', fontSize: { xs: '2rem', md: '2.85rem' }, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.035em', maxWidth: 455 }}>
            Insights that help you invest with{' '}
            <Box component="span" sx={{ color: '#a8c5ff', fontStyle: 'italic' }}>
              confidence.
            </Box>
          </Typography>
          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 1.75, maxWidth: 410 }}>
            Receive market insights, education updates, and new tools straight to your inbox.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleNewsletterSubmit} sx={{ position: 'relative' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 70px' },
              border: '1px solid rgba(255,255,255,0.32)',
              borderRadius: '5px',
              overflow: 'hidden',
              bgcolor: 'rgba(255,255,255,0.03)',
              '&:focus-within': { borderColor: '#8fb2ff' },
            }}
          >
            <InputBase
              name="email"
              type="email"
              required
              placeholder="Enter your email address"
              inputProps={{ 'aria-label': 'Newsletter email address' }}
              sx={{ minHeight: 64, px: 2.4, color: '#ffffff', fontSize: 14, '& input::placeholder': { color: 'rgba(255,255,255,0.42)', opacity: 1 } }}
            />
            <Button
              type="submit"
              disabled={isSubmittingNewsletter}
              aria-label="Submit newsletter email"
              sx={{ minWidth: 0, height: { xs: 52, sm: 'auto' }, borderRadius: 0, bgcolor: '#2458d7', color: '#ffffff', '&:hover': { bgcolor: '#1b49bd' } }}
            >
              <ArrowForwardIcon sx={{ fontSize: 24 }} />
            </Button>
          </Box>
          {newsletterResult && (
            <Typography sx={{ mt: 1.4, color: 'rgba(255,255,255,0.72)', fontSize: 12 }}>
              {newsletterResult}
            </Typography>
          )}
          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.44)', fontSize: 11.5, lineHeight: 1.6 }}>
            You can unsubscribe at any time. We respect your privacy.
          </Typography>
        </Box>
      </Box>
    </MotionReveal>
  )
}

export function HomePage() {
  const reduceMotion = useReducedMotion()
  const productsRef = useRef<HTMLDivElement>(null)
  const productsInView = useInView(productsRef, { once: true, margin: '-80px' })
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true, margin: '-40px' })

  return (
    <>
      <AnimatedCursor />
      <Box
        component="main"
        sx={{
          pt: { xs: 'var(--wc-page-top-xs)', md: 'var(--wc-page-top-md)' },
          pb: { xs: 'var(--wc-page-bottom-xs)', md: 'var(--wc-page-bottom-md)' },
          bgcolor: '#ffffff',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: '1880px !important', px: { xs: 'var(--wc-page-gutter-xs)', md: 'var(--wc-page-gutter-md)', xl: 'var(--wc-page-gutter-xl)' } }}>
          <Stack spacing={{ xs: 7, md: 9 }}>
            <Box
              ref={heroRef}
              component={motion.section}
              initial="hidden"
              animate={heroInView ? 'visible' : 'hidden'}
              variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.94fr) minmax(520px, 0.86fr)' },
                gap: { xs: 5, lg: 8 },
                alignItems: 'center',
              }}
            >
              <Stack spacing={{ xs: 3.4, md: 4.5 }}>
                <Box component={motion.div} variants={fadeUp}>
                </Box>

                <Box component={motion.div} variants={fadeUp}>
                  <Typography
                    variant="h1"
                    sx={{
                      color: 'var(--wc-text-primary)',
                      fontSize: { xs: '2.35rem', sm: '2.9rem', md: '3.45rem' },
                      lineHeight: 0.95,
                      fontWeight: 700,
                      letterSpacing: '-0.045em',
                    }}
                  >
                    Markets reward those
                    <br />
                    who see{' '}
                    <Box component="span" sx={{ color: 'var(--wc-primary)' }}>
                      beyond the obvious
                    </Box>
                    .
                  </Typography>
                  <Typography sx={{ mt: 3, color: 'var(--wc-text-secondary)', fontSize: { xs: 15.5, md: 16 }, lineHeight: 1.75, maxWidth: 690 }}>
                    Webict Capital is a research-driven investing community for the Pakistan Stock Exchange.
                    We help investors move past noise, develop independent thinking, and transform raw information
                    into actionable market intelligence.
                  </Typography>
                </Box>

                <Stack component={motion.div} variants={fadeUp} direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                
                </Stack>

                <Box component={motion.div} variants={fadeUp}>
                  <StatGrid />
                </Box>
              </Stack>

              <Box
                sx={{
                  position: 'relative',
                  // minHeight: { xs: 360, md: 640 },
                  borderRadius: '17px',
                  overflow: 'hidden',
                  border: '1px solid #dce6f4',
                  boxShadow: '0 26px 54px rgba(10,36,99,0.12)',
                }}
              >
                <Box
                  component="img"
                  src="/herosection.webp"
                  alt=""
                  aria-hidden
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 42%',
                  }}
                />
              </Box>
            </Box>

            <Box component={motion.section} ref={productsRef}>
              <MotionReveal>
                <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: { xs: 3.5, md: 4.5 } }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontFamily: 'var(--wc-font-body)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--wc-primary)',
                      mb: 1.5,
                    }}
                  >
                    Our Approach
                  </Typography>
                  <Typography variant="h2" sx={{ color: 'var(--wc-text-primary)', fontSize: { xs: '1.75rem', md: '2.4rem' }, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.02em' }}>
                    How we think about{' '}
                    <Box component="span" sx={{ color: 'var(--wc-primary)' }}>
                      markets
                    </Box>
                    .
                  </Typography>
                </Box>
              </MotionReveal>

              <Box
                component={motion.div}
                initial="hidden"
                animate={productsInView ? 'visible' : 'hidden'}
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}
              >
                {[
                  {
                    title: 'Research Focus',
                    body: 'We believe disciplined research is the foundation of every sound investment decision. Our approach prioritises depth over speed — understanding businesses, sectors, and cycles before forming a view.',
                    // icon: BarChartRoundedIcon,
                  },
                  {
                    title: 'Differentiation',
                    body: 'The market is full of opinions. Our edge is independence. We filter out consensus noise and build perspectives grounded in data, logic, and long-term thinking — not headlines or herd sentiment.',
                    // icon: AccountBalanceOutlinedIcon,
                  },
                  {
                    title: 'Information into Intelligence',
                    body: 'Raw data is everywhere. What matters is how you read it. We teach investors to connect the dots — turning market signals, financial statements, and macro trends into clear, confident action.',
                    // icon: SchoolOutlinedIcon,
                  },
                ].map((item, index) => {
                  return (
                    <Box
                      key={item.title}
                      component={motion.div}
                      variants={fadeUp}
                      // whileHover={reduceMotion ? undefined : { y: -4 }}
                      sx={{
                        border: '1px solid var(--wc-border)',
                        borderRadius: '10px',
                        bgcolor: 'var(--wc-surface)',
                        p: { xs: 2.4, md: 3 },
                        boxShadow: 'var(--wc-shadow-card)',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          // borderColor: 'rgba(10,46,120,0.35)',
                          boxShadow: '0 14px 38px rgba(7,19,41,0.06)',
                        },
                      }}
                    >
                      
                      <Typography sx={{ color: 'var(--wc-text-primary)', fontSize: 17, fontWeight: 700, mb: 1.2, letterSpacing: '-0.01em' }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                        {item.body}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>

            <MarketGlance />

            <Box component="section">
              <MotionReveal>
                <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: { xs: 3.5, md: 4.5 } }}>
                  
                  <Typography variant="h2" sx={{ mt: 1.5, color: '#071329', fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.1, fontWeight: 700 }}>
                    Featured products for confident investing.
                  </Typography>
                  <Typography sx={{ mt: 1.6, color: '#435981', fontSize: 15, lineHeight: 1.7 }}>
                    Practical tools and resources designed to help you learn, analyze, and invest with clarity.
                  </Typography>
                </Box>
              </MotionReveal>

              <Box
                component={motion.div}
                initial="hidden"
                animate={productsInView ? 'visible' : 'hidden'}
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}
              >
                {PRODUCTS.map((product, index) => (
                  <ProductCard key={product.title} product={product} index={index} />
                ))}
              </Box>
            </Box>

            <MotionReveal>
              <Box
                sx={{
                  border: '1px solid var(--wc-border)',
                  borderRadius: '10px',
                  bgcolor: '#071329',
                  minHeight: 260,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  px: { xs: 3, md: 8 },
                  py: { xs: 5, md: 6 },
                  boxShadow: '0 18px 42px rgba(7,19,41,0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(105deg, rgba(255,255,255,0.03), rgba(255,255,255,0) 48%, rgba(10,46,120,0.15))',
                    pointerEvents: 'none',
                  }}
                />
                <Box sx={{ maxWidth: 720, position: 'relative' }}>
                  <Typography
                    sx={{
                      color: '#90a4c8',
                      fontFamily: 'var(--wc-font-body)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      mb: 2,
                    }}
                  >
                    Start Your Journey
                  </Typography>
                  <Typography variant="h2" sx={{ color: '#ffffff', fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.035em' }}>
                    Shape Your Mind.{' '}
                    <Box component="span" sx={{ color: '#a8c5ff', fontStyle: 'italic' }}>
                      Then Shape Markets.
                    </Box>
                  </Typography>
                  <Typography sx={{ mt: 2.2, color: 'rgba(255,255,255,0.78)', fontSize: 15.5, lineHeight: 1.75, maxWidth: 600, mx: 'auto' }}>
                    Investing mastery begins with how you think — not which stock you pick. Join a community
                    built around research discipline, independent analysis, and long-term conviction.
                  </Typography>
                </Box>
              </Box>
            </MotionReveal>

            <NewsletterBand />
          </Stack>
        </Container>
      </Box>
    </>
  )
}
