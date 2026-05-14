import { signal } from "https://esm.sh/@preact/signals@1.2.3";
import * as db from "./db.js";

export const state = {
  entries: signal([]),
  tasks: signal([]),
  habits: signal([]),
  habitLogs: signal([]),
  goals: signal([]),
  moods: signal([]),
  userName: signal(""),
  themePref: signal("system"),
  reminderHour: signal(21),
  reminderEnabled: signal(false),
  hasOnboarded: signal(false),
  ready: signal(false),
};

const STORE_FOR = {
  entries: "entries",
  tasks: "tasks",
  habits: "habits",
  habitLogs: "habitLogs",
  goals: "goals",
  moods: "moods",
};

export async function load() {
  for (const key of Object.keys(STORE_FOR)) {
    state[key].value = await db.getAll(STORE_FOR[key]);
  }
  state.userName.value = (await db.kvGet("userName", "")) || "";
  state.themePref.value = (await db.kvGet("themePref", "system")) || "system";
  state.reminderHour.value = Number(await db.kvGet("reminderHour", 21)) || 21;
  state.reminderEnabled.value = Boolean(await db.kvGet("reminderEnabled", false));
  state.hasOnboarded.value = Boolean(await db.kvGet("hasOnboarded", false));
  state.ready.value = true;
}

export async function setKV(key, value) {
  state[key].value = value;
  await db.kvSet(key, value);
}

export async function upsert(collection, item) {
  const store = STORE_FOR[collection];
  if (!store) throw new Error("unknown collection: " + collection);
  const saved = await db.put(store, item);
  const list = state[collection].value.slice();
  const idx = list.findIndex((x) => x.id === saved.id);
  if (idx >= 0) list[idx] = saved;
  else list.push(saved);
  state[collection].value = list;
  return saved;
}

export async function remove(collection, id) {
  const store = STORE_FOR[collection];
  await db.remove(store, id);
  state[collection].value = state[collection].value.filter((x) => x.id !== id);
}

export async function eraseAll() {
  await db.clearAll();
  for (const key of Object.keys(STORE_FOR)) state[key].value = [];
  state.hasOnboarded.value = false;
  state.userName.value = "";
}

export async function exportJSON() {
  const data = await db.exportAll();
  return JSON.stringify(data, null, 2);
}
