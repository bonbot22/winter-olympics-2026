import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function NightCard({ night, athletes }) {
  const [editingMeal, setEditingMeal] = useState(false);
  const [mealName, setMealName] = useState(night.mealName ?? '');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(night.notes ?? '');
  const [selectedCook, setSelectedCook] = useState('');

  const ref = doc(db, 'dinnerRoster', night.id);
  const assignees = night.assignees ?? [];

  const available = athletes.filter((a) => !assignees.includes(a.name));

  async function saveMeal() {
    await updateDoc(ref, { mealName: mealName.trim() });
    setEditingMeal(false);
  }

  async function saveNotes() {
    await updateDoc(ref, { notes: notes.trim() });
    setEditingNotes(false);
  }

  async function addCook() {
    if (!selectedCook) return;
    await updateDoc(ref, { assignees: arrayUnion(selectedCook) });
    setSelectedCook('');
  }

  async function removeCook(name) {
    await updateDoc(ref, { assignees: arrayRemove(name) });
  }

  return (
    <div className="night-card card">
      <div className="night-card-header">
        <div className="night-label">{night.label}</div>
        <div className="night-date">{formatDate(night.date)}</div>
      </div>

      <div className="night-meal-row">
        <span className="section-label" style={{ marginBottom: 0 }}>Meal</span>
        {editingMeal ? (
          <span className="night-inline-edit">
            <input
              className="form-input"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveMeal(); if (e.key === 'Escape') setEditingMeal(false); }}
              placeholder="e.g. BBQ, pasta night…"
              autoFocus
            />
            <button className="btn btn-gold" onClick={saveMeal} style={{ padding: '6px 14px' }}>Save</button>
          </span>
        ) : (
          <span className="night-meal-display" onClick={() => setEditingMeal(true)}>
            {night.mealName || <span className="hq-address-placeholder">Click to set meal…</span>}
            <span className="hq-edit-icon">✏️</span>
          </span>
        )}
      </div>

      <div className="night-cooks-section">
        <span className="section-label">Cooks</span>
        {assignees.length === 0 ? (
          <div className="night-no-cooks">⚠️ Nobody on dinner — sort this out</div>
        ) : (
          <div className="car-chips" style={{ marginBottom: 8 }}>
            {assignees.map((name) => (
              <span key={name} className="chip">
                {name}
                <button className="chip-remove" onClick={() => removeCook(name)}>×</button>
              </span>
            ))}
          </div>
        )}

        {available.length > 0 && (
          <div className="car-add-passenger">
            <select
              className="form-input"
              value={selectedCook}
              onChange={(e) => setSelectedCook(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Assign cook…</option>
              {available.map((a) => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
            <button className="btn btn-gold" onClick={addCook} disabled={!selectedCook}>Add</button>
          </div>
        )}
      </div>

      <div className="night-notes-row">
        <span className="section-label" style={{ marginBottom: 0 }}>Notes</span>
        {editingNotes ? (
          <span className="night-inline-edit">
            <input
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveNotes(); if (e.key === 'Escape') setEditingNotes(false); }}
              placeholder="Any notes…"
              autoFocus
            />
            <button className="btn btn-gold" onClick={saveNotes} style={{ padding: '6px 14px' }}>Save</button>
          </span>
        ) : (
          <span className="night-meal-display" onClick={() => setEditingNotes(true)}>
            {night.notes || <span className="hq-address-placeholder">Add notes…</span>}
            <span className="hq-edit-icon">✏️</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default function MessHall() {
  const { data: nights, loading: nightsLoading, error } = useCollection('dinnerRoster');
  const { data: athletes, loading: athletesLoading } = useCollection('athletes');

  if (nightsLoading || athletesLoading) return <div className="loading-pulse">Loading Mess Hall…</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;

  const sorted = [...nights].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Dinner Roster Yet</h3>
        <p>The nights will appear once the app seeds on first load.</p>
      </div>
    );
  }

  return (
    <div className="messhall-grid">
      {sorted.map((night) => (
        <NightCard key={night.id} night={night} athletes={athletes} />
      ))}
    </div>
  );
}
