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
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { forwardRef, useState, useMemo, useEffect } from 'react'
import type { ReactElement, Ref } from 'react'
import { fetchUniqueSymbols } from '../lib/stockService'

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
  availableStocks?: WatchItem[]
}

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
        {stock.price > 0 ? (
          <>
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
          </>
        ) : (
          <Typography sx={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
            -- --
          </Typography>
        )}
      </Box>

      {/* Volume */}
      <Box sx={{ textAlign: 'right', minWidth: 44, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
        <Typography sx={{ fontFamily: mono, fontSize: 10.5, color: C.muted }}>
          {stock.volume !== '--' ? stock.volume : '--'}
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

export function WatchlistModal({ open, onClose, watchlist, onAdd, availableStocks: stocksProp }: WatchlistModalProps) {
  const reduce = useReducedMotion()
  const [query, setQuery] = useState('')
  const [fetchedStocks, setFetchedStocks] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch symbols from Supabase RPC when modal opens
  useEffect(() => {
    if (!open) return
    if (stocksProp && stocksProp.length > 0) {
      setFetchedStocks(stocksProp)
      return
    }
    setLoading(true)
    fetchUniqueSymbols()
      .then(setFetchedStocks)
      .catch(() => setFetchedStocks([]))
      .finally(() => setLoading(false))
  }, [open, stocksProp])

  const stocks = fetchedStocks

  const watchlistSymbols = useMemo(() => new Set(watchlist.map(w => w.symbol)), [watchlist])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return stocks
    return stocks.filter(
      s =>
        s.symbol.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q)
    )
  }, [query, stocks])

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
          {loading ? (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              sx={{ textAlign: 'center', py: 6 }}
            >
              <Typography sx={{ fontFamily: serif, fontSize: 14, color: C.muted }}>
                Loading symbols…
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              sx={{ textAlign: 'center', py: 6 }}
            >
              <Typography sx={{ fontFamily: serif, fontSize: 14, color: C.muted }}>
                {query ? `No stocks match "${query}"` : 'No stocks available'}
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
