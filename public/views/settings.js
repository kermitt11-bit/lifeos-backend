import { html, useState } from "../lib/ui.js";
import { state, setKV, exportJSON, eraseAll } from "../lib/store.js";

export function SettingsView() {
  const userName = state.userName.value;
  const themePref = state.themePref.value;
  const reminderEnabled = state.reminderEnabled.value;
  const reminderHour = state.reminderHour.value;
  const [exportText, setExportText] = useState("");

  async function doExport() {
    const text = await exportJSON();
    setExportText(text);
    if (navigator.share) {
      try {
        await navigator.share({ title: "LifeOS export", text });
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied JSON to clipboard.");
    } catch (_) {}
  }

  async function doErase() {
    if (!confirm("Erase all local data? This cannot be undone.")) return;
    await eraseAll();
    location.reload();
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      alert("Notifications aren't supported in this browser.");
      return;
    }
    const res = await Notification.requestPermission();
    alert(`Permission: ${res}`);
  }

  return html`
    <section class="screen">
      <header class="hero compact">
        <h1>Settings</h1>
        <p class="hero-sub">Make it yours</p>
      </header>

      <div class="card form-card">
        <label class="row">
          <span>Your name</span>
          <input value=${userName} onInput=${(e) => setKV("userName", e.target.value)} placeholder="Friend" />
        </label>
        <label class="row">
          <span>Theme</span>
          <select value=${themePref} onChange=${(e) => { setKV("themePref", e.target.value); document.documentElement.dataset.theme = e.target.value; }}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>

      <div class="card form-card">
        <label class="row">
          <span>Evening journal reminder</span>
          <input type="checkbox" checked=${reminderEnabled} onChange=${(e) => setKV("reminderEnabled", e.target.checked)} />
        </label>
        ${reminderEnabled && html`
          <label class="row">
            <span>At</span>
            <input type="number" min="6" max="23" value=${reminderHour}
                   onInput=${(e) => setKV("reminderHour", Number(e.target.value))} />
          </label>
        `}
        <button class="btn-secondary" onClick=${requestNotifications}>Request notification permission</button>
        <p class="muted small">Web notifications need the app open or background sync. Add to Home Screen for the best experience.</p>
      </div>

      <div class="card form-card">
        <h3>Data</h3>
        <button class="btn-secondary" onClick=${doExport}>Export as JSON</button>
        <button class="btn-danger" onClick=${doErase}>Erase all local data</button>
        ${exportText && html`<textarea readonly rows="6" class="mono">${exportText.slice(0, 4000)}${exportText.length > 4000 ? "\n…" : ""}</textarea>`}
      </div>

      <div class="card form-card">
        <h3>About</h3>
        <p class="muted">LifeOS PWA · v1.0 · Local-first. Your data lives in your phone's storage and never leaves unless you export it.</p>
      </div>
    </section>
  `;
}
