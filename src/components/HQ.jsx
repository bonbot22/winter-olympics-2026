import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCollection } from '../hooks/useCollection';
import { seedAll } from '../seed';

const TRIP_START = new Date('2026-08-16T00:00:00+10:00');

function useCountdown() {
  const [diff, setDiff] = useState(() => TRIP_START - Date.now());

  useEffect(() => {
    const id = setInterval(() => setDiff(TRIP_START - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return diff;
}

function Countdown() {
  const diff = useCountdown();

  if (diff <= 0) {
    return (
      <div className="hq-countdown hq-countdown--arrived">
        WE'RE HERE 🏔
      </div>
    );
  }

  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className="hq-countdown">
      <div className="hq-countdown-units">
        <div className="hq-countdown-unit">
          <span className="hq-countdown-num">{String(days).padStart(2, '0')}</span>
          <span className="hq-countdown-label">Days</span>
        </div>
        <span className="hq-countdown-sep">:</span>
        <div className="hq-countdown-unit">
          <span className="hq-countdown-num">{String(hours).padStart(2, '0')}</span>
          <span className="hq-countdown-label">Hrs</span>
        </div>
        <span className="hq-countdown-sep">:</span>
        <div className="hq-countdown-unit">
          <span className="hq-countdown-num">{String(minutes).padStart(2, '0')}</span>
          <span className="hq-countdown-label">Mins</span>
        </div>
        <span className="hq-countdown-sep">:</span>
        <div className="hq-countdown-unit">
          <span className="hq-countdown-num">{String(seconds).padStart(2, '0')}</span>
          <span className="hq-countdown-label">Secs</span>
        </div>
      </div>
      <div className="hq-countdown-sub">Until the Opening Ceremony</div>
    </div>
  );
}

function TripInfoCard({ config, onSaveAddress }) {
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState(config?.accommodationAddress ?? '');

  function handleSave() {
    onSaveAddress(address);
    setEditing(false);
  }

  return (
    <div className="card">
      <div className="card-title">Trip Info</div>
      <div className="hq-info-grid">
        <div className="hq-info-row">
          <span className="hq-info-key">Dates</span>
          <span className="hq-info-val">16–19 August 2026</span>
        </div>
        <div className="hq-info-row">
          <span className="hq-info-key">Location</span>
          <span className="hq-info-val">Falls Creek, VIC, Australia</span>
        </div>
        <div className="hq-info-row">
          <span className="hq-info-key">Accommodation</span>
          <span className="hq-info-val hq-info-address">
            {editing ? (
              <span className="hq-address-edit">
                <input
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <button className="btn btn-gold" style={{ marginTop: 6 }} onClick={handleSave}>Save</button>
              </span>
            ) : (
              <span
                className="hq-address-display"
                onClick={() => setEditing(true)}
                title="Click to edit"
              >
                {address || <span className="hq-address-placeholder">Click to add address…</span>}
                <span className="hq-edit-icon">✏️</span>
              </span>
            )}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <a
          href="https://www.fallscreek.com.au/snow-report"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          Snow Report →
        </a>
      </div>
    </div>
  );
}

function QuickStats({ athletes, cars }) {
  const totalSeats = cars.reduce((sum, car) => {
    const taken = (car.passengers?.length ?? 0) + 1;
    return sum + Math.max(0, (car.totalSeats ?? 0) - taken);
  }, 0);

  const stats = [
    { label: 'Athletes Confirmed', value: athletes.length },
    { label: 'Cars', value: cars.length },
    { label: 'Nights', value: 4 },
    { label: 'Seats Available', value: totalSeats },
  ];

  return (
    <div className="card hq-stats-card">
      {stats.map((s) => (
        <div key={s.label} className="hq-stat">
          <span className="hq-stat-num">{s.value}</span>
          <span className="hq-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function HQ() {
  const [config, setConfig] = useState(null);
  const [seeded, setSeeded] = useState(false);
  const { data: athletes } = useCollection('athletes');
  const { data: cars } = useCollection('cars');

  useEffect(() => {
    const ref = doc(db, 'config', 'trip');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      } else {
        setDoc(ref, {
          name: 'Winter Olympics 2026',
          location: 'Falls Creek, VIC',
          startDate: '2026-08-16',
          endDate: '2026-08-19',
          accommodationAddress: '',
        });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!seeded) {
      seedAll();
      setSeeded(true);
    }
  }, [seeded]);

  async function handleSaveAddress(address) {
    await updateDoc(doc(db, 'config', 'trip'), { accommodationAddress: address });
  }

  return (
    <div className="hq-root">
      <div className="card hq-countdown-card">
        <Countdown />
        <div className="hq-ceremony-note">
          Opening Ceremony · Sat 16 Aug · Falls Creek · Dress: Ridiculous
        </div>
      </div>

      <QuickStats athletes={athletes} cars={cars} />

      <TripInfoCard config={config} onSaveAddress={handleSaveAddress} />
    </div>
  );
}
