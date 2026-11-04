'use client';
/**
 * Admin digital keys — license-key stock per digital product. Uses admin.css.
 * Mirrors admin/keys.js: one card per product showing available/sold, with "Add keys" (bulk
 * paste, one per line) and "View n" (the key pool, copyable) sheets. Adding keys grows the
 * available count and re-renders the KPIs. In-memory demo state.
 */
import { useRef, useState } from 'react';
import { DEMO_KEYS, type KeyStock } from '@/lib/admin';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

export default function AdminKeysPage() {
  const [products, setProducts] = useState<KeyStock[]>(() => DEMO_KEYS.map((k) => ({ ...k, keys: [...k.keys] })));
  const [addId, setAddId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const totalAvailable = products.reduce((s, p) => s + p.available, 0);
  const totalDelivered = products.reduce((s, p) => s + p.sold, 0);

  const adding = products.find((p) => p.id === addId) ?? null;
  const viewing = products.find((p) => p.id === viewId) ?? null;

  const openAdd = (p: KeyStock) => { setAddId(p.id); setDraft(''); haptic('selection'); };
  const openView = (p: KeyStock) => { setViewId(p.id); haptic('selection'); };

  const addKeys = () => {
    if (!adding) return;
    const lines = draft.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { toast('Paste at least one key', { kind: 'danger' }); haptic('error'); return; }
    setProducts((prev) =>
      prev.map((p) => (p.id === adding.id ? { ...p, keys: [...p.keys, ...lines], available: p.available + lines.length } : p)),
    );
    haptic('success');
    setAddId(null);
    toast(`${lines.length} key(s) added`, { kind: 'success' });
  };

  /**
   * Load keys from one or more .txt files into the textarea (one key per line) so the admin can
   * review/edit them before hitting "Add keys" — the upload never saves keys on its own.
   */
  const loadFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    let loaded = 0;
    for (const file of files) {
      const isText = file.type === 'text/plain' || /\.txt$/i.test(file.name);
      if (!isText) { toast('Only .txt files are supported', { kind: 'danger' }); continue; }
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) { toast(`${file.name} has no keys`, { kind: 'danger' }); continue; }
      loaded += lines.length;
      setDraft((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')}\n${lines.join('\n')}` : lines.join('\n')));
    }
    if (loaded) {
      haptic('success');
      toast(`${loaded} key(s) loaded from file`, { kind: 'success' });
    }
  };

  const copyKey = async (key: string) => {
    try { await navigator.clipboard.writeText(key); } catch { /* clipboard unavailable */ }
    haptic('light');
    toast('Key copied', { kind: 'success' });
  };

  return (
    <>
      <AdminHeader title="Digital Keys" back="/admin" />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="key" size={18} /></span>Keys available</span><span className="kpi__value">{totalAvailable}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="download" size={18} /></span>Delivered</span><span className="kpi__value">{totalDelivered}</span></div>
        </div>
        <div className="admin-section-title">Digital products</div>
        <div className="container" style={{ paddingTop: 0 }}>
          {products.map((p) => {
            const low = p.available > 0 && p.available <= 10;
            const status = p.available === 0 ? 'cancelled' : low ? 'pending' : 'delivered';
            return (
              <div key={p.id} className="card card--pad" style={{ marginBottom: 12 }}>
                <div className="row-between">
                  <div>
                    <div className="semibold">{p.name}</div>
                    <div className="muted text-sm">{p.sold} delivered</div>
                  </div>
                  <span className={`status status--${status}`}>{p.available === 0 ? 'Out of keys' : `${p.available} available`}</span>
                </div>
                <div className="row gap-2" style={{ marginTop: 12 }}>
                  <button className="btn btn--sm" onClick={() => openAdd(p)}><Icon name="plus" size={16} /> Add keys</button>
                  {p.keys.length > 0 && (
                    <button className="btn btn--sm btn--outline" onClick={() => openView(p)}>View {p.keys.length}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <AdminTabBar active="products" />

      {adding && (
        <Sheet title="Add keys" onClose={() => setAddId(null)}>
          <p className="muted text-sm" style={{ marginBottom: 12 }}>
            Paste one key per line, or upload a .txt file.
          </p>
          <div className="row gap-2" style={{ marginBottom: 12 }}>
            <button className="btn btn--sm btn--outline" onClick={() => fileInput.current?.click()}>
              <Icon name="upload" size={16} /> Upload .txt
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".txt,text/plain"
            multiple
            hidden
            onChange={(e) => { void loadFiles(e.target.files); e.target.value = ''; }}
          />
          <div className="field">
            <textarea
              aria-label="License keys, one per line"
              className="textarea"
              style={{ minHeight: 140, fontFamily: 'ui-monospace, monospace' }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={'XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY'}
            />
          </div>
          <button className="btn btn--block" onClick={addKeys}>Add keys</button>
        </Sheet>
      )}

      {viewing && (
        <Sheet title={`${viewing.name} · keys`} onClose={() => setViewId(null)}>
          {viewing.keys.length > 0 ? (
            <div className="stack gap-2">
              {viewing.keys.map((k, i) => (
                <div key={`${k}-${i}`} className="dl-key" style={{ borderColor: 'var(--border)' }}>
                  <span>{k}</span>
                  <button type="button" className="text-accent semibold text-sm" onClick={() => copyKey(k)}>Copy</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No keys in the pool.</p>
          )}
        </Sheet>
      )}
    </>
  );
}
