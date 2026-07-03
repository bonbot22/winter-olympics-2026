import { useState, useEffect } from 'react';

const STORAGE_KEY = 'kitbag-personal-items';

const CATEGORIES = [
  { id: 'on-mountain', label: '⛷️ On Mountain' },
  { id: 'apres',       label: '🍻 Après / Evenings' },
  { id: 'toiletries',  label: '🧴 Toiletries' },
  { id: 'admin',       label: '📋 Admin' },
];

const DEFAULT_ITEMS = [
  { item: 'Ski jacket',                  category: 'on-mountain' },
  { item: 'Ski pants',                   category: 'on-mountain' },
  { item: 'Thermal base layer (top)',    category: 'on-mountain' },
  { item: 'Thermal base layer (bottom)', category: 'on-mountain' },
  { item: 'Ski socks x3',                category: 'on-mountain' },
  { item: 'Helmet',                      category: 'on-mountain' },
  { item: 'Goggles',                     category: 'on-mountain' },
  { item: 'Gloves',                      category: 'on-mountain' },
  { item: 'Buff/neck warmer',            category: 'on-mountain' },
  { item: 'Sunscreen SPF50+',            category: 'on-mountain' },
  { item: 'Lip balm SPF',                category: 'on-mountain' },
  { item: 'Hand warmers',                category: 'on-mountain' },
  { item: 'Warm jacket',                 category: 'apres' },
  { item: 'Casual pants',                category: 'apres' },
  { item: 'Warm boots/Uggs',             category: 'apres' },
  { item: 'Going-out outfit',            category: 'apres' },
  { item: 'Pyjamas',                     category: 'apres' },
  { item: 'Shampoo/conditioner',         category: 'toiletries' },
  { item: 'Moisturiser',                 category: 'toiletries' },
  { item: 'Deodorant',                   category: 'toiletries' },
  { item: 'Toothbrush/toothpaste',       category: 'toiletries' },
  { item: 'Ibuprofen/Panadol',           category: 'toiletries' },
  { item: 'Medicare card',               category: 'admin' },
];

const REMOVED_ITEM_NAMES = new Set([
  'Ski pass holder',
  'Portable charger',
  'Device chargers',
  'Accommodation details',
  'Cash',
]);

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.filter((it) => it.isCustom || !REMOVED_ITEM_NAMES.has(it.item));
    }
  } catch {
    // ignore corrupt storage, fall back to defaults
  }
  return DEFAULT_ITEMS.map((it, i) => ({ id: `default-${i}`, ...it, isCustom: false }));
}

function CategorySection({ category, items }) {
  return (
    <div className="kitbag-category card">
      <div className="kitbag-cat-header">
        <div className="kitbag-cat-title">{category.label}</div>
      </div>

      <ul className="kitbag-list">
        {items.map((item) => (
          <li key={item.id} className="kitbag-item">
            <span className="kitbag-item-name">{item.item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddItemForm({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Item name is required.'); return; }
    onAdd(name.trim(), category);
    onClose();
  }

  return (
    <form className="athlete-form card" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <div className="athlete-form-title">Add Item</div>
      <div className="athlete-form-grid">
        <div className="form-field">
          <label className="form-label">Item</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Extra gloves"
            autoFocus
          />
        </div>
        <div className="form-field">
          <label className="form-label">Category</label>
          <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="athlete-form-actions">
        <button type="submit" className="btn btn-gold">Add Item</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function PersonalKit() {
  const [items, setItems] = useState(loadItems);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function handleAdd(name, category) {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), item: name, category, isCustom: true },
    ]);
  }

  return (
    <div className="kitbag-section">
      <div className="kitbag-section-title">🎒 Personal Kit</div>
      <div className="kitbag-section-subtitle">Your own packing checklist — saved on this device only.</div>

      <div className="athletes-toolbar">
        <div />
        {!showForm && (
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>+ Add Item</button>
        )}
      </div>

      {showForm && <AddItemForm onAdd={handleAdd} onClose={() => setShowForm(false)} />}

      {CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.id);
        if (catItems.length === 0) return null;
        return (
          <CategorySection key={cat.id} category={cat} items={catItems} />
        );
      })}
    </div>
  );
}
