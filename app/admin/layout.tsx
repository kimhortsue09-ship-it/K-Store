'use client';
/** Admin layout — forces the dark theme (admin is dark-only) and provides the chrome context. */
import { useEffect } from 'react';
import '../../styles/pages/admin.css';
import { AdminChromeProvider } from '@/components/admin/adminChrome';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'dark');
    return () => {
      if (prev) root.setAttribute('data-theme', prev);
    };
  }, []);

  return <AdminChromeProvider>{children}</AdminChromeProvider>;
}
