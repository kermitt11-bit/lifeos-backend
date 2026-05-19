import { html, useState, useRef } from "../lib/ui.js";
import { state, setKV, exportJSON, importJSON, eraseAll, upsert } from "../lib/store.js";
import { INTEGRATIONS, uuid, parseMyNetDiary, parseJustFit } from "../lib/utils.js";

export function SettingsView() {
  const userName = state.userName.value;
  const themePref = state.themePref.value;
  const reminderEnabled = state.reminderEnabled.value;
  const reminderHour = state.reminderHour.value;
  const integrations = state.integrations.value || {};
  const openaiKey = state.openaiKey.value;

  const [exportText, setExportText] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const fileInput = useRef(null);

  const [expanded, setExpanded] = useState(null);
  const [ahPaste, setAhPaste] = useState("");
  const [chatKey, setChatKey] = useState(openaiKey);
  const [mndPaste, setMndPaste] = useState("");
  const [jfPaste, setJfPaste] = useState("");

  async function doExport() {
    const text = await exportJSON();
    setExportText(text);
    if (navigator.share) { try { await navigator.share({ title: "LifeOS export", text }); return; } catch (_) {} }
    try { await navigator.clipboard.writeText(text); alert("Copied JSON to clipboard."); } catch (_) {}
  }
  async function doErase() {
    if (!confirm("Erase all local data? This cannot be undone.")) return;
    await eraseAll();
    location.reload();
  }
  async function doImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const n = await importJSON(text);
      setImportStatus(`Imported ${n} records.`);
    } catch (err) {
      setImportStatus(`Import failed: ${err.message}`);
    } finally { e.target.value = ""; }
  }
  async function requestNotifications() {
    if (!("Notification" in window)) { alert("Notifications aren't supported in this browser."); return; }
    const res = await Notification.requestPermission();
    alert(`Permission: ${res}`);
  }

  async function setIntegration(id, patch) {
    const next = { ...integrations, [id]: { ...(integrations[id] || {}), ...patch } };
    await setKV("integrations", next);
  }

  async function connectChat() {
    if (!chatKey.trim().startsWith("sk-")) { alert("Paste an OpenAI key starting with sk-…"); return; }
    await setKV("openaiKey", chatKey.trim());
    await setIntegration("chatgpt", { connected: true, connectedAt: new Date().toISOString() });
    alert("ChatGPT connected. AI meal, workout, review & reset are unlocked.");
  }
  async function disconnectChat() {
    await setKV("openaiKey", "");
    setChatKey("");
    await setIntegration("chatgpt", { connected: false });
  }

  async function importAppleHealth() {
    // Expect simple JSON exported from the iOS companion or a Shortcut, of the form:
    // { steps: [{date, amount}], sleep: [{date, hours}], weight: [{date, kg}] }
    try {
      const data = JSON.parse(ahPaste);
      let n = 0;
      for (const s of data.steps || []) {
        await upsert("healthLogs", { id: uuid(), kind: "steps", amount: Number(s.amount) || 0, date: s.date || new Date().toISOString() }); n++;
      }
      for (const s of data.sleep || []) {
        await upsert("healthLogs", { id: uuid(), kind: "sleep", amount: Number(s.hours || s.amount) || 0, date: s.date || new Date().toISOString() }); n++;
      }
      for (const w of data.weight || []) {
        await upsert("healthLogs", { id: uuid(), kind: "weight", amount: Number(w.kg || w.amount) || 0, date: w.date || new Date().toISOString() }); n++;
      }
      await setIntegration("applehealth", { connected: true, lastSyncAt: new Date().toISOString() });
      setAhPaste("");
      alert(`Imported ${n} Apple Health records.`);
    } catch (err) {
      alert("Couldn't parse Apple Health JSON. Expected {steps:[], sleep:[], weight:[]}.");
    }
  }

  async function importMND() {
    const parsed = parseMyNetDiary(mndPaste);
    if (parsed.length === 0) { alert("No meals detected. Try pasting your MyNetDiary daily summary."); return; }
    for (const m of parsed) {
      await upsert("meals", {
        id: uuid(),
        date: new Date().toISOString(),
        slot: m.slot, name: m.name, emoji: "🍽️",
        kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat,
        source: "mynetdiary",
      });
    }
    await setIntegration("mynetdiary", { connected: true, lastSyncAt: new Date().toISOString() });
    setMndPaste("");
    alert(`Logged ${parsed.length} meals from MyNetDiary.`);
  }

  async function importJF() {
    const parsed = parseJustFit(jfPaste);
    if (!parsed.exercises.length && !parsed.minutes) { alert("Couldn't parse session."); return; }
    await upsert("workouts", {
      id: uuid(),
      date: new Date().toISOString(),
      name: parsed.name,
      emoji: "🏋️",
      color: "#D4A574",
      kind: "imported",
      minutes: parsed.minutes,
      kcal: parsed.kcal,
      exercises: parsed.exercises.map((e) => ({ ...e, done: true })),
      completed: true,
      source: "justfit",
    });
    await setIntegration("justfit", { connected: true, lastSyncAt: new Date().toISOString() });
    setJfPaste("");
    alert("Imported JustFit session.");
  }

  return html`
    <section class="screen">
      <header class="hero compact">
        <h1>Settings</h1>
        <p class="hero-sub">Make it yours · connect what you already use.</p>
      </header>

      <div class="card form-card">
        <h3>Preferences</h3>
        <label class="row">
          <span>Your name</span>
          <input value=${userName} onInput=${(e) => setKV("userName", e.target.value)} placeholder="Friend" />
        </label>
        <label class="row">
          <span>Theme</span>
          <select value=${themePref} onChange=${(e) => { setKV("themePref", e.target.value); document.documentElement.dataset.theme = e.target.value; }}>
            <option value="system">System</option>
            <option value="light">Light · cream</option>
            <option value="dark">Dark · cocoa</option>
          </select>
        </label>
        <label class="row">
          <span>Water target (ml)</span>
          <input type="number" min="500" max="6000" step="100" value=${state.waterTargetMl.value} onInput=${(e) => setKV("waterTargetMl", Number(e.target.value))} style="max-width:140px;" />
        </label>
        <label class="row">
          <span>Sleep target (h)</span>
          <input type="number" min="4" max="12" step="0.5" value=${state.sleepTargetHours.value} onInput=${(e) => setKV("sleepTargetHours", Number(e.target.value))} style="max-width:140px;" />
        </label>
        <label class="row">
          <span>Steps target</span>
          <input type="number" min="1000" max="30000" step="500" value=${state.stepsTarget.value} onInput=${(e) => setKV("stepsTarget", Number(e.target.value))} style="max-width:140px;" />
        </label>
      </div>

      <div class="card form-card">
        <h3>Notifications</h3>
        <label class="row">
          <span>Evening journal nudge</span>
          <input type="checkbox" checked=${reminderEnabled} onChange=${(e) => setKV("reminderEnabled", e.target.checked)} />
        </label>
        ${reminderEnabled && html`
          <label class="row">
            <span>At hour</span>
            <input type="number" min="6" max="23" value=${reminderHour} onInput=${(e) => setKV("reminderHour", Number(e.target.value))} style="max-width:100px;" />
          </label>
        `}
        <button class="btn-secondary small" onClick=${requestNotifications}>Request permission</button>
      </div>

      <section class="block">
        <div class="block-head"><h2>Integrations</h2></div>
        <small class="muted">Bring the data you already collect into Life OS. Everything stays local unless you sync.</small>

        ${INTEGRATIONS.map((i) => {
          const status = integrations[i.id]?.connected;
          const open = expanded === i.id;
          return html`
            <div class="int-tile" key=${i.id} style=${`--c:${i.color}`}>
              <div class="int-ico">${i.icon}</div>
              <div class="int-body">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <strong>${i.name}</strong>
                  <span class=${`int-status ${status ? "on" : "off"}`}>${status ? "connected" : "not yet"}</span>
                </div>
                <small>${i.note}</small>
                <small>${(i.capabilities || []).join(" · ")}</small>
                <button class="btn-secondary small" onClick=${() => setExpanded(open ? null : i.id)}>${open ? "Hide" : (status ? "Manage" : "Connect")}</button>

                ${open && i.id === "chatgpt" && html`
                  <div class="form-card" style="margin-top:8px;">
                    <input value=${chatKey} onInput=${(e) => setChatKey(e.target.value)} placeholder="sk-..." />
                    <div style="display:flex;gap:8px;">
                      <button class="btn-primary small" onClick=${connectChat}>Save key</button>
                      ${status && html`<button class="btn-danger" onClick=${disconnectChat}>Disconnect</button>`}
                    </div>
                    <small class="muted">Key stays in this device's IndexedDB. Used only for AI features.</small>
                  </div>
                `}
                ${open && i.id === "applehealth" && html`
                  <div class="form-card" style="margin-top:8px;">
                    <small class="muted">Use the iOS companion or an Apple Shortcut to export JSON. Paste it here.</small>
                    <textarea rows="6" value=${ahPaste} onInput=${(e) => setAhPaste(e.target.value)} placeholder=${`{\n  "steps":  [{"date": "2025-05-19", "amount": 8421}],\n  "sleep":  [{"date": "2025-05-19", "hours": 7.5}],\n  "weight": [{"date": "2025-05-19", "kg": 72.4}]\n}`}></textarea>
                    <button class="btn-primary small" onClick=${importAppleHealth}>Import</button>
                  </div>
                `}
                ${open && i.id === "mynetdiary" && html`
                  <div class="form-card" style="margin-top:8px;">
                    <small class="muted">Paste your MyNetDiary daily breakdown (sections + lines like "Greek yogurt — 200 kcal · 20p 24c 6f").</small>
                    <textarea rows="6" value=${mndPaste} onInput=${(e) => setMndPaste(e.target.value)} placeholder="Lines like: Greek yogurt - 200 kcal · 20p 24c 6f"></textarea>
                    <button class="btn-primary small" onClick=${importMND}>Import meals</button>
                  </div>
                `}
                ${open && i.id === "justfit" && html`
                  <div class="form-card" style="margin-top:8px;">
                    <small class="muted">Paste your finished JustFit session.</small>
                    <textarea rows="6" value=${jfPaste} onInput=${(e) => setJfPaste(e.target.value)} placeholder="Title: Push day · Duration: 32 min · Calories: 215 · • Bench press 4x8"></textarea>
                    <button class="btn-primary small" onClick=${importJF}>Import session</button>
                  </div>
                `}
              </div>
            </div>
          `;
        })}
      </section>

      <div class="card form-card">
        <h3>Data</h3>
        <button class="btn-secondary" onClick=${doExport}>Export as JSON</button>
        <button class="btn-secondary" onClick=${() => fileInput.current?.click()}>Import from JSON</button>
        <input ref=${fileInput} type="file" accept="application/json,.json" style="display:none" onChange=${doImport} />
        ${importStatus && html`<p class="muted small">${importStatus}</p>`}
        <button class="btn-danger" onClick=${doErase}>Erase all local data</button>
        ${exportText && html`<textarea readonly rows="6" class="mono">${exportText.slice(0, 4000)}${exportText.length > 4000 ? "\n…" : ""}</textarea>`}
      </div>

      <div class="card form-card">
        <h3>About</h3>
        <p class="muted">Life OS · v2.0 · Local-first. Calm, adaptable, supportive. Your data lives in your phone's storage and never leaves unless you choose to sync.</p>
      </div>
    </section>
  `;
}
