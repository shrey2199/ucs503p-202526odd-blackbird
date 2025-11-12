import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext(null);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider = ({ children }) => {
  // theme can be 'system', 'dark', or 'light'
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored && ['system', 'dark', 'light'].includes(stored)) {
      return stored;
    }
    return 'system';
  });

  // Calculate actual dark mode state based on theme
  const getIsDark = (currentTheme) => {
    if (currentTheme === 'dark') return true;
    if (currentTheme === 'light') return false;
    // currentTheme === 'system'
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDark, setIsDark] = useState(() => {
    // Get initial theme
    const stored = localStorage.getItem('theme');
    const initialTheme = (stored && ['system', 'dark', 'light'].includes(stored)) ? stored : 'system';
    const dark = getIsDark(initialTheme);
    // Apply immediately during initialization to prevent flash
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return dark;
  });

  // Update dark mode when theme changes
  useEffect(() => {
    const dark = getIsDark(theme);
    setIsDark(dark);
    
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen to system preference changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const dark = e.matches;
      setIsDark(dark);
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setThemeMode = (newTheme) => {
    setTheme(newTheme);
  };

  const value = {
    theme,
    isDark,
    setThemeMode,
  };

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
};

