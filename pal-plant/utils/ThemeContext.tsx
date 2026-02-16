import React, { createContext, useContext } from 'react';
import { ThemeColors } from '../types';

const ThemeContext = createContext<ThemeColors | null>(null);

export const ThemeProvider: React.FC<{ theme: ThemeColors; children: React.ReactNode }> = ({ theme, children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeColors => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};
