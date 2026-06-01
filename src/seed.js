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

const PACKING_ITEMS = [
  { item: 'Ski jacket',                  category: 'on-mountain' },
  { item: 'Ski pants',                   category: 'on-mountain' },
  { item: 'Thermal base layer (top)',    category: 'on-mountain' },
  { item: 'Thermal base layer (bottom)', category: 'on-mountain' },
  { item: 'Ski socks x3',               category: 'on-mountain' },
  { item: 'Helmet',                      category: 'on-mountain' },
  { item: 'Goggles',                     category: 'on-mountain' },
  { item: 'Gloves',                      category: 'on-mountain' },
  { item: 'Buff/neck warmer',           category: 'on-mountain' },
  { item: 'Sunscreen SPF50+',           category: 'on-mountain' },
  { item: 'Lip balm SPF',               category: 'on-mountain' },
  { item: 'Hand warmers',               category: 'on-mountain' },
  { item: 'Ski pass holder',            category: 'on-mountain' },
  { item: 'Warm jacket',                category: 'apres' },
  { item: 'Casual pants',               category: 'apres' },
  { item: 'Warm boots/Uggs',            category: 'apres' },
  { item: 'Going-out outfit',           category: 'apres' },
  { item: 'Pyjamas',                    category: 'apres' },
  { item: 'Shampoo/conditioner',        category: 'toiletries' },
  { item: 'Moisturiser',                category: 'toiletries' },
  { item: 'Deodorant',                  category: 'toiletries' },
  { item: 'Toothbrush/toothpaste',      category: 'toiletries' },
  { item: 'Ibuprofen/Panadol',          category: 'toiletries' },
  { item: 'Medicare card',              category: 'admin' },
  { item: 'Ski hire confirmation',      category: 'admin' },
  { item: 'Accommodation details',      category: 'admin' },
  { item: 'Cash',                        category: 'admin' },
  { item: 'Portable charger',           category: 'admin' },
];

let seeded = false;

export async function seedAll() {
  if (seeded) return;
  seeded = true;

  try {
    const [challengesSnap, dinnerSnap, packingSnap] = await Promise.all([
      getDocs(collection(db, 'challenges')),
      getDocs(collection(db, 'dinnerRoster')),
      getDocs(collection(db, 'packingList')),
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

    if (packingSnap.empty) {
      PACKING_ITEMS.forEach((p) => {
        batch.set(doc(collection(db, 'packingList')), { ...p, checkedBy: '', addedBy: 'system', createdAt: new Date() });
      });
      hasWork = true;
    }

    if (hasWork) await batch.commit();
  } catch (e) {
    console.error('Seed failed:', e);
  }
}
