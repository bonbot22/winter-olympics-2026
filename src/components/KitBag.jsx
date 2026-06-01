import { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';

const CATEGORIES = [
  { id: 'on-mountain', label: '⛷️ On Mountain' },
  { id: 'apres',       label: '🍻 Après / Evenings' },
  { id: 'toiletries',  label: '🧴 Toiletries' },
  { id: 'admin',       label: '📋 Admin' },
  { id: 'other',       label: '📦 Other' },
];

function ProgressBar({ checked, total }) {
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);
  return (
    <div className="kitbag-progress">
      <div className="kitbag-progress-bar">
        <div className="kitbag-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="kitbag-progress-label">{checked}/{total} packed</span>
    </div>
  );
}

function CategorySection({ category, items, onToggle, onCheckAll, onUncheckAll }) {
  const checked = items.filter((i) => i.checkedBy).length;

  return (
    <div className="kitbag-category card">
      <div className="kitbag-cat-header">
        <div className="kitbag-cat-title">{category.label}</div>
        <div className="kitbag-cat-actions">
          <button className="btn btn-ghost" style={{ fontSize: '0.72rem' }} onClick={() => onCheckAll(items)}>
            Check all
          </button>
          <button className="btn btn-ghost" style={{ fontSize: '0.72rem' }} onClick={() => onUncheckAll(items)}>
            Uncheck all
          </button>
        </div>
      </div>

      <ProgressBar checked={checked} total={items.length} />

      <ul className="kitbag-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`kitbag-item${item.checkedBy ? ' kitbag-item--checked' : ''}`}
            onClick={() => onToggle(item)}
          >
            <span className="kitbag-checkbox">
              {item.checkedBy ? '✅' : '⬜'}
            </span>
            <span className="kitbag-item-name">{item.item}</span>
            {item.checkedBy && (
              <span className="kitbag-checked-by">{item.checkedBy}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddItemForm({ onClose }) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('other');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!itemName.trim()) { setError('Item name is required.'); return; }
    await addDoc(collection(db, 'packingList'), {
      item: itemName.trim(),
      category,
      checkedBy: '',
      addedBy: '',
      createdAt: serverTimestamp(),
    });
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
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
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

export default function KitBag() {
  const { data: items, loading, error } = useCollection('packingList');
  const [showForm, setShowForm] = useState(false);

  async function handleToggle(item) {
    if (item.checkedBy) {
      await updateDoc(doc(db, 'packingList', item.id), { checkedBy: '' });
    } else {
      const name = window.prompt('Your name?');
      if (!name?.trim()) return;
      await updateDoc(doc(db, 'packingList', item.id), { checkedBy: name.trim() });
    }
  }

  async function handleCheckAll(categoryItems) {
    const name = window.prompt('Your name?');
    if (!name?.trim()) return;
    await Promise.all(
      categoryItems
        .filter((i) => !i.checkedBy)
        .map((i) => updateDoc(doc(db, 'packingList', i.id), { checkedBy: name.trim() }))
    );
  }

  async function handleUncheckAll(categoryItems) {
    await Promise.all(
      categoryItems
        .filter((i) => i.checkedBy)
        .map((i) => updateDoc(doc(db, 'packingList', i.id), { checkedBy: '' }))
    );
  }

  if (loading) return <div className="loading-pulse">Loading Kit Bag…</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>Kit Bag Is Empty</h3>
        <p>Items will appear once the app seeds on first load.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="athletes-toolbar" style={{ marginBottom: 16 }}>
        <div />
        {!showForm && (
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>+ Add Item</button>
        )}
      </div>

      {showForm && <AddItemForm onClose={() => setShowForm(false)} />}

      {CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.id);
        if (catItems.length === 0) return null;
        return (
          <CategorySection
            key={cat.id}
            category={cat}
            items={catItems}
            onToggle={handleToggle}
            onCheckAll={handleCheckAll}
            onUncheckAll={handleUncheckAll}
          />
        );
      })}
    </div>
  );
}
