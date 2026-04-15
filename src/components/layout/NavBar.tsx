import { useEffect, useState } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { AppBar, Box, Container, Drawer, IconButton, InputBase, Link, Modal, Stack, Toolbar, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { navItems } from '../../content/siteContent'

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLearnOpen, setIsLearnOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const hasOpenSubmenu = isLearnOpen
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 16)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <Box
        component={motion.div}
        initial={reduceMotion ? false : { opacity: 0, y: -22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
      <AppBar position="fixed" elevation={0} sx={{
          '@keyframes dotBounce': {
            '0%, 100%': { transform: 'translateY(0)' },
            '35%': { transform: 'translateY(-9px)' },
            '70%': { transform: 'translateY(0)' },
            '85%': { transform: 'translateY(-4px)' },
          },
          bgcolor: hasOpenSubmenu ? 'rgba(255,255,255,0.98)' : isScrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: hasOpenSubmenu || isScrolled ? 'divider' : 'transparent',
          backdropFilter: hasOpenSubmenu ? 'blur(12px)' : isScrolled ? 'blur(8px)' : 'none',
          boxShadow: hasOpenSubmenu ? '0 14px 28px rgba(0,0,0,0.12)' : isScrolled ? '0 6px 20px rgba(0,0,0,0.06)' : 'none',
          transition: 'background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease, backdrop-filter 220ms ease',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 1.5, md: 3 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, justifyContent: 'space-between', gap: 2 }}>
          <Link
            component={RouterLink}
            to="/"
            underline="none"
            color="inherit"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              '&:hover .logo-dot': {
                animation: 'dotBounce 520ms ease',
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontSize: { xs: 25, sm: 29, md: 36 },
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              Webict Capital
              <Box component="span" className="logo-dot" sx={{ color: 'primary.main', display: 'inline-block', fontSize: { xs: 34, sm: 40, md: 50 } }}>
                .
              </Box>
            </Typography>
          </Link>

          <Stack direction="row" spacing={0.3} sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
            <IconButton aria-label="Search" onClick={() => setIsSearchOpen(true)} sx={{ color: 'text.secondary' }}>
              <SearchOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton aria-label="Open navigation menu" onClick={() => setIsMobileMenuOpen(true)} sx={{ color: 'text.secondary' }}>
              <MenuRoundedIcon sx={{ fontSize: 23 }} />
            </IconButton>
          </Stack>

            <Stack direction="row" spacing={{ xs: 2.5, md: 4.6 }} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {navItems.map((item, index) => (
              <Box
                key={item.label}
                component={motion.div}
                initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.04, duration: 0.3 }}
              >
              <Link
                href={item.href}
                underline="none"
                color="text.secondary"
                sx={{
                  fontSize: { md: 15, lg: 16 },
                  fontWeight: 500,
                  position: 'relative',
                  px: 0.35,
                  py: 0.4,
                  transition: 'color 0.25s ease',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 2,
                    right: 2,
                    bottom: -5,
                    height: 2,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    opacity: 0,
                    transform: 'scaleX(0.25)',
                    transformOrigin: 'center',
                    transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
                  },
                  '&:hover': { color: 'text.primary' },
                  '&:hover::after': {
                    opacity: 1,
                    transform: 'scaleX(1)',
                  },
                }}
              >
                {item.label}
              </Link>
              </Box>
            ))}

            <Box
              onMouseEnter={() => setIsLearnOpen(true)}
              onMouseLeave={() => setIsLearnOpen(false)}
              sx={{ position: 'relative', '&::after': { content: '""', position: 'absolute', top: '100%', left: 0, right: 0, height: 8 } }}
            >
              <Link
                component={RouterLink}
                to="/glossary"
                underline="none"
                color={pathname.startsWith('/glossary') ? 'text.primary' : 'text.secondary'}
                sx={{
                  fontSize: { md: 15, lg: 16 },
                  fontWeight: 500,
                  position: 'relative',
                  px: 0.35,
                  py: 0.4,
                  transition: 'color 0.25s ease',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 2,
                    right: 2,
                    bottom: -5,
                    height: 2,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    opacity: pathname.startsWith('/glossary') || isLearnOpen ? 1 : 0,
                    transform: pathname.startsWith('/glossary') || isLearnOpen ? 'scaleX(1)' : 'scaleX(0.25)',
                    transformOrigin: 'center',
                    transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
                  },
                  '&:hover': { color: 'text.primary' },
                }}
              >
                Learn
              </Link>

              <Box
                sx={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: isLearnOpen ? 'translate(-50%, 0)' : 'translate(-50%, -6px)',
                  opacity: isLearnOpen ? 1 : 0,
                  pointerEvents: isLearnOpen ? 'auto' : 'none',
                  minWidth: 220,
                  bgcolor: 'rgba(255,255,255,0.98)',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 18px 32px rgba(0,0,0,0.12)',
                  borderRadius: 1,
                  overflow: 'hidden',
                  transition: 'opacity 180ms ease, transform 180ms ease',
                  zIndex: 10,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -7,
                    left: '50%',
                    width: 14,
                    height: 14,
                    bgcolor: 'common.white',
                    borderTop: '1px solid',
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    transform: 'translateX(-50%) rotate(45deg)',
                  },
                }}
              >
                <Link
                  component={RouterLink}
                  to="/glossary"
                  underline="none"
                  color="text.primary"
                  onClick={() => setIsLearnOpen(false)}
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'block',
                    px: 2.25,
                    py: 1.6,
                    fontSize: 15,
                    fontWeight: 500,
                    bgcolor: 'common.white',
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    '&:hover': { bgcolor: '#f4f6f8', color: 'text.primary' },
                  }}
                >
                  Glossary
                </Link>
              </Box>
            </Box>

              <IconButton
                aria-label="Search"
                onClick={() => setIsSearchOpen(true)}
                sx={{
                  color: 'text.secondary',
                  transition: 'color 0.25s ease, transform 0.25s ease',
                  '&:hover': { color: 'primary.main', transform: 'translateY(-1px)' },
                }}
              >
                <SearchOutlinedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      </Box>

      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'fixed',
          top: { xs: 64, md: 72 },
          left: 0,
          right: 0,
          bottom: 0,
          opacity: hasOpenSubmenu ? 1 : 0,
          pointerEvents: 'none',
          backdropFilter: hasOpenSubmenu ? 'blur(8px)' : 'none',
          backgroundColor: hasOpenSubmenu ? 'rgba(247, 248, 250, 0.2)' : 'transparent',
          transition: 'opacity 220ms ease, backdrop-filter 220ms ease, background-color 220ms ease',
          zIndex: theme.zIndex.appBar - 1,
        })}
      />

      <Modal open={isSearchOpen} onClose={() => setIsSearchOpen(false)}>
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(11, 21, 36, 0.38)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'start center',
            pt: { xs: '18vh', md: '22vh' },
            px: 2,
          }}
        >
          <Box
            component={motion.div}
            initial={reduceMotion ? false : { opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              width: 'min(760px, 100%)',
              bgcolor: 'common.white',
              border: '1px solid',
              borderColor: '#c9d9f2',
              borderRadius: 1.4,
              boxShadow: '0 26px 42px rgba(9, 24, 51, 0.24)',
              p: { xs: 1.2, md: 1.5 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
              <SearchOutlinedIcon sx={{ color: '#36527d' }} />
              <InputBase
                autoFocus
                placeholder="Search articles, glossary terms, resources..."
                inputProps={{ 'aria-label': 'Search content' }}
                sx={{
                  flex: 1,
                  fontSize: { xs: 15, md: 17 },
                  color: '#12233f',
                  '& input::placeholder': { color: '#6b7b92', opacity: 1 },
                }}
              />
              <IconButton aria-label="Close search" onClick={() => setIsSearchOpen(false)}>
                <CloseRoundedIcon sx={{ color: '#36527d' }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Modal>

      <Drawer anchor="right" open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
        <Box sx={{ width: 290, height: '100%', bgcolor: '#f9fbff', px: 2.2, py: 1.8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.6 }}>
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: 24, color: '#122544' }}>Menu</Typography>
            <IconButton aria-label="Close navigation menu" onClick={() => setIsMobileMenuOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Stack spacing={0.35}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                underline="none"
                onClick={() => setIsMobileMenuOpen(false)}
                sx={{
                  px: 1,
                  py: 1.05,
                  borderRadius: 1,
                  color: 'text.primary',
                  fontSize: 16,
                  '&:hover': { bgcolor: '#eaf2ff' },
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              component={RouterLink}
              to="/glossary"
              underline="none"
              onClick={() => setIsMobileMenuOpen(false)}
              sx={{
                px: 1,
                py: 1.05,
                borderRadius: 1,
                color: pathname.startsWith('/glossary') ? '#123570' : 'text.primary',
                fontSize: 16,
                fontWeight: pathname.startsWith('/glossary') ? 700 : 500,
                '&:hover': { bgcolor: '#eaf2ff' },
              }}
            >
              Learn / Glossary
            </Link>
          </Stack>
        </Box>
      </Drawer>
    </>
  )
}
