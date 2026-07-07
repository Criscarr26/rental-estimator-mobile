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
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Palette.card,
            borderTopColor: Palette.border,
          },
          tabBarActiveTintColor: Palette.accent,
          tabBarInactiveTintColor: Palette.textSecondary,
          sceneStyle: { backgroundColor: Palette.background },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: 'Estimar',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'calculator' : 'calculator-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            tabBarLabel: 'Historial',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'cloud' : 'cloud-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SessionProvider>
  );
}
