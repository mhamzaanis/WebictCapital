import { supabase, hasSupabaseConfig } from './supabase'
import type { StockDetail } from '../components/StockDrawer'

// ─── Types ──────────────────────────────────────────────────────────────────────

type DbStockRow = {
  symbol: string
  company: string
  section: string | null
  trade_date: string
  close: number | null
  open: number | null
  high: number | null
  low: number | null
  turnover: number | null
  change: number | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function toNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  if (typeof val === 'string') return parseFloat(val.replace(/,/g, '').trim()) || 0
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}

function fmtDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

function fmtVolume(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString('en-PK')
}

// ─── Service guards ─────────────────────────────────────────────────────────────

export function hasStockService(): boolean {
  return hasSupabaseConfig && supabase !== null
}

export function getDemoUserId(): string | null {
  return import.meta.env.VITE_DEMO_USER_ID ?? null
}

function canWriteWatchlist(): boolean {
  return hasStockService() && getDemoUserId() !== null
}

// ─── Stock Detail Fetch ─────────────────────────────────────────────────────────

export async function fetchStockDetail(symbol: string): Promise<StockDetail> {
  if (!hasStockService()) {
    throw new Error('Supabase client is not configured.')
  }

  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  const yearAgoStr = yearAgo.toISOString().slice(0, 10)

  const result = await supabase!
    .from('datatable')
    .select('trade_date,close,open,high,low,turnover,change,company,section')
    .eq('symbol', symbol.toUpperCase())
    .gte('trade_date', yearAgoStr)
    .order('trade_date', { ascending: true })

  if (result.error) throw result.error

  const rows = (result.data ?? []) as DbStockRow[]
  if (rows.length === 0) {
    throw new Error(`No data found for symbol "${symbol.toUpperCase()}".`)
  }

  const latest = rows[rows.length - 1]
  const prev = rows.length > 1 ? rows[rows.length - 2] : latest
  const allCloses = rows.map((r) => toNum(r.close)).filter((c) => c !== 0)
  const history30 = rows.map((r) => toNum(r.close))
  const historyLabels = rows.map((r) => fmtDateLabel(r.trade_date))

  const price = toNum(latest.close)
  const previousClose = toNum(prev.close)
  const change = toNum(latest.change)
  const changePct = previousClose !== 0 ? (change / previousClose) * 100 : 0
  const open = toNum(latest.open)
  const dayHigh = toNum(latest.high)
  const dayLow = toNum(latest.low)
  const turnover = toNum(latest.turnover)

  // Average volume from last 10 trading days
  const recentTurnovers = rows.slice(-10).map((r) => toNum(r.turnover)).filter((t) => t !== 0)
  const avgTurnover = recentTurnovers.length > 0
    ? recentTurnovers.reduce((a, b) => a + b, 0) / recentTurnovers.length
    : turnover

  const week52Low = allCloses.length > 0 ? Math.min(...allCloses) : price
  const week52High = allCloses.length > 0 ? Math.max(...allCloses) : price
  const yearAgoClose = allCloses.length > 0 ? allCloses[0] : price
  const week52ChangePct = yearAgoClose !== 0 ? ((price - yearAgoClose) / yearAgoClose) * 100 : 0

  const spark = history30.slice(-12)

  return {
    symbol: symbol.toUpperCase(),
    company: latest.company ?? symbol.toUpperCase(),
    sector: latest.section ?? '',
    industry: latest.section ?? '',
    price,
    change,
    changePct,
    volume: fmtVolume(turnover),
    avgVolume: fmtVolume(avgTurnover),
    sharesOutstanding: 'N/A',
    open,
    previousClose,
    dayLow,
    dayHigh,
    week52Low,
    week52High,
    week52ChangePct,
    eps: 0,
    pe: 0,
    marketCap: 'N/A',
    dividendYield: 0,
    beta: 0,
    roe: 0,
    debtToEquity: 0,
    priceToBook: 0,
    spark,
    history30,
    historyLabels,
  }
}

// ─── Watchlist Operations ───────────────────────────────────────────────────────

export async function fetchWatchlistSymbols(): Promise<string[]> {
  if (!canWriteWatchlist()) return []

  const userId = getDemoUserId()!
  const result = await supabase!
    .from('watchlists')
    .select('symbol')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (result.error) return []
  return ((result.data ?? []) as { symbol: string }[]).map((r) => r.symbol)
}

export async function addToWatchlist(symbol: string): Promise<void> {
  if (!canWriteWatchlist()) return

  const userId = getDemoUserId()!

  // Check if already present
  const existing = await supabase!
    .from('watchlists')
    .select('id')
    .eq('user_id', userId)
    .eq('symbol', symbol.toUpperCase())
    .maybeSingle()

  if (existing.data) return // already in watchlist

  const result = await supabase!
    .from('watchlists')
    .insert({ user_id: userId, symbol: symbol.toUpperCase() })

  if (result.error) {
    console.warn('Failed to add to watchlist:', result.error.message)
  }
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  if (!canWriteWatchlist()) return

  const userId = getDemoUserId()!

  const result = await supabase!
    .from('watchlists')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', symbol.toUpperCase())

  if (result.error) {
    console.warn('Failed to remove from watchlist:', result.error.message)
  }
}
