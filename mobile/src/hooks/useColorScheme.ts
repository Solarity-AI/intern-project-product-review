// Hook for color scheme - cross-platform
// Updated to use ThemeContext

import { useTheme } from '../context/ThemeContext';

export const useThemeColors = () => {
  const { colors } = useTheme();
  return colors;
};
