import { html, useState, useMemo } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import {
  startOfDay, startOfWeek, addDays, isSameDay,
  fmtDate, categoryFor, priorityFor, uuid,
} from "../lib/utils.js";

export function PlannerView({ openSheet }) {
  const tasks = state.tasks.value;
  const presetBlocks = state.presetBlocks.value;
  const actualBlocks = state.actualBlocks.value;
  const [selected, setSelected] = useState(startOfDay(new Date()));
  const [mode, setMode] = useState("timeline"); // timeline | tasks

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

  const presetDay = useMemo(() => presetBlocks.filter((b) => isSameDay(b.date, selected)).sort((a, b) => a.startMin - b.startMin), [presetBlocks, selected]);
  const actualDay = useMemo(() => actualBlocks.filter((b) => isSameDay(b.date, selected)).sort((a, b) => a.startMin - b.startMin), [actualBlocks, selected]);

  const done = dayTasks.filter((t) => t.completed).length;
  const highPri = dayTasks.filter((t) => t.priority >= 2).length;
  const presetCount = presetDay.length;
  const presetDone = actualDay.filter((a) => a.completed).length;

  async function toggleTask(t) {
    await upsert("tasks", {
      ...t, completed: !t.completed,
      completedAt: !t.completed ? new Date().toISOString() : null,
    });
  }

  async function applyPreset() {
    // Seed today's preset from a generic template if empty
    if (presetDay.length > 0) return;
    const seed = [
      { startMin: 7 * 60,  endMin: 7 * 60 + 30,  title: "Wake & water",        category: "health",   icon: "💧" },
      { startMin: 7 * 60 + 30, endMin: 8 * 60,  title: "Breakfast",            category: "health",   icon: "🥣" },
      { startMin: 8 * 60,  endMin: 9 * 60,      title: "Move (15-20 min)",     category: "health",   icon: "🏃" },
      { startMin: 9 * 60,  endMin: 12 * 60,     title: "Deep work",            category: "work",     icon: "🧠" },
      { startMin: 12 * 60, endMin: 12 * 60 + 45,title: "Lunch",                category: "health",   icon: "🥗" },
      { startMin: 13 * 60, endMin: 17 * 60,     title: "Meetings & admin",     category: "work",     icon: "💼" },
      { startMin: 17 * 60, endMin: 18 * 60,     title: "Hobby slot",           category: "creative", icon: "🎨" },
      { startMin: 18 * 60, endMin: 19 * 60,     title: "Dinner",               category: "health",   icon: "🍽️" },
      { startMin: 21 * 60, endMin: 22 * 60,     title: "Wind down + journal",  category: "personal", icon: "📓" },
    ];
    for (const b of seed) {
      await upsert("presetBlocks", { id: uuid(), date: selected.toISOString(), ...b });
    }
  }

  async function setActualState(preset, action) {
    // action: completed | skipped | replace
    const existing = actualBlocks.find((a) => a.presetId === preset.id && isSameDay(a.date, selected));
    if (action === "completed") {
      await upsert("actualBlocks", {
        id: existing?.id || uuid(),
        date: selected.toISOString(),
        presetId: preset.id,
        startMin: preset.startMin, endMin: preset.endMin,
        title: preset.title, category: preset.category, icon: preset.icon,
        completed: true, skipped: false, notes: existing?.notes || "",
      });
    } else if (action === "skipped") {
      await upsert("actualBlocks", {
        id: existing?.id || uuid(),
        date: selected.toISOString(),
        presetId: preset.id,
        startMin: preset.startMin, endMin: preset.endMin,
        title: preset.title, category: preset.category, icon: preset.icon,
        completed: false, skipped: true, notes: existing?.notes || "",
      });
    } else if (action === "clear") {
      if (existing) await remove("actualBlocks", existing.id);
    }
  }

  return html`
    <section class="screen">
      <div class="week-head">
        <strong style="font-family:var(--serif);font-size:20px;">${selected.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
        <button class="link" onClick=${() => setSelected(startOfDay(new Date()))}>Today</button>
      </div>

      <div class="week-strip">
        ${weekDays.map((d) => {
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          const hasPlan = presetBlocks.some((b) => isSameDay(b.date, d));
          return html`
            <button class=${`day-cell ${isSel ? "selected" : ""} ${isToday ? "today" : ""}`}
                    onClick=${() => setSelected(d)} key=${d.toISOString()}>
              <small>${d.toLocaleDateString(undefined, { weekday: "narrow" })}</small>
              <strong>${d.getDate()}</strong>
              ${hasPlan && html`<span class="pulse"></span>`}
            </button>
          `;
        })}
      </div>

      <div class="segmented">
        <button class=${`seg ${mode === "timeline" ? "active" : ""}`} onClick=${() => setMode("timeline")}>Day</button>
        <button class=${`seg ${mode === "tasks" ? "active" : ""}`}    onClick=${() => setMode("tasks")}>Tasks</button>
      </div>

      <div class="stat-grid">
        <div class="stat-tile" style="--c:#8FB89C">
          <small>Tasks done</small><strong>${done}/${dayTasks.length}</strong>
        </div>
        <div class="stat-tile" style="--c:#C77B7B">
          <small>Plan progress</small><strong>${presetDone}/${presetCount}</strong>
        </div>
        <div class="stat-tile" style="--c:#D4A574">
          <small>High priority</small><strong>${highPri}</strong>
        </div>
      </div>

      ${mode === "timeline"
        ? html`<${Timeline}
            selected=${selected} presetDay=${presetDay} actualDay=${actualDay}
            onApplyPreset=${applyPreset}
            onSet=${setActualState}
            openSheet=${openSheet}
          />`
        : html`<${TaskList} dayTasks=${dayTasks} selected=${selected} openSheet=${openSheet} toggleTask=${toggleTask} />`}
    </section>
  `;
}

function Timeline({ selected, presetDay, actualDay, onApplyPreset, onSet, openSheet }) {
  return html`
    <div class="block">
      <div class="block-head">
        <h2>${fmtDate(selected, { weekday: "long", month: "short", day: "numeric" })}</h2>
        <div style="display:flex;gap:6px;">
          <button class="btn-secondary small" onClick=${onApplyPreset}>Use preset</button>
          <button class="btn-primary small" onClick=${() => openSheet({ type: "block", defaultDate: selected.toISOString() })}>+ Block</button>
        </div>
      </div>
      ${presetDay.length === 0
        ? html`<div class="card empty">
            <span class="empty-ico">📓</span>
            <p>No preset for this day yet.</p>
            <small class="muted">Your original plan stays visible even after you move things around.</small>
            <button class="btn-primary small" onClick=${onApplyPreset}>Use a starter preset</button>
          </div>`
        : html`<div class="timeline">
            ${presetDay.map((p) => {
              const a = actualDay.find((x) => x.presetId === p.id);
              const skipped = a?.skipped;
              const done = a?.completed;
              return html`
                <div class=${`tl-row preset ${skipped ? "skipped" : ""}`} key=${`p${p.id}`}>
                  <div class="tl-time">${minToHM(p.startMin)}<small>preset</small></div>
                  <div>
                    <div class="tl-title">${p.icon || "·"} ${p.title}</div>
                    <div class="tl-meta">
                      <small>${minToHM(p.startMin)}–${minToHM(p.endMin)}</small>
                      ${skipped ? html`<span class="chip" style="--c:#B85A5A">skipped</span>` :
                        done ? html`<span class="chip" style="--c:#8FB89C">done</span>` :
                        html`<span class="chip outline">planned</span>`}
                    </div>
                  </div>
                  <div class="tl-actions">
                    <button class="icon-btn bare" title="Done" onClick=${() => onSet(p, "completed")}>✓</button>
                    <button class="icon-btn bare" title="Skip" onClick=${() => onSet(p, "skipped")}>⤳</button>
                    <button class="icon-btn bare" title="Replace" onClick=${() => openSheet({ type: "block", defaultDate: selected.toISOString(), replaces: p })}>↺</button>
                    <button class="icon-btn bare" title="Clear" onClick=${() => onSet(p, "clear")}>×</button>
                  </div>
                </div>
                ${a && a.title && a.title !== p.title && !a.skipped && html`
                  <div class="tl-row actual" key=${`a${a.id}`}>
                    <div class="tl-time">${minToHM(a.startMin)}<small>actual</small></div>
                    <div>
                      <div class="tl-title">${a.icon || "·"} ${a.title}</div>
                      <div class="tl-meta">
                        <small>${minToHM(a.startMin)}–${minToHM(a.endMin)}</small>
                        <span class="chip" style="--c:#C77B7B">replaced</span>
                      </div>
                    </div>
                    <div></div>
                  </div>
                `}
              `;
            })}
            ${actualDay.filter((a) => !a.presetId).map((a) => html`
              <div class="tl-row actual" key=${`b${a.id}`}>
                <div class="tl-time">${minToHM(a.startMin)}<small>added</small></div>
                <div>
                  <div class="tl-title">${a.icon || "·"} ${a.title}</div>
                  <div class="tl-meta"><small>${minToHM(a.startMin)}–${minToHM(a.endMin)}</small><span class="chip" style="--c:#A88BB8">new</span></div>
                </div>
                <div></div>
              </div>
            `)}
          </div>`}
      <p class="muted small">Originals never disappear — they fade with a strikethrough so you always see what you planned vs what happened.</p>
    </div>
  `;
}

function TaskList({ dayTasks, selected, openSheet, toggleTask }) {
  return html`
    <div class="block">
      <div class="block-head">
        <h2>Tasks for ${fmtDate(selected, { month: "short", day: "numeric" })}</h2>
        <button class="btn-primary small" onClick=${() => openSheet({ type: "task", defaultDate: selected.toISOString() })}>+ Task</button>
      </div>
      ${dayTasks.length === 0
        ? html`<div class="card empty"><p>Nothing scheduled. Add a task or use the timeline preset.</p></div>`
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
              </div>
            `;
          })}
    </div>
  `;
}

function minToHM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}
