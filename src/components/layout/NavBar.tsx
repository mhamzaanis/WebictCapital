import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { AppBar, Box, Container, IconButton, Link, Stack, Toolbar, Typography } from '@mui/material'
import { navItems } from '../../content/siteContent'

export function NavBar() {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'common.white',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 56, justifyContent: 'space-between', gap: 2 }}>
          <Link href="#" underline="none" color="inherit" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: 22, letterSpacing: '-0.03em' }}>
              Webict Capital
              <Box component="span" sx={{ color: 'primary.main' }}>
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
                sx={{ fontSize: 13, '&:hover': { color: 'text.primary' } }}
              >
                {item.label}
              </Link>
            ))}
            <IconButton aria-label="Search" size="small" sx={{ color: 'text.secondary' }}>
              <SearchOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
