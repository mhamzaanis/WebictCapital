export type NavItem = {
  label: string
  href: string
}

export type PortfolioItem = {
  name: string
  variant?: 'light' | 'italic' | 'compact' | 'wide' | 'stacked'
  badge?: string
  location?: string
  description?: string
  stage?: string
  href?: string
}

export type NewsCard = {
  category: string
  date: string
  title: string
  linkLabel: string
  href: string
}

export type FooterColumn = {
  title: string
  links: NavItem[]
}
