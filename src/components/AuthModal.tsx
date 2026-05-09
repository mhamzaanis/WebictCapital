import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Dialog, IconButton, Slide, Typography } from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { motion, useReducedMotion } from 'motion/react'
import { forwardRef, type ReactElement, type Ref } from 'react'
import { useAuth } from '../context/AuthContext'

type AuthModalProps = {
  open: boolean
  onClose: () => void
}

const NUMBER_FONT = 'var(--wc-number-font)'
const SERIF = '"Playfair Display", serif'

const SlideUp = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  )
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const reduce = useReducedMotion()
  const { signInWithGoogle, error, clearError } = useAuth()

  return (
    <Dialog
      open={open}
      onClose={() => { clearError(); onClose() }}
      fullWidth
      maxWidth={false}
      slots={{ transition: SlideUp }}
      slotProps={{
        transition: { timeout: reduce ? 0 : 280 },
        backdrop: {
          sx: { bgcolor: 'rgba(5,10,20,0.4)', backdropFilter: 'blur(6px)' },
        },
        paper: {
          sx: {
            width: { xs: '100%', sm: 420 },
            maxWidth: '100vw',
            maxHeight: { xs: '100dvh', sm: '92dvh' },
            borderRadius: { xs: 0, sm: '20px' },
            border: '1px solid var(--wc-divider)',
            bgcolor: 'var(--wc-paper)',
            overflow: 'hidden',
            boxShadow: '0 32px 64px rgba(8,14,26,0.18)',
          },
        },
      }}
    >
      {/* ── HEADER ── */}
      <Box sx={{
        px: { xs: 2.5, md: 3 },
        pt: 2.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <Typography sx={{
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--wc-text-secondary)',
          fontFamily: NUMBER_FONT,
          fontWeight: 600,
        }}>
          Webict Capital
        </Typography>
        <IconButton
          onClick={() => { clearError(); onClose() }}
          size="small"
          component={motion.button}
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            border: '1px solid var(--wc-divider)',
            bgcolor: 'var(--wc-surface)',
            color: 'var(--wc-text-secondary)',
            mt: '-2px',
            '&:hover': { color: 'var(--wc-text-primary)' },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* ── HERO ── */}
      <Box sx={{ px: { xs: 2.5, md: 3 }, pt: 3.5 }}>
        {/* Icon pair */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '10px',
            bgcolor: 'var(--wc-surface)',
            border: '1px solid var(--wc-divider)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* bar chart icon — inline SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--wc-text-secondary)' }}>
              <rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/>
            </svg>
          </Box>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'var(--wc-divider)' }} />
          <Box sx={{
            width: 40, height: 40, borderRadius: '10px',
            bgcolor: 'rgba(13,92,50,0.07)',
            border: '1px solid rgba(13,92,50,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0d5c32' }}>
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </Box>
        </Box>

        <Typography sx={{
          fontSize: { xs: 18, md: 20 },
          fontWeight: 700,
          color: 'var(--wc-text-primary)',
          fontFamily: SERIF,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          mb: 1,
        }}>
          Sign in to save your portfolio
        </Typography>
        <Typography sx={{
          fontSize: 13,
          color: 'var(--wc-text-secondary)',
          fontFamily: SERIF,
          lineHeight: 1.6,
          mb: 3,
        }}>
          Sync holdings, watchlist and trade history to your Google account.
        </Typography>
      </Box>

      {/* ── BODY ── */}
      <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 3 }}>
        {/* Benefits list */}
        <Box sx={{
          border: '1px solid var(--wc-divider)',
          borderRadius: '12px',
          overflow: 'hidden',
          mb: 2.5,
        }}>
          {[
            { icon: '⊞', label: 'Holdings synced to the cloud' },
            { icon: '◫', label: 'Watchlist across all devices' },
            { icon: '↺', label: 'Trade history tracked automatically' },
          ].map(({ label }, i, arr) => (
            <Box key={i} sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.75,
              py: 1.2,
              borderBottom: i < arr.length - 1 ? '1px solid var(--wc-divider)' : 'none',
            }}>
              <Box sx={{
                width: 6, height: 6,
                borderRadius: '50%',
                bgcolor: 'var(--wc-primary)',
                opacity: 0.35,
                flexShrink: 0,
              }} />
              <Typography sx={{ fontSize: 12.5, color: 'var(--wc-text-secondary)', fontFamily: SERIF }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Error */}
        {error && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
            px: 1.5,
            py: 1,
            borderRadius: '8px',
            bgcolor: 'rgba(180,0,0,0.05)',
            border: '1px solid rgba(180,0,0,0.15)',
          }}>
            <Typography sx={{ fontSize: 12, color: 'var(--wc-error)', fontFamily: SERIF, lineHeight: 1.5 }}>
              {error}
            </Typography>
          </Box>
        )}

        {/* Google button */}
        <Box
          component={motion.button}
          onClick={signInWithGoogle}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.2,
            py: 1.4,
            border: '1px solid var(--wc-divider)',
            borderRadius: '12px',
            bgcolor: 'var(--wc-paper)',
            cursor: 'pointer',
            outline: 'none',
            transition: 'background 0.15s ease',
            '&:hover': { bgcolor: 'var(--wc-surface)' },
          }}
        >
          <GoogleLogo />
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'var(--wc-text-primary)', fontFamily: NUMBER_FONT }}>
            Continue with Google
          </Typography>
        </Box>

        <Typography sx={{
          fontSize: 11,
          color: 'var(--wc-text-secondary)',
          fontFamily: SERIF,
          textAlign: 'center',
          mt: 1.5,
          opacity: 0.7,
        }}>
          Secured by Supabase · We never share your data
        </Typography>
      </Box>
    </Dialog>
  )
}
