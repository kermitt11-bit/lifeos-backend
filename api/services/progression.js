import { update, getState, todayKey } from "../data/store.js";
import { xpRules, identityStages } from "../data/seed.js";

const levelFromXp = (xp) => {
  let level = 1;
  let need = 100;
  let remaining = xp;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = Math.round(need * 1.25);
  }
  return { level, intoLevel: remaining, nextLevelNeeds: need };
};

const stageFromXp = (xp) => {
  let current = identityStages[0];
  for (const s of identityStages) {
    if (xp >= s.min) current = s;
  }
  return current;
};

export const awardXp = (eventKey, meta = {}) => {
  const amount = xpRules[eventKey] ?? 0;
  if (!amount) return { xp: getState().user.xp };
  return update((s) => {
    s.user.xp += amount;
    const lvl = levelFromXp(s.user.xp);
    s.user.level = lvl.level;
    s.user.identityStage = stageFromXp(s.user.xp).name;
    s.history.xpEvents.push({
      at: new Date().toISOString(),
      key: eventKey,
      amount,
      meta,
    });
  }).user;
};

const sameDay = (a, b) => a && b && a === b;

const daysBetween = (a, b) => {
  if (!a || !b) return Infinity;
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / (24 * 3600 * 1000));
};

export const bumpStreak = (streakKey) => {
  return update((s) => {
    const today = todayKey();
    s.user.streaks.lastDates ??= {};
    const last = s.user.streaks.lastDates[streakKey];
    if (sameDay(last, today)) return;
    if (daysBetween(last, today) === 1 || !last) {
      s.user.streaks[streakKey] = (s.user.streaks[streakKey] ?? 0) + 1;
    } else {
      s.user.streaks[streakKey] = 1;
    }
    s.user.streaks.lastDates[streakKey] = today;
    if (streakKey === "dailyCheckin") {
      s.user.streaks.lastCheckinDate = today;
    }
  }).user.streaks;
};

export const progressionSnapshot = () => {
  const s = getState();
  const lvl = levelFromXp(s.user.xp);
  const stage = stageFromXp(s.user.xp);
  return {
    name: s.user.name,
    xp: s.user.xp,
    level: lvl.level,
    intoLevel: lvl.intoLevel,
    nextLevelNeeds: lvl.nextLevelNeeds,
    progressInLevel: Math.round((lvl.intoLevel / lvl.nextLevelNeeds) * 100),
    identityStage: stage,
    streaks: s.user.streaks,
    recentEvents: s.history.xpEvents.slice(-15).reverse(),
  };
};
