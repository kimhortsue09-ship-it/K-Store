'use client';
/** Bottom sheet — real Nova Kit `.sheet` markup, used for add/edit forms. */
import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-overlay is-in" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" />
        <div className="sheet__head">
          <h3>{title}</h3>
          <button className="sheet__close" onClick={onClose} aria-label="Close"><Icon name="close" size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
