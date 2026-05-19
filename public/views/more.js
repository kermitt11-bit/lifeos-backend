import { html } from "../lib/ui.js";
import { state } from "../lib/store.js";

const TILES = [
  { id: "habits",   icon: "✅", label: "Habits",   color: "#8FB89C", sub: "Streaks · weekly target" },
  { id: "health",   icon: "❤️", label: "Health",   color: "#C77B7B", sub: "Water · sleep · steps" },
  { id: "hobbies",  icon: "🎨", label: "Hobbies",  color: "#C98863", sub: "Joy engine · 5-min starts" },
  { id: "reset",    icon: "🌿", label: "Reset",    color: "#A88BB8", sub: "When you're off track" },
  { id: "reviews",  icon: "📊", label: "Reviews",  color: "#7B92AE", sub: "Weekly · monthly patterns" },
  { id: "journal",  icon: "📓", label: "Journal",  color: "#D4A574", sub: "Mood · gratitude · prompts" },
  { id: "goals",    icon: "🎯", label: "Goals",    color: "#C77B7B", sub: "Timeframes · milestones" },
  { id: "settings", icon: "⚙",  label: "Settings", color: "#B59E9E", sub: "Theme · integrations · data" },
];

export function MoreView({ goTab, openSettings }) {
  const userName = state.userName.value;
  return html`
    <section class="screen">
      <header class="hero">
        <p class="hero-date">Modules</p>
        <h1>Everything else</h1>
        <p class="hero-sub">All 10 pillars are here. Pick what you need today.</p>
      </header>

      <div class="hub-grid">
        ${TILES.map((t) => html`
          <button class="hub-tile" key=${t.id} style=${`--c:${t.color}`}
                  onClick=${() => t.id === "settings" ? openSettings() : goTab(t.id)}>
            <span class="hub-ico">${t.icon}</span>
            <strong>${t.label}</strong>
            <small>${t.sub}</small>
          </button>
        `)}
      </div>

      <div class="card" style="text-align:center;">
        <p class="serif" style="font-size:18px;">Make it easier to start, easier to continue, easier to recover.</p>
        <small class="muted">${userName ? `For you, ${userName}.` : "For you."}</small>
      </div>
    </section>
  `;
}
