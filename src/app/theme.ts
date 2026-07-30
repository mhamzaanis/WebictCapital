import { createTheme } from '@mui/material/styles'

export const siteTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f7f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#101828',
      secondary: '#667085',
    },
    primary: {
      main: '#0a2e78',
      dark: '#071f55',
      light: '#eef5ff',
    },
    divider: '#e4e7ec',
    success: {
      main: '#187a55',
    },
    error: {
      main: '#c83e4d',
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
      letterSpacing: '-0.045em',
    },
    h2: {
      fontFamily: 'var(--wc-font-display)',
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontFamily: 'var(--wc-font-display)',
      fontWeight: 700,
      letterSpacing: '-0.035em',
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
          '--wc-font-brand': '"Playfair Display", serif',
          '--wc-font-display': '"Playfair Display", serif',
          '--wc-font-body': '"Inter", sans-serif',
          '--wc-font-data': '"Inter", sans-serif',
          '--wc-bg': '#f7f9fc',
          '--wc-surface': '#ffffff',
          '--wc-surface-soft': '#fbfdff',
          '--wc-text-primary': '#101828',
          '--wc-text-secondary': '#667085',
          '--wc-text-muted': '#98a2b3',
          '--wc-primary': '#0a2e78',
          '--wc-primary-dark': '#071f55',
          '--wc-primary-light': '#eef5ff',
          '--wc-primary-soft': '#eef5ff',
          '--wc-primary-strong': 'rgba(10,46,120,0.25)',
          '--wc-success': '#187a55',
          '--wc-success-soft': '#eaf7f1',
          '--wc-error': '#c83e4d',
          '--wc-error-soft': '#fdecef',
          '--wc-warning': '#b7791f',
          '--wc-warning-soft': '#fff7e6',
          '--wc-divider': '#e4e7ec',
          '--wc-divider-soft': 'rgba(228,231,236,0.7)',
          '--wc-border': '#e4e7ec',
          '--wc-shadow-card': 'none',
          '--wc-paper': '#fbfdff',
          '--wc-page-gutter-xs': '28px',
          '--wc-page-gutter-md': '64px',
          '--wc-page-gutter-xl': '100px',
          '--wc-page-top-xs': 'calc(64px + 4.5rem)',
          '--wc-page-top-md': 'calc(72px + 6rem)',
          '--wc-page-bottom-xs': '7rem',
          '--wc-page-bottom-md': '9rem',
          '--wc-section-gap-xs': '4.5rem',
          '--wc-section-gap-md': '6rem',
          '--wc-panel-gap-xs': '1.75rem',
          '--wc-panel-gap-md': '2.25rem',
          '--wc-card-padding-xs': '1.75rem',
          '--wc-card-padding-md': '2.25rem',
        },
        body: {
          backgroundColor: '#f7f9fc',
          color: '#101828',
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
          paddingInline: '1.15rem',
          paddingBlock: '0.58rem',
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
          backgroundColor: '#fbfdff',
          '& fieldset': {
            borderColor: '#dce6f2',
          },
          '&:hover fieldset': {
            borderColor: '#0a2e78',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0a2e78',
          },
        },
      },
    },
  },
})
