import Decimal from 'decimal.js'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MarketApiError } from '../../lib/api/errors'
import type { PortfolioSnapshot } from '../../lib/api/portfolio'
import {
  LOT_CORRECTION_CONFLICT_MESSAGE,
  PORTFOLIO_AUTH_REQUIRED_MESSAGE,
  PORTFOLIO_CONFLICT_MESSAGE,
  PORTFOLIO_WRITES_UNAVAILABLE_MESSAGE,
  WebictPortfolioPage,
} from './WebictPortfolioPage'

const api = vi.hoisted(() => ({
  fetchPortfolioSnapshot: vi.fn(),
  buy: vi.fn(),
  sell: vi.fn(),
  correctLot: vi.fn(),
  removePosition: vi.fn(),
  fetchLatestMarketSummary: vi.fn(),
}))
const authUser = vi.hoisted(() => ({
  id: '11111111-1111-4111-8111-111111111111',
  email: 'investor@example.test',
  emailVerified: true,
  displayName: 'Investor',
  avatarUrl: null,
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: authUser,
    loading: false,
    error: null,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
  }),
}))

vi.mock('../../lib/api/portfolio', () => ({
  fetchPortfolioSnapshot: api.fetchPortfolioSnapshot,
  buy: api.buy,
  sell: api.sell,
  correctLot: api.correctLot,
  removePosition: api.removePosition,
}))

vi.mock('../../lib/api/market', () => ({ fetchLatestMarketSummary: api.fetchLatestMarketSummary }))
vi.mock('../AuthModal', () => ({ AuthModal: ({ open }: { open: boolean }) => open ? <div data-testid="auth-request">Authentication required</div> : null }))

const holding = {
  securityId: 9_007_199_254_740_993n,
  symbol: 'HBL',
  companyName: 'Habib Bank Limited',
  quantity: 10n,
  totalCost: new Decimal('100'),
  averageUnitCost: new Decimal('10'),
  latestPrice: null,
  latestPriceDate: null,
  marketValue: null,
}

const secondHolding = {
  securityId: 10n,
  symbol: 'UBL',
  companyName: 'United Bank Limited',
  quantity: 20n,
  totalCost: new Decimal('250.25'),
  averageUnitCost: new Decimal('12.5125'),
  latestPrice: new Decimal('70.025'),
  latestPriceDate: '2026-08-08',
  marketValue: new Decimal('1400.50'),
}

const activity = {
  id: '22222222-2222-4222-8222-222222222222',
  securityId: 1n,
  symbol: 'HBL',
  activityType: 'legacy_trade',
  sourceKind: 'supabase_import',
  side: 'SELL',
  positionEffect: 'none',
  quantity: 5n,
  unitPrice: new Decimal('11'),
  tradeDate: '2025-01-01',
  legacySupabaseTradeId: 9_007_199_254_740_993n,
  sourceCreatedAt: null,
  allocationMethod: null,
  hasReliableLotAllocation: false,
  createdAt: '2026-08-01T00:00:00Z',
  reason: null,
  beforeQuantity: null,
  afterQuantity: null,
  beforeUnitCost: null,
  afterUnitCost: null,
  beforeAcquisitionDate: null,
  afterAcquisitionDate: null,
  portfolioVersionBefore: 3n,
  portfolioVersionAfter: 4n,
  lotVersionBefore: null,
  lotVersionAfter: null,
}

const lot = {
  id: '33333333-3333-4333-8333-333333333333',
  securityId: holding.securityId,
  symbol: 'HBL',
  quantity: 10n,
  unitCost: new Decimal('10'),
  acquisitionDate: '2026-07-01',
  origin: 'native',
  version: 7n,
  sourceCreatedAt: null,
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
}

function snapshot(overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot {
  return {
    summary: {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Default',
      baseCurrency: 'PKR',
      status: 'active',
      isDefault: true,
      version: 4n,
      holdingsMarketValue: new Decimal('1400.50'),
      unpricedHoldingCount: 1,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    holdings: [holding, secondHolding],
    lots: [lot],
    activity: [activity],
    watchlist: [],
    ...overrides,
  } as PortfolioSnapshot
}

function emptySnapshot(): PortfolioSnapshot {
  return snapshot({
    summary: { ...snapshot().summary, holdingsMarketValue: new Decimal(0), unpricedHoldingCount: 0 },
    holdings: [],
    lots: [],
    activity: [],
  })
}

function renderPage() {
  return render(<MemoryRouter><WebictPortfolioPage /></MemoryRouter>)
}

afterEach(cleanup)

async function openAndCompleteBuy() {
  await screen.findByText('Holdings value')
  const buyButton = screen.getByRole('button', { name: 'Buy shares' })
  await waitFor(() => expect(buyButton).toBeEnabled())
  fireEvent.click(buyButton)
  const dialog = screen.getByRole('dialog', { name: 'Buy shares' })
  fireEvent.change(within(dialog).getByLabelText('Company or symbol'), { target: { value: 'HBL' } })
  fireEvent.change(within(dialog).getByLabelText('Number of shares'), { target: { value: '2' } })
  fireEvent.change(within(dialog).getByLabelText('Price per share'), { target: { value: '12.345678' } })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm purchase' })).toBeEnabled())
  const form = dialog.querySelector('form')
  expect(form).not.toBeNull()
  fireEvent.keyDown(within(dialog).getByLabelText('Price per share'), { key: 'Enter', code: 'Enter' })
  // jsdom does not perform Enter's browser-default form submission, so dispatch that native event explicitly.
  fireEvent.submit(form!)
  await waitFor(() => expect(api.buy).toHaveBeenCalledOnce())
}

beforeEach(() => {
  api.fetchPortfolioSnapshot.mockReset()
  api.buy.mockReset()
  api.sell.mockReset()
  api.correctLot.mockReset()
  api.removePosition.mockReset()
  api.fetchLatestMarketSummary.mockReset()
  api.fetchPortfolioSnapshot.mockResolvedValue(snapshot())
  api.fetchLatestMarketSummary.mockResolvedValue({
    tickers: [
      { symbol: 'HBL', companyName: 'Habib Bank Limited' },
      { symbol: 'MCB', companyName: 'MCB Bank Limited' },
    ],
  })
  api.buy.mockResolvedValue({ activityId: '55555555-5555-4555-8555-555555555555', portfolioVersion: 5n })
  api.sell.mockResolvedValue({ activityId: '66666666-6666-4666-8666-666666666666', portfolioVersion: 5n })
  api.correctLot.mockResolvedValue({ activityId: '77777777-7777-4777-8777-777777777777', portfolioVersion: 5n })
})

describe('WebICT investment portfolio', () => {
  it('renders one polished empty state without technical or cash language', async () => {
    api.fetchPortfolioSnapshot.mockResolvedValue(emptySnapshot())
    const { container } = renderPage()
    expect(await screen.findByRole('heading', { name: 'My Portfolio' })).toBeInTheDocument()
    expect(await screen.findByText('No holdings yet')).toBeInTheDocument()
    expect(screen.queryByText(/No records/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Awaiting a market price')).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/server-authoritative|immutable activity|cash balance|market index/i)
  })

  it('shows user-facing summary values derived from populated holdings', async () => {
    const { container } = renderPage()
    expect(await screen.findByText('Holdings value')).toBeInTheDocument()
    expect(screen.getByText('Cost basis')).toBeInTheDocument()
    expect(screen.getByText('PKR 350.25')).toBeInTheDocument()
    expect(screen.getByText('Companies held')).toBeInTheDocument()
    expect(screen.getByText('Awaiting a market price')).toBeInTheDocument()
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
    expect(container.textContent).not.toMatch(/portfolioVersion|lotVersion|mutationId|positionEffect|Portfolio version|Lot version|Versions/i)
  })

  it('opens focused buy and sell dialogs and limits sales to current holdings', async () => {
    renderPage()
    await screen.findByText('Holdings value')
    const buyButton = screen.getByRole('button', { name: 'Buy shares' })
    await waitFor(() => expect(buyButton).toBeEnabled())
    fireEvent.click(buyButton)
    const buyDialog = screen.getByRole('dialog', { name: 'Buy shares' })
    expect(buyDialog.querySelectorAll('form')).toHaveLength(1)
    expect(within(buyDialog).getByRole('button', { name: 'Confirm purchase' })).toHaveAttribute('type', 'submit')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Buy shares' })).not.toBeInTheDocument())

    const sellButton = screen.getByRole('button', { name: 'Sell shares' })
    await waitFor(() => expect(sellButton).toBeEnabled())
    fireEvent.click(sellButton)
    const sellDialog = screen.getByRole('dialog', { name: 'Sell shares' })
    expect(sellDialog.querySelectorAll('form')).toHaveLength(1)
    expect(within(sellDialog).getByRole('button', { name: 'Confirm sale' })).toHaveAttribute('type', 'submit')
    expect(within(sellDialog).getByText('10 shares available on this date.')).toBeInTheDocument()
    expect(sellDialog).not.toHaveTextContent('MCB Bank Limited')
    expect(within(sellDialog).getByText(/chronological order/i)).toBeInTheDocument()
  })

  it('uses date-eligible lots for sell availability and blocks known oversells locally', async () => {
    const earlyLot = { ...lot, quantity: 5n, acquisitionDate: '2026-01-15' } as PortfolioSnapshot['lots'][number]
    const lateLot = {
      ...lot,
      id: '88888888-8888-4888-8888-888888888888',
      quantity: 10n,
      acquisitionDate: '2026-07-15',
      version: 2n,
    } as PortfolioSnapshot['lots'][number]
    api.fetchPortfolioSnapshot.mockResolvedValue(snapshot({
      holdings: [{ ...holding, quantity: 15n }],
      lots: [earlyLot, lateLot],
    }))

    renderPage()
    await screen.findByText('Holdings value')
    fireEvent.click(screen.getByRole('button', { name: 'Sell shares' }))
    const dialog = screen.getByRole('dialog', { name: 'Sell shares' })
    const form = dialog.querySelector('form')
    expect(form).not.toBeNull()

    fireEvent.change(within(dialog).getByLabelText('Trade date'), { target: { value: '2026-06-01' } })
    expect(await within(dialog).findByText('5 shares available on this date.')).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText('Number of shares'), { target: { value: '6' } })
    fireEvent.change(within(dialog).getByLabelText('Price per share'), { target: { value: '12.5' } })
    expect(within(dialog).getByRole('button', { name: 'Confirm sale' })).toBeDisabled()
    fireEvent.submit(form!)
    expect(api.sell).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByLabelText('Trade date'), { target: { value: '2026-08-01' } })
    expect(await within(dialog).findByText('15 shares available on this date.')).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Confirm sale' })).toBeEnabled())

    fireEvent.change(within(dialog).getByLabelText('Trade date'), { target: { value: '2026-06-01' } })
    fireEvent.change(within(dialog).getByLabelText('Number of shares'), { target: { value: '5' } })
    expect(await within(dialog).findByText('5 shares available on this date.')).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Confirm sale' })).toBeEnabled())
    fireEvent.submit(form!)
    await waitFor(() => expect(api.sell).toHaveBeenCalledOnce())
    expect(api.sell).toHaveBeenCalledWith(expect.objectContaining({ quantity: 5n, tradeDate: '2026-06-01' }))
  })

  it('keeps correction versions tied to the opened draft and resets it after a conflict', async () => {
    const refreshedLot = { ...lot, quantity: 12n, unitCost: new Decimal('11.25'), version: 8n } as PortfolioSnapshot['lots'][number]
    const refreshedSnapshot = snapshot({
      summary: { ...snapshot().summary, version: 5n },
      lots: [refreshedLot],
    })
    api.fetchPortfolioSnapshot
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValue(refreshedSnapshot)
    api.correctLot
      .mockRejectedValueOnce(new MarketApiError({ kind: 'conflict', status: 409, message: 'stale lot' }))
      .mockResolvedValue({ activityId: '99999999-9999-4999-8999-999999999999', portfolioVersion: 6n })

    renderPage()
    await screen.findByText('Holdings value')
    fireEvent.click(screen.getByRole('tab', { name: /Purchase lots/i }))
    const firstAction = await screen.findByRole('button', { name: 'Actions for HBL purchase' })
    await waitFor(() => expect(firstAction).toBeEnabled())
    fireEvent.click(firstAction)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Correct purchase' }))
    const staleDialog = screen.getByRole('dialog', { name: 'Correct HBL purchase' })
    fireEvent.change(within(staleDialog).getByLabelText('Shares'), { target: { value: '6' } })
    fireEvent.change(within(staleDialog).getByLabelText('Unit cost'), { target: { value: '9.5' } })
    fireEvent.change(within(staleDialog).getByLabelText(/Reason for correction/), { target: { value: 'Fix stale entry' } })
    fireEvent.click(within(staleDialog).getByRole('button', { name: 'Save correction' }))

    await waitFor(() => expect(api.correctLot).toHaveBeenCalledOnce())
    const staleBody = api.correctLot.mock.calls[0][1]
    expect(staleBody).toMatchObject({
      quantity: 6n,
      unitCost: new Decimal('9.5'),
      expectedLotVersion: 7n,
      expectedPortfolioVersion: 4n,
    })
    await waitFor(() => expect(api.fetchPortfolioSnapshot).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(LOT_CORRECTION_CONFLICT_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Correct HBL purchase' })).not.toBeInTheDocument()
    expect(api.correctLot).toHaveBeenCalledOnce()

    const refreshedAction = screen.getByRole('button', { name: 'Actions for HBL purchase' })
    await waitFor(() => expect(refreshedAction).toBeEnabled())
    fireEvent.click(refreshedAction)
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Correct purchase' }))
    const refreshedDialog = screen.getByRole('dialog', { name: 'Correct HBL purchase' })
    expect(within(refreshedDialog).getByLabelText('Shares')).toHaveValue('12')
    expect(within(refreshedDialog).getByLabelText('Unit cost')).toHaveValue('11.25')
    fireEvent.change(within(refreshedDialog).getByLabelText(/Reason for correction/), { target: { value: 'Confirm refreshed entry' } })
    fireEvent.click(within(refreshedDialog).getByRole('button', { name: 'Save correction' }))
    await waitFor(() => expect(api.correctLot).toHaveBeenCalledTimes(2))
    const refreshedBody = api.correctLot.mock.calls[1][1]
    expect(refreshedBody).toMatchObject({
      quantity: 12n,
      unitCost: new Decimal('11.25'),
      expectedLotVersion: 8n,
      expectedPortfolioVersion: 5n,
    })
    expect(refreshedBody.mutationId).not.toBe(staleBody.mutationId)
  })

  it('presents activity history without exposing audit implementation fields', async () => {
    const { container } = renderPage()
    await screen.findByText('Holdings value')
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }))
    expect(screen.getByText('Activity history')).toBeInTheDocument()
    expect(screen.getByText('Imported sale')).toBeInTheDocument()
    expect(screen.getByText(/Imported historical record/)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/position-neutral|positionEffect|portfolioVersion|lotVersion|mutationId|sourceKind/i)
  })

  it('keeps reads visible and disables changes after the write gate returns 503', async () => {
    api.buy.mockRejectedValue(new MarketApiError({ kind: 'writes_unavailable', status: 503, message: 'gate closed' }))
    renderPage()
    await openAndCompleteBuy()
    expect(api.buy).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 2n,
      expectedPortfolioVersion: 4n,
    }))
    expect(await screen.findByText(PORTFOLIO_WRITES_UNAVAILABLE_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText('Holdings value')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm purchase' })).toBeDisabled()
  })

  it('refreshes and translates a conflict without exposing concurrency details', async () => {
    api.buy.mockRejectedValue(new MarketApiError({ kind: 'conflict', status: 409, message: 'stale version' }))
    renderPage()
    await openAndCompleteBuy()
    await waitFor(() => expect(api.fetchPortfolioSnapshot).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(PORTFOLIO_CONFLICT_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByText(/stale version|portfolio version|mutation/i)).not.toBeInTheDocument()
  })

  it('clears private UI and requests authentication after a 401', async () => {
    api.fetchPortfolioSnapshot.mockRejectedValue(new MarketApiError({ kind: 'unauthenticated', status: 401, message: 'unauthorized' }))
    renderPage()
    expect(await screen.findByText(PORTFOLIO_AUTH_REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(screen.getByTestId('auth-request')).toBeInTheDocument()
    expect(screen.queryByText('Holdings value')).not.toBeInTheDocument()
  })
})
