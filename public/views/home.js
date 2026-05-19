import { html, useMemo } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import {
  greeting, fmtDate, moodEmoji, randomPrompt,
  isSameDay, startOfDay, categoryFor, priorityFor, streakFor, uuid,
  sumWater, lastSleep, todaySteps, energyLabel,
} from "../lib/utils.js";
import { tap, success } from "../lib/haptic.js";

export function HomeView({ openSheet, goTab }) {
  const today = new Date();
  const userName = state.userName.value;
  const tasks = state.tasks.value;
  const habits = state.habits.value;
  const habitLogs = state.habitLogs.value;
  const entries = state.entries.value;
  const moods = state.moods.value;
  const healthLogs = state.healthLogs.value;
  const meals = state.meals.value;
  const workouts = state.workouts.value;
  const presetBlocks = state.presetBlocks.value;
  const actualBlocks = state.actualBlocks.value;

  const todayTasks = useMemo(() =>
    tasks
      .filter((t) => isSameDay(t.dueDate, today))
      .sort((a, b) => (a.completed - b.completed) || (b.priority - a.priority)),
    [tasks]
  );
  const overdue = useMemo(() =>
    tasks
      .filter((t) => !t.completed && startOfDay(t.dueDate) < startOfDay(today))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [tasks]
  );

  const todayEntry = entries.find((e) => isSameDay(e.date, today));
  const latestMood = moods[moods.length - 1];
  const moodToday = latestMood && isSameDay(latestMood.date, today);
  const prompt = useMemo(() => randomPrompt(), [entries.length]);

  const completedCount = todayTasks.filter((t) => t.completed).length;
  const taskPct = todayTasks.length ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  const todayMeals = meals.filter((m) => isSameDay(m.date, today));
  const todayWorkout = workouts.find((w) => isSameDay(w.date, today));
  const todayPreset  = presetBlocks.filter((b) => isSameDay(b.date, today)).sort((a,b) => a.startMin - b.startMin);
  const todayActual  = actualBlocks.filter((b) => isSameDay(b.date, today)).sort((a,b) => a.startMin - b.startMin);

  const water = sumWater(healthLogs, today);
  const waterTarget = state.waterTargetMl.value;
  const sleep = lastSleep(healthLogs, today);
  const sleepHours = sleep ? Number(sleep.amount) || 0 : 0;
  const sleepTarget = state.sleepTargetHours.value;
  const steps = todaySteps(healthLogs, today);
  const stepsTarget = state.stepsTarget.value;

  const nextAction = useMemo(() => {
    const incomplete = todayTasks.find((t) => !t.completed);
    if (incomplete) return { label: incomplete.title, kind: "task", payload: incomplete };
    const nextPreset = todayPreset.find((p) => !todayActual.some((a) => a.presetId === p.id && (a.completed || a.skipped)));
    if (nextPreset) return { label: nextPreset.title, kind: "block", payload: nextPreset };
    return null;
  }, [todayTasks, todayPreset, todayActual]);

  async function toggleTask(t) {
    if (!t.completed) success(); else tap();
    await upsert("tasks", {
      ...t,
      completed: !t.completed,
      completedAt: !t.completed ? new Date().toISOString() : null,
    });
  }

  async function toggleHabit(h) {
    const todayMs = startOfDay(today).getTime();
    const existing = habitLogs.find(
      (l) => l.habitId === h.id && startOfDay(l.date).getTime() === todayMs
    );
    if (existing) { tap(); await remove("habitLogs", existing.id); }
    else {
      success();
      await upsert("habitLogs", { id: uuid(), habitId: h.id, date: new Date().toISOString(), completed: true });
    }
  }

  async function addWater(ml) {
    success();
    await upsert("healthLogs", { id: uuid(), kind: "water", amount: ml, date: new Date().toISOString() });
  }

  return html`
    <section class="screen">
      <header class="hero">
        <p class="hero-date">${fmtDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>${greeting(userName)}</h1>
        <p class="hero-sub">
          ${todayEntry
            ? html`You journaled today ${moodEmoji(todayEntry.moodScore)} · keep it gentle.`
            : "Take it one calm step at a time."}
        </p>
      </header>

      ${nextAction && html`
        <button class="card flat" style="background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, var(--surface)), var(--surface));" onClick=${() => nextAction.kind === "task" ? openSheet({ type: "task", task: nextAction.payload }) : goTab("planner")}>
          <span class="eyebrow">Next best step</span>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:6px;">
            <strong style="font-size:18px;">${nextAction.label}</strong>
            <span class="chev">›</span>
          </div>
        </button>
      `}

      <div class="quick-grid">
        <button class="quick" style="--c:#C77B7B" onClick=${() => openSheet({ type: "task" })}>
          <span class="quick-ico">＋</span><span>Task</span>
        </button>
        <button class="quick" style="--c:#8FB89C" onClick=${() => goTab("food")}>
          <span class="quick-ico">🥗</span><span>Eat</span>
        </button>
        <button class="quick" style="--c:#D4A574" onClick=${() => goTab("move")}>
          <span class="quick-ico">🏃</span><span>Move</span>
        </button>
        <button class="quick" style="--c:#A88BB8" onClick=${() => openSheet({ type: "mood" })}>
          <span class="quick-ico">${moodEmoji(latestMood?.score ?? 6)}</span><span>Mood</span>
        </button>
      </div>

      <div class="ring-grid">
        <${Ring} label="Water"  unit=${`${water} / ${waterTarget} ml`}  pct=${water / waterTarget} color="#7B92AE" emoji="💧"
                 onTap=${() => addWater(250)} />
        <${Ring} label="Sleep"  unit=${`${sleepHours.toFixed(1)} / ${sleepTarget}h`} pct=${sleepHours / sleepTarget} color="#A88BB8" emoji="🌙"
                 onTap=${() => goTab("health")} />
        <${Ring} label="Steps"  unit=${`${steps.toLocaleString()} / ${stepsTarget.toLocaleString()}`} pct=${steps / stepsTarget} color="#8FB89C" emoji="👣"
                 onTap=${() => goTab("health")} />
      </div>

      <button class="card mood-card" onClick=${() => openSheet({ type: "mood" })}>
        <span class="mood-emoji">${moodEmoji(latestMood?.score ?? 6)}</span>
        <div class="mood-text">
          <strong>${moodToday ? "Today's check-in" : "How are you feeling?"}</strong>
          <small>${moodToday
            ? `Mood ${latestMood.score}/10 · Energy ${energyLabel(latestMood.energy)}`
            : "Tap to log mood and energy"}</small>
        </div>
        <span class="chev">›</span>
      </button>

      <section class="block">
        <div class="block-head">
          <h2>Today</h2>
          <span class="muted">${completedCount}/${todayTasks.length} · ${taskPct}%</span>
        </div>
        ${todayTasks.length === 0
          ? html`<div class="card empty">
              <span class="empty-ico">🌿</span>
              <p>Nothing planned for today.</p>
              <button class="btn-primary small" onClick=${() => openSheet({ type: "task" })}>Add a gentle task</button>
            </div>`
          : todayTasks.slice(0, 5).map((t) => html`
              <${TaskRow} key=${t.id} task=${t} onToggle=${() => toggleTask(t)} onOpen=${() => openSheet({ type: "task", task: t })} />
            `)}
      </section>

      ${overdue.length > 0 && html`
        <section class="block">
          <div class="block-head">
            <h2>Carry over</h2>
            <span class="muted">${overdue.length} to move</span>
          </div>
          ${overdue.slice(0, 3).map((t) => html`
            <${TaskRow} key=${t.id} task=${t} onToggle=${() => toggleTask(t)} onOpen=${() => openSheet({ type: "task", task: t })} overdue />
          `)}
          <button class="link" onClick=${() => goTab("planner")}>Move to today →</button>
        </section>
      `}

      <div class="stat-grid two">
        <button class="card flat" style="--c:#8FB89C" onClick=${() => goTab("food")}>
          <span class="eyebrow" style="color:var(--c)">Today's food</span>
          <strong style="font-size:18px;display:block;margin-top:4px;">
            ${todayMeals.length === 0 ? "Plan a meal →" : `${todayMeals.length} logged`}
          </strong>
          <small class="muted">${todayMeals.reduce((s, m) => s + (m.kcal || 0), 0)} kcal</small>
        </button>
        <button class="card flat" style="--c:#D4A574" onClick=${() => goTab("move")}>
          <span class="eyebrow" style="color:var(--c)">Movement</span>
          <strong style="font-size:18px;display:block;margin-top:4px;">
            ${todayWorkout ? todayWorkout.name : "Pick a workout →"}
          </strong>
          <small class="muted">${todayWorkout ? `${todayWorkout.minutes} min · ${todayWorkout.energy}` : "Energy-aware suggestions"}</small>
        </button>
      </div>

      <button class="card prompt-card" onClick=${() => openSheet({ type: "journal" })}>
        <div class="prompt-head">
          <span class="sparkle">✨</span>
          <span>Reflection prompt</span>
        </div>
        <p class="prompt-body">${prompt}</p>
        <span class="prompt-cta">
          ${todayEntry ? "Open today's entry" : "Write tonight's entry"} →
        </span>
      </button>

      <section class="block">
        <div class="block-head">
          <h2>Habits</h2>
          <button class="link" onClick=${() => goTab("more")}>All →</button>
        </div>
        ${habits.length === 0
          ? html`<div class="card empty">
              <span class="empty-ico">🌱</span>
              <p>No habits yet. Pick one that supports tomorrow's version of you.</p>
              <button class="btn-secondary small" onClick=${() => openSheet({ type: "habit" })}>Add habit</button>
            </div>`
          : html`<div class="habit-strip">
              ${habits.slice(0, 8).map((h) => {
                const done = habitLogs.some(
                  (l) => l.habitId === h.id && isSameDay(l.date, today) && l.completed
                );
                const streak = streakFor(habitLogs, h.id);
                return html`
                  <button class=${`habit-chip ${done ? "done" : ""}`} key=${h.id}
                          style=${`--c:${h.color}`}
                          onClick=${() => toggleHabit(h)}>
                    <span class="habit-icon">${h.icon || "✓"}</span>
                    <span class="habit-name">${h.name}</span>
                    <small>🔥 ${streak}</small>
                  </button>
                `;
              })}
            </div>`}
      </section>
    </section>
  `;
}

function Ring({ label, unit, pct, color, emoji, onTap }) {
  const clamped = Math.max(0, Math.min(1, pct || 0));
  const r = 32, c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  return html`
    <button class="ring-card" style=${`--c:${color}`} onClick=${onTap}>
      <div class="ring">
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r=${r} class="ring-bg" fill="none" stroke-width="7"></circle>
          <circle cx="38" cy="38" r=${r} class="ring-fg" fill="none" stroke-width="7"
                  stroke-dasharray=${c} stroke-dashoffset=${offset}></circle>
        </svg>
        <div class="ring-num">${emoji}</div>
      </div>
      <div class="ring-label">${label}</div>
      <div class="ring-unit">${unit}</div>
    </button>
  `;
}

function TaskRow({ task, onToggle, onOpen, overdue }) {
  const cat = categoryFor(task.category);
  const pri = priorityFor(task.priority);
  return html`
    <div class="task-row">
      <button class=${`check ${task.completed ? "done" : ""}`} onClick=${onToggle} aria-label="toggle">
        ${task.completed ? "✓" : ""}
      </button>
      <button class="task-body" onClick=${onOpen}>
        <span class=${`task-title ${task.completed ? "strike" : ""}`}>${task.title}</span>
        <span class="task-meta">
          <span class="chip" style=${`--c:${cat.color}`}>${cat.icon} ${cat.label}</span>
          ${task.priority > 0 && html`<span class="chip ghost" style=${`--c:${pri.color}`}>${pri.label}</span>`}
          ${task.estimateMinutes ? html`<small class="muted">${task.estimateMinutes}m</small>` : null}
        </span>
      </button>
      ${overdue && html`<span class="badge danger">!</span>`}
    </div>
  `;
}
