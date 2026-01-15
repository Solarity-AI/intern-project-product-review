// ThemeContext - Manages dark/light mode state
// ✨ Fixed: Prevents white flash on Android by delaying render until theme loads
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { View, StyleSheet, useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import * as NavigationBar from 'expo-navigation-bar';

const THEME_STORAGE_KEY = 'app_theme_mode';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
  isThemeLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ✨ Background colors for preventing white flash
const THEME_BACKGROUNDS = {
  light: '#FDFBF8',
  dark: '#0C0A09',
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const initialScheme: ColorScheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  
  const [colorScheme, setColorScheme] = useState<ColorScheme>(initialScheme);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // ✨ Load saved theme on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && (saved === 'light' || saved === 'dark')) {
          setColorScheme(saved);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        if (isMounted) {
          // ✨ Small delay to ensure state is set before render
          requestAnimationFrame(() => {
            setIsThemeLoaded(true);
          });
        }
      }
    };

    loadTheme();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // ✨ Update Android navigation bar (safely with edge-to-edge)
  useEffect(() => {
    if (Platform.OS === 'android' && isThemeLoaded) {
      try {
        // setBackgroundColorAsync is not supported with edge-to-edge enabled
        // Only set button style for better compatibility
        NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
      } catch (error) {
        // Silently fail - edge-to-edge may prevent this operation
        console.debug('NavigationBar update skipped due to edge-to-edge:', error);
      }
    }
  }, [colorScheme, isThemeLoaded]);

  const saveTheme = useCallback(async (scheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setColorScheme((prev) => {
      const newScheme = prev === 'light' ? 'dark' : 'light';
      saveTheme(newScheme);
      return newScheme;
    });
  }, [saveTheme]);

  const setTheme = useCallback((scheme: ColorScheme) => {
    setColorScheme(scheme);
    saveTheme(scheme);
  }, [saveTheme]);

  const colors = useMemo(() => Colors[colorScheme], [colorScheme]);
  const backgroundColor = THEME_BACKGROUNDS[colorScheme];

  const value = useMemo(() => ({
    colorScheme,
    colors,
    toggleTheme,
    setTheme,
    isThemeLoaded,
  }), [colorScheme, colors, toggleTheme, setTheme, isThemeLoaded]);

  // ✨ CRITICAL: Render a themed background container ALWAYS
  // This prevents white flash by ensuring background is set immediately
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    </View>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});