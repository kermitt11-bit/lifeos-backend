import { html, useState, useMemo } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import {
  startOfDay, startOfWeek, addDays, isSameDay,
  fmtDate, categoryFor, priorityFor,
} from "../lib/utils.js";

export function PlannerView({ openSheet }) {
  const tasks = state.tasks.value;
  const [selected, setSelected] = useState(startOfDay(new Date()));

  const weekDays = useMemo(() => {
    const start = startOfWeek(selected);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  const dayTasks = useMemo(
    () =>
      tasks
        .filter((t) => isSameDay(t.dueDate, selected))
        .sort((a, b) => (a.completed - b.completed) || (b.priority - a.priority)),
    [tasks, selected]
  );

  const done = dayTasks.filter((t) => t.completed).length;
  const highPri = dayTasks.filter((t) => t.priority >= 2).length;

  async function toggleTask(t) {
    await upsert("tasks", {
      ...t,
      completed: !t.completed,
      completedAt: !t.completed ? new Date().toISOString() : null,
    });
  }

  return html`
    <section class="screen">
      <div class="week-head">
        <strong>${selected.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
        <button class="link" onClick=${() => setSelected(startOfDay(new Date()))}>Today</button>
      </div>
      <div class="week-strip">
        ${weekDays.map((d) => {
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          return html`
            <button class=${`day-cell ${isSel ? "selected" : ""} ${isToday ? "today" : ""}`}
                    onClick=${() => setSelected(d)} key=${d.toISOString()}>
              <small>${d.toLocaleDateString(undefined, { weekday: "narrow" })}</small>
              <strong>${d.getDate()}</strong>
            </button>
          `;
        })}
      </div>

      <div class="stat-grid">
        <div class="stat-tile" style="--c:#10B981">
          <small>Tasks done</small>
          <strong>${done}/${dayTasks.length}</strong>
        </div>
        <div class="stat-tile" style="--c:#3B82F6">
          <small>Total</small>
          <strong>${dayTasks.length}</strong>
        </div>
        <div class="stat-tile" style="--c:#F59E0B">
          <small>High priority</small>
          <strong>${highPri}</strong>
        </div>
      </div>

      <div class="block">
        <div class="block-head">
          <h2>${fmtDate(selected, { weekday: "long", month: "short", day: "numeric" })}</h2>
          <button class="btn-primary small" onClick=${() => openSheet({ type: "task", defaultDate: selected.toISOString() })}>+ Task</button>
        </div>
        ${dayTasks.length === 0
          ? html`<div class="card empty"><p>Nothing planned. Tap + Task to start.</p></div>`
          : dayTasks.map((t) => {
              const cat = categoryFor(t.category);
              const pri = priorityFor(t.priority);
              return html`
                <div class="task-row" key=${t.id}>
                  <button class=${`check ${t.completed ? "done" : ""}`} onClick=${() => toggleTask(t)} aria-label="toggle">
                    ${t.completed ? "✓" : ""}
                  </button>
                  <button class="task-body" onClick=${() => openSheet({ type: "task", task: t })}>
                    <span class=${`task-title ${t.completed ? "strike" : ""}`}>${t.title}</span>
                    <span class="task-meta">
                      <span class="chip" style=${`--c:${cat.color}`}>${cat.icon} ${cat.label}</span>
                      ${t.priority > 0 && html`<span class="chip ghost" style=${`--c:${pri.color}`}>${pri.label}</span>`}
                      ${t.estimateMinutes ? html`<small class="muted">${t.estimateMinutes}m</small>` : null}
                    </span>
                  </button>
                  <button class="icon-btn" onClick=${() => remove("tasks", t.id)} title="delete">🗑</button>
                </div>
              `;
            })}
      </div>
    </section>
  `;
}
