// Theme constants for React Native
// Cross-platform color palette

export const Colors = {
  light: {
    background: '#FDFBF8',
    foreground: '#1C1917',
    card: '#FEFEFE',
    cardForeground: '#1C1917',
    primary: '#F59E0B',
    primaryForeground: '#FFFFFF',
    secondary: '#F5F0E8',
    secondaryForeground: '#292524',
    muted: '#EDE8E0',
    mutedForeground: '#6B6560',
    accent: '#FEF3C7',
    accentForeground: '#B45309',
    border: '#E5DED4',
    starFilled: '#FACC15',
    starEmpty: '#D1D5DB',
    success: '#22C55E',
    destructive: '#EF4444',
  },
  dark: {
    background: '#0C0A09',
    foreground: '#F5F5F4',
    card: '#1C1917',
    cardForeground: '#F5F5F4',
    primary: '#FBBF24',
    primaryForeground: '#0C0A09',
    secondary: '#292524',
    secondaryForeground: '#E7E5E4',
    muted: '#292524',
    mutedForeground: '#A8A29E',
    accent: '#422006',
    accentForeground: '#FCD34D',
    border: '#292524',
    starFilled: '#FDE047',
    starEmpty: '#3F3F46',
    success: '#22C55E',
    destructive: '#DC2626',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const Shadow = {
  soft: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    
  },
  hover: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
};
