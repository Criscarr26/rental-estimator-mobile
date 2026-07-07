import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Set in .env as EXPO_PUBLIC_* so Expo inlines them at build time.
// Without them the app still estimates; only cloud saving is disabled.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        // AsyncStorage only on native: on web it touches `window`, which
        // crashes the dev server's Node-side render. Supabase's default
        // web storage already handles the no-window case.
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Official Supabase pattern for React Native: without an explicit
        // lock, concurrent auth calls can deadlock and signInWithPassword
        // never resolves (button appears to do nothing).
        lock: processLock,
      },
    })
  : null;

// Refresh tokens only while the app is in the foreground (Supabase's
// recommended setup for Expo). Not needed on web.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

// Guards a Supabase call so a hung network request can never leave the
// UI waiting forever; resolves to a typed timeout marker instead.
export async function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T | 'timeout'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
