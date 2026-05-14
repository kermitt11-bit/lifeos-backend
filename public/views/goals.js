import { html, useState } from "../lib/ui.js";
import { state } from "../lib/store.js";
import { GOAL_AREAS, GOAL_TIMEFRAMES, areaFor, diffDays, startOfDay } from "../lib/utils.js";

export function GoalsView({ openSheet }) {
  const goals = state.goals.value;
  const [filter, setFilter] = useState(null);

  const active = goals.filter((g) => !g.completed);
  const filtered = filter ? active.filter((g) => g.timeframe === filter) : active;
  const completed = goals.filter((g) => g.completed);

  return html`
    <section class="screen">
      <header class="hero compact">
        <h1>Goals</h1>
        <p class="hero-sub">${active.length} in motion · ${completed.length} done</p>
      </header>

      <div class="tag-row">
        <button class=${`pill ${!filter ? "active" : ""}`} onClick=${() => setFilter(null)}>All</button>
        ${GOAL_TIMEFRAMES.map((t) => html`
          <button class=${`pill ${filter === t.id ? "active" : ""}`}
                  onClick=${() => setFilter(filter === t.id ? null : t.id)}>${t.label}</button>
        `)}
      </div>

      ${active.length === 0
        ? html`<div class="card empty">
            <p>Set your first goal.</p>
            <button class="btn-primary" onClick=${() => openSheet({ type: "goal" })}>Add goal</button>
          </div>`
        : filtered.map((g) => html`<${GoalCard} goal=${g} openSheet=${openSheet} key=${g.id} />`)}

      ${completed.length > 0 && html`
        <div class="block">
          <div class="block-head"><h2>Completed</h2><span class="muted">${completed.length}</span></div>
          ${completed.map((g) => html`<${GoalCard} goal=${g} openSheet=${openSheet} key=${g.id} />`)}
        </div>
      `}

      <button class="fab" onClick=${() => openSheet({ type: "goal" })} aria-label="new goal">＋</button>
    </section>
  `;
}

function GoalCard({ goal, openSheet }) {
  const area = areaFor(goal.area);
  const days = diffDays(goal.targetDate, new Date());
  const daysText = days < 0 ? `${-days}d overdue` : days === 0 ? "Due today" : `${days}d left`;
  return html`
    <button class="card goal-card" onClick=${() => openSheet({ type: "goal", goal })}>
      <div class="goal-head">
        <span class="goal-ico">${area.icon}</span>
        <strong>${goal.title}</strong>
        ${goal.completed && html`<span class="badge success">✓</span>`}
      </div>
      ${goal.description && html`<p class="muted">${goal.description}</p>`}
      <div class="progress"><div class="progress-fill" style=${`width:${Math.round((goal.progress || 0) * 100)}%`}></div></div>
      <div class="goal-foot">
        <span class="pill small">${goal.timeframe}</span>
        <span class="pill small">${area.label}</span>
        <span class=${`muted ${days < 0 ? "danger" : ""}`}>${daysText}</span>
      </div>
    </button>
  `;
}
