import { html, useMemo } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import {
  greeting, fmtDate, moodEmoji, randomPrompt,
  isSameDay, startOfDay, categoryFor, priorityFor, streakFor, uuid,
} from "../lib/utils.js";
import { dateKey, findNextSlot, slotFor } from "../lib/meals.js";
import { tap, success } from "../lib/haptic.js";

export function TodayView({ openSheet }) {
  const today = new Date();
  const userName = state.userName.value;
  const tasks = state.tasks.value;
  const habits = state.habits.value;
  const habitLogs = state.habitLogs.value;
  const entries = state.entries.value;
  const moods = state.moods.value;

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

  const todayPlan = state.mealPlans.value.find((p) => p.id === dateKey(today));
  const nextMeal = todayPlan ? findNextSlot(todayPlan, new Date()) : null;

  const completedCount = todayTasks.filter((t) => t.completed).length;

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
    if (existing) {
      tap();
      await remove("habitLogs", existing.id);
    } else {
      success();
      await upsert("habitLogs", {
        id: uuid(),
        habitId: h.id,
        date: new Date().toISOString(),
        completed: true,
      });
    }
  }

  return html`
    <section class="screen">
      <header class="hero">
        <p class="hero-date">${fmtDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>${greeting(userName)}</h1>
        <p class="hero-sub">
          ${todayEntry ? `You journaled today ${moodEmoji(todayEntry.moodScore)}` : "Make today count."}
        </p>
      </header>

      <div class="quick-grid">
        <button class="quick" style="--c:#7C3AED" onClick=${() => openSheet({ type: "task" })}>
          <span class="quick-ico">＋</span>
          <span>New task</span>
        </button>
        <button class="quick" style="--c:#3B82F6" onClick=${() => openSheet({ type: "journal" })}>
          <span class="quick-ico">📓</span>
          <span>Journal</span>
        </button>
        <button class="quick" style="--c:#F59E0B" onClick=${() => openSheet({ type: "mood" })}>
          <span class="quick-ico">${moodEmoji(latestMood?.score ?? 6)}</span>
          <span>Mood</span>
        </button>
      </div>

      ${nextMeal && nextMeal.meal && html`
        <div class="card next-meal" style=${`--c:${nextMeal.slot.color}`}>
          <div class="next-meal-head">
            <span>${nextMeal.slot.icon} Next: ${nextMeal.slot.label}</span>
            <strong>${nextMeal.meal.time}</strong>
          </div>
          <div class="next-meal-body">
            <strong>${nextMeal.meal.name}</strong>
            <small class="muted">${nextMeal.meal.minutes}m · ${nextMeal.meal.ingredients.length} ingredients</small>
          </div>
        </div>
      `}

      <button class="card mood-card" onClick=${() => openSheet({ type: "mood" })}>
        <span class="mood-emoji">${moodEmoji(latestMood?.score ?? 6)}</span>
        <div class="mood-text">
          <strong>${moodToday ? "Today's mood logged" : "How are you feeling?"}</strong>
          <small>${moodToday
            ? `Mood ${latestMood.score}/10 · Energy ${latestMood.energy}/10`
            : "Tap to log a quick mood check-in"}</small>
        </div>
        <span class="chev">›</span>
      </button>

      <section class="block">
        <div class="block-head">
          <h2>Today's tasks</h2>
          <span class="muted">${completedCount}/${todayTasks.length} done</span>
        </div>
        ${todayTasks.length === 0
          ? html`<div class="card empty">
              <p>No tasks for today.</p>
              <button class="btn-primary" onClick=${() => openSheet({ type: "task" })}>Add task</button>
            </div>`
          : todayTasks.slice(0, 6).map((t) => html`
              <${TaskRow} key=${t.id} task=${t} onToggle=${() => toggleTask(t)} onOpen=${() => openSheet({ type: "task", task: t })} />
            `)}
      </section>

      ${overdue.length > 0 && html`
        <section class="block">
          <div class="block-head">
            <h2>Overdue</h2>
            <span class="muted">${overdue.length} to reschedule</span>
          </div>
          ${overdue.slice(0, 3).map((t) => html`
            <${TaskRow} key=${t.id} task=${t} onToggle=${() => toggleTask(t)} onOpen=${() => openSheet({ type: "task", task: t })} overdue />
          `)}
        </section>
      `}

      <button class="card prompt-card" onClick=${() => openSheet({ type: "journal" })}>
        <div class="prompt-head">
          <span class="sparkle">✨</span>
          <span>Reflection prompt</span>
        </div>
        <p class="prompt-body">${prompt}</p>
        <span class="prompt-cta">
          ${todayEntry ? "Open today's entry" : "Write today's entry"} →
        </span>
      </button>

      <section class="block">
        <div class="block-head">
          <h2>Habits</h2>
          <span class="muted">Tap to mark complete</span>
        </div>
        ${habits.length === 0
          ? html`<div class="card empty">
              <p>No habits yet. Add one from the Habits tab.</p>
            </div>`
          : html`<div class="habit-strip">
              ${habits.map((h) => {
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
