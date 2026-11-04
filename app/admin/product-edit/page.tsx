'use client';
/**
 * Nova Kit — Admin product editor (add / edit) with image CRUD
 * A faithful port of the HTML edition's `assets/js/admin/product-edit.js`: a full-page product
 * form with an image gallery (uploads + generated emoji icons; add / remove / set-primary), title,
 * type, category, pricing, inventory, description and digital-delivery fields.
 * `/admin/product-edit?id=…` edits an existing product; no `?id` creates a new one.
 * This demo validates and previews the payload — wire `save()` to your API (and swap the emoji
 * image manager for a real uploader) to persist.
 */
import { Suspense, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { placeholder } from '@/lib/ui';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import type { DigitalAsset, GalleryEntry, Product, ProductType } from '@/lib/types';

const MAX_UPLOAD = 2 * 1024 * 1024; // 2 MB
const MAX_IMAGES = 5;
const MAX_ASSET_UPLOAD = 5 * 1024 * 1024; // 5 MB per deliverable
const MAX_ASSETS = 5;

/** Human-readable file size for the attached-asset rows (e.g. "820 KB", "1.4 MB"). */
function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Same icon + colour choices as the HTML editor (product-edit.js:29-31). */
const EMOJIS = ['📦', '🎧', '⌚', '📱', '💻', '👕', '🧥', '👜', '👟', '🫖', '🎨', '🎮',
  '📘', '📚', '💾', '🔑', '☕', '🍿', '🥬', '💊', '🚗', '🏠', '🎁', '🔧', '🎸', '⚽', '💡', '🕶️'];
const COLORS = ['#00FF88', '#64D2FF', '#FF9500', '#FF4757', '#A855F7', '#EC4899', '#3AA0FF', '#FFD700'];

const thumbSrc = (g: GalleryEntry): string =>
  g.kind === 'image' ? g.src : placeholder(g.emoji, g.color, 160, 160);

/** The gallery a product starts with: its saved gallery, or a single icon built from emoji+colour. */
function initialGallery(p: Product | undefined): GalleryEntry[] {
  if (p?.gallery?.length) return p.gallery.map((g) => ({ ...g }));
  return [{ kind: 'emoji', emoji: p?.emoji || '📦', color: p?.color || '#00FF88' }];
}

function ProductEditInner() {
  const router = useRouter();
  const id = useSearchParams().get('id') ?? '';
  const { getProduct, categories } = useStore();

  const product = useMemo(() => (id ? getProduct(id) : undefined), [id, getProduct]);
  const isEdit = Boolean(product);

  /* ---- Form state --------------------------------------------------------- */
  const [gallery, setGallery] = useState<GalleryEntry[]>(() => initialGallery(product));
  const [type, setType] = useState<ProductType>(product?.type ?? 'physical');
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? 'other');
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : '');
  const [compare, setCompare] = useState(product?.originalPrice != null ? String(product.originalPrice) : '');
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [platform, setPlatform] = useState(product?.digital?.platform ?? '');
  const [format, setFormat] = useState(product?.digital?.format ?? '');
  const [license, setLicense] = useState(product?.digital?.license ?? '');
  const [assets, setAssets] = useState<DigitalAsset[]>(() => (product?.digital?.assets ?? []).map((a) => ({ ...a })));

  /* ---- Add-image flow ----------------------------------------------------- */
  const fileInput = useRef<HTMLInputElement>(null);
  const [chooser, setChooser] = useState(false);
  const [iconSheet, setIconSheet] = useState(false);
  const [pickEmoji, setPickEmoji] = useState(EMOJIS[0]);
  const [pickColor, setPickColor] = useState(COLORS[0]);

  /** Read selected files as data URLs and add them to the gallery. */
  const handleFiles = (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    let count = gallery.length;
    let added = 0;
    for (const file of files) {
      if (count >= MAX_IMAGES) { toast('Maximum 5 images', { kind: 'danger' }); break; }
      if (!file.type.startsWith('image/')) { toast('Only image files are allowed', { kind: 'danger' }); continue; }
      if (file.size > MAX_UPLOAD) { toast(`${file.name} is over 2 MB`, { kind: 'danger' }); continue; }
      count++;
      added++;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        setGallery((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, { kind: 'image', src }]));
      };
      reader.readAsDataURL(file);
    }
    if (added) haptic('success');
  };

  const removeImage = (i: number) => {
    if (gallery.length <= 1) { toast('At least one image is required', { kind: 'danger' }); return; }
    setGallery((prev) => prev.filter((_, idx) => idx !== i));
    haptic('light');
  };

  /** Tapping a non-primary thumb promotes it to index 0 (the primary image). */
  const makePrimary = (i: number) => {
    if (i <= 0) return;
    setGallery((prev) => {
      const next = [...prev];
      const [g] = next.splice(i, 1);
      next.unshift(g);
      return next;
    });
    haptic('selection');
  };

  const addIcon = () => {
    setGallery((prev) => [...prev, { kind: 'emoji', emoji: pickEmoji, color: pickColor }]);
    haptic('success');
    setIconSheet(false);
    toast('Icon added');
  };

  /* ---- Digital deliverables (files & links) ------------------------------- */
  const assetInput = useRef<HTMLInputElement>(null);
  const [linkSheet, setLinkSheet] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  /**
   * Attach uploaded deliverables. Demo-only: each file is held as a data-URL so the Downloads
   * page can serve it back. In production, upload to your storage and keep only the URL.
   */
  const handleAssetFiles = (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    let count = assets.length;
    let added = 0;
    for (const file of files) {
      if (count >= MAX_ASSETS) { toast('Maximum 5 files or links', { kind: 'danger' }); break; }
      if (file.size > MAX_ASSET_UPLOAD) { toast(`${file.name} is over 5 MB`, { kind: 'danger' }); continue; }
      count++;
      added++;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        setAssets((prev) => (prev.length >= MAX_ASSETS
          ? prev
          : [...prev, { kind: 'file', name: file.name, size: file.size, dataUrl }]));
      };
      reader.readAsDataURL(file);
    }
    if (added) {
      haptic('success');
      toast('File attached', { kind: 'success' });
    }
  };

  const addLink = () => {
    if (assets.length >= MAX_ASSETS) { toast('Maximum 5 files or links', { kind: 'danger' }); haptic('error'); return; }
    const label = linkLabel.trim();
    const url = linkUrl.trim();
    if (!label || !url) { toast('Add a label and a URL', { kind: 'danger' }); haptic('error'); return; }
    setAssets((prev) => [...prev, { kind: 'link', label, url }]);
    setLinkLabel('');
    setLinkUrl('');
    setLinkSheet(false);
    haptic('success');
    toast('Link added', { kind: 'success' });
  };

  const removeAsset = (i: number) => {
    setAssets((prev) => prev.filter((_, idx) => idx !== i));
    haptic('light');
  };

  /* ---- Actions ------------------------------------------------------------ */
  const save = () => {
    if (!name.trim() || !price.trim()) {
      toast('Name and price are required', { kind: 'danger' });
      haptic('error');
      return;
    }
    const primary = gallery[0];
    const iconEntry = gallery.find((g): g is Extract<GalleryEntry, { kind: 'emoji' }> => g.kind === 'emoji');
    const payload: Partial<Product> = {
      id: product?.id,
      name: name.trim(),
      type,
      categoryId,
      price: parseFloat(price),
      originalPrice: compare.trim() ? parseFloat(compare) : undefined,
      stock: parseInt(stock || '0', 10),
      description: description.trim(),
      gallery,
      // uploaded primary photo, if any
      image: primary?.kind === 'image' ? primary.src : undefined,
      emoji: iconEntry?.emoji || '📦',
      color: iconEntry?.color || '#00FF88',
      digital: type === 'digital' ? { platform, format, license, assets } : undefined,
    };
    // Demo build: `payload` is the validated product (with its image gallery). In production,
    // persist it here (e.g. `await saveProduct(payload)`), uploading the real images.
    void payload;
    haptic('success');
    toast(isEdit ? 'Changes saved (demo)' : 'Product created (demo)', { kind: 'success' });
    setTimeout(() => router.push('/admin/products'), 700);
  };

  const remove = async () => {
    if (await tgConfirm('Delete this product?')) {
      toast('Product deleted (demo)', { kind: 'danger' });
      router.push('/admin/products');
    }
  };

  return (
    <>
      <AdminHeader title={isEdit ? 'Edit product' : 'New product'} back="/admin/products" />

      <main className="screen screen--no-tabbar">
        <div className="container" style={{ paddingTop: 16 }}>
          {/* ---- Image gallery ------------------------------------------------ */}
          <div className="admin-section-title" style={{ paddingInline: 0 }}>Images</div>
          <p className="muted text-sm" style={{ marginBottom: 12 }}>
            Upload photos or pick an icon. Tap an image to make it the primary. Add up to 5.
          </p>
          <div className="img-gallery">
            {gallery.map((g, i) => (
              <div
                key={`${g.kind}-${i}-${g.kind === 'image' ? g.src.slice(-16) : g.emoji + g.color}`}
                role="button"
                tabIndex={0}
                aria-label="Set as primary image"
                className={`img-thumb${i === 0 ? ' is-primary' : ''}`}
                onClick={() => makePrimary(i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); makePrimary(i); } }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbSrc(g)} alt="" />
                {i === 0 && <span className="img-thumb__primary">PRIMARY</span>}
                <button
                  className="img-thumb__remove"
                  aria-label="Remove"
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                >
                  ×
                </button>
              </div>
            ))}
            {gallery.length < MAX_IMAGES && (
              <button
                className="img-add"
                aria-label="Add image"
                onClick={() => { setChooser(true); haptic('selection'); }}
              >
                <Icon name="plus" size={24} />
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          />

          {/* ---- Details ------------------------------------------------------ */}
          <div className="field" style={{ marginTop: 16 }}>
            <label className="field__label" htmlFor="f_name">Product name</label>
            <input className="input" id="f_name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label className="field__label">Type</label>
            <div className="segmented">
              <button type="button" className={type !== 'digital' ? 'is-active' : ''} onClick={() => setType('physical')}>Physical</button>
              <button type="button" className={type === 'digital' ? 'is-active' : ''} onClick={() => setType('digital')}>Digital</button>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="f_cat">Category</label>
            <select className="select" id="f_cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="f_price">Price</label>
              <input className="input" id="f_price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="f_compare">Compare-at</label>
              <input className="input" id="f_compare" type="number" min="0" step="0.01" value={compare} onChange={(e) => setCompare(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="f_stock">Stock</label>
            <input className="input" id="f_stock" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="f_desc">Description</label>
            <textarea className="textarea" id="f_desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* ---- Digital delivery (only for digital products) ------------------ */}
          {type === 'digital' && (
            <div>
              <div className="admin-section-title" style={{ paddingInline: 0 }}>Digital delivery</div>
              <div className="field">
                <label className="field__label" htmlFor="f_platform">Platform</label>
                <input className="input" id="f_platform" value={platform} onChange={(e) => setPlatform(e.target.value)} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="f_format">Format</label>
                <input className="input" id="f_format" value={format} onChange={(e) => setFormat(e.target.value)} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="f_license">License</label>
                <input className="input" id="f_license" value={license} onChange={(e) => setLicense(e.target.value)} />
              </div>

              {/* The actual deliverables handed to the buyer on /downloads. */}
              <div className="field__label">Files &amp; links</div>
              {assets.length ? (
                <div className="asset-list">
                  {assets.map((a, i) => (
                    <div key={`${a.kind}-${i}-${a.kind === 'file' ? a.name : a.url}`} className="asset-row">
                      <span className="asset-row__icon">
                        <Icon name={a.kind === 'file' ? 'box' : 'plug'} size={18} />
                      </span>
                      <div className="asset-row__info">
                        <div className="asset-row__name">{a.kind === 'file' ? a.name : a.label}</div>
                        <div className="asset-row__meta">{a.kind === 'file' ? formatSize(a.size) : a.url}</div>
                      </div>
                      <button
                        type="button"
                        className="asset-row__remove"
                        aria-label="Remove"
                        onClick={() => removeAsset(i)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="asset-empty">No files or links yet. Buyers will only get the licence key.</p>
              )}
              <div className="row gap-2">
                <button className="btn btn--sm btn--outline" onClick={() => assetInput.current?.click()}>
                  <Icon name="upload" size={16} /> Upload file
                </button>
                <button className="btn btn--sm btn--outline" onClick={() => { setLinkSheet(true); haptic('selection'); }}>
                  <Icon name="plug" size={16} /> Add link
                </button>
              </div>
              <input
                ref={assetInput}
                type="file"
                multiple
                hidden
                onChange={(e) => { handleAssetFiles(e.target.files); e.target.value = ''; }}
              />
              <p className="muted text-sm" style={{ marginTop: 8 }}>
                Files are stored in the browser for the demo. In production, upload to your own storage and store the URL.
              </p>
            </div>
          )}
        </div>
      </main>

      <div className="bottom-bar">
        {isEdit && (
          <button className="btn btn--outline" onClick={remove} aria-label="Delete product"><Icon name="trash" size={18} /></button>
        )}
        <button className="btn grow" onClick={save}>{isEdit ? 'Save changes' : 'Create product'}</button>
      </div>

      {/* First step of adding an image: upload a real photo, or generate an icon. */}
      {chooser && (
        <Sheet title="Add image" onClose={() => setChooser(false)}>
          <div className="stack gap-3">
            <button
              className="btn btn--block"
              onClick={() => { setChooser(false); fileInput.current?.click(); }}
            >
              <Icon name="upload" size={18} /> Upload photo
            </button>
            <button
              className="btn btn--outline btn--block"
              onClick={() => { setChooser(false); setIconSheet(true); }}
            >
              <Icon name="image" size={18} /> Choose an icon
            </button>
            <p className="muted text-sm" style={{ textAlign: 'center' }}>JPG or PNG, up to 2&nbsp;MB each.</p>
          </div>
        </Sheet>
      )}

      {/* Second step: build an emoji icon on a coloured tile. */}
      {iconSheet && (
        <Sheet title="Add image" onClose={() => setIconSheet(false)}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={placeholder(pickEmoji, pickColor, 160, 160)} width={72} height={72} style={{ borderRadius: 12 }} alt="" />
          </div>
          <div className="field__label">Icon</div>
          <div className="emoji-picker">
            {EMOJIS.map((e) => (
              <button key={e} type="button" className={e === pickEmoji ? 'on' : ''} onClick={() => setPickEmoji(e)}>{e}</button>
            ))}
          </div>
          <div className="field__label">Background</div>
          <div className="swatches">
            {COLORS.map((c) => (
              <span key={c} role="button" tabIndex={0} aria-label={`Background ${c}`} className={`swatch${c === pickColor ? ' on' : ''}`} style={{ background: c }} onClick={() => setPickColor(c)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPickColor(c); } }} />
            ))}
          </div>
          <button className="btn btn--block" onClick={addIcon}>Add image</button>
        </Sheet>
      )}

      {/* Attach an external deliverable (a hosted file, a course page, a repo…). */}
      {linkSheet && (
        <Sheet title="Add link" onClose={() => setLinkSheet(false)}>
          <div className="field">
            <label className="field__label" htmlFor="f_link_label">Label</label>
            <input
              className="input"
              id="f_link_label"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Download installer"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="f_link_url">URL</label>
            <input
              className="input"
              id="f_link_url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com/file.zip"
            />
          </div>
          <button className="btn btn--block" onClick={addLink}>Add link</button>
        </Sheet>
      )}
    </>
  );
}

export default function AdminProductEditPage() {
  return (
    <Suspense fallback={<div className="screen" style={{ padding: 24 }}>Loading…</div>}>
      <ProductEditInner />
    </Suspense>
  );
}
