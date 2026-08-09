import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function EditableTextBox({ docRef, field, label, value, placeholder, emptyLabel }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? '');

  useEffect(() => {
    if (!editing) setText(value ?? '');
  }, [value, editing]);

  async function save() {
    await updateDoc(docRef, { [field]: text.trim() });
    setEditing(false);
  }

  return (
    <div className="night-notes-row">
      <span className="section-label" style={{ marginBottom: 0 }}>{label}</span>
      {editing ? (
        <span className="night-inline-edit">
          <textarea
            className="form-input night-notes-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); if (e.key === 'Escape') setEditing(false); }}
            placeholder={placeholder}
            rows={3}
            autoFocus
          />
          <button className="btn btn-gold" onClick={save} style={{ padding: '6px 14px' }}>Save</button>
        </span>
      ) : (
        <span className="night-meal-display" onClick={() => setEditing(true)}>
          {value || <span className="hq-address-placeholder">{emptyLabel}</span>}
          <span className="hq-edit-icon">✏️</span>
        </span>
      )}
    </div>
  );
}

function Assignees({ docRef, assignees, athletes }) {
  const [selected, setSelected] = useState('');
  const available = athletes.filter((a) => !assignees.includes(a.name));

  async function add() {
    if (!selected) return;
    await updateDoc(docRef, { assignees: arrayUnion(selected) });
    setSelected('');
  }

  async function remove(name) {
    await updateDoc(docRef, { assignees: arrayRemove(name) });
  }

  return (
    <div className="night-cooks-section">
      <span className="section-label">Assigned</span>
      {assignees.length === 0 ? (
        <div className="night-no-cooks">⚠️ Nobody assigned yet</div>
      ) : (
        <div className="car-chips" style={{ marginBottom: 8 }}>
          {assignees.map((name) => (
            <span key={name} className="chip">
              {name}
              <button className="chip-remove" onClick={() => remove(name)}>×</button>
            </span>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="car-add-passenger">
          <select
            className="form-input"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Assign someone…</option>
            {available.map((a) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
          <button className="btn btn-gold" onClick={add} disabled={!selected}>Add</button>
        </div>
      )}
    </div>
  );
}

function MealCard({ docId, title, athletes }) {
  const [data, setData] = useState(null);
  const ref = doc(db, 'messHall', docId);

  useEffect(() => {
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setData(snap.data());
      } else {
        setDoc(ref, { assignees: [], notes: '' });
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const assignees = data?.assignees ?? [];

  return (
    <div className="night-card card">
      <div className="night-card-header">
        <div className="night-label">{title}</div>
      </div>

      <Assignees docRef={ref} assignees={assignees} athletes={athletes} />

      <EditableTextBox
        docRef={ref}
        field="notes"
        label="Notes"
        value={data?.notes}
        placeholder="Any notes… (Ctrl+Enter to save)"
        emptyLabel="Add notes…"
      />
    </div>
  );
}

function SnacksCard({ athletes }) {
  const [data, setData] = useState(null);
  const [person, setPerson] = useState('');
  const [item, setItem] = useState('');
  const ref = doc(db, 'messHall', 'snacks');

  useEffect(() => {
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setData(snap.data());
      } else {
        setDoc(ref, { items: [] });
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = data?.items ?? [];

  async function add() {
    const name = person.trim();
    const what = item.trim();
    if (!name || !what) return;
    await updateDoc(ref, { items: [...items, { name, item: what }] });
    setPerson('');
    setItem('');
  }

  async function remove(idx) {
    await updateDoc(ref, { items: items.filter((_, i) => i !== idx) });
  }

  return (
    <div className="night-card card">
      <div className="night-card-header">
        <div className="night-label">Snacks — Who's Bringing What</div>
      </div>

      <div className="night-cooks-section">
        <span className="section-label">On the list</span>
        {items.length === 0 ? (
          <div className="night-no-cooks">Nothing yet — add what you're bringing</div>
        ) : (
          <div className="car-chips" style={{ marginBottom: 8 }}>
            {items.map((it, idx) => (
              <span key={idx} className="chip">
                {it.name} — {it.item}
                <button className="chip-remove" onClick={() => remove(idx)}>×</button>
              </span>
            ))}
          </div>
        )}

        <div className="car-add-passenger">
          <select
            className="form-input"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Who…</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
          <input
            className="form-input"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder="Bringing…"
            style={{ flex: 1 }}
          />
          <button className="btn btn-gold" onClick={add} disabled={!person || !item.trim()}>Add</button>
        </div>
      </div>
    </div>
  );
}

function NightCard({ night, athletes }) {
  const [editingMeal, setEditingMeal] = useState(false);
  const [mealName, setMealName] = useState(night.mealName ?? '');
  const [selectedCook, setSelectedCook] = useState('');

  const ref = doc(db, 'dinnerRoster', night.id);
  const assignees = night.assignees ?? [];

  const available = athletes.filter((a) => !assignees.includes(a.name));

  async function saveMeal() {
    await updateDoc(ref, { mealName: mealName.trim() });
    setEditingMeal(false);
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

      <EditableTextBox
        docRef={ref}
        field="notes"
        label="Notes"
        value={night.notes}
        placeholder="Any notes… (Ctrl+Enter to save)"
        emptyLabel="Add notes…"
      />
    </div>
  );
}

export default function MessHall() {
  const { data: nights, loading: nightsLoading, error } = useCollection('dinnerRoster');
  const { data: athletes, loading: athletesLoading } = useCollection('athletes');

  if (nightsLoading || athletesLoading) return <div className="loading-pulse">Loading Mess Hall…</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;

  const sorted = [...nights].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="messhall-page">
      <section className="messhall-section">
        <h2 className="messhall-section-heading">🍳 Breakfast</h2>
        <div className="messhall-grid">
          <MealCard docId="breakfast" title="Breakfast — Every Morning" athletes={athletes} />
        </div>
      </section>

      <section className="messhall-section">
        <h2 className="messhall-section-heading">🥪 Lunch</h2>
        <div className="messhall-grid">
          <MealCard docId="lunch" title="Lunch — Every Day on the Mountain" athletes={athletes} />
        </div>
      </section>

      <section className="messhall-section">
        <h2 className="messhall-section-heading">🍿 Snacks</h2>
        <div className="messhall-grid">
          <SnacksCard athletes={athletes} />
        </div>
      </section>

      <section className="messhall-section">
        <h2 className="messhall-section-heading">🍽️ Dinner</h2>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <h3>No Dinner Roster Yet</h3>
            <p>The nights will appear once the app seeds on first load.</p>
          </div>
        ) : (
          <div className="messhall-grid">
            {sorted.map((night) => (
              <NightCard key={night.id} night={night} athletes={athletes} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
