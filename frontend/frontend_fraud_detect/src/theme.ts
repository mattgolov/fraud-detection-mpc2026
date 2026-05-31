import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    primary: {
      main: '#4A5568',
      light: '#718096',
      dark: '#2D3748',
    },
    secondary: {
      main: '#A0AEC0',
      light: '#CBD5E0',
      dark: '#718096',
    },
    text: {
      primary: '#172B4D',
      secondary: '#4A5568',
      disabled: '#A0AEC0',
    },
    divider: '#E2E8F0',
    error: {
      main: '#C53030',
      light: '#FC8181',
      dark: '#742A2A',
    },
    warning: {
      main: '#C05621',
      light: '#ED8936',
      dark: '#7C2D12',
    },
    info: {
      main: '#2C5282',
      light: '#2B6CB0',
      dark: '#1A365D',
    },
    success: {
      main: '#22543D',
      light: '#48BB78',
      dark: '#1B4332',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.5px',
      color: '#172B4D',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.3px',
      color: '#172B4D',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#172B4D',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#172B4D',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#172B4D',
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#172B4D',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#172B4D',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#4A5568',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
      textTransform: 'none',
      letterSpacing: '0.3px',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#718096',
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#4A5568',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#2D3748',
          },
        },
        outlined: {
          borderColor: '#E2E8F0',
          color: '#172B4D',
          '&:hover': {
            backgroundColor: '#F8F9FA',
            borderColor: '#CBD5E0',
          },
        },
        text: {
          color: '#172B4D',
          '&:hover': {
            backgroundColor: 'rgba(74, 85, 104, 0.04)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          backgroundColor: '#4A5568',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#2D3748',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E0',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          color: '#172B4D',
        },
      },
    },
  },
});

export default theme;
