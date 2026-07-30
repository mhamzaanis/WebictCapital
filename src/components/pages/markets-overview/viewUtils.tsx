import { TableCell, Tooltip, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { Tone } from '../../../lib/marketOverview'
import { DATA_FONT } from '../../markets/marketUtils'
import { metadataSx, sectionTitleSx, toneColor } from './viewFormat'

export function SectionHeader({ title, detail, right }: { title: string; detail?: ReactNode; right?: ReactNode }) {
  return (
    <Typography component="div" sx={{ mb: 1.5 }}>
      <Typography component="h2" sx={sectionTitleSx}>
        {title}
      </Typography>
      {(detail || right) && (
        <Typography component="div" sx={{ mt: 0.35, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          {detail && <Typography component="span" sx={metadataSx}>{detail}</Typography>}
          {right}
        </Typography>
      )}
    </Typography>
  )
}

export function NumericCell({
  children,
  tone,
  title,
}: {
  children: ReactNode
  tone?: Tone
  title?: string
}) {
  const cell = (
    <TableCell
      align="right"
      sx={{
        color: tone ? toneColor(tone) : 'var(--wc-text-primary)',
        fontFamily: DATA_FONT,
        fontSize: 13,
        fontWeight: tone ? 800 : 650,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </TableCell>
  )
  return title ? <Tooltip title={title}>{cell}</Tooltip> : cell
}
