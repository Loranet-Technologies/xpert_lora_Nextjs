'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'laundritek-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage immediately (before React hydration)
  const [theme, setTheme] = useState<Theme>(() => {
    // Only run on client side
    if (typeof window === 'undefined') return 'light';
    
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (storedTheme === 'dark' || storedTheme === 'light') {
        // Apply theme immediately to prevent FOUC
        const root = document.documentElement;
        if (storedTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        return storedTheme;
      }
    } catch (error) {
      // localStorage might be unavailable, default to light mode
      console.warn('Failed to load theme from localStorage:', error);
    }
    return 'light';
  });
  const [isMounted, setIsMounted] = useState(false);

  // Mark as mounted after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply theme to document element
  useEffect(() => {
    if (!isMounted) return;

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isMounted]);

  // Persist theme to localStorage
  useEffect(() => {
    if (!isMounted) return;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // localStorage might be unavailable, continue without persistence
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDarkMode: theme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

