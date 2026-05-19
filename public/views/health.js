import { html, useState, useMemo } from "../lib/ui.js";
import { state, upsert, remove, setKV } from "../lib/store.js";
import {
  uuid, isSameDay, fmtDate, sumWater, lastSleep, todaySteps,
  SUPPLEMENTS_DEFAULT, startOfDay, addDays,
} from "../lib/utils.js";
import { success, tap } from "../lib/haptic.js";

export function HealthView() {
  const today = new Date();
  const logs = state.healthLogs.value;
  const waterTarget = state.waterTargetMl.value;
  const sleepTarget = state.sleepTargetHours.value;
  const stepsTarget = state.stepsTarget.value;

  const water = sumWater(logs, today);
  const sleep = lastSleep(logs, today);
  const sleepHours = sleep?.amount || 0;
  const steps = todaySteps(logs, today);

  const [sleepInput, setSleepInput] = useState("");
  const [stepsInput, setStepsInput] = useState("");
  const [supplement, setSupplement] = useState(SUPPLEMENTS_DEFAULT[0]);

  const todaySupps = logs.filter((l) => l.kind === "supplement" && isSameDay(l.date, today));

  const weekWater = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      days.push({ d, total: sumWater(logs, d) });
    }
    return days;
  }, [logs]);

  const weekSleep = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const log = logs.filter((l) => l.kind === "sleep" && isSameDay(l.date, d)).slice(-1)[0];
      out.push({ d, hours: log?.amount || 0 });
    }
    return out;
  }, [logs]);

  async function addWater(ml) {
    success();
    await upsert("healthLogs", { id: uuid(), kind: "water", amount: ml, date: new Date().toISOString() });
  }
  async function logSleep() {
    const v = parseFloat(sleepInput);
    if (!v) return;
    await upsert("healthLogs", { id: uuid(), kind: "sleep", amount: v, date: new Date().toISOString() });
    setSleepInput(""); success();
  }
  async function logSteps() {
    const v = parseInt(stepsInput, 10);
    if (!v) return;
    await upsert("healthLogs", { id: uuid(), kind: "steps", amount: v, date: new Date().toISOString() });
    setStepsInput(""); success();
  }
  async function logSupplement(name) {
    success();
    await upsert("healthLogs", { id: uuid(), kind: "supplement", name, date: new Date().toISOString() });
  }

  return html`
    <section class="screen">
      <header class="hero">
        <p class="hero-date">${fmtDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>Health</h1>
        <p class="hero-sub">Water, sleep, steps, and supplements — simple logging.</p>
      </header>

      <section class="block">
        <div class="block-head"><h2>Water</h2><span class="muted">${water} / ${waterTarget} ml</span></div>
        <div class="progress"><div class="progress-fill" style=${`width:${Math.min(100, (water / waterTarget) * 100)}%`}></div></div>
        <div class="quick-grid">
          <button class="quick" style="--c:#7B92AE" onClick=${() => addWater(250)}><span class="quick-ico">💧</span><span>+250 ml</span></button>
          <button class="quick" style="--c:#7B92AE" onClick=${() => addWater(500)}><span class="quick-ico">🥤</span><span>+500 ml</span></button>
          <button class="quick" style="--c:#7B92AE" onClick=${() => addWater(750)}><span class="quick-ico">🍶</span><span>+750 ml</span></button>
          <button class="quick" style="--c:#B59E9E" onClick=${() => setKV("waterTargetMl", prompt("Daily water target (ml)", String(waterTarget)) || waterTarget)}><span class="quick-ico">⚙</span><span>Target</span></button>
        </div>
      </section>

      <section class="block">
        <div class="block-head"><h2>Sleep</h2><span class="muted">${sleepHours.toFixed(1)} / ${sleepTarget}h</span></div>
        <div class="progress"><div class="progress-fill" style=${`width:${Math.min(100, (sleepHours / sleepTarget) * 100)}%; background: linear-gradient(90deg, #A88BB8, #C77B7B);`}></div></div>
        <div class="card form-card">
          <label class="row">
            <span>Last night's sleep (h)</span>
            <input type="number" step="0.25" min="0" max="12" value=${sleepInput} placeholder=${String(sleepHours || 7.5)} onInput=${(e) => setSleepInput(e.target.value)} style="max-width:120px;" />
          </label>
          <button class="btn-primary small" onClick=${logSleep}>Log sleep</button>
        </div>
      </section>

      <section class="block">
        <div class="block-head"><h2>Steps</h2><span class="muted">${steps.toLocaleString()} / ${stepsTarget.toLocaleString()}</span></div>
        <div class="progress"><div class="progress-fill" style=${`width:${Math.min(100, (steps / stepsTarget) * 100)}%; background: linear-gradient(90deg, #8FB89C, #D4A574);`}></div></div>
        <div class="card form-card">
          <label class="row">
            <span>Steps today</span>
            <input type="number" min="0" max="60000" step="100" value=${stepsInput} placeholder=${String(steps || 6500)} onInput=${(e) => setStepsInput(e.target.value)} style="max-width:140px;" />
          </label>
          <button class="btn-primary small" onClick=${logSteps}>Log steps</button>
          <small class="muted">Sync from Apple Health via the iOS companion (PWAs can't read HealthKit directly).</small>
        </div>
      </section>

      <section class="block">
        <div class="block-head"><h2>Supplements</h2></div>
        <div class="seg-row">
          ${SUPPLEMENTS_DEFAULT.map((s) => {
            const taken = todaySupps.some((l) => l.name === s);
            return html`<button class=${`pill ${taken ? "active" : ""}`} key=${s} onClick=${() => logSupplement(s)}>${taken ? "✓ " : ""}${s}</button>`;
          })}
        </div>
        ${todaySupps.length > 0 && html`
          <small class="muted">Logged: ${todaySupps.map((s) => s.name).join(" · ")}</small>
        `}
      </section>

      <section class="block">
        <div class="block-head"><h2>This week</h2></div>
        <div class="card">
          <h3>Water</h3>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end;height:80px;">
            ${weekWater.map((d) => {
              const pct = Math.min(100, (d.total / waterTarget) * 100);
              return html`<div title=${`${d.total}ml`} style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div style=${`background:linear-gradient(180deg,#7B92AE,#A88BB8);height:${pct}%;width:18px;border-radius:6px 6px 0 0;min-height:4px;`}></div>
                <small class="muted" style="font-size:10px;">${d.d.toLocaleDateString(undefined,{weekday:"narrow"})}</small>
              </div>`;
            })}
          </div>
          <h3 style="margin-top:14px;">Sleep</h3>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end;height:80px;">
            ${weekSleep.map((d) => {
              const pct = Math.min(100, (d.hours / sleepTarget) * 100);
              return html`<div title=${`${d.hours}h`} style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div style=${`background:linear-gradient(180deg,#A88BB8,#C77B7B);height:${pct}%;width:18px;border-radius:6px 6px 0 0;min-height:4px;`}></div>
                <small class="muted" style="font-size:10px;">${d.d.toLocaleDateString(undefined,{weekday:"narrow"})}</small>
              </div>`;
            })}
          </div>
        </div>
      </section>
    </section>
  `;
}
