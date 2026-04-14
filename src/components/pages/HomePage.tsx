import { CtaSection } from '../sections/CtaSection'
import { HeroSection } from '../sections/HeroSection'
import { InvestingSection } from '../sections/InvestingSection'
import { NewsSection } from '../sections/NewsSection'
import { PortfolioSection } from '../sections/PortfolioSection'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <PortfolioSection />
      <InvestingSection />
      <NewsSection />
      <CtaSection />
    </>
  )
}
