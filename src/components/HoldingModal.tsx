import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import MergeRoundedIcon from '@mui/icons-material/MergeRounded'
import {
  Box,
  Dialog,
  IconButton,
  Slide,
  Typography,
  TextField,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { motion, useReducedMotion } from 'motion/react'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import type { ReactElement, Ref } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

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
}

export type HoldingMode = 'add' | 'edit' | 'average'

type HoldingModalProps = {
  open: boolean
  onClose: () => void
  holdings: Holding[]
  onSave: (holding: Holding) => void
  onAverage: (symbol: string, newShares: number, newPrice: number) => void
  initialMode?: HoldingMode
  initialSymbol?: string
}

// ─── Stocks available for adding new holdings ──────────────────────────────────

const availableStocks = [
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

function ModeTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <Box
      component={motion.button}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.6,
        px: 1.6,
        py: 0.8,
        border: `1px solid ${active ? C.accentMid : C.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        bgcolor: active ? C.accentLight : 'transparent',
        transition: 'all 0.2s ease',
        outline: 'none',
        '&:hover': { borderColor: C.accentMid, bgcolor: C.accentLight },
      }}
    >
      <Box sx={{ color: active ? C.accentMid : C.muted, display: 'flex' }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          fontFamily: mono,
          letterSpacing: '0.04em',
          color: active ? C.accentMid : C.muted,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

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

// ─── Main Component ────────────────────────────────────────────────────────────

export function HoldingModal({ open, onClose, holdings, onSave, onAverage, initialMode, initialSymbol }: HoldingModalProps) {
  const reduce = useReducedMotion()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  const [mode, setMode] = useState<HoldingMode>('add')

  // Add mode state
  const [addSymbol, setAddSymbol] = useState('')
  const [addCompany, setAddCompany] = useState('')
  const [addSector, setAddSector] = useState('')
  const [addShares, setAddShares] = useState('')
  const [addPrice, setAddPrice] = useState('')

  // Edit mode state
  const [editSymbol, setEditSymbol] = useState('')
  const [editShares, setEditShares] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editAvgCost, setEditAvgCost] = useState('')

  // Average mode state
  const [avgSymbol, setAvgSymbol] = useState('')
  const [avgNewShares, setAvgNewShares] = useState('')
  const [avgNewPrice, setAvgNewPrice] = useState('')

  const selectedHolding = useMemo(() => holdings.find(h => h.symbol === editSymbol) ?? null, [holdings, editSymbol])
  const selectedAvgHolding = useMemo(() => holdings.find(h => h.symbol === avgSymbol) ?? null, [holdings, avgSymbol])

  const newAvgCost = useMemo(() => {
    if (!selectedAvgHolding || !avgNewShares || !avgNewPrice) return null
    const oldTotal = selectedAvgHolding.shares * selectedAvgHolding.avgCost
    const newTotal = Number(avgNewShares) * Number(avgNewPrice)
    const totalShares = selectedAvgHolding.shares + Number(avgNewShares)
    return oldTotal + newTotal > 0 ? (oldTotal + newTotal) / totalShares : null
  }, [selectedAvgHolding, avgNewShares, avgNewPrice])

  const resetForm = () => {
    setMode('add')
    setAddSymbol(''); setAddCompany(''); setAddSector(''); setAddShares(''); setAddPrice('')
    setEditSymbol(''); setEditShares(''); setEditPrice(''); setEditAvgCost('')
    setAvgSymbol(''); setAvgNewShares(''); setAvgNewPrice('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleStockSelect = (symbol: string) => {
    const stock = availableStocks.find(s => s.symbol === symbol)
    if (!stock) return
    setAddSymbol(stock.symbol)
    setAddCompany(stock.company)
    setAddSector(stock.sector)
    setAddPrice(stock.price.toString())
  }

  const handleAddSave = () => {
    const shares = Number(addShares)
    const price = Number(addPrice)
    if (!addSymbol || !addCompany || !shares || !price) return

    const marketValue = shares * price
    const holding: Holding = {
      symbol: addSymbol,
      company: addCompany,
      sector: addSector,
      shares,
      price,
      avgCost: price,
      marketValue,
      todayPL: 0,
      todayPLPct: 0,
      totalPL: 0,
      totalPLPct: 0,
    }
    onSave(holding)
    resetForm()
    onClose()
  }

  const handleEditSave = () => {
    const shares = Number(editShares)
    const price = Number(editPrice)
    const avgCost = Number(editAvgCost)
    if (!editSymbol || !selectedHolding || !shares || !price) return

    const marketValue = shares * price
    const totalPL = marketValue - shares * avgCost
    const totalPLPct = shares * avgCost > 0 ? (totalPL / (shares * avgCost)) * 100 : 0
    const holding: Holding = {
      ...selectedHolding,
      shares,
      price,
      avgCost,
      marketValue,
      totalPL,
      totalPLPct,
    }
    onSave(holding)
    resetForm()
    onClose()
  }

  const handleAverageSave = () => {
    const newShares = Number(avgNewShares)
    const newPrice = Number(avgNewPrice)
    if (!avgSymbol || !newShares || !newPrice) return
    onAverage(avgSymbol, newShares, newPrice)
    resetForm()
    onClose()
  }

  const handleEditSelect = (symbol: string) => {
    setEditSymbol(symbol)
    const h = holdings.find(x => x.symbol === symbol)
    if (h) {
      setEditShares(h.shares.toString())
      setEditPrice(h.price.toString())
      setEditAvgCost(h.avgCost.toString())
    }
  }

  useEffect(() => {
    if (!open) return
    if (initialMode === 'edit' && initialSymbol) {
      setMode('edit')
      handleEditSelect(initialSymbol)
      return
    }
    if (initialMode === 'average' && initialSymbol) {
      setMode('average')
      setAvgSymbol(initialSymbol)
      setAvgNewShares('')
      setAvgNewPrice('')
      return
    }
    resetForm()
  }, [open, initialMode, initialSymbol])

  const canAdd = addSymbol && addCompany && Number(addShares) > 0 && Number(addPrice) > 0
  const canEdit = editSymbol && selectedHolding && Number(editShares) > 0 && Number(editPrice) > 0
  const canAverage = avgSymbol && selectedAvgHolding && Number(avgNewShares) > 0 && Number(avgNewPrice) > 0

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
            width: { xs: '100%', sm: '90vw', md: 680 },
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
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${C.border}`,
          px: { xs: 2.5, md: 3.5 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontFamily: serif,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.accentMid,
              mb: 0.6,
            }}
          >
            Holdings
          </Typography>
          <Typography sx={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.ink }}>
            {mode === 'add' ? 'Add New Holding' : mode === 'edit' ? 'Edit Holding' : 'Average Out'}
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          size="small"
          component={motion.button}
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
          sx={{
            color: C.muted,
            bgcolor: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            width: 32,
            height: 32,
            '&:hover': { color: C.ink, bgcolor: C.surfaceDeep },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <Box sx={{ overflowY: 'auto', px: { xs: 2.5, md: 3.5 }, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Mode tabs */}
        <Box
          component={motion.div}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
        >
          <ModeTab active={mode === 'add'} onClick={() => setMode('add')} icon={<AddRoundedIcon sx={{ fontSize: 16 }} />} label="New Holding" />
          <ModeTab active={mode === 'edit'} onClick={() => setMode('edit')} icon={<EditRoundedIcon sx={{ fontSize: 16 }} />} label="Edit" />
          <ModeTab active={mode === 'average'} onClick={() => setMode('average')} icon={<MergeRoundedIcon sx={{ fontSize: 16 }} />} label="Average Out" />
        </Box>

        {/* ── ADD NEW MODE ──────────────────────────────────────────────────── */}
        {mode === 'add' && (
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              select
              label="Select Stock"
              value={addSymbol}
              onChange={(e) => handleStockSelect(e.target.value)}
              fullWidth
              sx={selectSx}
            >
              <MenuItem value="" disabled>Choose a stock…</MenuItem>
              {availableStocks
                .filter(s => !holdings.some(h => h.symbol === s.symbol))
                .map(s => (
                  <MenuItem key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.company} · Rs. {fmt(s.price)}
                  </MenuItem>
                ))}
            </TextField>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Symbol" value={addSymbol} onChange={(e) => setAddSymbol(e.target.value.toUpperCase())} fullWidth sx={inputSx} inputProps={{ maxLength: 8 }} />
              <TextField label="Company" value={addCompany} onChange={(e) => setAddCompany(e.target.value)} fullWidth sx={inputSx} />
              <TextField label="Sector" value={addSector} onChange={(e) => setAddSector(e.target.value)} fullWidth sx={inputSx} />
              <TextField label="Buy Price (Rs.)" type="number" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} fullWidth sx={inputSx} inputProps={{ min: 0, step: '0.01' }} />
              <TextField label="Shares" type="number" value={addShares} onChange={(e) => setAddShares(e.target.value)} fullWidth sx={inputSx} inputProps={{ min: 1 }} />
            </Box>

            {canAdd && (
              <Box sx={{ border: `1px solid ${C.border}`, borderRadius: '10px', bgcolor: C.surface, p: 2 }}>
                <Typography sx={{ fontSize: 10, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                  Preview
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontFamily: mono, fontSize: 12, color: C.ink2 }}>
                    {fmt(Number(addShares))} shares @ {fmtPkr(Number(addPrice))}
                  </Typography>
                  <Typography sx={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: C.ink }}>
                    Total: {fmtPkr(Number(addShares) * Number(addPrice))}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box
              component={motion.button}
              onClick={handleAddSave}
              whileTap={{ scale: 0.97 }}
              disabled={!canAdd}
              sx={{
                alignSelf: 'flex-end',
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                px: 2.5,
                py: 1,
                border: 'none',
                borderRadius: '8px',
                cursor: canAdd ? 'pointer' : 'not-allowed',
                bgcolor: canAdd ? C.accentMid : C.border,
                color: canAdd ? '#fff' : C.muted,
                fontFamily: mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.04em',
                opacity: canAdd ? 1 : 0.5,
                transition: 'background 0.2s ease',
                '&:hover': canAdd ? { bgcolor: C.accent } : undefined,
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 16 }} />
              Add to Holdings
            </Box>
          </Box>
        )}

        {/* ── EDIT MODE ─────────────────────────────────────────────────────── */}
        {mode === 'edit' && (
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              select
              label="Select Holding to Edit"
              value={editSymbol}
              onChange={(e) => handleEditSelect(e.target.value)}
              fullWidth
              sx={selectSx}
            >
              <MenuItem value="" disabled>Choose a holding…</MenuItem>
              {holdings.map(h => (
                <MenuItem key={h.symbol} value={h.symbol}>
                  {h.symbol} — {h.company} · {fmt(h.shares)} sh @ Rs. {h.price.toFixed(2)}
                </MenuItem>
              ))}
            </TextField>

            {selectedHolding && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField label="Symbol" value={editSymbol} disabled fullWidth sx={inputSx} />
                  <TextField label="Company" value={selectedHolding.company} disabled fullWidth sx={inputSx} />
                  <TextField label="Sector" value={selectedHolding.sector} disabled fullWidth sx={inputSx} />
                  <TextField label="Avg Cost (Rs.)" type="number" value={editAvgCost} onChange={(e) => setEditAvgCost(e.target.value)} fullWidth sx={inputSx} inputProps={{ min: 0, step: '0.01' }} />
                  <TextField label="Current Price (Rs.)" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} fullWidth sx={inputSx} inputProps={{ min: 0, step: '0.01' }} />
                  <TextField label="Shares" type="number" value={editShares} onChange={(e) => setEditShares(e.target.value)} fullWidth sx={inputSx} inputProps={{ min: 1 }} />
                </Box>

                {canEdit && Number(editAvgCost) > 0 && (
                  <Box sx={{ border: `1px solid ${C.border}`, borderRadius: '10px', bgcolor: C.surface, p: 2 }}>
                    <Typography sx={{ fontSize: 10, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                      Updated Summary
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontFamily: mono, fontSize: 11, color: C.ink2 }}>Market Value</Typography>
                        <Typography sx={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.ink }}>
                          {fmtPkr(Number(editShares) * Number(editPrice))}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontFamily: mono, fontSize: 11, color: C.ink2 }}>Cost Basis</Typography>
                        <Typography sx={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.ink }}>
                          {fmtPkr(Number(editShares) * Number(editAvgCost))}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontFamily: mono, fontSize: 11, color: C.ink2 }}>Total P/L</Typography>
                        <Typography sx={{
                          fontFamily: mono, fontSize: 12, fontWeight: 700,
                          color: (Number(editShares) * Number(editPrice) - Number(editShares) * Number(editAvgCost)) >= 0 ? C.pos : C.neg,
                        }}>
                          {fmtPkr(Number(editShares) * Number(editPrice) - Number(editShares) * Number(editAvgCost))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                <Box
                  component={motion.button}
                  onClick={handleEditSave}
                  whileTap={{ scale: 0.97 }}
                  disabled={!canEdit}
                  sx={{
                    alignSelf: 'flex-end',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    px: 2.5,
                    py: 1,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: canEdit ? 'pointer' : 'not-allowed',
                    bgcolor: canEdit ? C.accentMid : C.border,
                    color: canEdit ? '#fff' : C.muted,
                    fontFamily: mono,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    opacity: canEdit ? 1 : 0.5,
                    transition: 'background 0.2s ease',
                    '&:hover': canEdit ? { bgcolor: C.accent } : undefined,
                  }}
                >
                  <EditRoundedIcon sx={{ fontSize: 16 }} />
                  Save Changes
                </Box>
              </>
            )}
          </Box>
        )}

        {/* ── AVERAGE OUT MODE ──────────────────────────────────────────────── */}
        {mode === 'average' && (
          <Box
            component={motion.div}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              select
              label="Select Holding to Average"
              value={avgSymbol}
              onChange={(e) => { setAvgSymbol(e.target.value); setAvgNewShares(''); setAvgNewPrice('') }}
              fullWidth
              sx={selectSx}
            >
              <MenuItem value="" disabled>Choose a holding…</MenuItem>
              {holdings.map(h => (
                <MenuItem key={h.symbol} value={h.symbol}>
                  {h.symbol} — {h.company} · {fmt(h.shares)} sh @ avg Rs. {h.avgCost.toFixed(2)}
                </MenuItem>
              ))}
            </TextField>

            {selectedAvgHolding && (
              <>
                {/* Current position summary */}
                <Box sx={{ border: `1px solid ${C.border}`, borderRadius: '10px', bgcolor: C.surface, p: 2 }}>
                  <Typography sx={{ fontSize: 10, color: C.muted, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                    Current Position
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono }}>Shares</Typography>
                      <Typography sx={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.ink }}>{fmt(selectedAvgHolding.shares)}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono }}>Avg Cost</Typography>
                      <Typography sx={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.ink }}>Rs. {selectedAvgHolding.avgCost.toFixed(2)}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono }}>Market Value</Typography>
                      <Typography sx={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.ink }}>{fmtPkr(selectedAvgHolding.marketValue)}</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="New Shares to Buy"
                    type="number"
                    value={avgNewShares}
                    onChange={(e) => setAvgNewShares(e.target.value)}
                    fullWidth
                    sx={inputSx}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    label="New Buy Price (Rs.)"
                    type="number"
                    value={avgNewPrice}
                    onChange={(e) => setAvgNewPrice(e.target.value)}
                    fullWidth
                    sx={inputSx}
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                </Box>

                {newAvgCost !== null && (
                  <Box sx={{ border: `1px solid ${C.accentMid}30`, borderRadius: '10px', bgcolor: C.accentLight, p: 2.5 }}>
                    <Typography sx={{ fontSize: 10, color: C.accentMid, fontFamily: mono, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                      Averaged Result
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono, mb: 0.3 }}>New Total Shares</Typography>
                        <Typography sx={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.ink }}>
                          {fmt(selectedAvgHolding.shares + Number(avgNewShares))}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono, mb: 0.3 }}>New Avg Cost</Typography>
                        <Typography sx={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.accentMid }}>
                          Rs. {newAvgCost.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 9, color: C.muted, fontFamily: mono, mb: 0.3 }}>Total Invested</Typography>
                        <Typography sx={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.ink }}>
                          {fmtPkr((selectedAvgHolding.shares + Number(avgNewShares)) * newAvgCost)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${C.border}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.ink2 }}>
                          Avg cost moves from Rs. {selectedAvgHolding.avgCost.toFixed(2)}
                        </Typography>
                        {newAvgCost < selectedAvgHolding.avgCost ? (
                          <Typography sx={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: C.pos }}>
                            ↓ Down
                          </Typography>
                        ) : newAvgCost > selectedAvgHolding.avgCost ? (
                          <Typography sx={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: C.neg }}>
                            ↑ Up
                          </Typography>
                        ) : (
                          <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
                            — Unchanged
                          </Typography>
                        )}
                        <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.ink2 }}>
                          to Rs. {newAvgCost.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                <Box
                  component={motion.button}
                  onClick={handleAverageSave}
                  whileTap={{ scale: 0.97 }}
                  disabled={!canAverage}
                  sx={{
                    alignSelf: 'flex-end',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    px: 2.5,
                    py: 1,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: canAverage ? 'pointer' : 'not-allowed',
                    bgcolor: canAverage ? C.accentMid : C.border,
                    color: canAverage ? '#fff' : C.muted,
                    fontFamily: mono,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    opacity: canAverage ? 1 : 0.5,
                    transition: 'background 0.2s ease',
                    '&:hover': canAverage ? { bgcolor: C.accent } : undefined,
                  }}
                >
                  <MergeRoundedIcon sx={{ fontSize: 16 }} />
                  Apply Average
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
