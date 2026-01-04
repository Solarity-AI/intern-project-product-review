// React Native App Entry Point with SafeAreaProvider, Notifications, Toast
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProductListScreen } from './screens/ProductListScreen';
import { ProductDetailsScreen } from './screens/ProductDetailsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { RootStackParamList } from './types';
import { Colors } from './constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const colors = Colors.light;

  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <ToastProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="ProductList"
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="ProductList" component={ProductListScreen} />
              <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
              <Stack.Screen 
                name="Notifications" 
                component={NotificationsScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}