import { describe, expect, it } from 'vitest'
import {
  INDEXABLE_STATIC_PATHS,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_URL,
  SOCIAL_IMAGE_WIDTH,
  buildTickerSeo,
  canonicalUrlForPath,
  selectRouteSeo,
  tickerCanonicalUrl,
} from './seo'

describe('route metadata selection', () => {
  it('uses research-first homepage positioning', () => {
    const seo = selectRouteSeo('/')

    expect(seo.title).toBe('Webict Capital | PSX Research, Data & Market Intelligence')
    expect(seo.description).toBe(
      'Research Pakistan Stock Exchange companies with daily market data, financials, ratios, technical indicators, comparisons, macro rates and portfolio tools.',
    )
    expect(seo.imageAlt).toBe('Webict Capital — PSX research, data and market intelligence')
  })

  it('gives every public static route unique, complete production metadata', () => {
    const metadata = INDEXABLE_STATIC_PATHS.map((path) => selectRouteSeo(path))

    expect(new Set(metadata.map((item) => item.title)).size).toBe(metadata.length)
    expect(new Set(metadata.map((item) => item.description)).size).toBe(metadata.length)

    for (const [index, path] of INDEXABLE_STATIC_PATHS.entries()) {
      const seo = metadata[index]
      expect(seo.canonicalUrl).toBe(canonicalUrlForPath(path))
      expect(seo.canonicalUrl).toMatch(/^https:\/\/webictcapital\.com\//)
      expect(seo.robots).toContain('index, follow')
      expect(seo.ogType).toBe('website')
      expect(seo.imageUrl).toBe(SOCIAL_IMAGE_URL)
      expect(seo.structuredData).toMatchObject({
        '@context': 'https://schema.org',
        url: seo.canonicalUrl,
      })
    }

    expect(SOCIAL_IMAGE_WIDTH).toBe(1200)
    expect(SOCIAL_IMAGE_HEIGHT).toBe(630)
  })

  it('generates canonical URLs without preview hosts, aliases, queries, or fragments', () => {
    expect(canonicalUrlForPath('/')).toBe('https://webictcapital.com/')
    expect(canonicalUrlForPath('/about/?ref=nav#team')).toBe('https://webictcapital.com/about')
  })

  it('marks the authenticated portfolio route noindex without stale platform wording', () => {
    const seo = selectRouteSeo('/portfolio')

    expect(seo.canonicalUrl).toBe('https://webictcapital.com/portfolio')
    expect(seo.robots).toBe('noindex, nofollow')
    expect(seo.structuredData).toBeUndefined()
    expect(`${seo.title} ${seo.description}`).not.toMatch(/supabase/i)
  })

  it('normalizes ticker canonicals and uses actual company information when available', () => {
    const seo = buildTickerSeo(' hbl ', ' Habib Bank Limited ')

    expect(tickerCanonicalUrl(' hbl ')).toBe('https://webictcapital.com/stocks/HBL')
    expect(selectRouteSeo('/stocks/hbl').canonicalUrl).toBe('https://webictcapital.com/stocks/HBL')
    expect(seo.canonicalUrl).toBe('https://webictcapital.com/stocks/HBL')
    expect(seo.title).toContain('HBL - Habib Bank Limited')
    expect(seo.description).toContain('Habib Bank Limited (HBL)')
    expect(seo.structuredData?.about).toEqual({
      '@type': 'Corporation',
      name: 'Habib Bank Limited',
      tickerSymbol: 'HBL',
    })
  })

  it('does not invent company structured data when the API has no company name', () => {
    const seo = buildTickerSeo('mebl', null)

    expect(seo.title).toBe('MEBL | PSX Stock Data')
    expect(seo.canonicalUrl).toBe('https://webictcapital.com/stocks/MEBL')
    expect(seo.structuredData).not.toHaveProperty('about')
  })
})
