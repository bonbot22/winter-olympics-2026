import { useState } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';

const EMPTY_CAR_FORM = {
  driverName: '',
  totalSeats: 4,
  departureLocation: '',
  departureTime: '',
  notes: '',
};

function seatsFree(car) {
  return (car.totalSeats ?? 0) - (car.passengers?.length ?? 0) - 1;
}

function allDriversAndPassengers(cars) {
  const names = new Set();
  cars.forEach((c) => {
    if (c.driverName) names.add(c.driverName);
    (c.passengers ?? []).forEach((p) => names.add(p));
  });
  return names;
}

function CarForm({ onClose }) {
  const [form, setForm] = useState(EMPTY_CAR_FORM);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.driverName.trim()) { setError('Driver name is required.'); return; }
    if (!form.departureLocation.trim()) { setError('Departure location is required.'); return; }
    const seats = parseInt(form.totalSeats, 10);
    if (isNaN(seats) || seats < 2 || seats > 8) { setError('Seats must be between 2 and 8.'); return; }

    await addDoc(collection(db, 'cars'), {
      driverName: form.driverName.trim(),
      totalSeats: seats,
      departureLocation: form.departureLocation.trim(),
      departureTime: form.departureTime,
      notes: form.notes.trim(),
      passengers: [],
      createdAt: serverTimestamp(),
    });
    onClose();
  }

  return (
    <form className="car-form" onSubmit={handleSubmit}>
      <div className="athlete-form-title">Add Car</div>
      <div className="car-form-grid">
        <div className="form-field">
          <label className="form-label">Driver Name</label>
          <input className="form-input" value={form.driverName} onChange={(e) => set('driverName', e.target.value)} placeholder="Driver's name" autoFocus />
        </div>
        <div className="form-field">
          <label className="form-label">Total Seats (incl. driver)</label>
          <input className="form-input" type="number" min={2} max={8} value={form.totalSeats} onChange={(e) => set('totalSeats', e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Departure Location</label>
          <input className="form-input" value={form.departureLocation} onChange={(e) => set('departureLocation', e.target.value)} placeholder="e.g. Sydney CBD" />
        </div>
        <div className="form-field">
          <label className="form-label">Departure Time</label>
          <input className="form-input" type="time" value={form.departureTime} onChange={(e) => set('departureTime', e.target.value)} />
        </div>
        <div className="form-field car-form-notes">
          <label className="form-label">Notes <span className="form-label-opt">(optional)</span></label>
          <input className="form-input" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. stopping at Cooma" />
        </div>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div className="athlete-form-actions">
        <button type="submit" className="btn btn-gold">Add Car</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

function CarCard({ car, athletes, allCars }) {
  const [selectedPassenger, setSelectedPassenger] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const assigned = allDriversAndPassengers(allCars);
  const free = seatsFree(car);

  const available = athletes.filter(
    (a) => !assigned.has(a.name) || (car.passengers ?? []).includes(a.name)
  ).filter(
    (a) => !(car.passengers ?? []).includes(a.name) && a.name !== car.driverName
  );

  async function addPassenger() {
    if (!selectedPassenger) return;
    const updated = [...(car.passengers ?? []), selectedPassenger];
    if (updated.length >= (car.totalSeats ?? 0) - 1) setError('');
    await updateDoc(doc(db, 'cars', car.id), { passengers: updated });
    setSelectedPassenger('');
  }

  async function removePassenger(name) {
    const updated = (car.passengers ?? []).filter((p) => p !== name);
    await updateDoc(doc(db, 'cars', car.id), { passengers: updated });
  }

  async function deleteCar() {
    await deleteDoc(doc(db, 'cars', car.id));
  }

  const taken = (car.passengers?.length ?? 0) + 1;
  const isFull = free <= 0;

  return (
    <div className="car-card">
      <div className="car-card-header">
        <div>
          <div className="car-driver">🚗 {car.driverName}</div>
          <div className="car-depart">
            {car.departureLocation}{car.departureTime ? ` · ${car.departureTime}` : ''}
          </div>
        </div>
        <div className="car-seats-badge" style={{ color: isFull ? 'var(--grey)' : 'var(--gold)' }}>
          {taken}/{car.totalSeats} seats
        </div>
      </div>

      {car.notes && <div className="car-notes">{car.notes}</div>}

      <div className="car-passengers">
        <div className="section-label">Passengers</div>
        <div className="car-chips">
          <span className="chip" style={{ borderColor: 'var(--navy-border)', color: 'var(--grey)' }}>
            🚗 {car.driverName} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(driver)</span>
          </span>
          {(car.passengers ?? []).map((name) => (
            <span key={name} className="chip">
              {name}
              <button className="chip-remove" onClick={() => removePassenger(name)}>×</button>
            </span>
          ))}
        </div>
      </div>

      {!isFull && available.length > 0 && (
        <div className="car-add-passenger">
          <select
            className="form-input"
            value={selectedPassenger}
            onChange={(e) => setSelectedPassenger(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Add passenger…</option>
            {available.map((a) => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
          <button className="btn btn-gold" onClick={addPassenger} disabled={!selectedPassenger}>
            Add
          </button>
        </div>
      )}

      {isFull && <div className="car-full-badge">FULL</div>}

      {error && <div className="error-msg">{error}</div>}

      <div className="car-card-footer">
        {confirmDelete ? (
          <div className="athlete-confirm">
            <span>Remove {car.driverName}'s car?</span>
            <div className="athlete-confirm-btns">
              <button className="btn btn-gold" style={{ fontSize: '0.75rem', padding: '5px 12px' }} onClick={deleteCar}>Remove</button>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '5px 12px' }} onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => setConfirmDelete(true)}>
            Remove car
          </button>
        )}
      </div>
    </div>
  );
}

function UnassignedAthletes({ athletes, cars }) {
  const assigned = allDriversAndPassengers(cars);
  const unassigned = athletes.filter((a) => !assigned.has(a.name));
  if (unassigned.length === 0) return null;

  return (
    <div className="card convoy-unassigned">
      <div className="card-title">⚠️ Not Yet in a Car</div>
      <div className="car-chips">
        {unassigned.map((a) => (
          <span key={a.id} className="chip">{a.name}</span>
        ))}
      </div>
    </div>
  );
}

export default function Convoy() {
  const { data: cars, loading: carsLoading, error: carsError } = useCollection('cars');
  const { data: athletes, loading: athletesLoading } = useCollection('athletes');
  const [showForm, setShowForm] = useState(false);

  if (carsLoading || athletesLoading) return <div className="loading-pulse">Loading Convoy…</div>;
  if (carsError) return <div className="error-msg">Error: {carsError}</div>;

  return (
    <div>
      <div className="athletes-toolbar">
        <div />
        {!showForm && (
          <button className="btn btn-gold" onClick={() => setShowForm(true)}>+ Add Car</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <CarForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {cars.length === 0 ? (
        <div className="empty-state">
          <h3>No Cars in the Convoy Yet</h3>
          <p>Add the first car and start filling seats.</p>
        </div>
      ) : (
        <div className="convoy-grid">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} athletes={athletes} allCars={cars} />
          ))}
        </div>
      )}

      {athletes.length > 0 && <UnassignedAthletes athletes={athletes} cars={cars} />}
    </div>
  );
}
