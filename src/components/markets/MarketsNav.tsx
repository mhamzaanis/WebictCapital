import { Box, Container, Tab, Tabs } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Overview', href: '/data' },
  { label: 'Stocks', href: '/data/stocks' },
  { label: 'Compare', href: '/data/compare' },
  { label: 'Rates', href: '/data/rates' },
]

export function MarketsNav() {
  const { pathname } = useLocation()
  const active = tabs.find((tab) => pathname === tab.href)?.href ?? false

  return (
    <Box sx={{ borderBottom: '1px solid var(--wc-border)', bgcolor: 'rgba(255,255,255,0.86)', position: 'sticky', top: 72, zIndex: 8, backdropFilter: 'blur(12px)' }}>
      <Container maxWidth="xl">
        <Tabs
          value={active}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Markets workspace navigation"
          sx={{
            minHeight: 46,
            '& .MuiTab-root': {
              minHeight: 46,
              fontFamily: 'var(--wc-font-body)',
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'none',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.href} value={tab.href} label={tab.label} component={Link} to={tab.href} />
          ))}
        </Tabs>
      </Container>
    </Box>
  )
}
