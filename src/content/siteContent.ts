import type { FooterColumn, NavItem, NewsCard, PortfolioItem } from '../types/content'

export const navItems: NavItem[] = [
  { label: 'About us', href: '#' },
  { label: 'Our team', href: '#' },
  { label: 'Companies', href: '#' },
  { label: 'Resources', href: '#' },
  { label: 'News', href: '#' },
]

export const portfolioItems: PortfolioItem[] = [
  { name: 'Revolut', variant: 'light' },
  { name: 'dream+', variant: 'italic' },
  { name: 'WAYVE', variant: 'wide' },
  { name: 'contentful', variant: 'compact' },
  { name: 'DARKTRACE', variant: 'wide' },
  { name: 'Photoroom', variant: 'compact' },
  { name: 'The Exploration Company', variant: 'stacked' },
  { name: 'GoCardless', variant: 'compact' },
  { name: 'MySQL', variant: 'compact' },
]

export const featuredNews = {
  category: 'Webict Capital News · Events',
  date: '21 February, 2026',
  title: 'MSC: Innovation is driving a new future for European security',
  description:
    'An event with Webict Capital, Former US Secretary of State Hillary Clinton, and the founders of Exein, Quantum Systems and Proxima Fusion.',
  imageCaption: 'Event Photography',
}

export const newsCards: NewsCard[] = [
  {
    category: 'Portfolio News',
    date: '19 March, 2026',
    title: 'Reso8 raises EUR 5m to build hyper-customised, Europe-first speech AI',
    linkLabel: 'Learn more',
    href: '#',
  },
  {
    category: 'Portfolio News',
    date: '20 February, 2026',
    title: 'Wayve secures USD 1.5B to deploy its global autonomy platform',
    linkLabel: 'Learn more',
    href: '#',
  },
]

export const footerColumns: FooterColumn[] = [
  {
    title: 'Webict Capital',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Sustainability', href: '#' },
      { label: 'Our Team', href: '#' },
      { label: 'Recruitments & Events', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Founder',
    links: [
      { label: 'Founder Wellbeing', href: '#' },
      { label: 'Programme Overview', href: '#' },
      { label: 'Founder Survey', href: '#' },
    ],
  },
  {
    title: 'Companies',
    links: [
      { label: 'Companies', href: '#' },
      { label: 'Portfolio Careers', href: '#' },
      { label: 'Founder Spotlights', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'ESG', href: '#' },
      { label: 'Marketing', href: '#' },
      { label: 'News', href: '#' },
      { label: 'Events', href: '#' },
    ],
  },
]
