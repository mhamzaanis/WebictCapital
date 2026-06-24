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

const MONO = '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace'

const filterFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#ffffff',
    color: '#0d1c30',
    fontFamily: MONO,
    fontSize: 12,
    borderRadius: 1,
    '& fieldset': { borderColor: '#dde7f4' },
    '&:hover fieldset': { borderColor: '#0a2463' },
    '&.Mui-focused fieldset': { borderColor: '#0a2463', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#0a2463' },
  '& input::placeholder': { color: '#8097b0', opacity: 1 },
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
