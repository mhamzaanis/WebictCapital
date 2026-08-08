/* eslint-disable react-refresh/only-export-components */
import ReactECharts from 'echarts-for-react'
import Decimal from 'decimal.js'
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { MarketApiError, getErrorMessage } from '../../lib/api/errors'
import { expectDate } from '../../lib/api/json'
import { fetchLatestMarketSummary } from '../../lib/api/market'
import {
  MARKET_INDEX_CODES,
  fetchMarketIndexHistory,
  latestActualObservations,
  type MarketIndexCode,
} from '../../lib/api/marketIndexes'
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
  MarketIndexHistoryResponseDto,
  MarketTickerDto,
  NativeTradeRequest,
  PortfolioMutationResponse,
  PositionLotResponse,
  PositionRemovalRequest,
} from '../../lib/api/types'
import { createMutationCommand, executeWithReconciliation } from '../../lib/portfolio/mutationCommand'
import { formatNumeric, projectNumeric } from '../../lib/numericPresentation'
import { registerPrivateStateReset } from '../../lib/privateState'
import { AuthModal } from '../AuthModal'

const CARD = {
  bgcolor: 'var(--wc-surface)',
  border: '1px solid var(--wc-border)',
  borderRadius: 2,
  p: 2,
} as const

type TradeDraft = { side: 'BUY' | 'SELL'; symbol: string; quantity: string; unitPrice: string; tradeDate: string }
type CorrectionDraft = {
  lot: PositionLotResponse
  quantity: string
  unitCost: string
  acquisitionDate: string
  correctionDate: string
  reason: string
}
type RemovalDraft = { holding: HoldingResponse; effectiveDate: string; reason: string }

export function localCalendarDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function asDate(value: string, label: string): IsoDate {
  return expectDate(value, label)
}

function money(value: Decimal | null): string {
  return value == null ? 'N/A' : `PKR ${formatNumeric(value, 2, 'N/A')}`
}

function indexChartOption(response: MarketIndexHistoryResponseDto | null) {
  const points = response ? latestActualObservations(response) : []
  return {
    animation: false,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: points.map((point) => point.tradeDate) },
    yAxis: { type: 'value', scale: true },
    dataZoom: [{ type: 'inside' }],
    series: [{
      name: response?.displayName ?? response?.code ?? 'Index',
      type: 'line',
      showSymbol: false,
      connectNulls: false,
      data: points.map((point) => point.close == null ? null : projectNumeric(point.close, 'portfolio index chart close')),
    }],
  }
}

export function WebictPortfolioPage() {
  const { user, loading: authLoading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null)
  const [catalogue, setCatalogue] = useState<MarketTickerDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [writesUnavailable, setWritesUnavailable] = useState(false)
  const [retryUnknown, setRetryUnknown] = useState<(() => Promise<void>) | null>(null)
  const [trade, setTrade] = useState<TradeDraft>({ side: 'BUY', symbol: '', quantity: '', unitPrice: '', tradeDate: localCalendarDate() })
  const [correction, setCorrection] = useState<CorrectionDraft | null>(null)
  const [removal, setRemoval] = useState<RemovalDraft | null>(null)
  const [indexCode, setIndexCode] = useState<MarketIndexCode>('KSE100')
  const [indexHistory, setIndexHistory] = useState<MarketIndexHistoryResponseDto | null>(null)

  const resetPrivate = useCallback(() => {
    setSnapshot(null)
    setError(null)
    setNotice(null)
    setRetryUnknown(null)
    setCorrection(null)
    setRemoval(null)
    setWritesUnavailable(false)
  }, [])

  useEffect(() => registerPrivateStateReset(resetPrivate), [resetPrivate])

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
      if (!controller.signal.aborted) setError(getErrorMessage(reason))
    })
    return () => controller.abort()
  }, [authLoading, refresh, resetPrivate, user])

  useEffect(() => {
    const controller = new AbortController()
    fetchLatestMarketSummary(controller.signal)
      .then((response) => setCatalogue(response.tickers))
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchMarketIndexHistory(
      indexCode,
      { from: '2021-01-01', to: localCalendarDate() },
      controller.signal,
    ).then(setIndexHistory).catch((reason) => {
      if (!controller.signal.aborted) setError(getErrorMessage(reason))
    })
    return () => controller.abort()
  }, [indexCode])

  const runCommand = useCallback(async <TBody extends NativeTradeRequest | LotCorrectionRequest | PositionRemovalRequest>(
    makeBody: (mutationId: NativeTradeRequest['mutationId']) => TBody,
    transport: (body: Readonly<TBody>) => Promise<PortfolioMutationResponse | unknown>,
  ) => {
    const command = createMutationCommand(makeBody, transport)
    const completeAttempt = async (retry: boolean) => {
      let outcome
      try {
        outcome = await executeWithReconciliation(command, retry, refresh)
      } catch (reason) {
        setError(getErrorMessage(reason))
        return
      }
      if (outcome.kind === 'succeeded') {
        setRetryUnknown(null)
        setNotice('Portfolio mutation completed. Server state has been refreshed.')
      } else if (outcome.kind === 'conflict') {
        setRetryUnknown(null)
        setNotice('The portfolio changed on the server. Current versions were refreshed; review and reconfirm with a new mutation command.')
      } else if (outcome.kind === 'writes_unavailable') {
        setWritesUnavailable(true)
        setRetryUnknown(null)
        setNotice('Portfolio writes are temporarily unavailable. Read data remains visible.')
      } else if (outcome.kind === 'unknown_outcome') {
        setRetryUnknown(() => () => completeAttempt(true))
        setError('The mutation outcome is unknown. Retry will reuse the exact UUID and frozen request body.')
      } else {
        setRetryUnknown(null)
        setError(getErrorMessage(outcome.error))
      }
    }
    await completeAttempt(false)
  }, [refresh])

  const submitTrade = useCallback(async () => {
    if (!snapshot) return
    setError(null)
    try {
      const quantity = BigInt(trade.quantity)
      const unitPrice = new Decimal(trade.unitPrice)
      const symbol = trade.symbol.trim().toUpperCase()
      await runCommand(
        (mutationId) => ({
          mutationId,
          symbol,
          quantity,
          unitPrice,
          tradeDate: asDate(trade.tradeDate, 'tradeDate'),
          expectedPortfolioVersion: snapshot.summary.version,
        }),
        (body) => trade.side === 'BUY' ? buy(body) : sell(body),
      )
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }, [runCommand, snapshot, trade])

  const submitCorrection = useCallback(async () => {
    if (!snapshot || !correction || !correction.reason.trim()) return
    try {
      await runCommand(
        (mutationId) => ({
          mutationId,
          quantity: BigInt(correction.quantity),
          unitCost: new Decimal(correction.unitCost),
          acquisitionDate: asDate(correction.acquisitionDate, 'acquisitionDate'),
          correctionDate: asDate(correction.correctionDate, 'correctionDate'),
          expectedLotVersion: correction.lot.version,
          expectedPortfolioVersion: snapshot.summary.version,
          reason: correction.reason.trim(),
        }),
        (body) => correctLot(correction.lot.id, body),
      )
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }, [correction, runCommand, snapshot])

  const submitRemoval = useCallback(async () => {
    if (!snapshot || !removal || !removal.reason.trim()) return
    try {
      await runCommand(
        (mutationId) => ({
          mutationId,
          effectiveDate: asDate(removal.effectiveDate, 'effectiveDate'),
          expectedPortfolioVersion: snapshot.summary.version,
          reason: removal.reason.trim(),
        }),
        (body) => removePosition(removal.holding.symbol, body),
      )
    } catch (reason) {
      setError(getErrorMessage(reason))
    }
  }, [removal, runCommand, snapshot])

  const catalogueBySymbol = useMemo(
    () => new Map(catalogue.map((item) => [item.symbol, item])),
    [catalogue],
  )
  const indexPoints = indexHistory ? latestActualObservations(indexHistory) : []
  const mutationsDisabled = writesUnavailable || loading || !snapshot

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Portfolio</Typography>
          <Typography color="text.secondary">Server-authoritative lots, holdings, immutable activity and watchlist. Holdings valuation only; no cash balance is defined.</Typography>
        </Box>
        {!user && !authLoading && <Alert severity="info" action={<Button onClick={() => setAuthModalOpen(true)}>Sign in</Button>}>Sign in to view your portfolio.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {notice && <PortfolioWriteGateNotice unavailable={writesUnavailable}>{notice}</PortfolioWriteGateNotice>}
        {retryUnknown && <Button variant="contained" color="warning" onClick={() => void retryUnknown()}>Retry exact unknown-outcome command</Button>}
        {snapshot && (
          <>
            <Box sx={CARD}>
              <Typography variant="overline">Holdings market value</Typography>
              <Typography variant="h4">{money(snapshot.summary.holdingsMarketValue)}</Typography>
              <Typography color="text.secondary">Portfolio version {snapshot.summary.version.toString()} · Unpriced holdings {snapshot.summary.unpricedHoldingCount}</Typography>
            </Box>

            <Box sx={CARD}>
              <Typography variant="h6" sx={{ mb: 1 }}>Record buy or sell</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <FormControl sx={{ minWidth: 110 }}><InputLabel>Side</InputLabel><Select label="Side" value={trade.side} onChange={(event) => setTrade((value) => ({ ...value, side: event.target.value as 'BUY' | 'SELL' }))}><MenuItem value="BUY">Buy</MenuItem><MenuItem value="SELL">Sell (server FIFO)</MenuItem></Select></FormControl>
                <TextField label="Symbol" value={trade.symbol} onChange={(event) => setTrade((value) => ({ ...value, symbol: event.target.value }))} />
                <TextField label="Quantity" value={trade.quantity} onChange={(event) => setTrade((value) => ({ ...value, quantity: event.target.value }))} />
                <TextField label="Unit price" value={trade.unitPrice} onChange={(event) => setTrade((value) => ({ ...value, unitPrice: event.target.value }))} />
                <TextField label="Trade date" type="date" value={trade.tradeDate} onChange={(event) => setTrade((value) => ({ ...value, tradeDate: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
                <Button variant="contained" disabled={mutationsDisabled || !trade.symbol || !trade.quantity || !trade.unitPrice} onClick={() => void submitTrade()}>Confirm</Button>
              </Stack>
            </Box>

            <PortfolioTables
              snapshot={snapshot}
              writesDisabled={mutationsDisabled}
              onCorrect={(lot) => setCorrection({ lot, quantity: lot.quantity.toString(), unitCost: lot.unitCost.toString(), acquisitionDate: lot.acquisitionDate, correctionDate: localCalendarDate(), reason: '' })}
              onRemove={(holding) => setRemoval({ holding, effectiveDate: localCalendarDate(), reason: '' })}
            />

            {correction && <Box sx={CARD}><Typography variant="h6">Correct lot {correction.lot.symbol} · version {correction.lot.version.toString()}</Typography><Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}><TextField label="Quantity" value={correction.quantity} onChange={(e) => setCorrection({ ...correction, quantity: e.target.value })}/><TextField label="Unit cost" value={correction.unitCost} onChange={(e) => setCorrection({ ...correction, unitCost: e.target.value })}/><TextField type="date" label="Acquisition date" value={correction.acquisitionDate} onChange={(e) => setCorrection({ ...correction, acquisitionDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }}/><TextField type="date" label="Correction date" value={correction.correctionDate} onChange={(e) => setCorrection({ ...correction, correctionDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }}/><TextField required label="Reason" value={correction.reason} onChange={(e) => setCorrection({ ...correction, reason: e.target.value })}/><Button disabled={mutationsDisabled || !correction.reason.trim()} onClick={() => void submitCorrection()}>Confirm correction</Button></Stack></Box>}
            {removal && <Box sx={CARD}><Typography variant="h6">Remove {removal.holding.symbol} position</Typography><Typography color="text.secondary">This records immutable removal activity; history is not deleted.</Typography><Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}><TextField type="date" label="Effective date" value={removal.effectiveDate} onChange={(e) => setRemoval({ ...removal, effectiveDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }}/><TextField required label="Reason" value={removal.reason} onChange={(e) => setRemoval({ ...removal, reason: e.target.value })}/><Button disabled={mutationsDisabled || !removal.reason.trim()} onClick={() => void submitRemoval()}>Confirm removal</Button></Stack></Box>}

            <Box sx={CARD}>
              <Typography variant="h6">Watchlist</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ my: 1 }}>
                <TextField select label="Catalogue symbol" value={trade.symbol} onChange={(event) => setTrade((value) => ({ ...value, symbol: event.target.value }))} sx={{ minWidth: 220 }}>{catalogue.map((ticker) => <MenuItem key={ticker.symbol} value={ticker.symbol}>{ticker.symbol} — {ticker.companyName ?? ticker.symbol}</MenuItem>)}</TextField>
                <Button disabled={mutationsDisabled || !trade.symbol} onClick={() => void putWatchlistItem(trade.symbol).then(() => refresh()).catch((reason) => { if (reason instanceof MarketApiError && reason.status === 503) setWritesUnavailable(true); setError(getErrorMessage(reason)) })}>Add</Button>
              </Stack>
              {snapshot.watchlist.map((item) => {
                const market = catalogueBySymbol.get(item.symbol)
                return <Stack key={item.symbol} direction="row" spacing={2} sx={{ py: 0.8, alignItems: 'center' }}><Button component={Link} to={`/stocks/${item.symbol}`}>{item.symbol}</Button><Typography sx={{ flex: 1 }}>{item.companyName ?? market?.companyName ?? 'N/A'}</Typography><Typography>{money(item.latestPrice ?? market?.close ?? null)}</Typography><Typography>{market?.change == null ? 'N/A' : formatNumeric(market.change)}</Typography><Typography>{market?.turnover == null ? 'N/A' : formatNumeric(market.turnover, 0)}</Typography><Button disabled={mutationsDisabled} onClick={() => void deleteWatchlistItem(item.symbol).then(() => refresh()).catch((reason) => { if (reason instanceof MarketApiError && reason.status === 503) setWritesUnavailable(true); setError(getErrorMessage(reason)) })}>Remove</Button></Stack>
              })}
              <Typography variant="caption">Sparklines are intentionally omitted; ticker detail is fetched only after a symbol is opened.</Typography>
            </Box>

            <Box sx={CARD}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Typography variant="h6" sx={{ flex: 1 }}>Market index history</Typography><FormControl size="small" sx={{ minWidth: 130 }}><InputLabel>Index</InputLabel><Select label="Index" value={indexCode} onChange={(event) => setIndexCode(event.target.value as MarketIndexCode)}>{MARKET_INDEX_CODES.map((code) => <MenuItem key={code} value={code}>{code}</MenuItem>)}</Select></FormControl></Stack>
              {indexHistory && <Typography color="text.secondary">Available {indexHistory.availableRange.from}–{indexHistory.availableRange.to}; requested {indexHistory.requestedRange.from ?? 'open'}–{indexHistory.requestedRange.to ?? 'open'}; applied {indexHistory.appliedRange.from}–{indexHistory.appliedRange.to}; as of {indexHistory.asOf?.tradeDate ?? 'N/A'}; latest {indexPoints.length} actual observations.</Typography>}
              {indexPoints.length > 0 ? <ReactECharts option={indexChartOption(indexHistory)} style={{ height: 320 }} /> : <Typography sx={{ py: 3 }}>No observations in this valid range.</Typography>}
            </Box>
          </>
        )}
      </Stack>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Container>
  )
}

export function PortfolioWriteGateNotice({ unavailable, children }: { unavailable: boolean; children: React.ReactNode }) {
  return <Alert severity={unavailable ? 'warning' : 'info'}>{children}</Alert>
}

export function PortfolioTables({ snapshot, writesDisabled, onCorrect, onRemove }: {
  snapshot: PortfolioSnapshot
  writesDisabled: boolean
  onCorrect: (lot: PositionLotResponse) => void
  onRemove: (holding: HoldingResponse) => void
}) {
  return <Stack spacing={2}>
    <DataTable title="Holdings" headers={['Symbol', 'Quantity', 'Total cost', 'Average unit cost', 'Latest quote', 'Market value', 'Action']} rows={snapshot.holdings.map((holding) => [<Button component={Link} to={`/stocks/${holding.symbol}`}>{holding.symbol}</Button>, holding.quantity.toString(), money(holding.totalCost), money(holding.averageUnitCost), money(holding.latestPrice), money(holding.marketValue), <Button disabled={writesDisabled} onClick={() => onRemove(holding)}>Remove position</Button>])}/>
    <DataTable title="Lots" headers={['Symbol', 'Quantity', 'Unit cost', 'Acquisition', 'Origin', 'Lot version', 'Action']} rows={snapshot.lots.map((lot) => [lot.symbol, lot.quantity.toString(), money(lot.unitCost), lot.acquisitionDate, lot.origin, lot.version.toString(), <Button disabled={writesDisabled} onClick={() => onCorrect(lot)}>Correct</Button>])}/>
    <DataTable title="Immutable activity" headers={['Date', 'Symbol', 'Activity', 'Position effect', 'Quantity', 'Price', 'Reason / correction detail', 'Versions']} rows={snapshot.activity.map((activity) => [activity.tradeDate, activity.symbol, `${activity.activityType}${activity.side ? ` ${activity.side}` : ''}`, activity.positionEffect === 'none' ? 'Position-neutral history' : activity.positionEffect, activity.quantity.toString(), money(activity.unitPrice), activity.reason ?? (activity.beforeQuantity != null || activity.afterQuantity != null ? `${activity.beforeQuantity?.toString() ?? 'N/A'} → ${activity.afterQuantity?.toString() ?? 'N/A'}; ${money(activity.beforeUnitCost)} → ${money(activity.afterUnitCost)}` : '—'), `${activity.portfolioVersionBefore?.toString() ?? '—'} → ${activity.portfolioVersionAfter?.toString() ?? '—'}`])}/>
  </Stack>
}

function DataTable({ title, headers, rows }: { title: string; headers: string[]; rows: React.ReactNode[][] }) {
  return <Box sx={{ ...CARD, p: 0, overflow: 'hidden' }}><Typography variant="h6" sx={{ p: 2 }}>{title}</Typography><TableContainer><Table size="small"><TableHead><TableRow>{headers.map((header) => <TableCell key={header}>{header}</TableCell>)}</TableRow></TableHead><TableBody>{rows.length ? rows.map((row, rowIndex) => <TableRow key={rowIndex}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={headers.length}>No records.</TableCell></TableRow>}</TableBody></Table></TableContainer></Box>
}
