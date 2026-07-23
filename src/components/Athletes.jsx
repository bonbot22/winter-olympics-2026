import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';

const TIERS = [
  { value: 'gold',        label: '🥇 Gold — Advanced' },
  { value: 'silver',      label: '🥈 Silver — Intermediate' },
  { value: 'bronze',      label: '🥉 Bronze — Beginner' },
  { value: 'participant', label: '🙋 Participant — Send help' },
];

const TIER_FILTERS = [
  { value: 'all',         label: 'All' },
  { value: 'gold',        label: '🥇 Gold' },
  { value: 'silver',      label: '🥈 Silver' },
  { value: 'bronze',      label: '🥉 Bronze' },
  { value: 'participant', label: '🙋 Participant' },
];

const TIER_META = {
  gold:        { emoji: '🥇', label: 'Gold',        color: 'var(--gold)' },
  silver:      { emoji: '🥈', label: 'Silver',      color: 'var(--silver)' },
  bronze:      { emoji: '🥉', label: 'Bronze',      color: 'var(--bronze)' },
  participant: { emoji: '🙋', label: 'Participant',  color: 'var(--grey)' },
};

const EMPTY_FORM = { name: '', skillTier: 'silver', arrivalDay: 'sat', room: '' };

function SkillBadge({ tier }) {
  const meta = TIER_META[tier] ?? TIER_META.participant;
  return (
    <span className="athlete-tier-badge" style={{ color: meta.color, borderColor: meta.color }}>
      {meta.emoji} {meta.label}
    </span>
  );
}

function AthleteCard({ athlete, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="athlete-card">
      <div className="athlete-card-header">
        <div className="athlete-name">{athlete.name}</div>
        <div className="athlete-card-actions">
          <button className="btn btn-ghost athlete-action-btn" onClick={() => onEdit(athlete)} title="Edit">✏️</button>
          <button className="btn btn-ghost athlete-action-btn" onClick={() => setConfirming(true)} title="Delete">🗑️</button>
        </div>
      </div>

      <SkillBadge tier={athlete.skillTier} />

      <div className="athlete-meta">
        <span className="athlete-meta-item">
          🗓 {athlete.arrivalDay === 'sat' ? 'Arriving Sat 15' : 'Arriving Sun 16'}
        </span>
        {athlete.room && (
          <span className="athlete-meta-item">🏠 {athlete.room}</span>
        )}
      </div>

      {confirming && (
        <div className="athlete-confirm">
          <span>Remove {athlete.name} from the Games?</span>
          <div className="athlete-confirm-btns">
            <button className="btn btn-gold" style={{ fontSize: '0.75rem', padding: '5px 12px' }} onClick={() => onDelete(athlete.id)}>Remove</button>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '5px 12px' }} onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AthleteForm({ athletes, editing, onClose }) {
  const [form, setForm] = useState(editing ?? EMPTY_FORM);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { setError('Name is required.'); return; }

    const duplicate = athletes.some(
      (a) => a.name.toLowerCase() === name.toLowerCase() && a.id !== editing?.id
    );
    if (duplicate) { setError(`${name} is already registered.`); return; }

    if (editing) {
      await updateDoc(doc(db, 'athletes', editing.id), {
        name,
        skillTier: form.skillTier,
        arrivalDay: form.arrivalDay,
        room: form.room.trim(),
      });
    } else {
      await addDoc(collection(db, 'athletes'), {
        name,
        skillTier: form.skillTier,
        arrivalDay: form.arrivalDay,
        room: form.room.trim(),
        createdAt: serverTimestamp(),
      });
    }
    onClose();
  }

  return (
    <form className="athlete-form" onSubmit={handleSubmit}>
      <div className="athlete-form-title">
        {editing ? `Editing ${editing.name}` : 'Register Athlete'}
      </div>
      <div className="athlete-form-grid">
        <div className="form-field">
          <label className="form-label">Name</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Full name"
            autoFocus
          />
        </div>
        <div className="form-field">
          <label className="form-label">Skill Tier</label>
          <select className="form-input" value={form.skillTier} onChange={(e) => set('skillTier', e.target.value)}>
            {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Arrival</label>
          <select className="form-input" value={form.arrivalDay} onChange={(e) => set('arrivalDay', e.target.value)}>
            <option value="sat">Sat 15 Aug</option>
            <option value="sun">Sun 16 Aug</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Room <span className="form-label-opt">(optional)</span></label>
          <input
            className="form-input"
            value={form.room}
            onChange={(e) => set('room', e.target.value)}
            placeholder="e.g. Room 3"
          />
        </div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="athlete-form-actions">
        <button type="submit" className="btn btn-gold">{editing ? 'Save Changes' : 'Register'}</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function Athletes() {
  const { data: athletes, loading, error } = useCollection('athletes');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'athletes', id));
  }

  function handleEdit(athlete) {
    setEditingAthlete(athlete);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingAthlete(null);
  }

  const filtered = filter === 'all' ? athletes : athletes.filter((a) => a.skillTier === filter);

  if (loading) return <div className="loading-pulse">Loading Athletes…</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;

  return (
    <div>
      <div className="athletes-toolbar">
        <div className="athletes-filters">
          {TIER_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-btn${filter === f.value ? ' active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!showForm && (
          <button className="btn btn-gold" onClick={() => { setEditingAthlete(null); setShowForm(true); }}>
            + Register Athlete
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <AthleteForm
            athletes={athletes}
            editing={editingAthlete}
            onClose={handleCloseForm}
          />
        </div>
      )}

      {athletes.length === 0 ? (
        <div className="empty-state">
          <h3>No Athletes Registered Yet</h3>
          <p>The Opening Ceremony is in {Math.max(0, Math.ceil((new Date('2026-08-15') - Date.now()) / 86400000))} days — get signing up.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter.charAt(0).toUpperCase() + filter.slice(1)} Athletes</h3>
          <p>Nobody in this tier yet.</p>
        </div>
      ) : (
        <div className="athletes-grid">
          {filtered.map((athlete) => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
