import { createContext, useContext, useEffect } from 'react';
import { ConfigProvider } from 'antd';

// Extras
import customTheme, { colorPalette } from '@/utils/theme';

// Create theme context
const ThemeContext = createContext();

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const currentTheme = 'light';
  const isDarkMode = false;

  // Set CSS variables from theme.js for consistent styling
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-500', colorPalette.primary[500]);
    root.style.setProperty('--primary-600', colorPalette.primary[600]);
    root.style.setProperty('--heading', colorPalette.heading);
  }, []);

  const toggleTheme = () => {};

  // Get theme configuration (single theme)
  const themeConfig = customTheme;

  // Context value
  const contextValue = {
    currentTheme,
    isDarkMode,
    toggleTheme,
    colorPalette,
    themeConfig,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
