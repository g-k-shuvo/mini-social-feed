import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { dark, light, EXPANDED_WIDTH, type Palette } from './tokens';

type Preference = 'system' | 'light' | 'dark';

interface ThemeValue {
  c: Palette;
  isLight: boolean;
  preference: Preference;
  setPreference: (p: Preference) => void;
  /** Recomputed from useWindowDimensions, so rotation never needs a remount. */
  isExpanded: boolean;
  width: number;
}

const ThemeContext = createContext<ThemeValue | null>(null);
const KEY = 'theme-preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const { width } = useWindowDimensions();
  const [preference, setPref] = useState<Preference>('system');

  useEffect(() => {
    void SecureStore.getItemAsync(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPref(v);
    });
  }, []);

  const setPreference = (p: Preference) => {
    setPref(p);
    void SecureStore.setItemAsync(KEY, p);
  };

  const value = useMemo<ThemeValue>(() => {
    const resolved = preference === 'system' ? (system ?? 'dark') : preference;
    const isLight = resolved === 'light';
    return {
      c: isLight ? light : dark,
      isLight,
      preference,
      setPreference,
      isExpanded: width >= EXPANDED_WIDTH,
      width,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference, system, width]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}
