import { useEffect, useState, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'color-scheme';
const THEME_EVENT = 'theme-preference-change';

export const getStoredTheme = (): ThemePreference => {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'light' || val === 'dark') {
      return val;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'auto';
};

export const applyTheme = (pref: ThemePreference): void => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) {
    meta.content = pref === 'auto' ? 'light dark' : pref;
  }
  try {
    if (pref === 'auto') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, pref);
    }
  } catch {
    // Ignore storage access errors
  }
  window.dispatchEvent(new Event(THEME_EVENT));
};

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const useTheme = () => {
  const [preference, setPrefState] = useState<ThemePreference>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());

  useEffect(() => {
    const syncPreference = () => {
      const next = getStoredTheme();
      const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
      if (meta) {
        meta.content = next === 'auto' ? 'light dark' : next;
      }
      setPrefState(next);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === STORAGE_KEY) {
        syncPreference();
      }
    };

    window.addEventListener(THEME_EVENT, syncPreference);
    window.addEventListener('storage', handleStorage);

    let mq: MediaQueryList | null = null;
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    if (typeof window !== 'undefined' && window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', handleMediaChange);
    }

    return () => {
      window.removeEventListener(THEME_EVENT, syncPreference);
      window.removeEventListener('storage', handleStorage);
      mq?.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    applyTheme(next);
    setPrefState(next);
  }, []);

  return { preference, setPreference, systemTheme };
};
