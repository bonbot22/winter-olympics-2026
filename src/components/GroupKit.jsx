import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';

const SEED_ITEMS = [
  'First aid kit',
  'Portable bluetooth speaker',
  'Card games / UNO',
  'Cooking oil + basic spices',
  'Reusable shopping bags',
  'Communal sunscreen',
  'Corkscrew / bottle opener',
  'Power board / extension cord',
];

function AddItemForm({ onClose }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Item name is required.'); return; }
    await addDoc(collection(db, 'groupKit'), {
      item: name.trim(),
      claimedBy: '',
      isCustom: true,
      createdAt: serverTimestamp(),
    });
    onClose();
  }

  return (
    <form className="athlete-form card" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <div className="athlete-form-title">Add Group Item</div>
      <div className="form-field">
        <label className="form-label">Item</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Board games"
          autoFocus
        />
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="athlete-form-actions">
        <button type="submit" className="btn btn-gold">Add Item</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function GroupKit() {
  const { data: items, loading, error } = useCollection('groupKit');
  const [showForm, setShowForm] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (loading || seededRef.current || items.length > 0) return;
    seededRef.current = true;
    const batch = writeBatch(db);
    SEED_ITEMS.forEach((name) => {
      batch.set(doc(collection(db, 'groupKit')), {
        item: name,
        claimedBy: '',
        isCustom: false,
        createdAt: serverTimestamp(),
      });
    });
    batch.commit().catch((e) => console.error('Group kit seed failed:', e));
  }, [loading, items.length]);

  async function handleClaim(item) {
    const name = window.prompt('Your name?');
    if (!name?.trim()) return;
    await updateDoc(doc(db, 'groupKit', item.id), { claimedBy: name.trim() });
  }

  async function handleUnclaim(item) {
    await updateDoc(doc(db, 'groupKit', item.id), { claimedBy: '' });
  }

  if (loading) return <div className="loading-pulse">Loading Group Kit…</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;

  return (
    <div className="kitbag-section">
      <div className="kitbag-section-title">🧳 Group Kit</div>
      <div className="kitbag-section-subtitle">Shared items — one person volunteers to bring each.</div>

      <div className="athletes-toolbar">
        <div />
        {!showForm && (
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>+ Add Item</button>
        )}
      </div>

      {showForm && <AddItemForm onClose={() => setShowForm(false)} />}

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>Group Kit Is Empty</h3>
          <p>Items will appear once the app seeds on first load.</p>
        </div>
      ) : (
        <ul className="groupkit-list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`groupkit-item${item.claimedBy ? ' groupkit-item--claimed' : ''}`}
              onClick={() => !item.claimedBy && handleClaim(item)}
            >
              <span className="groupkit-item-name">{item.item}</span>
              {item.claimedBy ? (
                <div className="groupkit-claimed-row">
                  <span className="groupkit-claimed-label">{item.claimedBy} is bringing this ✓</span>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.72rem' }}
                    onClick={(e) => { e.stopPropagation(); handleUnclaim(item); }}
                  >
                    Unclaim
                  </button>
                </div>
              ) : (
                <span className="groupkit-claim-hint">Click to claim</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
