'use client';
import { haptic } from '@/lib/telegram';

/** On/off switch — real Nova Kit `.switch` markup. */
export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { haptic('selection'); onChange(e.target.checked); }}
      />
      <span className="switch__track" />
    </label>
  );
}
