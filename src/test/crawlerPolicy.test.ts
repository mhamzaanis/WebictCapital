import { describe, expect, it } from 'vitest'
import { INDEXABLE_STATIC_PATHS, PRIVATE_PATHS, canonicalUrlForPath, selectRouteSeo } from '../lib/seo'
import appSource from '../App.tsx?raw'
import indexSource from '../../index.html?raw'
import headersSource from '../../public/_headers?raw'
import robotsSource from '../../public/robots.txt?raw'
import sitemapSource from '../../public/sitemap.xml?raw'

function headerRules(source: string): Map<string, string[]> {
  const rules = new Map<string, string[]>()
  let currentPattern = ''

  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) continue
    if (/^\s/.test(rawLine)) {
      rules.get(currentPattern)?.push(rawLine.trim())
    } else {
      currentPattern = rawLine.trim()
      rules.set(currentPattern, [])
    }
  }

  return rules
}

type RobotsGroup = { agents: string[]; directives: string[] }

function robotsGroups(source: string): RobotsGroup[] {
  const groups: RobotsGroup[] = []
  let current: RobotsGroup | null = null

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\s*#.*$/, '').trim()
    if (!line) continue
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const name = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()

    if (name === 'user-agent') {
      if (!current || current.directives.length > 0) {
        current = { agents: [], directives: [] }
        groups.push(current)
      }
      current.agents.push(value)
    } else if (current && name !== 'sitemap') {
      current.directives.push(`${name}:${value}`)
    }
  }

  return groups
}

describe('sitemap alignment', () => {
  const sitemap = sitemapSource
  const document = new DOMParser().parseFromString(sitemap, 'application/xml')

  it('is valid XML and exactly covers the public static route inventory', () => {
    expect(document.querySelector('parsererror')).toBeNull()
    const urls = Array.from(document.querySelectorAll('url > loc'), (node) => node.textContent)
    expect(urls).toEqual(INDEXABLE_STATIC_PATHS.map(canonicalUrlForPath))
    expect(sitemap).not.toMatch(/<priority>|<changefreq>/)
  })

  it('keeps private, dynamic, query-string, API, alias, and preview URLs out', () => {
    const urls = Array.from(document.querySelectorAll('url > loc'), (node) => node.textContent ?? '')
    for (const path of PRIVATE_PATHS) expect(sitemap).not.toContain(canonicalUrlForPath(path))
    expect(sitemap).not.toMatch(/\/stocks\/[^<]+/)
    expect(sitemap).not.toContain('api.webictcapital.com')
    expect(sitemap).not.toContain('preview.webictcapital.com')
    expect(sitemap).not.toContain('www.webictcapital.com')
    expect(urls.every((url) => !url.includes('?'))).toBe(true)
  })

  it('keeps the router, metadata inventory, and sitemap inventory synchronized', () => {
    const routerPaths = Array.from(appSource.matchAll(/<Route path="([^"]+)"/g), (match) => match[1])
    const publicStaticRoutes = routerPaths.filter((path) => path !== '*' && path !== '/portfolio' && !path.includes(':'))

    expect(publicStaticRoutes).toEqual([...INDEXABLE_STATIC_PATHS])
    for (const path of publicStaticRoutes) expect(selectRouteSeo(path).robots).toContain('index, follow')
  })
})

describe('Cloudflare indexing headers', () => {
  const rules = headerRules(headersSource)

  it('noindexes preview and workers.dev deployment URLs', () => {
    expect(rules.get('https://preview.webictcapital.com/*')).toContain('X-Robots-Tag: noindex, nofollow')
    expect(rules.get('https://:version.:subdomain.workers.dev/*')).toContain('X-Robots-Tag: noindex, nofollow')
  })

  it('does not apply noindex to either production hostname', () => {
    const noindexPatterns = Array.from(rules, ([pattern, headers]) => ({ pattern, headers }))
      .filter(({ headers }) => headers.some((header) => /^X-Robots-Tag:\s*noindex/i.test(header)))
      .map(({ pattern }) => pattern)

    expect(noindexPatterns).not.toContain('/*')
    expect(noindexPatterns).not.toContain('https://webictcapital.com/*')
    expect(noindexPatterns).not.toContain('https://www.webictcapital.com/*')
  })
})

describe('robots.txt groups', () => {
  const robots = robotsSource
  const groups = robotsGroups(robots)

  it('allows normal search crawling without overriding Googlebot or Bingbot groups', () => {
    expect(groups.find((group) => group.agents.includes('*'))?.directives).toEqual(['allow:/'])
    expect(groups.some((group) => group.agents.includes('Googlebot'))).toBe(false)
    expect(groups.some((group) => group.agents.includes('Bingbot'))).toBe(false)
    expect(robots).not.toMatch(/^Crawl-delay:/mi)
    expect(robots).toContain('Sitemap: https://webictcapital.com/sitemap.xml')
  })

  it('allows OAI search discovery and preserves selective GPTBot training restrictions', () => {
    expect(groups.find((group) => group.agents.includes('OAI-SearchBot'))?.directives).toEqual(['allow:/'])
    expect(groups.find((group) => group.agents.includes('GPTBot'))?.directives).toEqual([
      'disallow:/data',
      'disallow:/masterclasses',
      'disallow:/advisory',
    ])
    expect(robots).toMatch(/ChatGPT-User handles user-triggered requests; robots\.txt directives may not control/i)
  })
})

describe('source shell', () => {
  const index = indexSource

  it('keeps Vite source entry and contains no generated hashed asset paths', () => {
    expect(index).toContain('<script type="module" src="/src/main.tsx"></script>')
    expect(index).not.toMatch(/(?:src|href)="\/assets\//)
  })

  it('contains syntactically valid global JSON-LD without page-specific schemas', () => {
    const scripts = Array.from(index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), (match) => match[1])
    expect(scripts).toHaveLength(1)
    expect(JSON.parse(scripts[0])).toMatchObject({
      '@type': 'Organization',
      name: 'Webict Capital',
      description: 'Webict Capital provides daily PSX market data, market intelligence and analytical tools for researching Pakistan Stock Exchange companies.',
      logo: {
        '@type': 'ImageObject',
        url: 'https://webictcapital.com/webict-capital-logo.png',
        width: 512,
        height: 512,
      },
    })
    expect(index).not.toMatch(/SearchAction|BreadcrumbList|FAQPage|"sameAs"/)
  })

  it('serializes every route JSON-LD object as valid JSON', () => {
    for (const path of INDEXABLE_STATIC_PATHS) {
      const structuredData = selectRouteSeo(path).structuredData
      expect(() => JSON.parse(JSON.stringify(structuredData))).not.toThrow()
    }
  })
})
