import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Palette } from '@/constants/theme';
import { SessionProvider } from '@/lib/session';

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: Palette.background },
          headerTintColor: Palette.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          tabBarStyle: { backgroundColor: Palette.card, borderTopColor: Palette.border },
          tabBarActiveTintColor: Palette.accent,
          tabBarInactiveTintColor: Palette.textSecondary,
          sceneStyle: { backgroundColor: Palette.background },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tasador de Alquileres SD',
            tabBarLabel: 'Estimar',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calculator-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Mis estimaciones',
            tabBarLabel: 'Guardadas',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cloud-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SessionProvider>
  );
}
