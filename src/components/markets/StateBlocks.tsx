import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { getErrorMessage } from '../../lib/api/errors'
import { CARD_SX } from './marketUtils'

export function LoadingBlock({ label = 'Loading market data...' }: { label?: string }) {
  return (
    <Box sx={{ ...CARD_SX, p: 4, display: 'flex', justifyContent: 'center' }}>
      <Stack spacing={1.4} sx={{ alignItems: 'center' }}>
        <CircularProgress size={28} />
        <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13 }}>{label}</Typography>
      </Stack>
    </Box>
  )
}

export function ErrorBlock({ error }: { error: unknown }) {
  return (
    <Box sx={{ ...CARD_SX, p: 3, borderColor: 'rgba(197,51,70,0.35)' }}>
      <Stack direction="row" spacing={1.2}>
        <ErrorOutlineIcon sx={{ color: 'var(--wc-error)' }} />
        <Box>
          <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 800 }}>Market API request failed</Typography>
          <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, mt: 0.5 }}>{getErrorMessage(error)}</Typography>
        </Box>
      </Stack>
    </Box>
  )
}

export function EmptyBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <Box sx={{ ...CARD_SX, p: 4, textAlign: 'center' }}>
      <InboxOutlinedIcon sx={{ color: 'var(--wc-text-muted)', fontSize: 34 }} />
      <Typography sx={{ color: 'var(--wc-text-primary)', fontWeight: 800, mt: 1 }}>{title}</Typography>
      <Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, mt: 0.6 }}>{detail}</Typography>
    </Box>
  )
}
