/* =====================================================================
   store.js — localStorage helpers + small utilities
   ---------------------------------------------------------------------
   Everything the prototype saves lives under keys that start with
   "eduquest.v1." so "Reset demo" can remove exactly those keys.
   Nothing is ever sent to a server (no backend, no database).
   ===================================================================== */

const Store = (() => {
  const PREFIX = 'eduquest.v1.';

  const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

  // Read a saved value, or return a copy of the fallback.
  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? clone(fallback) : JSON.parse(raw);
    } catch (e) {
      return clone(fallback); // private mode / blocked storage → just use defaults
    }
  }

  // Save a value (Alpine proxies stringify fine).
  function set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  // "Reset demo": delete every EduQuest key.
  function reset() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  }

  return { get, set, reset };
})();

/* ---------------------------- Utilities ---------------------------- */
const Util = {
  // "2026-10-31" style key for the local date, n days from today
  dayKey(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  // "Oct 31" from a day key
  shortDate(key) {
    if (!key) return '';
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  },
  weekday(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-PH', { weekday: 'short' });
  },
  shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  pick(list) { return list[Math.floor(Math.random() * list.length)]; },
  fmt(n) { return Math.round(n || 0).toLocaleString('en-US'); },
  avg(list) { return list.length ? list.reduce((s, x) => s + x, 0) / list.length : 0; }
};

/* ---------------------------------------------------------------------
   The demo student's starting state. It already has a little progress
   so every dashboard looks alive on the first click. "Reset demo"
   brings the student back to exactly this state.
   --------------------------------------------------------------------- */
function defaultStudent() {
  // Seconds of learning time for the past 6 days (today starts at 0)
  const pastMinutes = [18, 25, 0, 31, 22, 15];
  const time = {};
  pastMinutes.forEach((min, i) => { time[Util.dayKey(-(6 - i))] = min * 60; });
  time[Util.dayKey(0)] = 0;

  return {
    nickname: 'Kiko',
    avatar: 'Kiko',
    xp: 185,
    streak: { count: 2, last: Util.dayKey(-1) }, // finishing a challenge today makes it 3 🔥
    badges: ['first-steps'],
    quests: {
      'math-1': { attempts: 2, firstAccuracy: 67, bestAccuracy: 83, lastAccuracy: 83, bestScore: 4210, stars: 2, mode: 'up', lastPlayed: Util.dayKey(-1) },
      'sci-1': { attempts: 1, firstAccuracy: 50, bestAccuracy: 50, lastAccuracy: 50, bestScore: 2380, stars: 1, mode: 'normal', lastPlayed: Util.dayKey(-2) },
      'eng-1': { attempts: 1, firstAccuracy: 67, bestAccuracy: 67, lastAccuracy: 67, bestScore: 3305, stars: 2, mode: 'normal', lastPlayed: Util.dayKey(-3) }
    },
    time
  };
}
