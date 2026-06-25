import { createTheme } from '@mui/material/styles'

export const siteTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#fafbfd',
    },
    text: {
      primary: '#080e1a',
      secondary: '#4a5e78',
    },
    primary: {
      main: '#0a2463',
      dark: '#080e1a',
      light: '#f0f4fb',
    },
    divider: '#e2eaf5',
    success: {
      main: '#1a6640',
    },
    error: {
      main: '#b4283a',
    },
  },
  typography: {
    fontFamily: 'var(--wc-font-body)',
    button: {
      fontFamily: 'var(--wc-font-body)',
      textTransform: 'none',
      fontWeight: 500,
    },
    h1: {
      fontFamily: 'var(--wc-font-display)',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'var(--wc-font-display)',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'var(--wc-font-display)',
      fontWeight: 700,
    },
    h4: {
      fontFamily: 'var(--wc-font-display)',
      fontWeight: 700,
    },
    h5: {
      fontFamily: 'var(--wc-font-display)',
      fontWeight: 700,
    },
    h6: {
      fontFamily: 'var(--wc-font-display)',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--wc-font-display': '"Playfair Display", serif',
          '--wc-font-body': '"Inter", sans-serif',
          '--wc-font-mono': '"JetBrains Mono", monospace',
          '--wc-text-primary': '#080e1a',
          '--wc-text-secondary': '#4a5e78',
          '--wc-primary': '#0a2463',
          '--wc-primary-light': '#f0f4fb',
          '--wc-primary-soft': 'rgba(10,36,99,0.08)',
          '--wc-primary-strong': 'rgba(10,36,99,0.25)',
          '--wc-divider': '#e2eaf5',
          '--wc-divider-soft': 'rgba(226,234,245,0.4)',
          '--wc-success': '#1a6640',
          '--wc-error': '#b4283a',
          '--wc-bg': '#ffffff',
          '--wc-paper': '#fafbfd',
          '--wc-number-font': '"JetBrains Mono", monospace',
        },
        body: {
          backgroundColor: '#ffffff',
          color: '#080e1a',
          fontFamily: 'var(--wc-font-body)',
          fontVariantNumeric: 'tabular-nums lining-nums',
          fontFeatureSettings: '"tnum" 1, "lnum" 1',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontVariantNumeric: 'tabular-nums lining-nums',
          fontFeatureSettings: '"tnum" 1, "lnum" 1',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontVariantNumeric: 'tabular-nums lining-nums',
          fontFeatureSettings: '"tnum" 1, "lnum" 1',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontFamily: 'var(--wc-font-body)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fafbfd',
          '& fieldset': {
            borderColor: '#dde7f4',
          },
          '&:hover fieldset': {
            borderColor: '#0a2463',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0a2463',
          },
        },
      },
    },
  },
})
