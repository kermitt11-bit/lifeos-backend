import { html, useMemo } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import {
  addDays, startOfDay, isSameDay, streakFor, completionsThisWeek, uuid,
} from "../lib/utils.js";

export function HabitsView({ openSheet }) {
  const habits = state.habits.value;
  const logs = state.habitLogs.value;
  const today = startOfDay(new Date());

  const doneToday = useMemo(
    () => habits.filter((h) => logs.some(
      (l) => l.habitId === h.id && l.completed && isSameDay(l.date, today)
    )).length,
    [habits, logs]
  );
  const bestStreak = useMemo(
    () => habits.reduce((m, h) => Math.max(m, streakFor(logs, h.id)), 0),
    [habits, logs]
  );

  async function toggleToday(h) {
    const t = today.getTime();
    const existing = logs.find(
      (l) => l.habitId === h.id && startOfDay(l.date).getTime() === t
    );
    if (existing) await remove("habitLogs", existing.id);
    else
      await upsert("habitLogs", {
        id: uuid(),
        habitId: h.id,
        date: new Date().toISOString(),
        completed: true,
      });
  }

  return html`
    <section class="screen">
      <header class="hero compact">
        <h1>Habits</h1>
        <p class="hero-sub">${habits.length} active</p>
      </header>

      <div class="stat-grid">
        <div class="stat-tile" style="--c:#10B981"><small>Done today</small><strong>${doneToday}/${habits.length}</strong></div>
        <div class="stat-tile" style="--c:#F59E0B"><small>Best streak</small><strong>${bestStreak}🔥</strong></div>
        <div class="stat-tile" style="--c:#3B82F6"><small>Active</small><strong>${habits.length}</strong></div>
      </div>

      ${habits.length === 0
        ? html`<div class="card empty">
            <p>Build your first habit. Tiny, daily, sustainable.</p>
            <button class="btn-primary" onClick=${() => openSheet({ type: "habit" })}>Add habit</button>
          </div>`
        : habits.map((h) => html`
            <div class="card habit-card" style=${`--c:${h.color}`} key=${h.id}>
              <div class="habit-row">
                <span class="habit-bubble">${h.icon || "✓"}</span>
                <button class="habit-info" onClick=${() => openSheet({ type: "habit", habit: h })}>
                  <strong>${h.name}</strong>
                  <small class="muted">
                    ${completionsThisWeek(logs, h.id)}/${h.targetPerWeek || 7} this week · 🔥 ${streakFor(logs, h.id)}
                  </small>
                </button>
                <button class=${`check ${logs.some((l) => l.habitId === h.id && isSameDay(l.date, today)) ? "done" : ""}`}
                        onClick=${() => toggleToday(h)} aria-label="toggle">
                  ${logs.some((l) => l.habitId === h.id && isSameDay(l.date, today)) ? "✓" : ""}
                </button>
              </div>
              <div class="habit-strip-mini">
                ${Array.from({ length: 14 }, (_, i) => addDays(today, -(13 - i))).map((day) => {
                  const done = logs.some(
                    (l) => l.habitId === h.id && l.completed && isSameDay(l.date, day)
                  );
                  return html`<span class=${`cell ${done ? "on" : ""}`} key=${day.toISOString()}></span>`;
                })}
              </div>
              <${HabitHeatmap} habit=${h} logs=${logs} />
            </div>
          `)}

      <button class="fab" onClick=${() => openSheet({ type: "habit" })} aria-label="new habit">＋</button>
    </section>
  `;
}

function HabitHeatmap({ habit, logs }) {
  const today = startOfDay(new Date());
  const cols = 12;
  const rows = 7;
  const total = cols * rows;
  const start = addDays(today, -(total - 1));
  const cells = Array.from({ length: total }, (_, i) => addDays(start, i));

  return html`
    <div class="heatmap">
      ${Array.from({ length: rows }, (_, row) => html`
        <div class="heat-row" key=${row}>
          ${Array.from({ length: cols }, (_, col) => {
            const idx = col * rows + row;
            const d = cells[idx];
            if (!d) return html`<span class="heat-cell ghost"></span>`;
            const done = logs.some(
              (l) => l.habitId === habit.id && l.completed && isSameDay(l.date, d)
            );
            return html`<span class=${`heat-cell ${done ? "on" : ""}`} key=${idx}></span>`;
          })}
        </div>
      `)}
    </div>
  `;
}
