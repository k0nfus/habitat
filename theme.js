import React, { createContext, useContext } from 'react';

export const themes = {
  dark: {
    mode: 'dark',
    backgroundGradient: ['#050505', '#1e1f24'],
    surface: '#23242a',
    surfaceAlt: '#2c2d33',
    surfaceBorder: '#3a3b42',
    textPrimary: '#f5f7fa',
    textSecondary: '#c7cad1',
    accent: '#6c5ce7',
    accentSecondary: '#00cec9',
    danger: '#ff7675',
    inputBackground: '#2f3037',
    inputBorder: '#41424b',
    buttonText: '#ffffff',
    tabBarBackground: '#050505',
    tabActive: '#6c5ce7',
    tabInactive: '#6c5ce733',
    statusBarStyle: 'light',
  },
  light: {
    mode: 'light',
    backgroundGradient: ['#f2f4f8', '#ffffff'],
    surface: '#ffffff',
    surfaceAlt: '#f7f9fc',
    surfaceBorder: '#d5d7de',
    textPrimary: '#1f2430',
    textSecondary: '#4a4f5c',
    accent: '#4c5bd4',
    accentSecondary: '#1db2a6',
    danger: '#e85a5a',
    inputBackground: '#ffffff',
    inputBorder: '#c5c8d4',
    buttonText: '#ffffff',
    tabBarBackground: '#ffffff',
    tabActive: '#4c5bd4',
    tabInactive: '#4c5bd466',
    statusBarStyle: 'dark',
  },
};

export const ThemeContext = createContext({ theme: themes.dark, mode: 'dark', setMode: () => {} });

export const useTheme = () => useContext(ThemeContext);
