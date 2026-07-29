import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { AboutPage } from './components/pages/AboutPage'
import { AdvisoryPage } from './components/pages/AdvisoryPage'
import { GlossaryPage } from './components/pages/GlossaryPage'
import { HomePage } from './components/pages/HomePage'
import { MarketsOverviewPage } from './components/pages/MarketsOverviewPage'
import { MasterclassesPage } from './components/pages/MasterclassesPage'
import { PortfolioPage } from './components/pages/PortfolioPage'
import { RatesMacroPage, UsdPkrRatesPage } from './components/pages/RatesMacroPage'
import { SipCalculatorPage } from './components/pages/SipCalculatorPage'
import { StockComparisonPage } from './components/pages/StockComparisonPage'
import { StockDetailPage } from './components/pages/StockDetailPage'
import { StocksExplorerPage } from './components/pages/StocksExplorerPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/advisory" element={<AdvisoryPage />} />
        <Route path="/data" element={<MarketsOverviewPage />} />
        <Route path="/data/stocks" element={<StocksExplorerPage />} />
        <Route path="/data/compare" element={<StockComparisonPage />} />
        <Route path="/data/rates" element={<RatesMacroPage />} />
        <Route path="/data/rates/usd-pkr" element={<UsdPkrRatesPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/masterclasses" element={<MasterclassesPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/sip-calculator" element={<SipCalculatorPage />} />
        <Route path="/stocks/:symbol" element={<StockDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
