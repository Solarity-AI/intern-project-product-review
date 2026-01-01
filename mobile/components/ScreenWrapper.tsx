// Global SafeArea + StatusBar wrapper for consistent screen layout
import React from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  backgroundColor,
  statusBarStyle = 'dark-content',
  edges = ['top', 'left', 'right'],
  style,
}) => {
  const insets = useSafeAreaInsets();
  const colors = Colors.light;
  const bgColor = backgroundColor ?? colors.background;

  // Calculate padding based on edges
  const paddingStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, paddingStyle, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={bgColor}
        translucent={Platform.OS === 'android'}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
