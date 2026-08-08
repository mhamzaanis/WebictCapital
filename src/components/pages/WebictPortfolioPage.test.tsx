import Decimal from 'decimal.js'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PortfolioTables, PortfolioWriteGateNotice } from './WebictPortfolioPage'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, error: null, signInWithGoogle: vi.fn(), signOut: vi.fn(), clearError: vi.fn() }),
}))

const snapshot = {
  summary: { id: '11111111-1111-4111-8111-111111111111', name: 'Default', baseCurrency: 'PKR', status: 'active', isDefault: true, version: 4n, holdingsMarketValue: new Decimal('1000'), unpricedHoldingCount: 1, createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z' },
  lots: [],
  holdings: [{ securityId: 9_007_199_254_740_993n, symbol: 'HBL', companyName: null, quantity: 10n, totalCost: new Decimal('100'), averageUnitCost: new Decimal('10'), latestPrice: null, latestPriceDate: null, marketValue: null }],
  activity: [{ id: '22222222-2222-4222-8222-222222222222', securityId: 1n, symbol: 'HBL', activityType: 'legacy_trade', sourceKind: 'supabase_import', side: 'SELL', positionEffect: 'none', quantity: 5n, unitPrice: new Decimal('11'), tradeDate: '2025-01-01', legacySupabaseTradeId: 9_007_199_254_740_993n, sourceCreatedAt: null, allocationMethod: null, hasReliableLotAllocation: false, createdAt: '2026-08-01T00:00:00Z', reason: null, beforeQuantity: null, afterQuantity: null, beforeUnitCost: null, afterUnitCost: null, beforeAcquisitionDate: null, afterAcquisitionDate: null, portfolioVersionBefore: null, portfolioVersionAfter: null, lotVersionBefore: null, lotVersionAfter: null }],
  watchlist: [],
} as never

describe('WebICT portfolio rendering', () => {
  it('renders null quotes as N/A, legacy SELL as neutral history, and no cash semantics', () => {
    const { container } = render(<MemoryRouter><PortfolioTables snapshot={snapshot} writesDisabled={false} onCorrect={vi.fn()} onRemove={vi.fn()} /></MemoryRouter>)
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
    expect(screen.getByText('Position-neutral history')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/cash/i)
  })

  it('surfaces the write gate without removing read UI', () => {
    render(<PortfolioWriteGateNotice unavailable>Portfolio writes are temporarily unavailable. Read data remains visible.</PortfolioWriteGateNotice>)
    expect(screen.getByRole('alert')).toHaveTextContent('Read data remains visible')
  })
})
