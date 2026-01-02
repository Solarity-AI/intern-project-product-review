// Toast Context for in-app snackbar/toast notifications
import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (toastConfig: ToastConfig) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      translateY.stopAnimation();
      opacity.stopAnimation();
      translateY.setValue(-100);
      opacity.setValue(0);

      setConfig(toastConfig);
      setVisible(true);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = toastConfig.duration ?? 3000;
      timeoutRef.current = setTimeout(() => hideToast(), duration);
    },
    [translateY, opacity, hideToast]
  );

  const getIconName = (type: ToastType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getIconColor = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.destructive;
      case 'info':
      default:
        return colors.primary;
    }
  };

  const getBackgroundColor = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return '#ECFDF5';
      case 'error':
        return '#FEF2F2';
      case 'info':
      default:
        return '#EFF6FF';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {visible && config && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.toastContainer,
            {
              top: insets.top + Spacing.md,
              backgroundColor: getBackgroundColor(config.type),
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <View style={styles.toastContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getIconColor(config.type) + '20' },
              ]}
            >
              <Ionicons
                name={getIconName(config.type)}
                size={20}
                color={getIconColor(config.type)}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.toastTitle, { color: colors.foreground }]}>
                {config.title}
              </Text>
              {config.message && (
                <Text
                  style={[styles.toastMessage, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {config.message}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,

    // Always on top
    zIndex: 99999,

    // ✅ CRITICAL for Android stacking
    elevation: 99999,

    borderRadius: BorderRadius.lg,

    // iOS shadow (android uses elevation)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {},
    }),
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { flex: 1 },
  toastTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  toastMessage: { fontSize: FontSize.xs, lineHeight: 16 },
  closeButton: { padding: Spacing.xs },
});
