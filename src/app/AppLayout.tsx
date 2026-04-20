import { Box } from '@mui/material'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Helmet } from 'react-helmet-async'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { NavBar } from '../components/layout/NavBar'

const SITE_URL = 'https://webictcapital.com'
const DEFAULT_IMAGE = `${SITE_URL}/herosection.webp`
const TWITTER_HANDLE = '@webictcapital'

type PageSeo = {
  title: string
  description: string
  structuredData?: Record<string, unknown>
}

const SEO_BY_PATH: Record<string, PageSeo> = {
  '/': {
    title: 'Webict Capital | PSX Stock Market Education & Investing Courses Pakistan',
    description:
      "Pakistan's leading investing education platform. Learn PSX stock market fundamentals, portfolio strategy, and risk management through structured masterclasses, daily market data, and a comprehensive investing glossary.",
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Webict Capital - Home',
      url: `${SITE_URL}/`,
      description: "Pakistan's structured investing education platform for PSX investors.",
      publisher: {
        '@type': 'Organization',
        name: 'Webict Capital',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/favicon.svg`,
      },
    },
  },
  '/about': {
    title: 'About Webict Capital | PSX Investing Education in Karachi, Pakistan',
    description:
      'Learn about Webict Capital - a Karachi-based investing education platform helping PSX investors build long-term, research-driven discipline through structured programs and practical market knowledge.',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Webict Capital',
      url: `${SITE_URL}/about`,
      description:
        'Webict Capital is a Karachi-based investing education platform focused on PSX stock market education.',
      publisher: {
        '@type': 'Organization',
        name: 'Webict Capital',
        url: `${SITE_URL}/`,
      },
    },
  },
  '/data': {
    title: 'PSX Market Data | Daily Pakistan Stock Exchange Closing Rates',
    description:
      'Track daily PSX market data including KSE-100 index movement, advances, declines, volume, and per-stock closing price updates. Free daily Pakistan Stock Exchange data from Webict Capital.',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'DataCatalog',
      name: 'PSX Daily Market Data',
      url: `${SITE_URL}/data`,
      description: 'Daily Pakistan Stock Exchange closing rates, KSE-100 figures, and per-stock data.',
      publisher: {
        '@type': 'Organization',
        name: 'Webict Capital',
        url: `${SITE_URL}/`,
      },
      temporalCoverage: '2024/..',
      spatialCoverage: 'Pakistan',
    },
  },
  '/glossary': {
    title: 'PSX Investing Glossary | Key Stock Market Terms Explained',
    description:
      'Browse clear, practical definitions of core investing and Pakistan Stock Exchange terms - from P/E ratio and dividend yield to liquidity, market cap, and sector analysis concepts.',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: 'PSX Investing Glossary',
      url: `${SITE_URL}/glossary`,
      description: 'Comprehensive glossary of investing terms for Pakistan Stock Exchange investors.',
      publisher: {
        '@type': 'Organization',
        name: 'Webict Capital',
        url: `${SITE_URL}/`,
      },
    },
  },
  '/masterclasses': {
    title: 'PSX Investing Masterclasses | Structured Learning Tracks by Webict Capital',
    description:
      'Explore Webict Capital masterclass seasons covering PSX market foundations, portfolio construction, risk controls, sector rotation, entry and exit discipline, and long-term investing workflows.',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Webict Capital Masterclasses',
      url: `${SITE_URL}/masterclasses`,
      description: 'Structured investing education seasons for Pakistan Stock Exchange investors.',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Course',
            name: 'Season 01: Foundations of Confident Investing',
            description:
              'Learn PSX market structure, risk management, fundamental analysis, and build a personal investment framework.',
            url: `${SITE_URL}/masterclasses`,
            provider: {
              '@type': 'Organization',
              name: 'Webict Capital',
            },
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'Course',
            name: 'Season 02: Portfolio Strategy and Execution',
            description:
              'Master portfolio construction, sector rotation, entry and exit discipline, and review systems for long-term consistency.',
            url: `${SITE_URL}/masterclasses`,
            provider: {
              '@type': 'Organization',
              name: 'Webict Capital',
            },
          },
        },
      ],
    },
  },
  '/advisory': {
    title: 'Investment Advisory | Webict Capital - Coming Soon',
    description:
      'Discover upcoming advisory services from Webict Capital - focused strategy sessions, personalized PSX market reviews, and actionable portfolio guidance tailored for Pakistan investors.',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Webict Capital Investment Advisory',
      url: `${SITE_URL}/advisory`,
      description:
        'Upcoming personalized investment advisory service for PSX investors from Webict Capital.',
      provider: {
        '@type': 'Organization',
        name: 'Webict Capital',
        url: `${SITE_URL}/`,
      },
      areaServed: { '@type': 'Country', name: 'Pakistan' },
      serviceType: 'Investment Advisory',
    },
  },
}

export function AppLayout() {
  const { pathname } = useLocation()
  const reduceMotion = useReducedMotion()
  const seo = SEO_BY_PATH[pathname] ?? SEO_BY_PATH['/']
  const canonicalUrl = pathname === '/' ? SITE_URL : `${SITE_URL}${pathname}`

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'common.white' }}>
      <Helmet>
        {/* Primary */}
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Webict Capital" />
        <meta property="og:locale" content="en_PK" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_IMAGE} />
        <meta property="og:image:alt" content="Webict Capital - PSX Investing Education Platform" />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={TWITTER_HANDLE} />
        <meta name="twitter:creator" content={TWITTER_HANDLE} />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta name="twitter:image" content={DEFAULT_IMAGE} />
        <meta name="twitter:image:alt" content="Webict Capital - PSX Investing Education" />

        {/* Per-page structured data */}
        {seo.structuredData && (
          <script type="application/ld+json">{JSON.stringify(seo.structuredData)}</script>
        )}
      </Helmet>
      <NavBar />
      <AnimatePresence mode="wait" initial={false}>
        <Box
          key={pathname}
          component={motion.div}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </Box>
      </AnimatePresence>
      <Footer />
    </Box>
  )
}
