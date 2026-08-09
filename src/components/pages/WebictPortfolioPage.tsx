/* eslint-disable react-refresh/only-export-components */
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import Decimal from 'decimal.js'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { MarketApiError, getErrorMessage } from '../../lib/api/errors'
import { expectDate } from '../../lib/api/json'
import { fetchLatestMarketSummary } from '../../lib/api/market'
import {
  buy,
  correctLot,
  deleteWatchlistItem,
  fetchPortfolioSnapshot,
  putWatchlistItem,
  removePosition,
  sell,
  type PortfolioSnapshot,
} from '../../lib/api/portfolio'
import type {
  HoldingResponse,
  IsoDate,
  LotCorrectionRequest,
  MarketTickerDto,
  NativeTradeRequest,
  PortfolioActivityResponse,
  PortfolioMutationResponse,
  PositionLotResponse,
  PositionRemovalRequest,
  WatchlistItemResponse,
} from '../../lib/api/types'
import { createMutationCommand, executeWithReconciliation } from '../../lib/portfolio/mutationCommand'
import { formatNumeric } from '../../lib/numericPresentation'
import { clearAllPrivateState, registerPrivateStateReset } from '../../lib/privateState'
import { AuthModal } from '../AuthModal'

const CARD = {
  bgcolor: 'var(--wc-surface)',
  border: '1px solid var(--wc-border)',
  borderRadius: 2.5,
  boxShadow: '0 12px 32px rgba(10, 46, 120, 0.045)',
} as const

const TABLE_HEAD = {
  color: 'var(--wc-text-secondary)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  borderColor: 'var(--wc-divider)',
} as const

type PortfolioTab = 'holdings' | 'activity' | 'lots' | 'watchlist'
type TradeSide = 'BUY' | 'SELL'
type TradeDraft = {
  side: TradeSide
  symbol: string
  quantity: string
  unitPrice: string
  commissionRate: string
  tradeDate: string
  quoteDate: IsoDate | null
}
type CorrectionDraft = {
  lotId: string
  symbol: string
  expectedLotVersion: bigint
  expectedPortfolioVersion: bigint
  quantity: string
  unitCost: string
  acquisitionDate: string
  correctionDate: string
  reason: string
}
type RemovalDraft = { symbol: string; effectiveDate: string; reason: string }
type CommandOutcome = 'succeeded' | 'conflict' | 'writes_unavailable' | 'unknown_outcome' | 'failed'
type TradeCalculation = {
  grossUnitPrice: Decimal
  commissionRate: Decimal
  commissionPerShare: Decimal
  adjustedUnitPrice: Decimal
  grossValue: Decimal
  totalCommission: Decimal
  adjustedTotal: Decimal
}

export const PORTFOLIO_CONFLICT_MESSAGE = 'Your portfolio changed. Review the latest values and try again.'
export const LOT_CORRECTION_CONFLICT_MESSAGE = 'This lot changed while you were editing it. Review the latest values before correcting it again.'
export const PORTFOLIO_WRITES_UNAVAILABLE_MESSAGE = 'Portfolio changes are temporarily unavailable.'
export const PORTFOLIO_AUTH_REQUIRED_MESSAGE = 'Your session has ended. Sign in to view your portfolio.'

export function localCalendarDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function aggregateCostBasis(holdings: readonly HoldingResponse[]): Decimal {
  return holdings.reduce((total, holding) => total.plus(holding.totalCost), new Decimal(0))
}

export function translatePortfolioError(error: unknown): string {
  if (error instanceof MarketApiError) {
    if (error.status === 409) return PORTFOLIO_CONFLICT_MESSAGE
    if (error.status === 503) return PORTFOLIO_WRITES_UNAVAILABLE_MESSAGE
    if (error.status === 401) return PORTFOLIO_AUTH_REQUIRED_MESSAGE
  }
  return getErrorMessage(error)
}

function asDate(value: string, label: string): IsoDate {
  return expectDate(value, label)
}

function money(value: Decimal | null): string {
  return value == null ? 'N/A' : `PKR ${formatNumeric(value, 2, 'N/A')}`
}

function moneyDetailed(value: Decimal): string {
  return `PKR ${formatNumeric(value, 6, 'N/A')}`
}

function positiveQuantity(value: string): bigint | null {
  if (!/^\d+$/.test(value.trim())) return null
  try {
    const quantity = BigInt(value.trim())
    return quantity > 0n ? quantity : null
  } catch {
    return null
  }
}

function validPrice(value: string): boolean {
  try {
    const price = new Decimal(value)
    return price.isFinite() && !price.isNegative()
  } catch {
    return false
  }
}

function validCommissionRate(value: string): boolean {
  try {
    const rate = new Decimal(value)
    return rate.isFinite() && rate.greaterThanOrEqualTo(0) && rate.lessThan(100)
  } catch {
    return false
  }
}

export function calculateCommissionAdjustedTrade(
  side: TradeSide,
  grossUnitPriceText: string,
  commissionRateText: string,
  quantity: bigint,
): TradeCalculation | null {
  if (!validPrice(grossUnitPriceText) || !validCommissionRate(commissionRateText) || quantity <= 0n) return null
  const grossUnitPrice = new Decimal(grossUnitPriceText)
  const commissionRate = new Decimal(commissionRateText)
  const rateFraction = commissionRate.dividedBy(100)
  const adjustedUnitPrice = grossUnitPrice
    .times(side === 'BUY' ? new Decimal(1).plus(rateFraction) : new Decimal(1).minus(rateFraction))
    .toDecimalPlaces(6, Decimal.ROUND_HALF_UP)
  const commissionPerShare = side === 'BUY'
    ? adjustedUnitPrice.minus(grossUnitPrice)
    : grossUnitPrice.minus(adjustedUnitPrice)
  const decimalQuantity = new Decimal(quantity.toString())
  return {
    grossUnitPrice,
    commissionRate,
    commissionPerShare,
    adjustedUnitPrice,
    grossValue: grossUnitPrice.times(decimalQuantity),
    totalCommission: commissionPerShare.times(decimalQuantity),
    adjustedTotal: adjustedUnitPrice.times(decimalQuantity),
  }
}

function formatCalendarDate(value: IsoDate): string {
  const [year, month, day] = value.split('-')
  const monthNames: Record<string, string> = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' }
  const monthName = monthNames[month]
  return monthName ? `${day.replace(/^0/, '')} ${monthName} ${year}` : value
}

function availableSellQuantity(
  lots: readonly PositionLotResponse[],
  holding: HoldingResponse | null,
  tradeDate: string,
): bigint {
  if (!holding || !tradeDate) return 0n
  return lots.reduce(
    (available, lot) => lot.securityId === holding.securityId && lot.acquisitionDate <= tradeDate
      ? available + lot.quantity
      : available,
    0n,
  )
}

function friendlyActivityLabel(activity: PortfolioActivityResponse): string {
  if (activity.activityType === 'legacy_trade') {
    return activity.side === 'SELL' ? 'Imported sale' : 'Imported purchase'
  }
  if (activity.activityType.includes('correction')) return 'Purchase corrected'
  if (activity.activityType.includes('removal')) return 'Position removed'
  if (activity.side === 'BUY') return 'Shares purchased'
  if (activity.side === 'SELL') return 'Shares sold'
  return 'Portfolio updated'
}

function activityDetail(activity: PortfolioActivityResponse): string | null {
  if (activity.reason) return activity.reason
  if (activity.beforeQuantity != null || activity.afterQuantity != null) {
    return `Quantity ${activity.beforeQuantity?.toString() ?? 'N/A'} → ${activity.afterQuantity?.toString() ?? 'N/A'} · Cost ${money(activity.beforeUnitCost)} → ${money(activity.afterUnitCost)}`
  }
  if (activity.activityType === 'legacy_trade' && activity.side === 'SELL') {
    return 'Imported historical record'
  }
  return null
}

export function WebictPortfolioPage() {
  const { user, loading: authLoading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null)
  const [catalogue, setCatalogue] = useState<MarketTickerDto[]>([])
  const [catalogueDate, setCatalogueDate] = useState<IsoDate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [writesUnavailable, setWritesUnavailable] = useState(false)
  const [retryUnknown, setRetryUnknown] = useState<(() => Promise<void>) | null>(null)
  const [tab, setTab] = useState<PortfolioTab>('holdings')
  const [trade, setTrade] = useState<TradeDraft | null>(null)
  const [correction, setCorrection] = useState<CorrectionDraft | null>(null)
  const [removal, setRemoval] = useState<RemovalDraft | null>(null)
  const [watchlistBusy, setWatchlistBusy] = useState(false)

  const resetPrivate = useCallback(() => {
    setSnapshot(null)
    setError(null)
    setNotice(null)
    setSuccessToast(null)
    setRetryUnknown(null)
    setTrade(null)
    setCorrection(null)
    setRemoval(null)
    setWritesUnavailable(false)
    setWatchlistBusy(false)
  }, [])

  useEffect(() => registerPrivateStateReset(resetPrivate), [resetPrivate])

  const handleError = useCallback((reason: unknown) => {
    if (reason instanceof MarketApiError && reason.status === 401) {
      clearAllPrivateState()
      setAuthModalOpen(true)
    }
    if (reason instanceof MarketApiError && reason.status === 503) setWritesUnavailable(true)
    setError(translatePortfolioError(reason))
  }, [])

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const next = await fetchPortfolioSnapshot(signal)
      setSnapshot(next)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    if (!user) {
      resetPrivate()
      if (!authLoading) setAuthModalOpen(true)
      return () => controller.abort()
    }
    void refresh(controller.signal).catch((reason) => {
      if (!controller.signal.aborted) handleError(reason)
    })
    return () => controller.abort()
  }, [authLoading, handleError, refresh, resetPrivate, user])

  useEffect(() => {
    const controller = new AbortController()
    fetchLatestMarketSummary(controller.signal)
      .then((response) => {
        setCatalogue(response.tickers)
        setCatalogueDate(response.tradeDate)
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  const runCommand = useCallback(async <TBody extends NativeTradeRequest | LotCorrectionRequest | PositionRemovalRequest>(
    makeBody: (mutationId: NativeTradeRequest['mutationId']) => TBody,
    transport: (body: Readonly<TBody>) => Promise<PortfolioMutationResponse | unknown>,
  ): Promise<CommandOutcome> => {
    const command = createMutationCommand(makeBody, transport)
    const completeAttempt = async (retry: boolean): Promise<CommandOutcome> => {
      const outcome = await executeWithReconciliation(command, retry, refresh)
      if (outcome.kind === 'succeeded') {
        setRetryUnknown(null)
        setError(null)
        setNotice(null)
      } else if (outcome.kind === 'conflict') {
        setRetryUnknown(null)
        setNotice(null)
        setError(PORTFOLIO_CONFLICT_MESSAGE)
      } else if (outcome.kind === 'writes_unavailable') {
        setWritesUnavailable(true)
        setRetryUnknown(null)
        setError(null)
        setNotice(PORTFOLIO_WRITES_UNAVAILABLE_MESSAGE)
      } else if (outcome.kind === 'unknown_outcome') {
        setRetryUnknown(() => async () => { await completeAttempt(true) })
        setNotice(null)
        setError('We could not confirm whether this change was saved. You can safely retry the same request.')
      } else {
        setRetryUnknown(null)
        setNotice(null)
        handleError(outcome.error)
      }
      return outcome.kind
    }
    return completeAttempt(false)
  }, [handleError, refresh])

  const openTrade = useCallback((side: TradeSide) => {
    const holding = side === 'SELL' ? snapshot?.holdings[0] ?? null : null
    setError(null)
    setTrade({
      side,
      symbol: holding?.symbol ?? '',
      quantity: '',
      unitPrice: holding?.latestPrice?.toString() ?? '',
      commissionRate: '0.15',
      tradeDate: localCalendarDate(),
      quoteDate: holding?.latestPrice != null ? holding.latestPriceDate : null,
    })
  }, [snapshot])

  const submitTrade = useCallback(async () => {
    if (!snapshot || !trade) return
    const quantity = positiveQuantity(trade.quantity)
    if (quantity == null) return
    const calculation = calculateCommissionAdjustedTrade(trade.side, trade.unitPrice, trade.commissionRate, quantity)
    if (!calculation) return
    const symbol = trade.symbol.trim().toUpperCase()
    if (trade.side === 'SELL') {
      const holding = snapshot.holdings.find((candidate) => candidate.symbol === symbol) ?? null
      const available = availableSellQuantity(snapshot.lots, holding, trade.tradeDate)
      if (available === 0n || quantity > available) return
    }
    try {
      const outcome = await runCommand(
        (mutationId) => ({
          mutationId,
          symbol,
          quantity,
          unitPrice: calculation.adjustedUnitPrice,
          tradeDate: asDate(trade.tradeDate, 'tradeDate'),
          expectedPortfolioVersion: snapshot.summary.version,
        }),
        (body) => trade.side === 'BUY' ? buy(body) : sell(body),
      )
      if (outcome === 'succeeded') {
        setTrade(null)
        setSuccessToast(trade.side === 'BUY' ? `${symbol} shares added successfully.` : `${symbol} shares sold successfully.`)
      }
    } catch (reason) {
      handleError(reason)
    }
  }, [handleError, runCommand, snapshot, trade])

  const submitCorrection = useCallback(async () => {
    if (!correction || !correction.reason.trim()) return
    try {
      const outcome = await runCommand(
        (mutationId) => ({
          mutationId,
          quantity: BigInt(correction.quantity),
          unitCost: new Decimal(correction.unitCost),
          acquisitionDate: asDate(correction.acquisitionDate, 'acquisitionDate'),
          correctionDate: asDate(correction.correctionDate, 'correctionDate'),
          expectedLotVersion: correction.expectedLotVersion,
          expectedPortfolioVersion: correction.expectedPortfolioVersion,
          reason: correction.reason.trim(),
        }),
        (body) => correctLot(correction.lotId, body),
      )
      if (outcome === 'succeeded') {
        setCorrection(null)
        setSuccessToast('Purchase lot updated successfully.')
      }
      if (outcome === 'conflict') {
        setCorrection(null)
        setError(LOT_CORRECTION_CONFLICT_MESSAGE)
      }
    } catch (reason) {
      handleError(reason)
    }
  }, [correction, handleError, runCommand])

  const submitRemoval = useCallback(async () => {
    if (!snapshot || !removal || !removal.reason.trim()) return
    const currentHolding = snapshot.holdings.find((holding) => holding.symbol === removal.symbol)
    if (!currentHolding) {
      setRemoval(null)
      setError(PORTFOLIO_CONFLICT_MESSAGE)
      return
    }
    try {
      const outcome = await runCommand(
        (mutationId) => ({
          mutationId,
          effectiveDate: asDate(removal.effectiveDate, 'effectiveDate'),
          expectedPortfolioVersion: snapshot.summary.version,
          reason: removal.reason.trim(),
        }),
        (body) => removePosition(currentHolding.symbol, body),
      )
      if (outcome === 'succeeded') {
        setRemoval(null)
        setSuccessToast(`${currentHolding.symbol} position removed successfully.`)
      }
    } catch (reason) {
      handleError(reason)
    }
  }, [handleError, removal, runCommand, snapshot])

  const addWatchlistSymbol = useCallback(async (ticker: MarketTickerDto) => {
    if (!snapshot || watchlistBusy || writesUnavailable) return
    setWatchlistBusy(true)
    try {
      const item = await putWatchlistItem(ticker.symbol)
      setSnapshot((current) => current ? {
        ...current,
        watchlist: [...current.watchlist.filter((existing) => existing.symbol !== item.symbol), item],
      } : current)
      setError(null)
      setSuccessToast(`${item.symbol} added to your watchlist.`)
    } catch (reason) {
      handleError(reason)
    } finally {
      setWatchlistBusy(false)
    }
  }, [handleError, snapshot, watchlistBusy, writesUnavailable])

  const removeWatchlistSymbol = useCallback(async (symbol: string) => {
    if (!snapshot || watchlistBusy || writesUnavailable) return
    setWatchlistBusy(true)
    try {
      await deleteWatchlistItem(symbol)
      setSnapshot((current) => current ? {
        ...current,
        watchlist: current.watchlist.filter((item) => item.symbol !== symbol),
      } : current)
      setError(null)
      setSuccessToast(`${symbol} removed from your watchlist.`)
    } catch (reason) {
      handleError(reason)
    } finally {
      setWatchlistBusy(false)
    }
  }, [handleError, snapshot, watchlistBusy, writesUnavailable])

  const mutationsDisabled = writesUnavailable || loading || !snapshot
  const selectedSellHolding = trade?.side === 'SELL'
    ? snapshot?.holdings.find((holding) => holding.symbol === trade.symbol) ?? null
    : null
  const eligibleSellQuantity = trade?.side === 'SELL'
    ? availableSellQuantity(snapshot?.lots ?? [], selectedSellHolding, trade.tradeDate)
    : null
  const parsedTradeQuantity = trade ? positiveQuantity(trade.quantity) : null
  const tradeCalculation = trade && parsedTradeQuantity != null
    ? calculateCommissionAdjustedTrade(trade.side, trade.unitPrice, trade.commissionRate, parsedTradeQuantity)
    : null
  const exceedsAvailable = Boolean(
    trade?.side === 'SELL'
    && parsedTradeQuantity != null
    && eligibleSellQuantity != null
    && parsedTradeQuantity > eligibleSellQuantity,
  )
  const tradeReady = Boolean(
    trade
    && trade.symbol
    && parsedTradeQuantity != null
    && tradeCalculation != null
    && trade.tradeDate
    && (trade.side === 'BUY' || (selectedSellHolding != null && eligibleSellQuantity != null && eligibleSellQuantity > 0n))
    && !exceedsAvailable,
  )

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        bgcolor: 'var(--wc-bg)',
        pt: { xs: 'var(--wc-page-top-xs)', md: 'var(--wc-page-top-md)' },
        pb: { xs: 'var(--wc-page-bottom-xs)', md: 'var(--wc-page-bottom-md)' },
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: '1280px !important', px: { xs: 'var(--wc-page-gutter-xs)', md: 'var(--wc-page-gutter-md)' } }}>
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ color: 'var(--wc-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 1 }}>
                Investments
              </Typography>
              <Typography component="h1" sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-display)', fontSize: { xs: '2.15rem', md: '3rem' }, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
                My Portfolio
              </Typography>
            </Box>
            {snapshot && (
              <Stack direction="row" spacing={1.25} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button fullWidth startIcon={<AddRoundedIcon />} variant="contained" disabled={mutationsDisabled} onClick={() => openTrade('BUY')} sx={{ minWidth: { sm: 145 } }}>
                  Buy shares
                </Button>
                <Button fullWidth startIcon={<RemoveRoundedIcon />} variant="outlined" disabled={mutationsDisabled || snapshot.holdings.length === 0} onClick={() => openTrade('SELL')} sx={{ minWidth: { sm: 145 } }}>
                  Sell shares
                </Button>
              </Stack>
            )}
          </Stack>

          {!user && !authLoading && (
            <EmptyState
              icon={<ShowChartRoundedIcon />}
              title="Sign in to see your investments"
              description="Your holdings and activity are available after you sign in."
              action={<Button variant="contained" onClick={() => setAuthModalOpen(true)}>Sign in</Button>}
            />
          )}
          {loading && !snapshot && <Stack direction="row" spacing={1.5} sx={{ py: 7, justifyContent: 'center', alignItems: 'center' }}><CircularProgress size={22} /><Typography color="text.secondary">Loading your portfolio…</Typography></Stack>}
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {notice && <PortfolioWriteGateNotice unavailable={writesUnavailable}>{notice}</PortfolioWriteGateNotice>}
          {retryUnknown && <Button variant="contained" color="warning" onClick={() => void retryUnknown()} sx={{ alignSelf: 'flex-start' }}>Retry request</Button>}

          {snapshot && (
            <>
              <PortfolioSummary snapshot={snapshot} />

              <Box sx={{ ...CARD, overflow: 'hidden' }}>
                <Tabs
                  value={tab}
                  onChange={(_event, value: PortfolioTab) => setTab(value)}
                  aria-label="Portfolio sections"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ px: { xs: 1, md: 2 }, borderBottom: '1px solid var(--wc-divider)', minHeight: 56 }}
                >
                  <Tab value="holdings" label="Holdings" />
                  <Tab value="activity" label="Activity" />
                  <Tab value="lots" label={<Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}><span>Purchase lots</span><Chip label="Advanced" size="small" /></Stack>} />
                  <Tab value="watchlist" label="Watchlist" />
                </Tabs>
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                  {tab === 'holdings' && (
                    <HoldingsPanel
                      holdings={snapshot.holdings}
                      writesDisabled={mutationsDisabled}
                      onBuy={() => openTrade('BUY')}
                      onRemove={(holding) => setRemoval({ symbol: holding.symbol, effectiveDate: localCalendarDate(), reason: '' })}
                    />
                  )}
                  {tab === 'activity' && <ActivityPanel activity={snapshot.activity} />}
                  {tab === 'lots' && (
                    <LotsPanel
                      lots={snapshot.lots}
                      writesDisabled={mutationsDisabled}
                      onCorrect={(lot) => setCorrection({ lotId: lot.id, symbol: lot.symbol, expectedLotVersion: lot.version, expectedPortfolioVersion: snapshot.summary.version, quantity: lot.quantity.toString(), unitCost: lot.unitCost.toString(), acquisitionDate: lot.acquisitionDate, correctionDate: localCalendarDate(), reason: '' })}
                    />
                  )}
                  {tab === 'watchlist' && (
                    <WatchlistPanel
                      items={snapshot.watchlist}
                      catalogue={catalogue}
                      disabled={mutationsDisabled || watchlistBusy}
                      onAdd={(ticker) => void addWatchlistSymbol(ticker)}
                      onRemove={(symbol) => void removeWatchlistSymbol(symbol)}
                    />
                  )}
                </Box>
              </Box>
            </>
          )}
        </Stack>
      </Container>

      <TradeDialog
        draft={trade}
        catalogue={catalogue}
        catalogueDate={catalogueDate}
        holdings={snapshot?.holdings ?? []}
        selectedHolding={selectedSellHolding}
        eligibleSellQuantity={eligibleSellQuantity}
        exceedsAvailable={exceedsAvailable}
        calculation={tradeCalculation}
        disabled={mutationsDisabled || !tradeReady}
        onChange={setTrade}
        onClose={() => setTrade(null)}
        onSubmit={() => void submitTrade()}
      />
      <CorrectionDialog draft={correction} disabled={mutationsDisabled} onChange={setCorrection} onClose={() => setCorrection(null)} onSubmit={() => void submitCorrection()} />
      <RemovalDialog draft={removal} disabled={mutationsDisabled} onChange={setRemoval} onClose={() => setRemoval(null)} onSubmit={() => void submitRemoval()} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <Snackbar key={successToast} open={Boolean(successToast)} autoHideDuration={5000} onClose={(_event, reason) => { if (reason !== 'clickaway') setSuccessToast(null) }} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccessToast(null)} sx={{ width: '100%' }}>{successToast}</Alert>
      </Snackbar>
    </Box>
  )
}

export function PortfolioWriteGateNotice({ unavailable, children }: { unavailable: boolean; children: React.ReactNode }) {
  return <Alert severity={unavailable ? 'warning' : 'success'}>{children}</Alert>
}

export function PortfolioSummary({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const companyCount = new Set(snapshot.holdings.map((holding) => holding.symbol)).size
  const summaryItems = [
    { label: 'Holdings value', value: money(snapshot.summary.holdingsMarketValue), icon: <PaidOutlinedIcon /> },
    { label: 'Cost basis', value: money(aggregateCostBasis(snapshot.holdings)), icon: <ShowChartRoundedIcon /> },
    { label: 'Companies held', value: companyCount.toLocaleString('en-PK'), icon: <BusinessRoundedIcon /> },
    ...(snapshot.summary.unpricedHoldingCount > 0
      ? [{ label: 'Awaiting a market price', value: snapshot.summary.unpricedHoldingCount.toLocaleString('en-PK'), icon: <ShowChartRoundedIcon /> }]
      : []),
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: `repeat(${summaryItems.length}, minmax(0, 1fr))` }, gap: 1.5 }}>
      {summaryItems.map((item) => (
        <Box key={item.label} sx={{ ...CARD, p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box>
              <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 12, fontWeight: 600, mb: 0.8 }}>{item.label}</Typography>
              <Typography sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-data)', fontSize: { xs: 22, md: 25 }, fontWeight: 700, letterSpacing: '-0.025em' }}>{item.value}</Typography>
            </Box>
            <Box sx={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 2, bgcolor: 'var(--wc-primary-soft)', color: 'var(--wc-primary)', '& svg': { fontSize: 20 } }}>{item.icon}</Box>
          </Stack>
        </Box>
      ))}
    </Box>
  )
}

export function HoldingsPanel({ holdings, writesDisabled, onBuy, onRemove }: {
  holdings: HoldingResponse[]
  writesDisabled: boolean
  onBuy: () => void
  onRemove: (holding: HoldingResponse) => void
}) {
  if (holdings.length === 0) {
    return <EmptyState icon={<BusinessRoundedIcon />} title="No holdings yet" description="Record your first purchase to start building your portfolio." action={<Button variant="contained" startIcon={<AddRoundedIcon />} disabled={writesDisabled} onClick={onBuy}>Buy shares</Button>} />
  }
  return (
    <>
      <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table>
          <TableHead><TableRow>{['Company', 'Shares', 'Average cost', 'Total cost', 'Latest price', 'Market value', ''].map((header) => <TableCell key={header} sx={TABLE_HEAD} align={header && header !== 'Company' ? 'right' : 'left'}>{header}</TableCell>)}</TableRow></TableHead>
          <TableBody>{holdings.map((holding) => <TableRow key={holding.symbol} hover><TableCell sx={{ borderColor: 'var(--wc-divider)' }}><Button component={Link} to={`/stocks/${holding.symbol}`} sx={{ px: 0, fontWeight: 800 }}>{holding.symbol}</Button><Typography variant="body2" color="text.secondary">{holding.companyName ?? 'Company name unavailable'}</Typography></TableCell><TableCell align="right">{formatNumeric(holding.quantity, 0)}</TableCell><TableCell align="right">{money(holding.averageUnitCost)}</TableCell><TableCell align="right">{money(holding.totalCost)}</TableCell><TableCell align="right">{money(holding.latestPrice)}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{money(holding.marketValue)}</TableCell><TableCell align="right"><HoldingActions holding={holding} disabled={writesDisabled} onRemove={onRemove} /></TableCell></TableRow>)}</TableBody>
        </Table>
      </TableContainer>
      <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {holdings.map((holding) => <Box key={holding.symbol} sx={{ border: '1px solid var(--wc-divider)', borderRadius: 2, p: 2 }}><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}><Box><Button component={Link} to={`/stocks/${holding.symbol}`} sx={{ px: 0, fontWeight: 800 }}>{holding.symbol}</Button><Typography variant="body2" color="text.secondary">{holding.companyName ?? 'Company name unavailable'}</Typography></Box><HoldingActions holding={holding} disabled={writesDisabled} onRemove={onRemove} /></Stack><Divider sx={{ my: 1.5 }} /><Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}><Value label="Shares" value={formatNumeric(holding.quantity, 0)} /><Value label="Average cost" value={money(holding.averageUnitCost)} /><Value label="Latest price" value={money(holding.latestPrice)} /><Value label="Market value" value={money(holding.marketValue)} strong /></Box></Box>)}
      </Stack>
    </>
  )
}

export function ActivityPanel({ activity }: { activity: PortfolioActivityResponse[] }) {
  if (activity.length === 0) return <EmptyState icon={<ShowChartRoundedIcon />} title="No activity yet" description="Purchases, sales, corrections, and removals will appear here." />
  return (
    <Stack divider={<Divider flexItem />}>
      <Box sx={{ mb: 1 }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Activity history</Typography><Typography variant="body2" color="text.secondary">A chronological record of changes to your investments.</Typography></Box>
      {activity.map((item) => {
        const detail = activityDetail(item)
        return <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} sx={{ py: 2, alignItems: { sm: 'center' } }}><Box sx={{ flex: 1 }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}><Typography sx={{ fontWeight: 700 }}>{friendlyActivityLabel(item)}</Typography><Chip label={item.symbol} size="small" variant="outlined" /></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.tradeDate}{detail ? ` · ${detail}` : ''}</Typography></Box><Box sx={{ textAlign: { sm: 'right' } }}><Typography sx={{ fontFamily: 'var(--wc-font-data)', fontWeight: 700 }}>{formatNumeric(item.quantity, 0)} shares</Typography><Typography variant="body2" color="text.secondary">{money(item.unitPrice)}</Typography></Box></Stack>
      })}
    </Stack>
  )
}

export function LotsPanel({ lots, writesDisabled, onCorrect }: { lots: PositionLotResponse[]; writesDisabled: boolean; onCorrect: (lot: PositionLotResponse) => void }) {
  if (lots.length === 0) return <EmptyState icon={<ShowChartRoundedIcon />} title="No purchase lots" description="Detailed purchase lots will appear after you record a purchase." />
  return (
    <>
      <Box sx={{ mb: 2 }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Purchase lots</Typography><Typography variant="body2" color="text.secondary">Advanced purchase-level detail used for cost tracking.</Typography></Box>
      <TableContainer>
        <Table size="small">
          <TableHead><TableRow>{['Symbol', 'Shares', 'Unit cost', 'Purchase date', ''].map((header) => <TableCell key={header} sx={TABLE_HEAD} align={header && header !== 'Symbol' ? 'right' : 'left'}>{header}</TableCell>)}</TableRow></TableHead>
          <TableBody>{lots.map((lot) => <TableRow key={lot.id} hover><TableCell sx={{ fontWeight: 700 }}>{lot.symbol}</TableCell><TableCell align="right">{formatNumeric(lot.quantity, 0)}</TableCell><TableCell align="right">{money(lot.unitCost)}</TableCell><TableCell align="right">{lot.acquisitionDate}</TableCell><TableCell align="right"><LotActions lot={lot} disabled={writesDisabled} onCorrect={onCorrect} /></TableCell></TableRow>)}</TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

function WatchlistPanel({ items, catalogue, disabled, onAdd, onRemove }: {
  items: WatchlistItemResponse[]
  catalogue: MarketTickerDto[]
  disabled: boolean
  onAdd: (ticker: MarketTickerDto) => void
  onRemove: (symbol: string) => void
}) {
  return (
    <Stack spacing={2.5}>
      <Box sx={{ maxWidth: 560 }}>
        <SymbolAutocomplete
          catalogue={catalogue}
          value={null}
          excludedSymbols={items.map((item) => item.symbol)}
          disabled={disabled}
          label="Add company to watchlist"
          onSelect={(ticker) => { if (ticker && !disabled) onAdd(ticker) }}
        />
      </Box>
      {items.length === 0 ? (
        <EmptyState icon={<ShowChartRoundedIcon />} title="Your watchlist is empty" description="Add companies to keep their latest market prices close at hand." />
      ) : (
        <TableContainer>
          <Table>
            <TableHead><TableRow>{['Symbol', 'Company', 'Latest price', 'Price date', ''].map((header) => <TableCell key={header} sx={TABLE_HEAD} align={header === 'Latest price' || header === 'Price date' ? 'right' : 'left'}>{header}</TableCell>)}</TableRow></TableHead>
            <TableBody>{items.map((item) => (
              <TableRow key={item.symbol} hover>
                <TableCell sx={{ fontWeight: 750 }}>{item.symbol}</TableCell>
                <TableCell>{item.companyName ?? 'Company name unavailable'}</TableCell>
                <TableCell align="right">{money(item.latestPrice)}</TableCell>
                <TableCell align="right">{item.latestPriceDate ? formatCalendarDate(item.latestPriceDate) : 'N/A'}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    <Button component={Link} to={`/stocks/${item.symbol}`} size="small">Open company</Button>
                    <Button color="error" size="small" disabled={disabled} onClick={() => onRemove(item.symbol)}>Remove</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}

function SymbolAutocomplete({ catalogue, value, excludedSymbols = [], disabled = false, label, onSelect }: {
  catalogue: MarketTickerDto[]
  value: MarketTickerDto | null
  excludedSymbols?: string[]
  disabled?: boolean
  label: string
  onSelect: (ticker: MarketTickerDto | null) => void
}) {
  const excluded = new Set(excludedSymbols)
  return (
    <Autocomplete
      disabled={disabled}
      options={catalogue.filter((ticker) => !excluded.has(ticker.symbol))}
      value={value}
      onChange={(_event, ticker) => onSelect(ticker)}
      isOptionEqualToValue={(option, selected) => option.symbol === selected.symbol}
      getOptionLabel={(ticker) => `${ticker.symbol} — ${ticker.companyName ?? 'Company name unavailable'}`}
      filterOptions={(options, state) => {
        const query = state.inputValue.trim().toLocaleLowerCase()
        return options.filter((ticker) => !query
          || ticker.symbol.toLocaleLowerCase().includes(query)
          || (ticker.companyName ?? '').toLocaleLowerCase().includes(query))
      }}
      renderOption={(props, ticker) => (
        <Box component="li" {...props} key={ticker.symbol} sx={{ display: 'block !important', py: '9px !important' }}>
          <Typography sx={{ fontWeight: 750 }}>{ticker.symbol} — {ticker.companyName ?? 'Company name unavailable'}</Typography>
          <Typography variant="body2" color="text.secondary">Latest: {money(ticker.close)}</Typography>
        </Box>
      )}
      renderInput={(params) => <TextField {...params} label={label} placeholder="Search by symbol or company" />}
    />
  )
}

function TradeDialog({ draft, catalogue, catalogueDate, holdings, selectedHolding, eligibleSellQuantity, exceedsAvailable, calculation, disabled, onChange, onClose, onSubmit }: {
  draft: TradeDraft | null
  catalogue: MarketTickerDto[]
  catalogueDate: IsoDate | null
  holdings: HoldingResponse[]
  selectedHolding: HoldingResponse | null
  eligibleSellQuantity: bigint | null
  exceedsAvailable: boolean
  calculation: TradeCalculation | null
  disabled: boolean
  onChange: (draft: TradeDraft | null) => void
  onClose: () => void
  onSubmit: () => void
}) {
  if (!draft) return null
  const buying = draft.side === 'BUY'
  const selectedTicker = buying ? catalogue.find((ticker) => ticker.symbol === draft.symbol) ?? null : null
  const quoteHelper = draft.quoteDate
    ? `Latest close as of ${formatCalendarDate(draft.quoteDate)}`
    : 'No recent quote is available. Enter the price manually.'
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{buying ? 'Buy shares' : 'Sell shares'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            {buying ? (
              <SymbolAutocomplete
                catalogue={catalogue}
                value={selectedTicker}
                label="Company or symbol"
                onSelect={(ticker) => {
                  if (ticker?.symbol === draft.symbol) return
                  onChange({
                    ...draft,
                    symbol: ticker?.symbol ?? '',
                    unitPrice: ticker?.close?.toString() ?? '',
                    quoteDate: ticker?.close != null ? catalogueDate : null,
                  })
                }}
              />
            ) : (
              <TextField select label="Holding" value={draft.symbol} onChange={(event) => {
                const holding = holdings.find((candidate) => candidate.symbol === event.target.value) ?? null
                onChange({
                  ...draft,
                  symbol: holding?.symbol ?? '',
                  unitPrice: holding?.latestPrice?.toString() ?? '',
                  quoteDate: holding?.latestPrice != null ? holding.latestPriceDate : null,
                })
              }}>{holdings.map((holding) => <MenuItem key={holding.symbol} value={holding.symbol}>{holding.symbol}{holding.companyName ? ` — ${holding.companyName}` : ''}</MenuItem>)}</TextField>
            )}
            <TextField label="Number of shares" value={draft.quantity} onChange={(event) => onChange({ ...draft, quantity: event.target.value })} error={exceedsAvailable || (!buying && eligibleSellQuantity === 0n)} helperText={!buying && selectedHolding && eligibleSellQuantity != null ? `${formatNumeric(eligibleSellQuantity, 0)} shares available on this date.${exceedsAvailable ? ' Enter a lower quantity.' : ''}` : 'Enter a positive whole number.'} inputMode="numeric" />
            <TextField label="Price per share" value={draft.unitPrice} onChange={(event) => onChange({ ...draft, unitPrice: event.target.value })} helperText={quoteHelper} inputMode="decimal" />
            <TextField label="Commission rate (%)" value={draft.commissionRate} onChange={(event) => onChange({ ...draft, commissionRate: event.target.value })} error={draft.commissionRate !== '' && !validCommissionRate(draft.commissionRate)} helperText="Enter a rate from 0 up to, but not including, 100%." inputMode="decimal" />
            <TextField label="Trade date" type="date" value={draft.tradeDate} onChange={(event) => onChange({ ...draft, tradeDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            {!buying && <Alert severity="info">Shares are sold from your eligible purchases in chronological order.</Alert>}
            {calculation && <TradeBreakdown side={draft.side} calculation={calculation} />}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button type="button" onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={disabled}>{buying ? 'Confirm purchase' : 'Confirm sale'}</Button></DialogActions>
      </Box>
    </Dialog>
  )
}

function TradeBreakdown({ side, calculation }: { side: TradeSide; calculation: TradeCalculation }) {
  const buying = side === 'BUY'
  const rows = [
    ['Market/execution price per share', moneyDetailed(calculation.grossUnitPrice)],
    ['Commission rate', `${calculation.commissionRate.toString()}%`],
    ['Commission per share', moneyDetailed(calculation.commissionPerShare)],
    [buying ? 'Adjusted cost per share' : 'Net price per share', moneyDetailed(calculation.adjustedUnitPrice)],
    ['Gross transaction value', moneyDetailed(calculation.grossValue)],
    ['Total commission', moneyDetailed(calculation.totalCommission)],
    [buying ? 'Total cost' : 'Net proceeds', moneyDetailed(calculation.adjustedTotal)],
  ]
  return (
    <Box sx={{ bgcolor: 'var(--wc-primary-soft)', borderRadius: 2, p: 2 }}>
      <Typography sx={{ fontWeight: 750, mb: 1 }}>Confirmation breakdown</Typography>
      <Stack spacing={0.7}>{rows.map(([label, value]) => <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="body2" sx={{ fontFamily: 'var(--wc-font-data)', fontWeight: 650, textAlign: 'right' }}>{value}</Typography></Stack>)}</Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>The stored portfolio cost uses the commission-adjusted price.</Typography>
    </Box>
  )
}

function CorrectionDialog({ draft, disabled, onChange, onClose, onSubmit }: { draft: CorrectionDraft | null; disabled: boolean; onChange: (draft: CorrectionDraft | null) => void; onClose: () => void; onSubmit: () => void }) {
  if (!draft) return null
  const valid = positiveQuantity(draft.quantity) != null && validPrice(draft.unitCost) && Boolean(draft.reason.trim())
  return <Dialog open fullWidth maxWidth="sm" onClose={onClose}><DialogTitle sx={{ fontWeight: 700 }}>Correct {draft.symbol} purchase</DialogTitle><DialogContent dividers><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Shares" value={draft.quantity} onChange={(event) => onChange({ ...draft, quantity: event.target.value })}/><TextField label="Cost per share, including commission" value={draft.unitCost} onChange={(event) => onChange({ ...draft, unitCost: event.target.value })}/><TextField type="date" label="Purchase date" value={draft.acquisitionDate} onChange={(event) => onChange({ ...draft, acquisitionDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }}/><TextField type="date" label="Correction date" value={draft.correctionDate} onChange={(event) => onChange({ ...draft, correctionDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }}/><TextField required multiline minRows={3} label="Reason for correction" value={draft.reason} onChange={(event) => onChange({ ...draft, reason: event.target.value })}/></Stack></DialogContent><DialogActions sx={{ px: 3, py: 2 }}><Button onClick={onClose}>Cancel</Button><Button variant="contained" disabled={disabled || !valid} onClick={onSubmit}>Save correction</Button></DialogActions></Dialog>
}

function RemovalDialog({ draft, disabled, onChange, onClose, onSubmit }: { draft: RemovalDraft | null; disabled: boolean; onChange: (draft: RemovalDraft | null) => void; onClose: () => void; onSubmit: () => void }) {
  if (!draft) return null
  return <Dialog open fullWidth maxWidth="sm" onClose={onClose}><DialogTitle sx={{ fontWeight: 700 }}>Remove {draft.symbol} position</DialogTitle><DialogContent dividers><Stack spacing={2} sx={{ pt: 1 }}><Alert severity="warning">This closes the position while keeping its activity history.</Alert><TextField type="date" label="Effective date" value={draft.effectiveDate} onChange={(event) => onChange({ ...draft, effectiveDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }}/><TextField required multiline minRows={3} label="Reason for removal" value={draft.reason} onChange={(event) => onChange({ ...draft, reason: event.target.value })}/></Stack></DialogContent><DialogActions sx={{ px: 3, py: 2 }}><Button onClick={onClose}>Cancel</Button><Button color="error" variant="contained" disabled={disabled || !draft.reason.trim()} onClick={onSubmit}>Remove position</Button></DialogActions></Dialog>
}

function HoldingActions({ holding, disabled, onRemove }: { holding: HoldingResponse; disabled: boolean; onRemove: (holding: HoldingResponse) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return <><IconButton aria-label={`Actions for ${holding.symbol}`} disabled={disabled} onClick={(event) => setAnchor(event.currentTarget)}><MoreVertRoundedIcon /></IconButton><Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={() => { setAnchor(null); onRemove(holding) }}><DeleteOutlineRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />Remove position</MenuItem></Menu></>
}

function LotActions({ lot, disabled, onCorrect }: { lot: PositionLotResponse; disabled: boolean; onCorrect: (lot: PositionLotResponse) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return <><IconButton aria-label={`Actions for ${lot.symbol} purchase`} disabled={disabled} onClick={(event) => setAnchor(event.currentTarget)}><MoreVertRoundedIcon /></IconButton><Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={() => { setAnchor(null); onCorrect(lot) }}><EditOutlinedIcon fontSize="small" sx={{ mr: 1.25 }} />Correct purchase</MenuItem></Menu></>
}

function Value({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <Box><Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 11, mb: 0.3 }}>{label}</Typography><Typography sx={{ fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: strong ? 700 : 600 }}>{value}</Typography></Box>
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return <Box sx={{ textAlign: 'center', py: { xs: 5, md: 7 }, px: 2 }}><Box sx={{ display: 'grid', placeItems: 'center', width: 52, height: 52, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: 'var(--wc-primary-soft)', color: 'var(--wc-primary)', '& svg': { fontSize: 25 } }}>{icon}</Box><Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>{title}</Typography><Typography color="text.secondary" sx={{ maxWidth: 430, mx: 'auto', mb: action ? 2.5 : 0 }}>{description}</Typography>{action}</Box>}
