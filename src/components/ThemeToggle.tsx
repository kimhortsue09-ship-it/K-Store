'use client';
import { useEffect, useState } from 'react';
import { config } from '@/config';
import { haptic } from '@/lib/telegram';
import { Icon } from './Icon';

const KEY = `${config.data.persistNamespace}:theme`;

/** Black/White (dark/light) toggle — real Nova Kit `.appbar__btn` markup. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setTheme((document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark');
  }, []);

  if (!config.theme.allowUserToggle) return null;

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    haptic('selection');
    setTheme(next);
  };

  return (
    <button onClick={toggle} className="appbar__btn" data-theme-toggle aria-label="Toggle light and dark">
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={22} />
    </button>
  );
}
