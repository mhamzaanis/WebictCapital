export const SITE_ORIGIN = 'https://webictcapital.com'
export const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/webict-capital-og.png`
export const SOCIAL_IMAGE_WIDTH = 1200
export const SOCIAL_IMAGE_HEIGHT = 630

export const INDEXABLE_STATIC_PATHS = [
  '/',
  '/about',
  '/advisory',
  '/data',
  '/data/stocks',
  '/data/compare',
  '/data/rates',
  '/data/rates/usd-pkr',
  '/glossary',
  '/masterclasses',
  '/sip-calculator',
] as const

export const PRIVATE_PATHS = ['/portfolio'] as const

export type IndexableStaticPath = (typeof INDEXABLE_STATIC_PATHS)[number]

export type PageSeo = Readonly<{
  title: string
  description: string
  canonicalUrl: string
  robots: string
  ogType: 'website'
  imageUrl: string
  imageAlt: string
  structuredData?: Record<string, unknown>
}>

type PageDescriptor = Readonly<{
  title: string
  description: string
  schemaType: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'Dataset' | 'WebApplication' | 'DefinedTermSet'
  schemaName: string
  applicationCategory?: 'FinanceApplication'
}>

const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
const NOINDEX_ROBOTS = 'noindex, nofollow'
const SITE_NAME = 'Webict Capital'

const PAGE_BY_PATH: Record<IndexableStaticPath, PageDescriptor> = {
  '/': {
    title: 'Webict Capital | PSX Research, Data & Market Intelligence',
    description:
      'Research Pakistan Stock Exchange companies with daily market data, financials, ratios, technical indicators, comparisons, macro rates and portfolio tools.',
    schemaType: 'WebPage',
    schemaName: 'Webict Capital',
  },
  '/about': {
    title: 'About Webict Capital | PSX Investing Education',
    description:
      'Learn how Webict Capital helps Pakistan Stock Exchange investors build research skills, independent conviction, and disciplined long-term decision-making.',
    schemaType: 'AboutPage',
    schemaName: 'About Webict Capital',
  },
  '/advisory': {
    title: 'Investment Advisory Waitlist | Webict Capital',
    description:
      'Learn about Webict Capital’s upcoming Pakistan-market advisory experience, read the service FAQ, and join the early-access waitlist.',
    schemaType: 'WebPage',
    schemaName: 'Webict Capital investment advisory waitlist',
  },
  '/data': {
    title: 'PSX Market Overview | Indexes, Movers and Sectors',
    description:
      'Review the latest available Pakistan Stock Exchange close, major indexes, market breadth, leading movers, heatmap, and sector performance.',
    schemaType: 'CollectionPage',
    schemaName: 'Pakistan Stock Exchange market overview',
  },
  '/data/stocks': {
    title: 'PSX Stocks Explorer | Prices, Volume and Sectors',
    description:
      'Search, filter, sort, and export the latest available PSX stock observations by symbol, company, sector, price movement, and traded volume.',
    schemaType: 'CollectionPage',
    schemaName: 'PSX stocks explorer',
  },
  '/data/compare': {
    title: 'PSX Stock Comparison Tool | Webict Capital',
    description:
      'Compare up to four PSX stocks across shared-date performance, fundamentals, volatility, drawdown, and raw technical indicators.',
    schemaType: 'WebApplication',
    schemaName: 'PSX stock comparison tool',
    applicationCategory: 'FinanceApplication',
  },
  '/data/rates': {
    title: 'KIBOR Rates and History | Webict Capital',
    description:
      'View latest available KIBOR bid and offer rates, compare tenors, chart historical observations, filter dates, and export table data.',
    schemaType: 'Dataset',
    schemaName: 'Pakistan KIBOR rates and history',
  },
  '/data/rates/usd-pkr': {
    title: 'USD/PKR Rates and History | Webict Capital',
    description:
      'Explore State Bank of Pakistan Mark-to-Market Ready USD/PKR observations with historical charts, date ranges, and exportable table data.',
    schemaType: 'Dataset',
    schemaName: 'USD/PKR Mark-to-Market Ready rates and history',
  },
  '/glossary': {
    title: 'Investing Glossary | PSX and Finance Terms Explained',
    description:
      'Browse clear definitions and practical explanations of investing, finance, economics, and Pakistan Stock Exchange terminology.',
    schemaType: 'DefinedTermSet',
    schemaName: 'Webict Capital investing glossary',
  },
  '/masterclasses': {
    title: 'PSX Investing Masterclasses | Webict Capital',
    description:
      'Explore a four-season investing curriculum covering PSX market structure, risk, fundamental analysis, portfolio strategy, valuation, and market psychology.',
    schemaType: 'CollectionPage',
    schemaName: 'Webict Capital investing masterclasses',
  },
  '/sip-calculator': {
    title: 'SIP Calculator | Estimate Investment Growth',
    description:
      'Estimate systematic monthly investment growth by adjusting contribution, expected annual return, time horizon, and inflation view.',
    schemaType: 'WebApplication',
    schemaName: 'Webict Capital SIP calculator',
    applicationCategory: 'FinanceApplication',
  },
}

function normalizedPathname(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || '/'
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`
  return withLeadingSlash === '/' ? '/' : withLeadingSlash.replace(/\/+$/, '')
}

export function canonicalUrlForPath(pathname: string): string {
  const path = normalizedPathname(pathname)
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`
}

export function normalizeTickerSymbol(symbol: string): string {
  return symbol.trim().toUpperCase()
}

export function tickerCanonicalUrl(symbol: string): string {
  const normalizedSymbol = normalizeTickerSymbol(symbol)
  return `${SITE_ORIGIN}/stocks/${encodeURIComponent(normalizedSymbol)}`
}

function structuredDataForPage(path: IndexableStaticPath, descriptor: PageDescriptor): Record<string, unknown> {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': descriptor.schemaType,
    name: descriptor.schemaName,
    url: canonicalUrlForPath(path),
    description: descriptor.description,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
    },
  }

  if (descriptor.applicationCategory) data.applicationCategory = descriptor.applicationCategory
  return data
}

function pageSeo(path: IndexableStaticPath): PageSeo {
  const descriptor = PAGE_BY_PATH[path]
  return {
    title: descriptor.title,
    description: descriptor.description,
    canonicalUrl: canonicalUrlForPath(path),
    robots: INDEX_ROBOTS,
    ogType: 'website',
    imageUrl: SOCIAL_IMAGE_URL,
    imageAlt: 'Webict Capital — PSX research, data and market intelligence',
    structuredData: structuredDataForPage(path, descriptor),
  }
}

export function buildTickerSeo(symbol: string, companyName?: string | null): PageSeo {
  const normalizedSymbol = normalizeTickerSymbol(symbol)
  const normalizedCompanyName = companyName?.trim() || null
  const canonicalUrl = tickerCanonicalUrl(normalizedSymbol)
  const subject = normalizedCompanyName ? `${normalizedCompanyName} (${normalizedSymbol})` : normalizedSymbol
  const title = normalizedCompanyName
    ? `${normalizedSymbol} - ${normalizedCompanyName} | PSX Stock Data`
    : `${normalizedSymbol} | PSX Stock Data`
  const description = `Explore ${subject} quote history, company profile, valuation, financial statements, announcements, payouts, reports, and raw technical indicators.`
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${subject} PSX stock data`,
    url: canonicalUrl,
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
    },
  }

  if (normalizedCompanyName) {
    structuredData.about = {
      '@type': 'Corporation',
      name: normalizedCompanyName,
      tickerSymbol: normalizedSymbol,
    }
  }

  return {
    title,
    description,
    canonicalUrl,
    robots: INDEX_ROBOTS,
    ogType: 'website',
    imageUrl: SOCIAL_IMAGE_URL,
    imageAlt: `${subject} stock data on Webict Capital`,
    structuredData,
  }
}

function decodeRouteSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function selectRouteSeo(pathname: string): PageSeo {
  const path = normalizedPathname(pathname)
  if (INDEXABLE_STATIC_PATHS.includes(path as IndexableStaticPath)) {
    return pageSeo(path as IndexableStaticPath)
  }

  if (path === '/portfolio') {
    return {
      title: 'My Portfolio | Webict Capital',
      description: 'Private portfolio workspace for signed-in Webict Capital users.',
      canonicalUrl: canonicalUrlForPath('/portfolio'),
      robots: NOINDEX_ROBOTS,
      ogType: 'website',
      imageUrl: SOCIAL_IMAGE_URL,
      imageAlt: 'Webict Capital private portfolio workspace',
    }
  }

  const tickerMatch = /^\/stocks\/([^/]+)$/.exec(path)
  if (tickerMatch) {
    return {
      ...buildTickerSeo(decodeRouteSegment(tickerMatch[1])),
      // StockDetailPage supplies its JSON-LD after the API returns the canonical
      // symbol and optional company name, avoiding speculative company data.
      structuredData: undefined,
    }
  }

  return {
    title: 'Redirecting | Webict Capital',
    description: 'This URL redirects to the Webict Capital homepage.',
    canonicalUrl: canonicalUrlForPath('/'),
    robots: NOINDEX_ROBOTS,
    ogType: 'website',
    imageUrl: SOCIAL_IMAGE_URL,
    imageAlt: 'Webict Capital — PSX research, data and market intelligence',
  }
}
