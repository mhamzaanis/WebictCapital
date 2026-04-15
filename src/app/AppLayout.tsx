import { Box } from '@mui/material'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { NavBar } from '../components/layout/NavBar'

export function AppLayout() {
  const { pathname } = useLocation()
  const reduceMotion = useReducedMotion()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'common.white' }}>
      <NavBar />
      <AnimatePresence mode="wait" initial={false}>
        <Box
          key={pathname}
          component={motion.div}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </Box>
      </AnimatePresence>
      <Footer />
    </Box>
  )
}
