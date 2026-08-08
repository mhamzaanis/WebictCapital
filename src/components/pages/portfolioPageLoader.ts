import type { ComponentType } from 'react'
import type { PlatformMode } from '../../lib/runtimeConfig'

type PortfolioModule = { PortfolioComponent: ComponentType }

export async function loadPortfolioModule(mode: PlatformMode): Promise<PortfolioModule> {
  if (mode === 'webict') {
    const module = await import('./WebictPortfolioPage')
    return { PortfolioComponent: module.WebictPortfolioPage }
  }
  const module = await import('./SupabasePortfolioPage')
  return { PortfolioComponent: module.SupabasePortfolioPage }
}
