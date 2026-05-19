import { html, useState, useMemo } from "../lib/ui.js";
import { state, upsert } from "../lib/store.js";
import {
  uuid, fmtDate, startOfWeek, startOfMonth, addDays, isSameDay, startOfDay,
  streakFor, categoryFor,
} from "../lib/utils.js";
import { aiEnabled, ask } from "../lib/ai.js";

export function ReviewsView() {
  const [scope, setScope] = useState("week");
  const today = new Date();
  const start = scope === "week" ? startOfWeek(today) : startOfMonth(today);
  const end = scope === "week" ? addDays(start, 7) : addDays(startOfMonth(addDays(start, 32)), 0);

  const tasks = state.tasks.value;
  const habitLogs = state.habitLogs.value;
  const habits = state.habits.value;
  const moods = state.moods.value;
  const entries = state.entries.value;
  const meals = state.meals.value;
  const workouts = state.workouts.value;
  const hobbyLogs = state.hobbyLogs.value;
  const reviews = state.reviews.value;

  const inRange = (d) => new Date(d) >= start && new Date(d) < end;

  const tasksInRange = tasks.filter((t) => inRange(t.dueDate));
  const completed = tasksInRange.filter((t) => t.completed);
  const moodsInRange = moods.filter((m) => inRange(m.date));
  const avgMood = moodsInRange.length ? (moodsInRange.reduce((s, m) => s + m.score, 0) / moodsInRange.length) : 0;
  const avgEnergy = moodsInRange.length ? (moodsInRange.reduce((s, m) => s + m.energy, 0) / moodsInRange.length) : 0;
  const mealsInRange = meals.filter((m) => inRange(m.date));
  const workoutsInRange = workouts.filter((w) => inRange(w.date));
  const hobbiesInRange = hobbyLogs.filter((h) => inRange(h.date));
  const entriesInRange = entries.filter((e) => inRange(e.date));
  const resetsInRange = reviews.filter((r) => r.kind === "reset" && inRange(r.date));

  const topHabits = useMemo(() => {
    return habits.map((h) => {
      const count = habitLogs.filter((l) => l.habitId === h.id && l.completed && inRange(l.date)).length;
      return { h, count };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [habits, habitLogs, start, end]);

  const topCategories = useMemo(() => {
    const counts = {};
    for (const t of completed) {
      const cat = t.category || "personal";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [completed]);

  const wins = useMemo(() => {
    const list = [];
    if (completed.length) list.push(`Finished ${completed.length} task${completed.length === 1 ? "" : "s"}`);
    if (workoutsInRange.length) list.push(`${workoutsInRange.length} workout${workoutsInRange.length === 1 ? "" : "s"} logged`);
    if (hobbiesInRange.length) list.push(`${hobbiesInRange.length} hobby session${hobbiesInRange.length === 1 ? "" : "s"} for joy`);
    if (mealsInRange.length) list.push(`${mealsInRange.length} meals tracked`);
    if (entriesInRange.length) list.push(`${entriesInRange.length} journal entr${entriesInRange.length === 1 ? "y" : "ies"}`);
    if (avgMood) list.push(`Average mood ${avgMood.toFixed(1)}/10`);
    return list;
  }, [completed, workoutsInRange, hobbiesInRange, mealsInRange, entriesInRange, avgMood]);

  const friction = useMemo(() => {
    const list = [];
    const skipped = tasksInRange.filter((t) => !t.completed && new Date(t.dueDate) < today);
    if (skipped.length) list.push(`${skipped.length} task${skipped.length === 1 ? "" : "s"} carried over — worth pruning?`);
    if (avgEnergy < 4 && moodsInRange.length >= 3) list.push("Low energy showed up often — earlier sleep this week?");
    if (resetsInRange.length >= 2) list.push(`Reset mode used ${resetsInRange.length}× — what's the recurring overwhelm?`);
    if (hobbiesInRange.length === 0) list.push("Zero hobby sessions — your joy column was empty.");
    return list;
  }, [tasksInRange, avgEnergy, moodsInRange, resetsInRange, hobbiesInRange]);

  const [aiSummary, setAiSummary] = useState("");
  const [busy, setBusy] = useState(false);
  async function makeAiSummary() {
    if (!aiEnabled()) { alert("Connect ChatGPT in Settings → Integrations."); return; }
    setBusy(true);
    try {
      const text = await ask({
        system: "You write a kind, observant weekly review for a calm life-OS app. 4 sections in markdown: Wins, Patterns, Friction, One useful upgrade. Be specific, never shame.",
        user: `Scope: ${scope}. Tasks completed: ${completed.length}/${tasksInRange.length}. Workouts: ${workoutsInRange.length}. Hobbies: ${hobbiesInRange.length}. Avg mood ${avgMood.toFixed(1)}, avg energy ${avgEnergy.toFixed(1)}. Resets: ${resetsInRange.length}. Top habits: ${topHabits.map((x) => x.h.name + " x" + x.count).join(", ")}.`,
      });
      setAiSummary(text);
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  }

  return html`
    <section class="screen">
      <header class="hero">
        <p class="hero-date">Reviews</p>
        <h1>Patterns & upgrades</h1>
        <p class="hero-sub">A kind look at what happened. Wins, friction, one upgrade.</p>
      </header>

      <div class="segmented">
        <button class=${`seg ${scope === "week" ? "active" : ""}`} onClick=${() => setScope("week")}>This week</button>
        <button class=${`seg ${scope === "month" ? "active" : ""}`} onClick=${() => setScope("month")}>This month</button>
      </div>

      <div class="stat-grid four">
        <div class="stat-tile" style="--c:#8FB89C"><small>Tasks done</small><strong>${completed.length}</strong></div>
        <div class="stat-tile" style="--c:#D4A574"><small>Workouts</small><strong>${workoutsInRange.length}</strong></div>
        <div class="stat-tile" style="--c:#A88BB8"><small>Hobbies</small><strong>${hobbiesInRange.length}</strong></div>
        <div class="stat-tile" style="--c:#C77B7B"><small>Avg mood</small><strong>${avgMood ? avgMood.toFixed(1) : "—"}</strong></div>
      </div>

      <div class="card review-block">
        <h3>Wins</h3>
        <ul class="review-list">${wins.length ? wins.map((w) => html`<li key=${w}>${w}</li>`) : html`<li class="muted">Quiet week. That counts too.</li>`}</ul>
      </div>

      <div class="card review-block">
        <h3>Patterns</h3>
        <ul class="review-list">
          ${topHabits.length === 0
            ? html`<li class="muted">No habits tracked yet.</li>`
            : topHabits.map(({ h, count }) => html`<li key=${h.id}>${h.icon || "·"} ${h.name} — ${count}×</li>`)}
          ${topCategories.length > 0 && html`<li>Most time in: ${topCategories.map(([c, n]) => `${categoryFor(c).icon} ${categoryFor(c).label} (${n})`).join(" · ")}</li>`}
        </ul>
      </div>

      <div class="card review-block">
        <h3>Friction</h3>
        <ul class="review-list">${friction.length ? friction.map((f) => html`<li key=${f}>${f}</li>`) : html`<li class="muted">No major friction noted.</li>`}</ul>
      </div>

      <div class="card review-block">
        <h3>AI summary</h3>
        <button class="btn-primary small" onClick=${makeAiSummary} disabled=${busy || !aiEnabled()}>${busy ? "Thinking…" : "Generate kind review"}</button>
        ${aiSummary && html`<div class="prompt-inline" style="margin-top:10px;white-space:pre-wrap;">${aiSummary}</div>`}
      </div>
    </section>
  `;
}
