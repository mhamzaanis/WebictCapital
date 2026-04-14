import { useEffect, useState } from 'react'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { AppBar, Box, Container, IconButton, Link, Stack, Toolbar, Typography } from '@mui/material'
import { navItems } from '../../content/siteContent'

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false)

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
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        '@keyframes dotBounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '35%': { transform: 'translateY(-5px)' },
          '70%': { transform: 'translateY(0)' },
          '85%': { transform: 'translateY(-2px)' },
        },
        bgcolor: isScrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: isScrolled ? 'divider' : 'transparent',
        backdropFilter: isScrolled ? 'blur(8px)' : 'none',
        boxShadow: isScrolled ? '0 6px 20px rgba(0,0,0,0.06)' : 'none',
        transition: 'background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease, backdrop-filter 220ms ease',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, justifyContent: 'space-between', gap: 2 }}>
          <Link
            href="#"
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
                fontSize: { xs: 32, md: 36 },
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              Webict Capital
              <Box component="span" className="logo-dot" sx={{ color: 'primary.main', display: 'inline-block' }}>
                .
              </Box>
            </Typography>
          </Link>

          <Stack
            direction="row"
            spacing={{ xs: 2, md: 4 }}
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                underline="none"
                color="text.secondary"
                sx={{
                  fontSize: { md: 15, lg: 16 },
                  fontWeight: 500,
                  position: 'relative',
                  pb: 0.75,
                  transition: 'color 0.25s ease',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: '50%',
                    bottom: -7,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    opacity: 0,
                    transform: 'translate(-50%, 10px)',
                    transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
                  },
                  '&:hover': { color: 'text.primary' },
                  '&:hover::after': {
                    opacity: 1,
                    transform: 'translate(-50%, 0)',
                  },
                }}
              >
                {item.label}
              </Link>
            ))}
            <IconButton
              aria-label="Search"
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
  )
}
