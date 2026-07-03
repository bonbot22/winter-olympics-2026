import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

const CHALLENGES = [
  { name: 'Super-G Speed Run',         description: 'First to the bottom of the main run',         icon: '⛷️',  isCustom: false },
  { name: 'Mogul Mastery',             description: 'Best form through the mogul field',            icon: '🎿',  isCustom: false },
  { name: 'Après Biathlon',            description: 'Last one standing at après',                   icon: '🍺',  isCustom: false },
  { name: 'Opening Ceremony Faceplant',description: 'Most spectacular wipeout on day 1',            icon: '😵',  isCustom: false },
  { name: 'Black Run Conquest',        description: 'First to complete a black run',                icon: '⚫',  isCustom: false },
  { name: 'Best Dressed on Mountain',  description: 'Peak mountain fashion',                        icon: '👑',  isCustom: false },
  { name: 'First Chair',               description: 'First on the lift, day 1',                     icon: '🚡',  isCustom: false },
  { name: 'Longest Wipeout',           description: 'Distance travelled after falling',             icon: '📏',  isCustom: false },
];

const DINNER_NIGHTS = [
  { id: 'night-16', date: '2026-08-16', label: 'Saturday Night',  mealName: '', assignees: [], notes: '' },
  { id: 'night-17', date: '2026-08-17', label: 'Sunday Night',    mealName: '', assignees: [], notes: '' },
  { id: 'night-18', date: '2026-08-18', label: 'Monday Night',    mealName: '', assignees: [], notes: '' },
  { id: 'night-19', date: '2026-08-19', label: 'Tuesday Night',   mealName: '', assignees: [], notes: '' },
];

let seeded = false;

export async function seedAll() {
  if (seeded) return;
  seeded = true;

  try {
    const [challengesSnap, dinnerSnap] = await Promise.all([
      getDocs(collection(db, 'challenges')),
      getDocs(collection(db, 'dinnerRoster')),
    ]);

    const batch = writeBatch(db);
    let hasWork = false;

    if (challengesSnap.empty) {
      CHALLENGES.forEach((c) => {
        batch.set(doc(collection(db, 'challenges')), c);
      });
      hasWork = true;
    }

    if (dinnerSnap.empty) {
      DINNER_NIGHTS.forEach((n) => {
        batch.set(doc(db, 'dinnerRoster', n.id), n);
      });
      hasWork = true;
    }

    if (hasWork) await batch.commit();
  } catch (e) {
    console.error('Seed failed:', e);
  }
}
