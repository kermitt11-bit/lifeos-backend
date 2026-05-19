import { html, useState, useMemo } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import {
  uuid, isSameDay, fmtDate, FOOD_CATEGORIES, APPROVED_FOODS,
  MEAL_TEMPLATES, suggestMeals, parseMyNetDiary,
} from "../lib/utils.js";
import { aiEnabled, ask } from "../lib/ai.js";
import { success, tap } from "../lib/haptic.js";

const SLOTS = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅" },
  { id: "lunch",     label: "Lunch",     emoji: "☀️" },
  { id: "dinner",    label: "Dinner",    emoji: "🌙" },
  { id: "snack",     label: "Snack Box", emoji: "🍫" },
];

export function FoodView({ openSheet }) {
  const today = new Date();
  const pantry = state.pantry.value;
  const meals = state.meals.value;
  const todayMeals = meals.filter((m) => isSameDay(m.date, today));

  const [slot, setSlot] = useState(currentSlot());
  const [busy, setBusy] = useState(false);
  const [aiMeal, setAiMeal] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const pantryNames = useMemo(() => pantry.map((p) => p.name.toLowerCase()), [pantry]);
  const suggestions = useMemo(() => suggestMeals(pantryNames, slot, 4), [pantryNames, slot]);

  const totals = todayMeals.reduce((acc, m) => ({
    kcal: acc.kcal + (m.kcal || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  async function logMealFromTemplate(tpl) {
    success();
    await upsert("meals", {
      id: uuid(),
      date: new Date().toISOString(),
      slot: tpl.slot,
      name: tpl.name,
      emoji: tpl.emoji,
      kcal: tpl.kcal, protein: tpl.protein, carbs: tpl.carbs, fat: tpl.fat,
      portion: tpl.portion, steps: tpl.steps,
      source: "lifeos",
    });
  }

  async function generateAIMeal() {
    if (!aiEnabled()) {
      alert("Connect ChatGPT in Settings → Integrations to use AI meal building.");
      return;
    }
    setBusy(true);
    try {
      const data = await ask({
        system: "You build practical meals from a user's available ingredients. Strict rules: NO EGGS. Use only approved categories. Keep instructions short and realistic. Be explicit about portions. Use the closest fallback meal if ingredients are incomplete. Respond as JSON.",
        user: `Build a ${slot} meal from these ingredients: ${pantry.map((p) => p.name).join(", ") || "what's reasonable"}. Approved categories: protein, carb, veg, fruit, fat, dairy, drink, snack. Return: {name, emoji, kcal, protein, carbs, fat, portion, steps, missing[]}`,
        json: true,
      });
      setAiMeal({ ...data, slot });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function logAiMeal() {
    if (!aiMeal) return;
    await upsert("meals", {
      id: uuid(),
      date: new Date().toISOString(),
      slot: aiMeal.slot,
      name: aiMeal.name,
      emoji: aiMeal.emoji || "🍽️",
      kcal: Number(aiMeal.kcal) || 0,
      protein: Number(aiMeal.protein) || 0,
      carbs: Number(aiMeal.carbs) || 0,
      fat: Number(aiMeal.fat) || 0,
      portion: aiMeal.portion,
      steps: aiMeal.steps,
      source: "chatgpt",
    });
    setAiMeal(null);
    success();
  }

  async function doImport() {
    const parsed = parseMyNetDiary(importText);
    if (parsed.length === 0) {
      alert("Couldn't read any meals. Try pasting your MyNetDiary daily view.");
      return;
    }
    for (const m of parsed) {
      await upsert("meals", {
        id: uuid(),
        date: new Date().toISOString(),
        slot: m.slot,
        name: m.name,
        emoji: "🍽️",
        kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat,
        source: "mynetdiary",
      });
    }
    setShowImport(false);
    setImportText("");
    success();
  }

  return html`
    <section class="screen">
      <header class="hero">
        <p class="hero-date">${fmtDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>Food</h1>
        <p class="hero-sub">Approved categories · no eggs · explicit portions.</p>
      </header>

      <div class="stat-grid four">
        <div class="stat-tile" style="--c:#C77B7B"><small>kcal</small><strong>${totals.kcal}</strong></div>
        <div class="stat-tile" style="--c:#8FB89C"><small>protein</small><strong>${totals.protein}g</strong></div>
        <div class="stat-tile" style="--c:#D4A574"><small>carbs</small><strong>${totals.carbs}g</strong></div>
        <div class="stat-tile" style="--c:#A88BB8"><small>fat</small><strong>${totals.fat}g</strong></div>
      </div>

      <div class="segmented">
        ${SLOTS.map((s) => html`
          <button class=${`seg ${slot === s.id ? "active" : ""}`} onClick=${() => setSlot(s.id)}>${s.emoji} ${s.label}</button>
        `)}
      </div>

      <section class="block">
        <div class="block-head">
          <h2>Build from what you have</h2>
          <button class="btn-secondary small" onClick=${() => openSheet({ type: "pantry" })}>Pantry (${pantry.length})</button>
        </div>
        ${pantry.length === 0
          ? html`<div class="card empty">
              <span class="empty-ico">🧺</span>
              <p>Tell us what's in your kitchen.</p>
              <small class="muted">We'll suggest meals from your approved ingredients only — no eggs.</small>
              <button class="btn-primary small" onClick=${() => openSheet({ type: "pantry" })}>Open pantry</button>
            </div>`
          : html`<div class="block">
              ${suggestions.map(({ template, needsHit, needsMiss }) => html`
                <button class="card meal-card flat" key=${template.id} onClick=${() => logMealFromTemplate(template)} style="--c:#C77B7B">
                  <span class="meal-emoji">${template.emoji}</span>
                  <div class="meal-body">
                    <strong>${template.name}</strong>
                    <small class="muted">${template.portion}</small>
                    <div class="meal-macros">
                      <span class="m">🔥 <b>${template.kcal}</b></span>
                      <span class="m">P <b>${template.protein}g</b></span>
                      <span class="m">C <b>${template.carbs}g</b></span>
                      <span class="m">F <b>${template.fat}g</b></span>
                      ${needsMiss > 0 && html`<span class="chip" style="--c:#D4A574">${needsMiss} missing · fallback</span>`}
                    </div>
                  </div>
                </button>
              `)}
            </div>`}
      </section>

      <section class="block">
        <div class="block-head">
          <h2>AI meal · ChatGPT</h2>
          <small class="muted">${aiEnabled() ? "Connected" : "Add key in Settings"}</small>
        </div>
        <button class="btn-primary" onClick=${generateAIMeal} disabled=${busy || !aiEnabled()}>
          ${busy ? "Thinking…" : `Build a ${SLOTS.find((s) => s.id === slot).label.toLowerCase()} from my pantry`}
        </button>
        ${aiMeal && html`
          <div class="card meal-card flat" style="--c:#A88BB8">
            <span class="meal-emoji">${aiMeal.emoji || "🍽️"}</span>
            <div class="meal-body">
              <strong>${aiMeal.name}</strong>
              <small class="muted">${aiMeal.portion || ""}</small>
              <small>${aiMeal.steps || ""}</small>
              <div class="meal-macros">
                <span class="m">🔥 <b>${aiMeal.kcal || 0}</b></span>
                <span class="m">P <b>${aiMeal.protein || 0}g</b></span>
                <span class="m">C <b>${aiMeal.carbs || 0}g</b></span>
                <span class="m">F <b>${aiMeal.fat || 0}g</b></span>
              </div>
              ${Array.isArray(aiMeal.missing) && aiMeal.missing.length > 0 && html`<small class="muted">Missing: ${aiMeal.missing.join(", ")}</small>`}
              <div style="display:flex;gap:8px;margin-top:6px;">
                <button class="btn-primary small" onClick=${logAiMeal}>Log meal</button>
                <button class="btn-secondary small" onClick=${() => setAiMeal(null)}>Discard</button>
              </div>
            </div>
          </div>
        `}
      </section>

      <section class="block">
        <div class="block-head">
          <h2>Today's meals</h2>
          <button class="btn-secondary small" onClick=${() => setShowImport((v) => !v)}>Import MyNetDiary</button>
        </div>
        ${showImport && html`
          <div class="card form-card">
            <small class="muted">Paste your MyNetDiary daily summary (Breakfast / Lunch / Dinner sections). We'll log each line.</small>
            <textarea rows="6" value=${importText} onInput=${(e) => setImportText(e.target.value)} placeholder="Breakfast / Lunch / Dinner sections, then lines like: Greek yogurt — 200 kcal · 20p 24c 6f"></textarea>
            <button class="btn-primary small" onClick=${doImport}>Import</button>
          </div>
        `}
        ${todayMeals.length === 0
          ? html`<div class="card empty"><span class="empty-ico">🍽️</span><p>Nothing logged yet today.</p></div>`
          : todayMeals.map((m) => html`
              <div class="card meal-card flat" style="--c:#8FB89C" key=${m.id}>
                <span class="meal-emoji">${m.emoji || "🍽️"}</span>
                <div class="meal-body">
                  <strong>${m.name}</strong>
                  <small class="muted">${SLOTS.find((s) => s.id === m.slot)?.label || m.slot} · ${m.portion || ""}</small>
                  <div class="meal-macros">
                    <span class="m">🔥 <b>${m.kcal || 0}</b></span>
                    <span class="m">P <b>${m.protein || 0}g</b></span>
                    <span class="m">C <b>${m.carbs || 0}g</b></span>
                    <span class="m">F <b>${m.fat || 0}g</b></span>
                    ${m.source && html`<span class="chip outline">${m.source}</span>`}
                  </div>
                </div>
                <button class="icon-btn bare" onClick=${() => { tap(); remove("meals", m.id); }}>×</button>
              </div>
            `)}
      </section>

      <div class="card form-card" style="background:var(--surface-2);">
        <h3>Food rules</h3>
        <small class="muted">• Only approved categories · • No eggs · • Treats live in Snack Box only · • Portions stay explicit · • Fallback meal when ingredients are incomplete · • Short, realistic steps.</small>
      </div>
    </section>
  `;
}

function currentSlot() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}
