import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { NavBar } from '../components/layout/NavBar'

export function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'common.white' }}>
      <NavBar />
      <Outlet />
      <Footer />
    </Box>
  )
}
