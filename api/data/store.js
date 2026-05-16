import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_PATH = path.resolve(__dirname, "../../data/state.json");

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultState = () => ({
  user: {
    name: "Kerme",
    level: 1,
    xp: 0,
    identityStage: "Seedling",
    streaks: {
      dailyCheckin: 0,
      foodLog: 0,
      movement: 0,
      roomReset: 0,
      lastCheckinDate: null,
    },
  },
  today: {
    date: todayKey(),
    mode: {
      dayType: "work",
      energy: "medium",
      training: "rest",
      health: "ok",
    },
    mvp: false,
    focus: null,
    mood: null,
    completedSteps: [],
  },
  recovery: { active: null },
  history: {
    meals: [],
    workouts: [],
    moods: [],
    recoveries: [],
    roomResets: [],
    xpEvents: [],
    dayLogs: [],
    journal: [],
  },
});

let state = null;
let writeQueued = false;

const migrate = (s) => {
  const d = defaultState();
  s.user ??= d.user;
  s.user.streaks ??= d.user.streaks;
  s.user.streaks.lastDates ??= {};
  s.today ??= d.today;
  s.today.completedSteps ??= [];
  s.recovery ??= d.recovery;
  s.history ??= d.history;
  for (const key of Object.keys(d.history)) {
    s.history[key] ??= [];
  }
  return s;
};

const load = () => {
  if (state) return state;
  try {
    if (fs.existsSync(STATE_PATH)) {
      state = migrate(JSON.parse(fs.readFileSync(STATE_PATH, "utf8")));
    } else {
      state = defaultState();
      persist();
    }
  } catch {
    state = defaultState();
  }
  return state;
};

const persist = () => {
  if (writeQueued) return;
  writeQueued = true;
  queueMicrotask(() => {
    writeQueued = false;
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  });
};

export const getState = () => load();

export const update = (mutator) => {
  load();
  mutator(state);
  rolloverIfNewDay();
  persist();
  return state;
};

const rolloverIfNewDay = () => {
  const today = todayKey();
  if (state.today.date !== today) {
    state.history.dayLogs.push({
      date: state.today.date,
      mode: state.today.mode,
      mvp: state.today.mvp,
      focus: state.today.focus,
      mood: state.today.mood,
      completedSteps: state.today.completedSteps,
    });
    state.today = {
      date: today,
      mode: { dayType: "work", energy: "medium", training: "rest", health: "ok" },
      mvp: false,
      focus: null,
      mood: null,
      completedSteps: [],
    };
  }
};

export const ensureToday = () => update(() => {});

export { todayKey };
