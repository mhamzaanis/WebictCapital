import { lazy, Suspense } from 'react'
import { getRuntimeConfig } from '../../lib/runtimeConfig'
import { PulseSkeleton } from '../PulseSkeleton'
import { loadPortfolioModule } from './portfolioPageLoader'

const SelectedPortfolioPage = lazy(async () => {
  const { PortfolioComponent } = await loadPortfolioModule(getRuntimeConfig().platformMode)
  return { default: PortfolioComponent }
})

export function PortfolioPage() {
  return (
    <Suspense fallback={<PulseSkeleton shape="rectangular" height={480} />}>
      <SelectedPortfolioPage />
    </Suspense>
  )
}
