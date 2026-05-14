import { html, useState, useMemo } from "../lib/ui.js";
import { state } from "../lib/store.js";
import { addDays, startOfDay, isSameDay, categoryFor, streakFor } from "../lib/utils.js";

const RANGES = [
  { id: 7, label: "7d" },
  { id: 30, label: "30d" },
  { id: 90, label: "90d" },
];

export function InsightsView({ openSheet }) {
  const [days, setDays] = useState(30);
  const tasks = state.tasks.value;
  const moods = state.moods.value;
  const entries = state.entries.value;
  const habits = state.habits.value;
  const logs = state.habitLogs.value;
  const goals = state.goals.value;

  const cutoff = useMemo(() => addDays(new Date(), -days), [days]);

  const inRange = (d) => new Date(d) >= cutoff;

  const moodSeries = useMemo(
    () => moods.filter((m) => inRange(m.date)).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [moods, cutoff]
  );
  const avgMood = moodSeries.length
    ? (moodSeries.reduce((s, m) => s + m.score, 0) / moodSeries.length).toFixed(1)
    : "–";

  const taskBuckets = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const day = addDays(startOfDay(new Date()), -(days - 1 - i));
      const dayTasks = tasks.filter((t) => isSameDay(t.dueDate, day));
      return {
        day,
        total: dayTasks.length,
        done: dayTasks.filter((t) => t.completed).length,
      };
    });
  }, [tasks, days]);

  const taskTotal = taskBuckets.reduce((s, b) => s + b.total, 0);
  const taskDone = taskBuckets.reduce((s, b) => s + b.done, 0);
  const taskPct = taskTotal ? Math.round((taskDone / taskTotal) * 100) : 0;

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      map.set(t.category, (map.get(t.category) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([id, n]) => ({ ...categoryFor(id), n }))
      .sort((a, b) => b.n - a.n);
  }, [tasks]);

  return html`
    <section class="screen">
      <header class="hero compact">
        <h1>Insights</h1>
        <p class="hero-sub">How you're doing</p>
      </header>

      <div class="segmented">
        ${RANGES.map((r) => html`
          <button class=${`seg ${r.id === days ? "active" : ""}`} onClick=${() => setDays(r.id)}>${r.label}</button>
        `)}
      </div>

      <div class="stat-grid two">
        <div class="stat-tile" style="--c:#F59E0B"><small>Avg mood</small><strong>${avgMood}</strong></div>
        <div class="stat-tile" style="--c:#10B981"><small>Task completion</small><strong>${taskPct}%</strong></div>
        <div class="stat-tile" style="--c:#3B82F6"><small>Journal entries</small><strong>${entries.filter((e) => inRange(e.date)).length}</strong></div>
        <div class="stat-tile" style="--c:#7C3AED"><small>Active habits</small><strong>${habits.length}</strong></div>
      </div>

      <div class="block">
        <div class="block-head"><h2>Mood trend</h2><small class="muted">Last ${days}d</small></div>
        ${moodSeries.length === 0
          ? html`<div class="card empty"><p>Log a mood to start seeing your trend.</p></div>`
          : html`<div class="card"><${Sparkline} points=${moodSeries.map((m) => m.score)} max=${10} color="#7C3AED" /></div>`}
      </div>

      <div class="block">
        <div class="block-head"><h2>Task completion</h2><small class="muted">Daily</small></div>
        ${taskTotal === 0
          ? html`<div class="card empty"><p>Add tasks to track completion.</p></div>`
          : html`<div class="card"><${BarChart} buckets=${taskBuckets} /></div>`}
      </div>

      <div class="block">
        <div class="block-head"><h2>Time by category</h2></div>
        ${byCategory.length === 0
          ? html`<div class="card empty"><p>Categorize your tasks to see this view.</p></div>`
          : html`<div class="card">
              ${byCategory.map((c) => html`
                <div class="bar-row" key=${c.id}>
                  <span class="bar-label">${c.icon} ${c.label}</span>
                  <div class="bar-track"><div class="bar-fill" style=${`width:${(c.n / byCategory[0].n) * 100}%;background:${c.color}`}></div></div>
                  <small class="muted">${c.n}</small>
                </div>
              `)}
            </div>`}
      </div>

      <div class="block">
        <div class="block-head"><h2>Habit consistency</h2></div>
        ${habits.length === 0
          ? html`<div class="card empty"><p>Add a habit to track consistency.</p></div>`
          : html`<div class="card">
              ${habits.map((h) => {
                const target = h.targetPerWeek || 7;
                const count = logs.filter((l) => l.habitId === h.id && l.completed && inRange(l.date)).length;
                const pct = Math.min(100, (count / (target * (days / 7))) * 100);
                return html`
                  <div class="bar-row" key=${h.id}>
                    <span class="bar-label">${h.icon || "✓"} ${h.name}</span>
                    <div class="bar-track"><div class="bar-fill" style=${`width:${pct}%;background:${h.color}`}></div></div>
                    <small class="muted">🔥 ${streakFor(logs, h.id)}</small>
                  </div>
                `;
              })}
            </div>`}
      </div>

      <div class="block">
        <div class="block-head"><h2>Goal progress</h2></div>
        ${goals.filter((g) => !g.completed).length === 0
          ? html`<div class="card empty"><p>Set a goal to see progress.</p></div>`
          : html`<div class="card">
              ${goals.filter((g) => !g.completed).map((g) => html`
                <div class="bar-row" key=${g.id}>
                  <span class="bar-label">${g.title}</span>
                  <div class="bar-track"><div class="bar-fill" style=${`width:${Math.round((g.progress || 0) * 100)}%`}></div></div>
                  <small class="muted">${Math.round((g.progress || 0) * 100)}%</small>
                </div>
              `)}
            </div>`}
      </div>
    </section>
  `;
}

function Sparkline({ points, max = 10, color = "#7C3AED" }) {
  const W = 320, H = 120, P = 8;
  if (points.length === 0) return html`<svg viewBox="0 0 ${W} ${H}" />`;
  const step = points.length > 1 ? (W - P * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => [P + i * step, H - P - (p / max) * (H - P * 2)]);
  const path = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${coords[coords.length - 1][0]},${H - P} L${coords[0][0]},${H - P} Z`;
  return html`
    <svg viewBox="0 0 ${W} ${H}" class="spark">
      <defs>
        <linearGradient id="sp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color=${color} stop-opacity="0.4" />
          <stop offset="100%" stop-color=${color} stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d=${area} fill="url(#sp-grad)" />
      <path d=${path} fill="none" stroke=${color} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
  `;
}

function BarChart({ buckets }) {
  const W = 320, H = 120, P = 6;
  const max = Math.max(1, ...buckets.map((b) => b.total));
  const barW = (W - P * 2) / buckets.length - 1;
  return html`
    <svg viewBox="0 0 ${W} ${H}" class="bars">
      ${buckets.map((b, i) => {
        const x = P + i * ((W - P * 2) / buckets.length);
        const totalH = (b.total / max) * (H - P * 2);
        const doneH = (b.done / max) * (H - P * 2);
        return html`
          <g key=${i}>
            <rect x=${x} y=${H - P - totalH} width=${barW} height=${totalH} fill="#10B98140" rx="2" />
            <rect x=${x} y=${H - P - doneH} width=${barW} height=${doneH} fill="#10B981" rx="2" />
          </g>
        `;
      })}
    </svg>
  `;
}
