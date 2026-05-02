import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import {
  Box,
  Dialog,
  IconButton,
  Slide,
  Typography,
  TextField,
  InputAdornment,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { forwardRef, useState, useMemo } from 'react'
import type { ReactElement, Ref } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type WatchItem = {
  symbol: string
  company: string
  price: number
  change: number
  changePct: number
  volume: string
  spark: number[]
}

type WatchlistModalProps = {
  open: boolean
  onClose: () => void
  watchlist: WatchItem[]
  onAdd: (item: WatchItem) => void
}

// ─── Available stocks for watchlist ────────────────────────────────────────────

const searchableStocks: WatchItem[] = [
  { symbol: 'OGDC', company: 'Oil & Gas Development Co.', price: 158.4, change: 2.3, changePct: 1.47, volume: '4.2M', spark: [14, 15, 13, 16, 12, 11, 10, 9, 11, 10, 9, 8] },
  { symbol: 'ENGRO', company: 'Engro Corporation', price: 286.0, change: -4.1, changePct: -1.41, volume: '1.8M', spark: [9, 10, 11, 13, 15, 17, 18, 20, 21, 22, 20, 21] },
  { symbol: 'LUCK', company: 'Lucky Cement', price: 1024.5, change: 8.7, changePct: 0.86, volume: '890K', spark: [20, 18, 17, 16, 15, 14, 12, 10, 9, 8, 7, 6] },
  { symbol: 'PSO', company: 'Pakistan State Oil', price: 312.9, change: -3.6, changePct: -1.14, volume: '3.1M', spark: [8, 10, 11, 13, 14, 17, 19, 20, 21, 22, 21, 23] },
  { symbol: 'MCB', company: 'MCB Bank Ltd', price: 198.6, change: 1.2, changePct: 0.61, volume: '2.4M', spark: [10, 11, 12, 10, 13, 14, 15, 14, 16, 17, 16, 18] },
  { symbol: 'HBL', company: 'Habib Bank Ltd', price: 117.03, change: 0.35, changePct: 0.3, volume: '5.1M', spark: [10, 11, 12, 11, 13, 14, 13, 15, 14, 13, 14, 15] },
  { symbol: 'UBL', company: 'United Bank Ltd', price: 245.6, change: -2.1, changePct: -0.85, volume: '2.8M', spark: [18, 17, 16, 17, 15, 16, 14, 15, 14, 13, 14, 13] },
  { symbol: 'EFERT', company: 'Engro Fertilizers', price: 178.5, change: 3.2, changePct: 1.83, volume: '3.5M', spark: [12, 13, 12, 14, 13, 15, 14, 16, 15, 17, 16, 15] },
  { symbol: 'FCCL', company: 'Fauji Cement', price: 42.8, change: -0.5, changePct: -1.15, volume: '6.2M', spark: [8, 9, 8, 10, 9, 11, 10, 9, 8, 7, 8, 7] },
  { symbol: 'FFC', company: 'Fauji Fertilizer Co.', price: 215.3, change: 1.8, changePct: 0.84, volume: '2.1M', spark: [15, 14, 15, 16, 15, 17, 16, 18, 17, 16, 17, 18] },
  { symbol: 'HUBC', company: 'Hub Power Co.', price: 158.9, change: 5.2, changePct: 3.38, volume: '7.8M', spark: [9, 10, 11, 12, 11, 13, 14, 15, 16, 15, 14, 16] },
  { symbol: 'KEL', company: 'K-Electric Ltd', price: 5.85, change: 0.12, changePct: 2.09, volume: '12.4M', spark: [5, 6, 5, 7, 6, 8, 7, 6, 7, 8, 7, 6] },
  { symbol: 'MARI', company: 'Mari Petroleum', price: 445.75, change: 4.05, changePct: 0.92, volume: '1.2M', spark: [11, 12, 13, 12, 14, 13, 15, 14, 16, 15, 16, 17] },
  { symbol: 'MLCF', company: 'Maple Leaf Cement', price: 68.4, change: -1.1, changePct: -1.58, volume: '3.3M', spark: [10, 11, 10, 9, 10, 8, 9, 8, 7, 8, 7, 6] },
  { symbol: 'NESTLE', company: 'Nestlé Pakistan', price: 5725.49, change: 425.49, changePct: 8.03, volume: '85K', spark: [16, 17, 18, 17, 19, 18, 20, 19, 21, 20, 22, 23] },
  { symbol: 'POL', company: 'Pakistan Oilfields', price: 485.2, change: 6.8, changePct: 1.42, volume: '1.5M', spark: [13, 12, 14, 13, 15, 14, 16, 15, 17, 16, 18, 17] },
  { symbol: 'SEARL', company: 'Searle Company', price: 92.3, change: -2.4, changePct: -2.53, volume: '1.9M', spark: [7, 8, 7, 9, 8, 10, 9, 8, 7, 6, 7, 5] },
  { symbol: 'SYS', company: 'Systems Ltd', price: 312.6, change: -0.7, changePct: -0.22, volume: '1.1M', spark: [16, 17, 16, 18, 17, 19, 18, 17, 18, 19, 18, 17] },
  { symbol: 'TRG', company: 'TRG Pakistan', price: 130.2, change: -13.0, changePct: -9.12, volume: '8.5M', spark: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4] },
  { symbol: 'DGKC', company: 'DG Khan Cement', price: 95.8, change: 1.5, changePct: 1.59, volume: '4.1M', spark: [11, 10, 12, 11, 13, 12, 14, 13, 12, 13, 14, 15] },
  { symbol: 'BAFL', company: 'Bank Alfalah Ltd', price: 72.3, change: -0.4, changePct: -0.55, volume: '5.6M', spark: [9, 10, 9, 8, 7, 8, 7, 6, 7, 8, 7, 6] },
  { symbol: 'ATRL', company: 'Attock Refinery Ltd', price: 385.6, change: 9.2, changePct: 2.44, volume: '2.3M', spark: [14, 13, 15, 14, 16, 15, 17, 16, 18, 17, 19, 18] },
  { symbol: 'PIOC', company: 'Pioneer Cement', price: 168.2, change: 2.8, changePct: 1.69, volume: '1.7M', spark: [10, 11, 10, 12, 11, 13, 12, 14, 13, 12, 14, 13] },
  { symbol: 'FABL', company: 'Faysal Bank Ltd', price: 55.4, change: 0.9, changePct: 1.65, volume: '3.8M', spark: [8, 7, 8, 9, 8, 10, 9, 8, 9, 10, 9, 8] },
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

// ─── Sub-components ────────────────────────────────────────────────────────────

function StockRow({
  stock, alreadyAdded, onAdd, index,
}: {
  stock: WatchItem
  alreadyAdded: boolean
  onAdd: () => void
  index: number
}) {
  const reduce = useReducedMotion()
  const [hov, setHov] = useState(false)
  const pos = stock.change >= 0

  return (
    <Box
      component={motion.div}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      sx={{
        py: 1.2,
        px: 1.2,
        mx: -1.2,
        borderRadius: '8px',
        bgcolor: hov ? 'rgba(10,36,99,0.03)' : 'transparent',
        transition: 'background-color 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {/* Symbol + Company */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: C.ink }}>
          {stock.symbol}
        </Typography>
        <Typography sx={{ fontSize: 10, color: C.ink2, fontFamily: serif, mt: 0.1 }}>
          {stock.company}
        </Typography>
      </Box>

      {/* Price */}
      <Box sx={{ textAlign: 'right', minWidth: 80, flexShrink: 0 }}>
        <Typography sx={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.ink }}>
          Rs. {fmt(stock.price)}
        </Typography>
        <Typography
          sx={{
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 600,
            color: pos ? C.pos : C.neg,
          }}
        >
          {pos ? '+' : ''}{stock.change.toFixed(1)} ({pos ? '+' : ''}{stock.changePct.toFixed(2)}%)
        </Typography>
      </Box>

      {/* Volume */}
      <Box sx={{ textAlign: 'right', minWidth: 44, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
        <Typography sx={{ fontFamily: mono, fontSize: 10.5, color: C.muted }}>
          {stock.volume}
        </Typography>
      </Box>

      {/* Add button */}
      <Box sx={{ flexShrink: 0 }}>
        {alreadyAdded ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              px: 1.2,
              py: 0.5,
              borderRadius: '6px',
              bgcolor: C.posBg,
              border: `1px solid ${C.pos}30`,
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 13, color: C.pos }} />
            <Typography sx={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: C.pos }}>
              Added
            </Typography>
          </Box>
        ) : (
          <Box
            component={motion.button}
            onClick={onAdd}
            whileTap={{ scale: 0.94 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              px: 1.2,
              py: 0.5,
              border: `1px solid ${C.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              bgcolor: 'transparent',
              fontFamily: mono,
              fontSize: 10,
              fontWeight: 600,
              color: C.accentMid,
              transition: 'all 0.2s ease',
              outline: 'none',
              '&:hover': {
                bgcolor: C.accentLight,
                borderColor: C.accentMid,
              },
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 13 }} />
            Add
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function WatchlistModal({ open, onClose, watchlist, onAdd }: WatchlistModalProps) {
  const reduce = useReducedMotion()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const [query, setQuery] = useState('')

  const watchlistSymbols = useMemo(() => new Set(watchlist.map(w => w.symbol)), [watchlist])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return searchableStocks
    return searchableStocks.filter(
      s =>
        s.symbol.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q)
    )
  }, [query])

  const handleClose = () => {
    setQuery('')
    onClose()
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
            width: { xs: '100%', sm: '90vw', md: 640 },
            maxWidth: '100vw',
            maxHeight: { xs: '100dvh', sm: '85dvh' },
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
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
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
              Watchlist
            </Typography>
            <Typography sx={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.ink }}>
              Add Stocks
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

        <TextField
          placeholder="Search by symbol or company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 16, color: C.muted }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: mono,
              fontSize: 13,
              color: C.ink,
              borderRadius: '10px',
              bgcolor: C.surface,
              '& fieldset': { borderColor: C.border, transition: 'border-color 0.2s ease' },
              '&:hover fieldset': { borderColor: C.borderStrong },
              '&.Mui-focused fieldset': { borderColor: C.accentMid, borderWidth: '1px' },
            },
            '& .MuiInputBase-input::placeholder': { color: C.muted, opacity: 0.7 },
          }}
        />
      </Box>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <Box sx={{ overflowY: 'auto', px: { xs: 2.5, md: 3.5 }, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {filtered.length} stock{filtered.length !== 1 ? 's' : ''} found
          </Typography>
          <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
            {watchlist.length} in watchlist
          </Typography>
        </Box>

        <Divider sx={{ borderColor: C.border, mb: 1 }} />

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              sx={{ textAlign: 'center', py: 6 }}
            >
              <Typography sx={{ fontFamily: serif, fontSize: 14, color: C.muted }}>
                No stocks match "{query}"
              </Typography>
            </Box>
          ) : (
            <Box key={query} sx={{ pb: 2 }}>
              {filtered.map((stock, i) => (
                <Box key={stock.symbol}>
                  <StockRow
                    stock={stock}
                    index={i}
                    alreadyAdded={watchlistSymbols.has(stock.symbol)}
                    onAdd={() => onAdd(stock)}
                  />
                  {i < filtered.length - 1 && (
                    <Divider sx={{ borderColor: C.border, opacity: 0.4 }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </AnimatePresence>
      </Box>
    </Dialog>
  )
}
