import { html, render, useState, useEffect } from "/lib/ui.js";
import { state, load, setKV } from "/lib/store.js";
import { HomeView } from "/views/home.js";
import { PlannerView } from "/views/planner.js";
import { FoodView } from "/views/food.js";
import { MoveView } from "/views/move.js";
import { MoreView } from "/views/more.js";
import { HealthView } from "/views/health.js";
import { HabitsView } from "/views/habits.js";
import { JournalView } from "/views/journal.js";
import { GoalsView } from "/views/goals.js";
import { ResetView } from "/views/reset.js";
import { ReviewsView } from "/views/reviews.js";
import { InsightsView } from "/views/insights.js";
import { SettingsView } from "/views/settings.js";
import { Sheet } from "/views/sheets.js";
import { shouldShowIOSHint, dismissIOSHint } from "/lib/install.js";

const TABS = [
  { id: "home",    label: "Home",    icon: "☀️" },
  { id: "planner", label: "Plan",    icon: "🗓" },
  { id: "food",    label: "Food",    icon: "🥗" },
  { id: "move",    label: "Move",    icon: "🏃" },
  { id: "more",    label: "More",    icon: "⋯" },
];

const SUB_VIEWS = new Set(["habits", "health", "hobbies", "reset", "reviews", "journal", "goals"]);

function App() {
  const [, force] = useState(0);
  const [tab, setTab] = useState("home");
  const [sub, setSub] = useState(null);
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
    if (shouldShowIOSHint()) setTimeout(() => setShowInstallHint(true), 1500);
    return () => unsubs.forEach((u) => u && u());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = state.themePref.value;
  }, [state.themePref.value]);

  if (!state.ready.value) {
    return html`<div class="boot"><div class="boot-dot"></div><p>Loading Life OS…</p></div>`;
  }

  if (!state.hasOnboarded.value) {
    return html`<${Onboarding} onFinish=${(name) => {
      setKV("userName", name);
      setKV("hasOnboarded", true);
    }} />`;
  }

  function goTab(id) {
    if (id === "settings") { setShowSettings(true); return; }
    if (SUB_VIEWS.has(id)) {
      setTab("more"); setSub(id); setShowSettings(false); return;
    }
    setTab(id); setSub(null); setShowSettings(false);
  }

  let body = null;
  if (showSettings) {
    body = html`<${SettingsView} />`;
  } else if (sub === "health")  body = html`<${HealthView} />`;
  else if (sub === "habits")    body = html`<${HabitsView} openSheet=${setSheet} />`;
  else if (sub === "hobbies")   body = html`<${MoveView}   openSheet=${setSheet} />`;
  else if (sub === "reset")     body = html`<${ResetView}  goTab=${goTab} />`;
  else if (sub === "reviews")   body = html`<${ReviewsView} />`;
  else if (sub === "journal")   body = html`<${JournalView} openSheet=${setSheet} />`;
  else if (sub === "goals")     body = html`<${GoalsView}   openSheet=${setSheet} />`;
  else if (tab === "home")      body = html`<${HomeView}    openSheet=${setSheet} goTab=${goTab} />`;
  else if (tab === "planner")   body = html`<${PlannerView} openSheet=${setSheet} />`;
  else if (tab === "food")      body = html`<${FoodView}    openSheet=${setSheet} />`;
  else if (tab === "move")      body = html`<${MoveView}    openSheet=${setSheet} />`;
  else if (tab === "more")      body = html`<${MoreView}    goTab=${goTab} openSettings=${() => setShowSettings(true)} />`;

  const topTitle = showSettings ? "Settings"
                  : sub === "health" ? "Health"
                  : sub === "habits" ? "Habits"
                  : sub === "hobbies" ? "Hobbies"
                  : sub === "reset" ? "Reset"
                  : sub === "reviews" ? "Reviews"
                  : sub === "journal" ? "Journal"
                  : sub === "goals" ? "Goals"
                  : null;

  return html`
    <div class="app-shell">
      <header class="topbar">
        ${(showSettings || sub)
          ? html`<button class="link" onClick=${() => { setShowSettings(false); setSub(null); }}>‹ ${topTitle || "Back"}</button>`
          : html`<span class="brand">Life OS<span class="dot">.</span></span>`}
        <div class="top-right">
          <button class="icon-btn bare" onClick=${() => setSheet({ type: "task" })} title="New task">＋</button>
          <button class="icon-btn bare" onClick=${() => setShowSettings((v) => !v)} title="Settings">⚙</button>
        </div>
      </header>

      <main class="main">${body}</main>

      ${!showSettings && !sub && html`
        <nav class="tabbar" role="tablist">
          ${TABS.map((t) => html`
            <button class=${`tab ${tab === t.id ? "active" : ""}`}
                    onClick=${() => goTab(t.id)} key=${t.id}>
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
          <strong>Install Life OS</strong>
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
    { icon: "🌿", title: "Calm by design",       sub: "Plan, act, recover, grow — across food, body, hobbies, mood, and the day." },
    { icon: "🗓", title: "The plan stays visible", sub: "Move, skip, replace, or reschedule. Your original is never deleted." },
    { icon: "🍽", title: "Food without rigidity", sub: "Build meals from what you have. No eggs. Snack box for treats." },
    { icon: "🎨", title: "Hobbies count as much", sub: "Joy is a pillar. 5-minute starts when you have only minutes." },
    { icon: "🪄", title: "Recovery, not catching up", sub: "Off day? Reset mode shrinks the world for 30 minutes." },
  ];
  const last = step === pages.length - 1;
  const p = pages[step];
  return html`
    <div class="onboarding">
      <div class="onboard-icon">${p.icon}</div>
      <h1>${p.title}</h1>
      <p class="muted center">${p.sub}</p>
      <div class="dots">${pages.map((_, i) => html`<span class=${`dot ${i === step ? "on" : ""}`} key=${i}></span>`)}</div>
      ${last
        ? html`
            <input class="name-input" placeholder="What should we call you?" value=${name} onInput=${(e) => setName(e.target.value)} />
            <button class="btn-primary big" onClick=${() => onFinish(name.trim())}>Begin →</button>
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
