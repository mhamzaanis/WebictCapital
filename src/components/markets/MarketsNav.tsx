import { Box, Container, Tab, Tabs } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Overview', href: '/data' },
  { label: 'Stocks', href: '/data/stocks' },
  { label: 'Compare', href: '/data/compare' },
  { label: 'KIBOR', href: '/data/rates' },
  { label: 'USD/PKR', href: '/data/rates/usd-pkr' },
]

export function MarketsNav() {
  const { pathname } = useLocation()
  const active = tabs.find((tab) => pathname === tab.href)?.href ?? false

  return (
    <Box sx={{ borderBottom: '1px solid var(--wc-border)', bgcolor: 'rgba(255,255,255,0.92)', position: 'sticky', top: 80, zIndex: 8, backdropFilter: 'blur(2px)', mt: { xs: 8, md: 9 } }}>
      <Container maxWidth="xl">
        <Tabs
          value={active}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Markets workspace navigation"
          sx={{
            minHeight: 46,
            '& .MuiTabs-indicator': {
              height: 2,
              bgcolor: 'var(--wc-primary)',
            },
            '& .MuiTab-root': {
              minHeight: 46,
              minWidth: 'auto',
              px: { xs: 1.3, md: 1.8 },
              fontFamily: 'var(--wc-font-body)',
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'none',
              color: 'var(--wc-text-secondary)',
              '&.Mui-selected': {
                color: 'var(--wc-primary)',
              },
              '&:focus-visible': {
                outline: '2px solid var(--wc-primary)',
                outlineOffset: -2,
              },
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
