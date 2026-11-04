'use client';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * localStorage-backed state, SSR-safe. Hydrates after mount (so server and client render the
 * same initial markup) and writes on change. `ready` is false until the first hydration.
 *
 *   const [prefs, setPrefs, ready] = usePersistentState('nova:prefs', { email: true });
 */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state, ready]);

  return [state, setState, ready];
}
