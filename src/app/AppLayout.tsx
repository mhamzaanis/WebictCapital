import { Box } from '@mui/material'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Helmet } from 'react-helmet-async'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { NavBar } from '../components/layout/NavBar'
import {
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_WIDTH,
  selectRouteSeo,
  type PageSeo,
} from '../lib/seo'

const TWITTER_HANDLE = '@webictcapital'

export function PageMetadata({ seo }: { seo: PageSeo }) {
  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="robots" content={seo.robots} />
      <link rel="canonical" href={seo.canonicalUrl} />

      <meta property="og:type" content={seo.ogType} />
      <meta property="og:site_name" content="Webict Capital" />
      <meta property="og:locale" content="en_PK" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={seo.canonicalUrl} />
      <meta property="og:image" content={seo.imageUrl} />
      <meta property="og:image:width" content={String(SOCIAL_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(SOCIAL_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={seo.imageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.imageUrl} />
      <meta name="twitter:image:alt" content={seo.imageAlt} />

      {seo.structuredData && (
        <script type="application/ld+json">{JSON.stringify(seo.structuredData)}</script>
      )}
    </Helmet>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()
  const reduceMotion = useReducedMotion()
  const seo = selectRouteSeo(pathname)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--wc-bg)' }}>
      <PageMetadata seo={seo} />
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
