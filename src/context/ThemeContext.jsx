import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => storageService.getTheme() || 'dark');

  // Compute whether dark mode is currently active
  const getIsDark = useCallback((targetTheme) => {
    if (targetTheme === 'dark') return true;
    if (targetTheme === 'light') return false;
    // System fallback
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  }, []);

  const [isDark, setIsDark] = useState(() => getIsDark(theme));

  // Apply theme to DOM
  const applyTheme = useCallback((activeIsDark) => {
    const root = document.documentElement;
    if (activeIsDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    storageService.saveTheme(newTheme);
    const darkActive = getIsDark(newTheme);
    setIsDark(darkActive);
    applyTheme(darkActive);
  }, [getIsDark, applyTheme]);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
  }, [isDark, setTheme]);

  // Synchronize on mount and system preference changes
  useEffect(() => {
    const darkActive = getIsDark(theme);
    setIsDark(darkActive);
    applyTheme(darkActive);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      if (theme === 'system') {
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, getIsDark, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        resolvedTheme: isDark ? 'dark' : 'light',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
