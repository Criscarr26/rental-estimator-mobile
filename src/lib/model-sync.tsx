import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import rawParams from '@/assets/model_params.json';

import { ModelParams } from './model';

// Optional: when the Tasador SD API is deployed, set this in .env and the
// app keeps its weights in sync with the served model. Unset, the app
// behaves exactly as before: bundled weights only.
const API_URL = process.env.EXPO_PUBLIC_MODEL_API_URL;
const CACHE_KEY = 'model-params-cache-v1';

export const BUNDLED_MODEL = rawParams as unknown as ModelParams;

interface ModelState {
  params: ModelParams;
  version: string | null; // null = bundled weights
  source: 'bundled' | 'cache' | 'remote';
}

const ModelContext = createContext<ModelState>({
  params: BUNDLED_MODEL,
  version: null,
  source: 'bundled',
});

export function ModelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModelState>({
    params: BUNDLED_MODEL,
    version: null,
    source: 'bundled',
  });

  useEffect(() => {
    if (!API_URL) return;
    let active = true;

    (async () => {
      // Last synced weights first, so an offline start is still current.
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && active) {
          const { version, params } = JSON.parse(cached);
          setState({ params, version, source: 'cache' });
        }
      } catch {
        // corrupt cache: bundled weights keep working
      }

      try {
        const response = await fetch(`${API_URL.replace(/\/$/, '')}/v1/model/params`);
        if (!response.ok || !active) return;
        const { version, params } = await response.json();
        setState({ params, version, source: 'remote' });
        console.log(`model params synced: v${version}`);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ version, params }));
      } catch {
        // offline or API down: bundled/cached weights keep working
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return <ModelContext.Provider value={state}>{children}</ModelContext.Provider>;
}

export function useModel(): ModelState {
  return useContext(ModelContext);
}
