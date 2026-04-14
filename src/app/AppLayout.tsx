import { Box } from '@mui/material'
import { Footer } from '../components/layout/Footer'
import { NavBar } from '../components/layout/NavBar'
import { CtaSection } from '../components/sections/CtaSection'
import { HeroSection } from '../components/sections/HeroSection'
import { InvestingSection } from '../components/sections/InvestingSection'
import { NewsSection } from '../components/sections/NewsSection'
import { PortfolioSection } from '../components/sections/PortfolioSection'

export function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'common.white' }}>
      <NavBar />
      <HeroSection />
      <PortfolioSection />
      <InvestingSection />
      <NewsSection />
      <CtaSection />
      <Footer />
    </Box>
  )
}
