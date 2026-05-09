import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import {
  Box,
  Dialog,
  IconButton,
  Slide,
  Typography,
  TextField,
  MenuItem,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { motion, useReducedMotion } from 'motion/react'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import type { ReactElement, Ref } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BuyLot = {
  id: string
  shares: number
  price: number
}

export type Holding = {
  symbol: string
  company: string
  sector: string
  shares: number
  price: number
  avgCost: number
  marketValue: number
  todayPL: number
  todayPLPct: number
  totalPL: number
  totalPLPct: number
  buyLots: BuyLot[]
}

type HoldingModalProps = {
  open: boolean
  onClose: () => void
  holdings: Holding[]
  onSave: (holding: Holding) => void
  initialMode?: 'new' | 'manage'
  initialSymbol?: string
  availableStocks?: { symbol: string; company: string; sector: string; price: number }[]
}

// ─── Stocks available for adding new holdings ──────────────────────────────────

const availableStocksHardcoded = [
  { symbol: 'EFERT', company: 'Engro Fertilizers', sector: 'Fertilizer', price: 178.5 },
  { symbol: 'FCCL', company: 'Fauji Cement', sector: 'Cement', price: 42.8 },
  { symbol: 'FFC', company: 'Fauji Fertilizer Co.', sector: 'Fertilizer', price: 215.3 },
  { symbol: 'HBL', company: 'Habib Bank Ltd', sector: 'Banking', price: 117.03 },
  { symbol: 'HUBC', company: 'Hub Power Co.', sector: 'Energy', price: 158.9 },
  { symbol: 'KEL', company: 'K-Electric Ltd', sector: 'Energy', price: 5.85 },
  { symbol: 'LUCK', company: 'Lucky Cement', sector: 'Cement', price: 1024.5 },
  { symbol: 'MARI', company: 'Mari Petroleum', sector: 'Energy', price: 445.75 },
  { symbol: 'MCB', company: 'MCB Bank Ltd', sector: 'Banking', price: 198.6 },
  { symbol: 'MLCF', company: 'Maple Leaf Cement', sector: 'Cement', price: 68.4 },
  { symbol: 'NESTLE', company: 'Nestlé Pakistan', sector: 'Consumer', price: 5725.49 },
  { symbol: 'OGDC', company: 'Oil & Gas Dev. Co.', sector: 'Energy', price: 158.4 },
  { symbol: 'POL', company: 'Pakistan Oilfields', sector: 'Energy', price: 485.2 },
  { symbol: 'PSO', company: 'Pakistan State Oil', sector: 'Energy', price: 312.9 },
  { symbol: 'SEARL', company: 'Searle Company', sector: 'Pharma', price: 92.3 },
  { symbol: 'SYS', company: 'Systems Ltd', sector: 'Technology', price: 312.6 },
  { symbol: 'TRG', company: 'TRG Pakistan', sector: 'Technology', price: 130.2 },
  { symbol: 'UBL', company: 'United Bank Ltd', sector: 'Banking', price: 245.6 },
]

// ─── Design tokens ─────────────────────────────────────────────────────────────

const mono = 'var(--wc-number-font, "DM Mono", monospace)'
const serif = '"Playfair Display", serif'

const C = {
  bg: '#ffffff',
  surface: '#f7f9fc',
  surfaceDeep: '#f0f4f9',
  border: '#e4ecf4',
  borderStrong: '#c8d8eb',
  ink: '#080e1a',
  ink2: '#3a4e65',
  muted: '#8097b0',
  accent: '#0a2463',
  accentMid: '#1a4fa8',
  accentLight: 'rgba(10,36,99,0.07)',
  pos: '#0d5c32',
  posBg: 'rgba(13,92,50,0.07)',
  neg: '#9b1c2e',
  negBg: 'rgba(155,28,46,0.07)',
  divider: 'var(--wc-divider)',
}

// ─── Transition ────────────────────────────────────────────────────────────────

const SlideUp = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

// ─── Formatters ────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString('en-PK')
const fmtPkr = (v: number) => `Rs. ${fmt(Math.round(v))}`

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: C.ink2,
        fontFamily: mono,
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  )
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    fontFamily: mono,
    fontSize: 13,
    color: C.ink,
    borderRadius: '8px',
    bgcolor: C.surface,
    '& fieldset': { borderColor: C.border, transition: 'border-color 0.2s ease' },
    '&:hover fieldset': { borderColor: C.borderStrong },
    '&.Mui-focused fieldset': { borderColor: C.accentMid, borderWidth: '1px' },
  },
  '& .MuiInputLabel-root': { fontFamily: serif, fontSize: 12, color: C.muted },
}

const selectSx = {
  ...inputSx,
  '& .MuiSelect-select': { fontFamily: mono, fontSize: 13 },
}

function ActionBtn({
  onClick, icon, label, color = C.accentMid, disabled,
}: { onClick: () => void; icon: React.ReactNode; label: string; color?: string; disabled?: boolean }) {
  return (
    <Box
      component={motion.button}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      disabled={disabled}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.6,
        py: 0.8,
        border: `1px solid ${disabled ? C.border : color}`,
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        bgcolor: 'transparent',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s ease',
        outline: 'none',
        '&:hover': disabled ? {} : { bgcolor: `${color}14` },
      }}
    >
      <Box sx={{ color: disabled ? C.muted : color, display: 'flex' }}>{icon}</Box>
      <Typography sx={{ fontSize: 11, fontWeight: 600, fontFamily: mono, letterSpacing: '0.04em', color: disabled ? C.muted : color }}>
        {label}
      </Typography>
    </Box>
  )
}

function SaveBtn({
  onClick, disabled, label, icon,
}: { onClick: () => void; disabled?: boolean; label: string; icon?: React.ReactNode }) {
  return (
    <Box
      component={motion.button}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      sx={{
        alignSelf: 'flex-end',
        display: 'flex',
        alignItems: 'center',
        gap: 0.8,
        px: 2.5,
        py: 1,
        border: 'none',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        bgcolor: disabled ? C.border : C.accentMid,
        color: disabled ? C.muted : '#fff',
        fontFamily: mono,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.04em',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.2s ease',
        '&:hover': disabled ? undefined : { bgcolor: C.accent },
      }}
    >
      {icon}
      {label}
    </Box>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function HoldingModal({ open, onClose, holdings, onSave, initialMode, initialSymbol, availableStocks: stocksProp }: HoldingModalProps) {
  const reduce = useReducedMotion()

  const stocks = stocksProp ?? availableStocksHardcoded

  const isManage = initialMode === 'manage'

  // New mode: selected stock
  const [selectedStock, setSelectedStock] = useState('')

  // Buy lots (shared across modes)
  const [lots, setLots] = useState<BuyLot[]>([])

  // Add buy inline form
  const [showBuyForm, setShowBuyForm] = useState(false)
  const [buyShares, setBuyShares] = useState('')
  const [buyPrice, setBuyPrice] = useState('')

  // Sell inline form (manage mode only)
  const [showSellForm, setShowSellForm] = useState(false)
  const [sellShares, setSellShares] = useState('')

  // Edit lot inline state
  const [editingLotId, setEditingLotId] = useState<string | null>(null)
  const [editShares, setEditShares] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const managedHolding = useMemo(() => holdings.find(h => h.symbol === initialSymbol) ?? null, [holdings, initialSymbol])

  // Computed from lots
  const totalShares = useMemo(() => lots.reduce((s, l) => s + l.shares, 0), [lots])
  const avgCost = useMemo(() => {
    const totalCost = lots.reduce((s, l) => s + l.shares * l.price, 0)
    return totalShares > 0 ? totalCost / totalShares : 0
  }, [lots, totalShares])
  const totalCostBasis = useMemo(() => lots.reduce((s, l) => s + l.shares * l.price, 0), [lots])

  const projectedAvg = useMemo(() => {
    if (!buyShares || !buyPrice) return null
    const ns = Number(buyShares)
    const np = Number(buyPrice)
    if (!ns || !np) return null
    const newTotalCost = totalCostBasis + ns * np
    const newTotalShares = totalShares + ns
    return newTotalShares > 0 ? newTotalCost / newTotalShares : null
  }, [lots, buyShares, buyPrice, totalShares, totalCostBasis])

  // Current market price
  const currentPrice = isManage
    ? (managedHolding?.price ?? 0)
    : selectedStock
      ? (stocks.find(s => s.symbol === selectedStock)?.price ?? 0)
      : 0

  const stockDetail = useMemo(() => stocks.find(s => s.symbol === selectedStock), [selectedStock])

  const totalPL = totalShares * currentPrice - totalCostBasis
  const totalPLPct = totalCostBasis > 0 ? (totalPL / totalCostBasis) * 100 : 0

  const resetForm = () => {
    setSelectedStock('')
    setLots([])
    setShowBuyForm(false)
    setShowSellForm(false)
    setBuyShares('')
    setBuyPrice('')
    setSellShares('')
    setEditingLotId(null)
    setEditShares('')
    setEditPrice('')
  }

  // Initialize on open
  useEffect(() => {
    if (!open) return
    if (isManage && initialSymbol && managedHolding) {
      setLots(
        managedHolding.buyLots.length > 0
          ? managedHolding.buyLots.map(l => ({ ...l }))
          : [{ id: 'lot-1', shares: managedHolding.shares, price: managedHolding.avgCost }]
      )
      setSelectedStock('')
    } else {
      resetForm()
    }
    setShowBuyForm(false)
    setShowSellForm(false)
    setBuyShares('')
    setBuyPrice('')
    setSellShares('')
    setEditingLotId(null)
    setEditShares('')
    setEditPrice('')
  }, [open, initialMode, initialSymbol])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddBuy = () => {
    const shares = Number(buyShares)
    const price = Number(buyPrice)
    if (!shares || !price) return
    const newLot: BuyLot = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      shares,
      price,
    }
    setLots(prev => [...prev, newLot])
    setBuyShares('')
    setBuyPrice('')
    setShowBuyForm(false)
  }

  const handleEditLot = (id: string, shares: number, price: number) => {
    setLots(prev => prev.map(l => (l.id === id ? { ...l, shares, price } : l)))
  }

  const handleDeleteLot = (id: string) => {
    setLots(prev => prev.filter(l => l.id !== id))
  }

  const handleSell = () => {
    const sellQty = Number(sellShares)
    if (!sellQty || sellQty <= 0 || sellQty >= totalShares) return
    let remaining = sellQty
    const updated = lots
      .map(lot => {
        if (remaining <= 0) return lot
        const fromThis = Math.min(lot.shares, remaining)
        remaining -= fromThis
        return { ...lot, shares: lot.shares - fromThis }
      })
      .filter(l => l.shares > 0)
    setLots(updated)
    setSellShares('')
    setShowSellForm(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSave = () => {
    if (totalShares <= 0) return

    if (isManage && managedHolding) {
      onSave({
        ...managedHolding,
        shares: totalShares,
        avgCost,
        price: currentPrice,
        marketValue: totalShares * currentPrice,
        totalPL,
        totalPLPct,
        buyLots: lots,
      })
    } else if (stockDetail) {
      onSave({
        symbol: stockDetail.symbol,
        company: stockDetail.company,
        sector: stockDetail.sector,
        shares: totalShares,
        price: currentPrice,
        avgCost,
        marketValue: totalShares * currentPrice,
        todayPL: 0,
        todayPLPct: 0,
        totalPL: 0,
        totalPLPct: 0,
        buyLots: lots,
      })
    }

    resetForm()
    onClose()
  }

  const canSave = totalShares > 0 && (isManage || stockDetail != null)

  const canAddBuy = isManage || stockDetail != null

  // ── Inline edit helpers ──────────────────────────────────────────────────

  const startEdit = (lot: BuyLot) => {
    setEditingLotId(lot.id)
    setEditShares(lot.shares.toString())
    setEditPrice(lot.price.toString())
  }

  const confirmEdit = () => {
    if (!editingLotId) return
    const shares = Number(editShares)
    const price = Number(editPrice)
    if (!shares || !price) return
    handleEditLot(editingLotId, shares, price)
    setEditingLotId(null)
    setEditShares('')
    setEditPrice('')
  }

  const cancelEdit = () => {
    setEditingLotId(null)
    setEditShares('')
    setEditPrice('')
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={false}
      slots={{ transition: SlideUp }}
      slotProps={{
        transition: { timeout: reduce ? 0 : 320 },
        backdrop: {
          sx: {
            bgcolor: 'rgba(5,10,20,0.55)',
            backdropFilter: 'blur(6px)',
          },
        },
        paper: {
          sx: {
            width: { xs: '100%', sm: '90vw', md: 560 },
            maxWidth: '100vw',
            maxHeight: { xs: '100dvh', sm: '92dvh' },
            borderRadius: { xs: 0, sm: '16px' },
            border: `1px solid ${C.borderStrong}`,
            bgcolor: C.bg,
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(8,14,26,0.28), 0 0 0 1px rgba(10,36,99,0.06)',
          },
        },
      }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.border}`,
          px: { xs: 2.5, md: 3.5 }, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11, fontFamily: serif, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.accentMid, mb: 0.6,
            }}
          >
            Holdings
          </Typography>
          <Typography sx={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.ink }}>
            {isManage ? `${managedHolding?.symbol} — ${managedHolding?.company}` : 'Add New Holding'}
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          size="small"
          component={motion.button}
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
          sx={{
            color: C.muted, bgcolor: C.surface, border: `1px solid ${C.border}`,
            borderRadius: '8px', width: 32, height: 32,
            '&:hover': { color: C.ink, bgcolor: C.surfaceDeep },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <Box sx={{ overflowY: 'auto', px: { xs: 2.5, md: 3.5 }, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {!isManage && (
          /* ── Stock selector (new mode only) ── */
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
          >
            <TextField
              select
              label="Select Stock"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              fullWidth
              sx={selectSx}
            >
              <MenuItem value="" disabled>Choose a stock…</MenuItem>
              {stocks
                .filter(s => !holdings.some(h => h.symbol === s.symbol))
                .map(s => (
                  <MenuItem key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.company} · Rs. {fmt(s.price)}
                  </MenuItem>
                ))}
            </TextField>
          </Box>
        )}

        {isManage && managedHolding && (
          /* ── Position summary (manage mode) ── */
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34 }}
            sx={{
              border: `1px solid ${C.border}`,
              borderRadius: '10px',
              bgcolor: C.surface,
              p: 2,
            }}
          >
            <Typography sx={{ fontSize: 10, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.2 }}>
              Current Position
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              <Box>
                <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono }}>Shares</Typography>
                <Typography sx={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.ink }}>{fmt(totalShares)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono }}>Avg Cost</Typography>
                <Typography sx={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.accentMid }}>Rs. {avgCost.toFixed(2)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono }}>Market Value</Typography>
                <Typography sx={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.ink }}>{fmtPkr(totalShares * currentPrice)}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.ink2 }}>
                Market price: Rs. {currentPrice.toFixed(2)}
              </Typography>
              <Typography sx={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: totalPL >= 0 ? C.pos : C.neg }}>
                · {totalPL >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* ── Buy Lots ──────────────────────────────────────────────────────── */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.05 }}
        >
          <FieldLabel>Buy Lots ({lots.length})</FieldLabel>

          {lots.length === 0 ? (
            <Box
              sx={{
                py: 3, textAlign: 'center',
                border: `1px dashed ${C.borderStrong}`,
                borderRadius: '10px',
                bgcolor: C.surface,
              }}
            >
              <Typography sx={{ fontFamily: serif, fontSize: 13, color: C.muted }}>
                No purchases added yet
              </Typography>
              <Typography sx={{ fontFamily: serif, fontSize: 11, color: C.muted, mt: 0.5 }}>
                Tap "Add Buying" below to add your first entry
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
              {lots.map(lot => (
                <Box
                  key={lot.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    p: 1.2, borderRadius: '8px', border: `1px solid ${C.border}`,
                    bgcolor: C.bg,
                  }}
                >
                  {editingLotId === lot.id ? (
                    <>
                      <TextField
                        size="small"
                        label="Shares"
                        type="number"
                        value={editShares}
                        onChange={(e) => setEditShares(e.target.value)}
                        sx={{
                          flex: 1,
                          ...inputSx,
                          '& .MuiOutlinedInput-root': { fontSize: 12, bgcolor: C.bg },
                        }}
                        slotProps={{ htmlInput: { min: 1 } }}
                      />
                      <TextField
                        size="small"
                        label="Price"
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        sx={{
                          flex: 1,
                          ...inputSx,
                          '& .MuiOutlinedInput-root': { fontSize: 12, bgcolor: C.bg },
                        }}
                        slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                      />
                      <IconButton size="small" onClick={confirmEdit} sx={{ color: C.pos }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, fontFamily: mono }}>OK</Typography>
                      </IconButton>
                      <IconButton size="small" onClick={cancelEdit} sx={{ color: C.muted }}>
                        <CloseRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.ink }}>
                          {fmt(lot.shares)} shares
                        </Typography>
                        <Typography sx={{ fontFamily: mono, fontSize: 11, color: C.ink2 }}>
                          @ Rs. {lot.price.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', mr: 1 }}>
                        <Typography sx={{ fontFamily: mono, fontSize: 11, color: C.muted }}>
                          Rs. {fmt(Math.round(lot.shares * lot.price))}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => startEdit(lot)} sx={{ color: C.muted }}>
                        <EditRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteLot(lot.id)} sx={{ color: C.neg }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* ── Action buttons row ──────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canAddBuy && (
            <ActionBtn
              onClick={() => { setShowBuyForm(v => !v); setShowSellForm(false) }}
              icon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
              label="Add Buying"
            />
          )}
          {isManage && lots.length > 0 && (
            <ActionBtn
              onClick={() => { setShowSellForm(v => !v); setShowBuyForm(false) }}
              icon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
              label="Sell"
              color={C.neg}
            />
          )}
        </Box>

        {/* ── Add Buy inline form ──────────────────────────────────────────── */}
        {showBuyForm && (
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              border: `1px solid ${C.accentMid}30`,
              borderRadius: '10px',
              bgcolor: C.accentLight,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 10, color: C.accentMid, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              New Purchase
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Shares"
                type="number"
                value={buyShares}
                onChange={(e) => setBuyShares(e.target.value)}
                fullWidth
                sx={inputSx}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <TextField
                label="Buy Price (Rs.)"
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                fullWidth
                sx={inputSx}
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              />
            </Box>

            {projectedAvg !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.8, px: 1.2, bgcolor: C.bg, borderRadius: '8px' }}>
                <Typography sx={{ fontFamily: mono, fontSize: 11, color: C.ink2 }}>
                  Updated avg cost:
                </Typography>
                <Typography sx={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: C.accentMid }}>
                  Rs. {projectedAvg.toFixed(2)}
                </Typography>
                {avgCost > 0 && projectedAvg !== avgCost && (
                  <Typography
                    sx={{
                      fontFamily: mono, fontSize: 10, fontWeight: 600,
                      color: projectedAvg < avgCost ? C.pos : C.neg,
                    }}
                  >
                    ({projectedAvg < avgCost ? '▼' : '▲'} {Math.abs(((projectedAvg - avgCost) / avgCost) * 100).toFixed(1)}%)
                  </Typography>
                )}
                {avgCost > 0 && projectedAvg === avgCost && (
                  <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
                    — unchanged
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <ActionBtn
                onClick={() => { setShowBuyForm(false); setBuyShares(''); setBuyPrice('') }}
                icon={<CloseRoundedIcon sx={{ fontSize: 16 }} />}
                label="Cancel"
                color={C.muted}
              />
              <SaveBtn
                onClick={handleAddBuy}
                disabled={!buyShares || !buyPrice}
                label="Confirm Buy"
                icon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
              />
            </Box>
          </Box>
        )}

        {/* ── Sell inline form ────────────────────────────────────────────── */}
        {showSellForm && (
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              border: `1px solid ${C.neg}30`,
              borderRadius: '10px',
              bgcolor: C.negBg,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 10, color: C.neg, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sell Shares
            </Typography>
            <TextField
              label="Shares to Sell"
              type="number"
              value={sellShares}
              onChange={(e) => setSellShares(e.target.value)}
              fullWidth
              sx={inputSx}
              slotProps={{ htmlInput: { min: 1, max: totalShares - 1 } }}
            />
            {sellShares && Number(sellShares) > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1.2, bgcolor: C.bg, borderRadius: '8px' }}>
                <Typography sx={{ fontFamily: mono, fontSize: 11, color: C.ink2 }}>
                  Remaining:
                </Typography>
                <Typography sx={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: C.ink }}>
                  {fmt(totalShares - Number(sellShares))} shares
                </Typography>
              </Box>
            )}
            {sellShares && Number(sellShares) >= totalShares && (
              <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.neg }}>
                Cannot sell all shares. Use delete from the portfolio page instead.
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <ActionBtn
                onClick={() => { setShowSellForm(false); setSellShares('') }}
                icon={<CloseRoundedIcon sx={{ fontSize: 16 }} />}
                label="Cancel"
                color={C.muted}
              />
              <SaveBtn
                onClick={handleSell}
                disabled={!sellShares || Number(sellShares) <= 0 || Number(sellShares) >= totalShares}
                label="Confirm Sell"
                icon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
              />
            </Box>
          </Box>
        )}

        {/* ── Save button ────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
          <SaveBtn
            onClick={handleSave}
            disabled={!canSave}
            label={isManage ? 'Save Changes' : 'Save Holding'}
            icon={isManage ? undefined : <AddRoundedIcon sx={{ fontSize: 16 }} />}
          />
        </Box>
      </Box>
    </Dialog>
  )
}
