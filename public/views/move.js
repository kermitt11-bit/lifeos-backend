import { html, useState, useMemo } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import {
  uuid, isSameDay, fmtDate, EQUIPMENT, WORKOUT_TEMPLATES, suggestWorkouts,
  HOBBY_LIBRARY, HOBBY_CATEGORIES, hobbyCategoryFor, suggestHobbies,
  parseJustFit, energyLabel,
} from "../lib/utils.js";
import { aiEnabled, ask } from "../lib/ai.js";
import { success, tap } from "../lib/haptic.js";

export function MoveView({ openSheet }) {
  const [sub, setSub] = useState("workout");
  return html`
    <section class="screen">
      <header class="hero">
        <p class="hero-date">${fmtDate(new Date(), { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>Move & play</h1>
        <p class="hero-sub">Workouts when you have fuel · hobbies when you have joy.</p>
      </header>

      <div class="segmented">
        <button class=${`seg ${sub === "workout" ? "active" : ""}`} onClick=${() => setSub("workout")}>🏋️ Workout</button>
        <button class=${`seg ${sub === "hobby"   ? "active" : ""}`} onClick=${() => setSub("hobby")}>🎨 Hobbies</button>
      </div>

      ${sub === "workout" ? html`<${WorkoutPanel} openSheet=${openSheet} />` : html`<${HobbyPanel} />`}
    </section>
  `;
}

function WorkoutPanel({ openSheet }) {
  const today = new Date();
  const workouts = state.workouts.value;
  const todayLog = workouts.find((w) => isSameDay(w.date, today));

  const moods = state.moods.value;
  const lastMood = moods[moods.length - 1];
  const defaultEnergy = lastMood ? (lastMood.energy >= 7 ? "high" : lastMood.energy >= 4 ? "medium" : "low") : "medium";

  const [energy, setEnergy] = useState(defaultEnergy);
  const [equipment, setEquipment] = useState("none");
  const [minutes, setMinutes] = useState(energy === "low" ? 15 : energy === "medium" ? 20 : 30);
  const [busy, setBusy] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const suggestions = useMemo(() => suggestWorkouts({ energy, equipment, minutes }, 3), [energy, equipment, minutes]);

  async function logWorkout(tpl) {
    success();
    await upsert("workouts", {
      id: uuid(),
      date: new Date().toISOString(),
      name: tpl.name,
      emoji: tpl.emoji,
      color: tpl.color,
      kind: tpl.energy,
      energy: tpl.energy,
      minutes: tpl.minutes,
      exercises: tpl.exercises.map((e) => ({ ...e, done: false })),
      notes: "",
      completed: false,
      source: "lifeos",
    });
  }

  async function toggleExercise(w, idx) {
    tap();
    const ex = w.exercises.slice();
    ex[idx] = { ...ex[idx], done: !ex[idx].done };
    const completed = ex.every((e) => e.done);
    await upsert("workouts", { ...w, exercises: ex, completed });
  }

  async function generateAIWorkout() {
    if (!aiEnabled()) { alert("Connect ChatGPT in Settings → Integrations."); return; }
    setBusy(true);
    try {
      const data = await ask({
        system: "You build calm, energy-aware workouts. Low = gentle / walk. Medium = 15-20 min. High = 30-45 min. Match equipment. Be specific, kind, never shaming.",
        user: `Build a workout. energy=${energy}, equipment=${equipment}, minutes=${minutes}. Return JSON: {name, emoji, kcal_est, exercises:[{name, reps, note?}], notes}`,
        json: true,
      });
      setAiPlan(data);
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  }

  async function logAiPlan() {
    if (!aiPlan) return;
    await upsert("workouts", {
      id: uuid(),
      date: new Date().toISOString(),
      name: aiPlan.name || "AI workout",
      emoji: aiPlan.emoji || "💪",
      color: "#A88BB8",
      kind: energy, energy,
      minutes,
      exercises: (aiPlan.exercises || []).map((e) => ({ ...e, done: false })),
      notes: aiPlan.notes || "",
      completed: false,
      source: "chatgpt",
    });
    setAiPlan(null);
    success();
  }

  async function doImport() {
    const parsed = parseJustFit(importText);
    if (!parsed.exercises.length && !parsed.minutes) { alert("Couldn't parse JustFit session. Paste full session detail."); return; }
    await upsert("workouts", {
      id: uuid(),
      date: new Date().toISOString(),
      name: parsed.name,
      emoji: "🏋️",
      color: "#D4A574",
      kind: "imported", energy,
      minutes: parsed.minutes,
      kcal: parsed.kcal,
      exercises: parsed.exercises.map((e) => ({ ...e, done: true })),
      notes: "",
      completed: true,
      source: "justfit",
    });
    setShowImport(false); setImportText("");
    success();
  }

  return html`
    <section class="block">
      <div class="card form-card flat">
        <div class="row stack">
          <span class="tiny">Energy</span>
          <div class="seg-row">
            ${["low", "medium", "high"].map((e) => html`
              <button class=${`pill ${energy === e ? "active" : ""}`} onClick=${() => setEnergy(e)}>${e === "low" ? "🐢 Low" : e === "medium" ? "🚶 Medium" : "🔥 High"}</button>
            `)}
          </div>
        </div>
        <div class="row stack">
          <span class="tiny">Equipment</span>
          <div class="seg-row">
            ${EQUIPMENT.map((e) => html`<button class=${`pill ${equipment === e.id ? "active" : ""}`} onClick=${() => setEquipment(e.id)}>${e.label}</button>`)}
          </div>
        </div>
        <div class="row">
          <span class="tiny">Minutes</span>
          <input type="number" min="5" max="90" step="5" value=${minutes} onInput=${(e) => setMinutes(Number(e.target.value))} style="max-width:100px;" />
        </div>
      </div>

      <div class="block-head"><h2>Suggested for you</h2><small class="muted">${lastMood ? `Energy ${energyLabel(lastMood.energy)}` : "Set today's energy"}</small></div>
      ${suggestions.map((w) => html`
        <div class="card workout-card flat" style=${`--c:${w.color}`} key=${w.id}>
          <div class="workout-head">
            <div class="workout-ico">${w.emoji}</div>
            <div style="flex:1;">
              <strong>${w.name}</strong>
              <div class="meta muted" style="font-size:12px;margin-top:2px;">${w.minutes} min · ${w.energy} energy · ${w.equipment.join(", ")}</div>
            </div>
            <button class="btn-primary small" onClick=${() => logWorkout(w)}>Start</button>
          </div>
          <div class="exercise-list">
            ${w.exercises.map((ex, i) => html`
              <div class="ex-row" key=${i}>
                <span class="ex-name">${ex.name}</span>
                <span class="ex-meta">${ex.reps}${ex.note ? ` · ${ex.note}` : ""}</span>
              </div>
            `)}
          </div>
        </div>
      `)}

      <div class="block-head"><h2>AI workout · ChatGPT</h2><small class="muted">${aiEnabled() ? "Connected" : "Add key in Settings"}</small></div>
      <button class="btn-primary" onClick=${generateAIWorkout} disabled=${busy || !aiEnabled()}>${busy ? "Thinking…" : `Build a custom ${minutes}-min ${energy} session`}</button>
      ${aiPlan && html`
        <div class="card workout-card flat" style="--c:#A88BB8">
          <div class="workout-head">
            <div class="workout-ico">${aiPlan.emoji || "🪄"}</div>
            <div style="flex:1;"><strong>${aiPlan.name}</strong><div class="muted" style="font-size:12px;">AI · ${minutes} min</div></div>
            <button class="btn-primary small" onClick=${logAiPlan}>Log</button>
          </div>
          <div class="exercise-list">
            ${(aiPlan.exercises || []).map((e, i) => html`
              <div class="ex-row" key=${i}><span class="ex-name">${e.name}</span><span class="ex-meta">${e.reps}${e.note ? ` · ${e.note}` : ""}</span></div>
            `)}
          </div>
          ${aiPlan.notes && html`<small class="muted">${aiPlan.notes}</small>`}
        </div>
      `}

      <div class="block-head"><h2>Today's session</h2>
        <button class="btn-secondary small" onClick=${() => setShowImport((v) => !v)}>Import JustFit</button>
      </div>
      ${showImport && html`
        <div class="card form-card">
          <small class="muted">Paste your finished JustFit session (title, duration, calories, exercises).</small>
          <textarea rows="6" value=${importText} onInput=${(e) => setImportText(e.target.value)} placeholder="Title: Push day · Duration: 32 min · Calories: 215 · • Bench press 4x8"></textarea>
          <button class="btn-primary small" onClick=${doImport}>Import session</button>
        </div>
      `}
      ${todayLog
        ? html`<div class="card workout-card flat" style=${`--c:${todayLog.color || "#C77B7B"}`}>
            <div class="workout-head">
              <div class="workout-ico">${todayLog.emoji || "💪"}</div>
              <div style="flex:1;"><strong>${todayLog.name}</strong><div class="muted" style="font-size:12px;">${todayLog.minutes} min · ${todayLog.source}</div></div>
              <button class="icon-btn bare" onClick=${() => remove("workouts", todayLog.id)}>×</button>
            </div>
            <div class="exercise-list">
              ${(todayLog.exercises || []).map((ex, i) => html`
                <button class=${`ex-row ${ex.done ? "done" : ""}`} key=${i} onClick=${() => toggleExercise(todayLog, i)}>
                  <span class="ex-name">${ex.done ? "✓ " : ""}${ex.name}</span>
                  <span class="ex-meta">${ex.reps || ""}</span>
                </button>
              `)}
            </div>
          </div>`
        : html`<div class="card empty"><span class="empty-ico">🏋️</span><p>No session yet today. Start one from suggestions above.</p></div>`}
    </section>
  `;
}

function HobbyPanel() {
  const today = new Date();
  const hobbies = state.hobbies.value;
  const logs = state.hobbyLogs.value;
  const moods = state.moods.value;
  const lastMood = moods[moods.length - 1];

  const [filterCat, setFilterCat] = useState("all");
  const [minutes, setMinutes] = useState(15);
  const [mood, setMood] = useState("any");

  const suggestEnergy = lastMood ? (lastMood.energy >= 7 ? "high" : lastMood.energy >= 4 ? "medium" : "low") : "any";
  const suggested = useMemo(() => suggestHobbies({ mood, energy: suggestEnergy, minutes }, 6), [mood, suggestEnergy, minutes]);

  const todayLogs = logs.filter((l) => isSameDay(l.date, today));

  const items = useMemo(() => {
    const seen = new Set();
    const all = [...HOBBY_LIBRARY, ...hobbies];
    return all.filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      if (filterCat === "all") return true;
      return h.category === filterCat;
    });
  }, [hobbies, filterCat]);

  async function logHobby(h, duration = 5) {
    success();
    await upsert("hobbyLogs", {
      id: uuid(),
      hobbyId: h.id,
      hobbyName: h.name,
      hobbyEmoji: h.emoji,
      category: h.category,
      duration,
      date: new Date().toISOString(),
      notes: "",
    });
  }

  return html`
    <section class="block">
      <div class="block-head"><h2>Joy engine · suggested</h2><small class="muted">${suggestEnergy} energy</small></div>
      <div class="seg-row">
        <button class=${`pill ${mood === "any" ? "active" : ""}`} onClick=${() => setMood("any")}>Any mood</button>
        <button class=${`pill ${mood === "calm" ? "active" : ""}`} onClick=${() => setMood("calm")}>Calm</button>
        <button class=${`pill ${mood === "curious" ? "active" : ""}`} onClick=${() => setMood("curious")}>Curious</button>
        <button class=${`pill ${mood === "focused" ? "active" : ""}`} onClick=${() => setMood("focused")}>Focused</button>
      </div>
      <div class="seg-row">
        ${[5, 10, 15, 30, 60].map((m) => html`<button class=${`pill ${minutes === m ? "active" : ""}`} onClick=${() => setMinutes(m)}>${m}m</button>`)}
      </div>

      <div class="hobby-grid">
        ${suggested.map((h) => {
          const cat = hobbyCategoryFor(h.category);
          return html`
            <button class="hobby-tile" key=${`s${h.id}`} style=${`--c:${cat.color}`} onClick=${() => logHobby(h, h.min)}>
              <span class="hobby-tag">${cat.label}</span>
              <span class="hobby-emoji">${h.emoji}</span>
              <strong>${h.name}</strong>
              <small><b>5-min start:</b> ${h.intro}</small>
              <small style="margin-top:6px;"><b>Deep:</b> ${h.deep}</small>
            </button>
          `;
        })}
      </div>

      <div class="block-head"><h2>All hobbies</h2></div>
      <div class="seg-row">
        <button class=${`pill ${filterCat === "all" ? "active" : ""}`} onClick=${() => setFilterCat("all")}>All</button>
        ${HOBBY_CATEGORIES.map((c) => html`
          <button class=${`pill ${filterCat === c.id ? "active" : ""}`} onClick=${() => setFilterCat(c.id)}>${c.icon} ${c.label}</button>
        `)}
      </div>
      <div class="hobby-grid">
        ${items.map((h) => {
          const cat = hobbyCategoryFor(h.category);
          return html`
            <button class="hobby-tile" key=${`l${h.id}`} style=${`--c:${cat.color}`} onClick=${() => logHobby(h, h.min || 10)}>
              <span class="hobby-tag">${cat.label}</span>
              <span class="hobby-emoji">${h.emoji}</span>
              <strong>${h.name}</strong>
              <small>${h.intro || ""}</small>
            </button>
          `;
        })}
      </div>

      <div class="block-head"><h2>Today's joy</h2></div>
      ${todayLogs.length === 0
        ? html`<div class="card empty"><span class="empty-ico">🌷</span><p>Pick something just for you. Hobbies are equal in importance to food and workouts.</p></div>`
        : todayLogs.map((l) => html`
            <div class="card meal-card flat" key=${l.id} style=${`--c:${hobbyCategoryFor(l.category).color}`}>
              <span class="meal-emoji">${l.hobbyEmoji || "🎨"}</span>
              <div class="meal-body">
                <strong>${l.hobbyName}</strong>
                <small class="muted">${l.duration} min · ${hobbyCategoryFor(l.category).label}</small>
              </div>
              <button class="icon-btn bare" onClick=${() => remove("hobbyLogs", l.id)}>×</button>
            </div>
          `)}
    </section>
  `;
}
