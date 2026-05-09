import { useEffect, useState } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { AppBar, Avatar, Box, Container, Divider, Drawer, IconButton, Link, Menu, MenuItem, Stack, Toolbar, Typography } from '@mui/material'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { navItems } from '../../content/siteContent'
import { useAuth } from '../../context/AuthContext'

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [openDropdownLabel, setOpenDropdownLabel] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null)
  const { pathname } = useLocation()
  const hasOpenSubmenu = Boolean(openDropdownLabel)
  const reduceMotion = useReducedMotion()
  const { user, signOut } = useAuth()

  const userMenuOpen = Boolean(userMenuAnchor)
  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) => setUserMenuAnchor(e.currentTarget)
  const handleUserMenuClose = () => setUserMenuAnchor(null)
  const handleSignOut = async () => {
    handleUserMenuClose()
    await signOut()
  }

  const isInternalHref = (href: string) => href.startsWith('/')
  const getPathFromHref = (href: string) => href.split('#')[0] || '/'
  const isActiveHref = (href: string) => {
    if (!isInternalHref(href)) return false
    const targetPath = getPathFromHref(href)
    return pathname === targetPath || (targetPath !== '/' && pathname.startsWith(targetPath))
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      {/* ── AppBar ── */}
      <Box
        component={motion.div}
        initial={reduceMotion ? false : { opacity: 0, y: -28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: hasOpenSubmenu
              ? 'rgba(255,255,255,0.99)'
              : isScrolled
              ? 'rgba(255,255,255,0.96)'
              : 'transparent',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor:
              hasOpenSubmenu || isScrolled ? '#e2eaf5' : 'transparent',
            backdropFilter:
              hasOpenSubmenu ? 'blur(16px)' : isScrolled ? 'blur(10px)' : 'none',
            boxShadow:
              hasOpenSubmenu
                ? '0 12px 28px rgba(10,36,99,0.08)'
                : isScrolled
                ? '0 4px 16px rgba(10,36,99,0.05)'
                : 'none',
            transition:
              'background-color 260ms ease, border-color 260ms ease, box-shadow 260ms ease, backdrop-filter 260ms ease',
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
            <Toolbar
              disableGutters
              sx={{
                minHeight: { xs: 64, md: 72 },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              {/* ── Logo ── */}
              <Link
                component={RouterLink}
                to="/"
                underline="none"
                color="inherit"
                onMouseEnter={() => setLogoHovered(true)}
                onMouseLeave={() => setLogoHovered(false)}
                sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0 }}
              >
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'inline-flex', alignItems: 'baseline' }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: 22, sm: 26, md: 30 },
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      fontWeight: 800,
                      color: '#080e1a',
                      transition: 'color 0.22s ease',
                      ...(logoHovered && { color: '#0a2463' }),
                    }}
                  >
                    Webict Capital
                  </Typography>

                  {/* Animated dot — multi-bounce with ripple on hover */}
                  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-end', ml: '1px' }}>
                    {/* Ripple ring — appears on hover */}
                    <AnimatePresence>
                      {logoHovered && !reduceMotion && (
                        <motion.span
                          key="ripple"
                          initial={{ scale: 0.4, opacity: 0.6 }}
                          animate={{ scale: 2.8, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.55, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: 'rgba(10,36,99,0.18)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <motion.span
                      animate={
                        reduceMotion
                          ? {}
                          : logoHovered
                          ? {
                              y: [0, -14, 0, -7, 0, -3, 0],
                              transition: {
                                duration: 0.72,
                                ease: 'easeOut',
                                times: [0, 0.22, 0.42, 0.58, 0.74, 0.88, 1],
                              },
                            }
                          : { y: 0 }
                      }
                      style={{ display: 'inline-block', lineHeight: 1 }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          fontSize: { xs: 38, sm: 44, md: 52 },
                          lineHeight: 0.72,
                          color: '#0a2463',
                          fontWeight: 900,
                          display: 'inline-block',
                          transition: 'color 0.22s ease',
                        }}
                      >
                        .
                      </Typography>
                    </motion.span>
                  </Box>
                </motion.div>
              </Link>

              {/* ── Mobile menu button ── */}
              <Stack
                direction="row"
                spacing={0.3}
                sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}
              >
                {user && (
                  <Avatar
                    src={user.user_metadata?.avatar_url ?? undefined}
                    alt={user.user_metadata?.full_name ?? user.email ?? ''}
                    onClick={handleUserMenuOpen}
                    sx={{
                      width: 30,
                      height: 30,
                      cursor: 'pointer',
                      border: '1.5px solid var(--wc-divider)',
                      transition: 'border-color 0.2s ease',
                      '&:hover': { borderColor: 'var(--wc-primary)' },
                    }}
                  />
                )}
                <motion.div
                  whileTap={reduceMotion ? undefined : { scale: 0.88 }}
                  transition={{ duration: 0.16 }}
                >
                  <IconButton
                    aria-label="Open navigation menu"
                    onClick={() => setIsMobileMenuOpen(true)}
                    sx={{
                      color: '#080e1a',
                      transition: 'color 0.2s ease',
                      '&:hover': { color: '#0a2463', bgcolor: '#f0f4fb' },
                    }}
                  >
                    <MenuRoundedIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </motion.div>
              </Stack>

              {/* ── Desktop nav links ── */}
              <Stack
                direction="row"
                spacing={{ xs: 2, md: 4 }}
                sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
              >
                {navItems.map((item, index) => {
                  const hasChildren = Boolean(item.children?.length)
                  const isDropdownOpen = openDropdownLabel === item.label
                  const isItemActive =
                    isActiveHref(item.href) ||
                    (item.children?.some((child) => isActiveHref(child.href)) ?? false)

                  if (hasChildren) {
                    return (
                      <Box
                        key={item.label}
                        component={motion.div}
                        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 + index * 0.05, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        onMouseEnter={() => setOpenDropdownLabel(item.label)}
                        onMouseLeave={() => setOpenDropdownLabel(null)}
                        sx={{
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            height: 10,
                          },
                        }}
                      >
                        <NavLink
                          item={item}
                          isItemActive={isItemActive}
                          isDropdownOpen={isDropdownOpen}
                          isInternalHref={isInternalHref}
                          onClick={(e) => {
                            e.preventDefault()
                            setOpenDropdownLabel((c) => (c === item.label ? null : item.label))
                          }}
                        />

                        {/* Dropdown */}
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              key="dropdown"
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.98 }}
                              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 10px)',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                minWidth: 220,
                                background: '#ffffff',
                                border: '1px solid #e2eaf5',
                                boxShadow: '0 16px 32px rgba(10,36,99,0.1)',
                                borderRadius: 6,
                                overflow: 'hidden',
                                zIndex: 10,
                              }}
                            >
                              {/* Arrow */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -7,
                                  left: '50%',
                                  width: 14,
                                  height: 14,
                                  bgcolor: '#ffffff',
                                  borderTop: '1px solid #e2eaf5',
                                  borderLeft: '1px solid #e2eaf5',
                                  transform: 'translateX(-50%) rotate(45deg)',
                                }}
                              />
                              {item.children?.map((child, ci) => (
                                <motion.div
                                  key={child.label}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: ci * 0.04, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <Link
                                    component={isInternalHref(child.href) ? RouterLink : 'a'}
                                    to={isInternalHref(child.href) ? child.href : undefined}
                                    href={!isInternalHref(child.href) ? child.href : undefined}
                                    underline="none"
                                    color="text.primary"
                                    onClick={() => setOpenDropdownLabel(null)}
                                    sx={{
                                      display: 'block',
                                      px: 2.4,
                                      py: 1.5,
                                      fontSize: 14.5,
                                      fontWeight: 500,
                                      color: '#253750',
                                      position: 'relative',
                                      transition: 'background-color 0.18s ease, color 0.18s ease',
                                      '&:hover': { bgcolor: '#f0f4fb', color: '#0a2463' },
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: '20%',
                                        bottom: '20%',
                                        width: 2,
                                        bgcolor: '#0a2463',
                                        borderRadius: 1,
                                        opacity: 0,
                                        transition: 'opacity 0.18s ease',
                                      },
                                      '&:hover::before': { opacity: 1 },
                                    }}
                                  >
                                    {child.label}
                                  </Link>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Box>
                    )
                  }

                  return (
                    <Box
                      key={item.label}
                      component={motion.div}
                      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + index * 0.05, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <NavLink
                        item={item}
                        isItemActive={isItemActive}
                        isDropdownOpen={false}
                        isInternalHref={isInternalHref}
                      />
                    </Box>
                  )
                })}

                {/* ── User profile (desktop) ── */}
                {user && (
                  <Box
                    component={motion.div}
                    initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    onClick={handleUserMenuOpen}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      ml: 1,
                      pl: 1,
                      borderLeft: '1px solid #e2eaf5',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s ease',
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    <Avatar
                      src={user.user_metadata?.avatar_url ?? undefined}
                      alt={user.user_metadata?.full_name ?? user.email ?? ''}
                      sx={{
                        width: 32,
                        height: 32,
                        border: '1.5px solid #e2eaf5',
                        transition: 'border-color 0.2s ease',
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#253750',
                        fontFamily: '"Playfair Display", serif',
                        maxWidth: 120,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>

      {/* ── Backdrop overlay when dropdown open ── */}
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
          backdropFilter: hasOpenSubmenu ? 'blur(6px)' : 'none',
          backgroundColor: hasOpenSubmenu ? 'rgba(240,244,251,0.18)' : 'transparent',
          transition: 'opacity 220ms ease, backdrop-filter 220ms ease',
          zIndex: theme.zIndex.appBar - 1,
        })}
      />

      {/* ── User menu (sign out) ── */}
      <Menu
        anchorEl={userMenuAnchor}
        open={userMenuOpen}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.8,
              minWidth: 180,
              borderRadius: '10px',
              border: '1px solid #e2eaf5',
              boxShadow: '0 12px 28px rgba(10,36,99,0.1)',
              overflow: 'hidden',
            },
          },
        }}
      >
        {user && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#080e1a', fontFamily: '"Playfair Display", serif' }}>
              {user.user_metadata?.full_name ?? 'User'}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: '#4a5e78', fontFamily: '"Noto Sans Mono", monospace', mt: 0.1 }}>
              {user.email}
            </Typography>
          </Box>
        )}
        <Divider sx={{ borderColor: '#e2eaf5' }} />
        <MenuItem
          onClick={handleSignOut}
          sx={{
            fontSize: 12.5,
            color: '#b4283a',
            fontFamily: '"Playfair Display", serif',
            py: 1.2,
            gap: 1,
            '&:hover': { bgcolor: 'rgba(180,40,58,0.04)' },
          }}
        >
          <LogoutRoundedIcon sx={{ fontSize: 16 }} />
          Sign out
        </MenuItem>
      </Menu>

      {/* ── Mobile drawer ── */}
      <Drawer
        anchor="right"
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 300,
              bgcolor: '#ffffff',
              borderLeft: '1px solid #e2eaf5',
              boxShadow: '-8px 0 32px rgba(10,36,99,0.08)',
            },
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: 2.5, py: 2 }}>
          {/* Drawer header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ borderTop: '2px solid #0a2463', pt: 1, pr: 3 }}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontFamily: '"Playfair Display", serif',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#0a2463',
                }}
              >
                Navigation
              </Typography>
            </Box>
            <motion.div whileTap={reduceMotion ? undefined : { scale: 0.85, rotate: 90 }} transition={{ duration: 0.2 }}>
              <IconButton
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
                sx={{ color: '#080e1a', '&:hover': { bgcolor: '#f0f4fb' } }}
              >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </motion.div>
          </Box>

          {/* Nav items */}
          <Stack spacing={0.25} sx={{ flex: 1 }}>
            {navItems.map((item, index) => {
              const isActive =
                isActiveHref(item.href) ||
                (item.children?.some((child) => isActiveHref(child.href)) ?? false)

              return (
                <motion.div
                  key={item.label}
                  initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    component={isInternalHref(item.href) ? RouterLink : 'a'}
                    to={isInternalHref(item.href) ? item.href : undefined}
                    href={!isInternalHref(item.href) ? item.href : undefined}
                    underline="none"
                    onClick={() => setIsMobileMenuOpen(false)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1.4,
                      py: 1.15,
                      borderRadius: 1,
                      color: isActive ? '#0a2463' : '#253750',
                      fontSize: 15.5,
                      fontWeight: isActive ? 700 : 500,
                      bgcolor: isActive ? '#f0f4fb' : 'transparent',
                      borderLeft: isActive ? '2px solid #0a2463' : '2px solid transparent',
                      transition: 'all 0.18s ease',
                      '&:hover': { bgcolor: '#f5f8ff', color: '#0a2463', borderLeftColor: '#0a2463' },
                    }}
                  >
                    {item.label}
                    {isActive && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#0a2463',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Link>

                  {/* Sub-items */}
                  {item.children?.map((child) => (
                    <Link
                      key={child.label}
                      component={isInternalHref(child.href) ? RouterLink : 'a'}
                      to={isInternalHref(child.href) ? child.href : undefined}
                      href={!isInternalHref(child.href) ? child.href : undefined}
                      underline="none"
                      onClick={() => setIsMobileMenuOpen(false)}
                      sx={{
                        display: 'block',
                        pl: 3.2,
                        pr: 1.4,
                        py: 0.9,
                        borderRadius: 1,
                        color: isActiveHref(child.href) ? '#0a2463' : '#4a5e78',
                        fontSize: 14,
                        fontWeight: isActiveHref(child.href) ? 600 : 400,
                        transition: 'all 0.18s ease',
                        '&:hover': { bgcolor: '#f5f8ff', color: '#0a2463' },
                      }}
                    >
                      {child.label}
                    </Link>
                  ))}
                </motion.div>
              )
            })}
          </Stack>

          {/* Drawer footer */}
          <Box sx={{ borderTop: '1px solid #e2eaf5', pt: 2, mt: 2 }}>
            {user && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Avatar
                  src={user.user_metadata?.avatar_url ?? undefined}
                  alt={user.user_metadata?.full_name ?? user.email ?? ''}
                  sx={{ width: 32, height: 32, border: '1.5px solid #e2eaf5' }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#080e1a', fontFamily: '"Playfair Display", serif' }}>
                    {user.user_metadata?.full_name ?? 'User'}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: '#4a5e78', fontFamily: '"Noto Sans Mono", monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleSignOut}
                  size="small"
                  sx={{ color: '#b4283a', '&:hover': { bgcolor: 'rgba(180,40,58,0.06)' } }}
                >
                  <LogoutRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            )}
            <Typography
              sx={{
                fontSize: 10,
                fontFamily: '"Playfair Display", serif',
                letterSpacing: '0.12em',
                color: '#8097b0',
                textTransform: 'uppercase',
              }}
            >
              Webict Capital · Karachi, Pakistan
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

// ── Shared nav link component ─────────────────────────────────────────────────

function NavLink({
  item,
  isItemActive,
  isDropdownOpen,
  isInternalHref,
  onClick,
}: {
  item: { label: string; href: string }
  isItemActive: boolean
  isDropdownOpen: boolean
  isInternalHref: (href: string) => boolean
  onClick?: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)
  const reduce = useReducedMotion()
  const isActive = isItemActive || isDropdownOpen

  return (
    <Link
      component={isInternalHref(item.href) ? RouterLink : 'a'}
      to={isInternalHref(item.href) ? item.href : undefined}
      href={!isInternalHref(item.href) ? item.href : undefined}
      underline="none"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        fontSize: { md: 14.5, lg: 15.5 },
        fontWeight: 500,
        position: 'relative',
        px: 0.4,
        py: 0.5,
        color: isActive ? '#080e1a' : '#4a5e78',
        letterSpacing: '0.01em',
        transition: 'color 0.22s ease',
        display: 'inline-block',
        '&:hover': { color: '#080e1a' },
      }}
    >
      {item.label}

      {/* Underline bar */}
      <motion.span
        animate={{
          scaleX: isActive || hovered ? 1 : 0,
          opacity: isActive || hovered ? 1 : 0,
        }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          left: 4,
          right: 4,
          bottom: -4,
          height: 2,
          borderRadius: 2,
          backgroundColor: '#0a2463',
          transformOrigin: 'center',
          display: 'block',
        }}
      />

      {/* Active dot — pulses once on mount */}
      {isActive && !reduce && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.05 }}
          style={{
            position: 'absolute',
            top: 2,
            right: -4,
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: '#0a2463',
            display: 'block',
          }}
        />
      )}
    </Link>
  )
}