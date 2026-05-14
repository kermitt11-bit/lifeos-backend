import { html, render, useState, useEffect } from "/lib/ui.js";
import { state, load, setKV } from "/lib/store.js";
import { TodayView } from "/views/today.js";
import { PlannerView } from "/views/planner.js";
import { JournalView } from "/views/journal.js";
import { HabitsView } from "/views/habits.js";
import { GoalsView } from "/views/goals.js";
import { InsightsView } from "/views/insights.js";
import { SettingsView } from "/views/settings.js";
import { Sheet } from "/views/sheets.js";
import { moodEmoji } from "/lib/utils.js";
import { shouldShowIOSHint, dismissIOSHint } from "/lib/install.js";

const TABS = [
  { id: "today",    label: "Today",    icon: "☀️" },
  { id: "planner",  label: "Planner",  icon: "🗓" },
  { id: "journal",  label: "Journal",  icon: "📓" },
  { id: "habits",   label: "Habits",   icon: "✅" },
  { id: "insights", label: "Insights", icon: "📊" },
];

function App() {
  const [, force] = useState(0);
  const [tab, setTab] = useState("today");
  const [sheet, setSheet] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    const keys = Object.keys(state);
    const unsubs = keys.map((k) => state[k].subscribe(() => force((n) => n + 1)));
    load();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (shouldShowIOSHint()) {
      setTimeout(() => setShowInstallHint(true), 1500);
    }
    return () => unsubs.forEach((u) => u && u());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = state.themePref.value;
  }, [state.themePref.value]);

  if (!state.ready.value) {
    return html`<div class="boot"><div class="boot-dot"></div><p>Loading LifeOS…</p></div>`;
  }

  if (!state.hasOnboarded.value) {
    return html`<${Onboarding} onFinish=${(name) => {
      setKV("userName", name);
      setKV("hasOnboarded", true);
    }} />`;
  }

  let body = null;
  if (showSettings) {
    body = html`<${SettingsView} />`;
  } else if (tab === "today") body = html`<${TodayView} openSheet=${setSheet} />`;
  else if (tab === "planner") body = html`<${PlannerView} openSheet=${setSheet} />`;
  else if (tab === "journal") body = html`<${JournalView} openSheet=${setSheet} />`;
  else if (tab === "habits") body = html`<${HabitsView} openSheet=${setSheet} />`;
  else if (tab === "insights")
    body = html`<${InsightsView} openSheet=${setSheet} openSettings=${() => setShowSettings(true)} />`;

  return html`
    <div class="app-shell">
      <header class="topbar">
        ${showSettings
          ? html`<button class="link" onClick=${() => setShowSettings(false)}>‹ Back</button>`
          : html`<span class="brand">LifeOS</span>`}
        <div class="top-right">
          <button class="icon-btn" onClick=${() => setSheet({ type: "task" })} title="New task">＋</button>
          <button class="icon-btn" onClick=${() => setShowSettings((v) => !v)} title="Settings">⚙</button>
        </div>
      </header>

      <main class="main">${body}</main>

      ${!showSettings && html`
        <nav class="tabbar" role="tablist">
          ${TABS.map((t) => html`
            <button class=${`tab ${tab === t.id ? "active" : ""}`}
                    onClick=${() => setTab(t.id)} key=${t.id}>
              <span class="tab-icon">${t.icon}</span>
              <span class="tab-label">${t.label}</span>
            </button>
          `)}
        </nav>
      `}

      <${Sheet} payload=${sheet} onClose=${() => setSheet(null)} />

      ${showInstallHint && html`<${InstallHint} onDismiss=${() => { dismissIOSHint(); setShowInstallHint(false); }} />`}
    </div>
  `;
}

function InstallHint({ onDismiss }) {
  return html`
    <div class="install-hint">
      <div class="install-card">
        <div class="install-head">
          <strong>Install LifeOS</strong>
          <button class="link" onClick=${onDismiss}>Not now</button>
        </div>
        <p class="muted small">Make it feel native: tap <span class="ios-share">⇪</span> Share, then <strong>Add to Home Screen</strong>. It'll launch full-screen, work offline, and keep all your data.</p>
        <div class="install-steps">
          <span>1. Tap <span class="ios-share">⇪</span></span>
          <span>2. "Add to Home Screen"</span>
          <span>3. "Add"</span>
        </div>
      </div>
    </div>
  `;
}

function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const pages = [
    { icon: "☀️", title: "Plan your day", sub: "Tasks, priorities, your whole day in one calm view." },
    { icon: "📓", title: "Journal with intent", sub: "Mood, gratitude, highlights, prompts every evening." },
    { icon: "✅", title: "Build habits that stick", sub: "Streaks, weekly targets, a year-at-a-glance heatmap." },
    { icon: "📊", title: "See your life clearly", sub: "Insights across mood, focus, and progress on what matters." },
  ];
  const last = step === pages.length - 1;
  const p = pages[step];

  return html`
    <div class="onboarding">
      <div class="onboard-icon">${p.icon}</div>
      <h1>${p.title}</h1>
      <p class="muted center">${p.sub}</p>
      <div class="dots">
        ${pages.map((_, i) => html`<span class=${`dot ${i === step ? "on" : ""}`} key=${i}></span>`)}
      </div>
      ${last
        ? html`
            <input class="name-input" placeholder="What should we call you?" value=${name}
                   onInput=${(e) => setName(e.target.value)} />
            <button class="btn-primary big" onClick=${() => onFinish(name.trim())}>Start →</button>
            <button class="link" onClick=${() => onFinish("")}>Skip</button>
          `
        : html`
            <button class="btn-primary big" onClick=${() => setStep(step + 1)}>Next</button>
            <button class="link" onClick=${() => onFinish("")}>Skip</button>
          `}
    </div>
  `;
}

render(html`<${App} />`, document.getElementById("app"));
