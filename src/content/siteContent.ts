import type { FooterColumn, NavItem, NewsCard, PortfolioItem } from '../types/content'

export const navItems: NavItem[] = [
  {
    label: 'Learn',
    href: '/glossary',
    children: [
      { label: 'Glossary', href: '/glossary' },
      {label: 'Masterclasses', href: '/masterclasses'},
    ],
  },
  { label: 'Data', href: '/data' },
  { label: 'Advisory', href: '#' },
  { label: 'Our team', href: '#' },
  { label: 'News', href: '#' },
  { label: 'About us', href: '/about' },
]

export const portfolioItems: PortfolioItem[] = [
  {
    name: 'Revolut',
    variant: 'light',
    location: 'London, UK',
    description: 'The digital banking alternative.',
    stage: 'Seed in 2015',
    href: '#',
  },
  {
    name: 'dream+',
    variant: 'italic',
    location: 'Istanbul, TR',
    description: 'Mobile gaming studio behind global chart toppers.',
    stage: 'Series A in 2020',
    href: '#',
  },
  {
    name: 'WAYVE',
    variant: 'wide',
    location: 'London, UK',
    description: 'Embodied AI for autonomous mobility systems.',
    stage: 'Series C in 2022',
    href: '#',
  },
  {
    name: 'contentful',
    variant: 'compact',
    location: 'Berlin, DE',
    description: 'Composable content platform for digital experiences.',
    stage: 'Series A in 2014',
    href: '#',
  },
  {
    name: 'DARKTRACE',
    variant: 'wide',
    location: 'Cambridge, UK',
    description: 'Cyber AI company helping enterprises defend data.',
    stage: 'Growth in 2015',
    href: '#',
  },
  {
    name: 'Photoroom',
    variant: 'compact',
    location: 'Paris, FR',
    description: 'AI-native visual editing tools for commerce teams.',
    stage: 'Series B in 2023',
    href: '#',
  },
  {
    name: 'The Exploration Company',
    variant: 'stacked',
    location: 'Munich, DE',
    description: 'Reusable and modular space logistics infrastructure.',
    stage: 'Series A in 2024',
    href: '#',
  },
  {
    name: 'GoCardless',
    variant: 'compact',
    location: 'London, UK',
    description: 'Global bank payment network for recurring revenue.',
    stage: 'Series A in 2012',
    href: '#',
  },
  {
    name: 'MySQL',
    variant: 'compact',
    location: 'Helsinki, FI',
    description: 'Open source database technology powering developers.',
    stage: 'Series A in 2001',
    href: '#',
  },
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
      { label: 'About Us', href: '/about' },
      { label: 'Sustainability', href: '#' },
      { label: 'Our Team', href: '#' },
      { label: 'Recruitments & Events', href: '#' },
      { label: 'Contact', href: '/about#contact' },
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
