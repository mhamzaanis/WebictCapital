import { createTheme } from '@mui/material/styles'

export const siteTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#f7f8fa',
    },
    text: {
      primary: '#101214',
      secondary: '#4c535b',
    },
    primary: {
      main: '#1565c0',
    },
    divider: '#d9dee5',
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
})
