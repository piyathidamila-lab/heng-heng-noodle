'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

/**
 * Scales up text, buttons, and tap targets across the /staff area (front-of-house
 * tablet, used by staff who may be 50+) without touching the admin dashboard's
 * theme — nests a second ThemeProvider that extends the app's existing theme
 * rather than replacing it, so palette/dark-mode/etc. still come from the root.
 */
export function StaffThemeProvider({ children }: Props) {
  return (
    <ThemeProvider
      theme={(outerTheme) =>
        createTheme(outerTheme, {
          typography: {
            body1: { fontSize: '1.125rem' }, // 18px, was 16px
            body2: { fontSize: '1rem' }, // 16px, was 14px
            subtitle1: { fontSize: '1.125rem' }, // 18px, was 16px
            subtitle2: { fontSize: '1rem' }, // 16px, was 14px
            caption: { fontSize: '0.875rem' }, // 14px, was 12px
            button: { fontSize: '1rem' }, // 16px, was 14px
            h4: { fontSize: '1.75rem' },
            h5: { fontSize: '1.375rem' },
          },
          components: {
            MuiButton: {
              styleOverrides: {
                root: { minHeight: 52, borderRadius: 10 },
                sizeSmall: { minHeight: 44, fontSize: '0.9375rem' },
                sizeLarge: { minHeight: 58, fontSize: '1.0625rem' },
              },
            },
            MuiIconButton: {
              styleOverrides: {
                root: { padding: 10 },
                sizeSmall: { padding: 8 },
              },
            },
            MuiChip: {
              styleOverrides: {
                root: { height: 34, fontSize: '0.9375rem' },
                sizeSmall: { height: 30, fontSize: '0.875rem' },
              },
            },
            MuiTab: {
              styleOverrides: {
                root: { minHeight: 52, fontSize: '1.0625rem' },
              },
            },
            MuiInputBase: {
              styleOverrides: {
                root: { fontSize: '1.0625rem' },
              },
            },
            MuiFormLabel: {
              styleOverrides: {
                root: { fontSize: '1.0625rem' },
              },
            },
            MuiSwitch: {
              styleOverrides: {
                root: { width: 52, height: 32 },
                switchBase: { padding: 5 },
                thumb: { width: 22, height: 22 },
              },
            },
          },
        })
      }
    >
      {children}
    </ThemeProvider>
  );
}
