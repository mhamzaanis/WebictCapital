import { InputAdornment, Stack, TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'

export type MovementFilter = 'all' | 'gainers' | 'losers' | 'unchanged'

export type FiltersBarProps = {
  disabled: boolean
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  movementFilter: MovementFilter
  setMovementFilter: Dispatch<SetStateAction<MovementFilter>>
  industryFilter: string
  setIndustryFilter: Dispatch<SetStateAction<string>>
  industryOptions: string[]
}

const UI_FONT = 'var(--wc-font-body)'

const filterFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'var(--wc-surface)',
    color: 'var(--wc-text-primary)',
    fontFamily: UI_FONT,
    fontSize: 13,
    borderRadius: '10px',
    '& fieldset': { borderColor: 'var(--wc-border)' },
    '&:hover fieldset': { borderColor: 'rgba(10,46,120,0.35)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--wc-primary)', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root': { color: 'var(--wc-text-muted)', fontFamily: UI_FONT, fontSize: 13 },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--wc-primary)' },
  '& input::placeholder': { color: 'var(--wc-text-muted)', opacity: 1 },
  '& select': { fontFamily: UI_FONT },
}

export function FiltersBar({
  disabled,
  search,
  setSearch,
  movementFilter,
  setMovementFilter,
  industryFilter,
  setIndustryFilter,
  industryOptions,
}: FiltersBarProps) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
      <TextField
        placeholder="Search symbol or company…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8097b0', fontSize: 15 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: { xs: '100%', md: '50%' }, ...filterFieldSx }}
      />

      <TextField
        select
        size="small"
        label="Movement"
        value={movementFilter}
        onChange={(e) => setMovementFilter(e.target.value as MovementFilter)}
        disabled={disabled}
        slotProps={{ select: { native: true } }}
        sx={{ width: { xs: '100%', md: '25%' }, ...filterFieldSx }}
      >
        <option value="all">All</option>
        <option value="gainers">Gainers</option>
        <option value="losers">Losers</option>
        <option value="unchanged">Unchanged</option>
      </TextField>

      <TextField
        select
        size="small"
        label="Industry"
        value={industryFilter}
        onChange={(e) => setIndustryFilter(e.target.value)}
        disabled={disabled}
        slotProps={{ select: { native: true } }}
        sx={{ width: { xs: '100%', md: '25%' }, ...filterFieldSx }}
      >
        <option value="all">All Industries</option>
        {industryOptions.map((industry) => (
          <option key={industry} value={industry}>
            {industry}
          </option>
        ))}
      </TextField>
    </Stack>
  )
}
