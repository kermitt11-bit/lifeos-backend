import { html, useState, useMemo } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import { uuid, fmtDate } from "../lib/utils.js";
import {
  PANTRY_KINDS, PANTRY_GROUPS, PANTRY_LOCATIONS, SLOTS,
  RECIPES, kindFor, slotFor, generatePlan, dateKey, pickTip,
} from "../lib/meals.js";
import { tap, success } from "../lib/haptic.js";

export function MealsView({ openSheet }) {
  const [tab, setTab] = useState("today");
  const pantry = state.pantry.value;
  const plans = state.mealPlans.value;

  const today = new Date();
  const todayId = dateKey(today);
  const todayPlan = plans.find((p) => p.id === todayId);

  return html`
    <section class="screen">
      <header class="hero compact">
        <p class="hero-date">Meals</p>
        <h1>Use what you have</h1>
        <p class="hero-sub">A calm, slotted plan from your pantry — no shopping.</p>
      </header>

      <div class="segmented">
        <button class=${`seg ${tab === "today" ? "active" : ""}`} onClick=${() => setTab("today")}>Today</button>
        <button class=${`seg ${tab === "pantry" ? "active" : ""}`} onClick=${() => setTab("pantry")}>Pantry · ${pantry.length}</button>
        <button class=${`seg ${tab === "recipes" ? "active" : ""}`} onClick=${() => setTab("recipes")}>Recipes</button>
      </div>

      ${tab === "today" && html`<${TodayPlan} plan=${todayPlan} pantry=${pantry} openSheet=${openSheet} switchToPantry=${() => setTab("pantry")} />`}
      ${tab === "pantry" && html`<${PantryView} pantry=${pantry} openSheet=${openSheet} />`}
      ${tab === "recipes" && html`<${RecipesView} pantry=${pantry} />`}
    </section>
  `;
}

// -------------------- Today plan --------------------

function TodayPlan({ plan, pantry, openSheet, switchToPantry }) {
  const today = new Date();
  const [tip, setTip] = useState(() => pickTip());

  async function generate() {
    const fresh = generatePlan(today, pantry);
    success();
    await upsert("mealPlans", fresh);
  }

  async function clearPlan() {
    if (!plan) return;
    if (!confirm("Clear today's plan?")) return;
    await remove("mealPlans", plan.id);
  }

  if (!plan) {
    return html`
      <div class="card empty meals-empty">
        <div class="meals-art">🍽️</div>
        <h3>No plan for today yet</h3>
        <p class="muted center">
          ${pantry.length === 0
            ? "Add a few things from your fridge/pantry first — even 5 items is enough."
            : `Generate a meal plan from your ${pantry.length} pantry item${pantry.length === 1 ? "" : "s"}.`}
        </p>
        ${pantry.length === 0
          ? html`<button class="btn-primary" onClick=${switchToPantry}>Add pantry items →</button>`
          : html`<button class="btn-primary big" onClick=${generate}>✨ Build today's plan</button>`}
      </div>

      ${pantry.length === 0 && html`
        <div class="card meals-howto">
          <h3>How it works</h3>
          <ol class="howto">
            <li><strong>Tap Pantry</strong> and tap-add what you have. Use the staples shortcut.</li>
            <li><strong>Build today's plan</strong> — we match recipes to your pantry only.</li>
            <li><strong>Check in</strong> before each meal: a 1–10 hunger scale beats reaching for junk on autopilot.</li>
          </ol>
        </div>
      `}
    `;
  }

  const slotsArr = SLOTS.map((s) => ({ slot: s, meal: plan.slots?.[s.id] || null }));
  const eatenCount = slotsArr.filter((s) => s.meal?.eaten).length;
  const totalCount = slotsArr.filter((s) => s.meal).length;

  async function markEaten(slotId) {
    const meal = plan.slots[slotId];
    success();
    await upsert("mealPlans", {
      ...plan,
      slots: { ...plan.slots, [slotId]: { ...meal, eaten: !meal.eaten, eatenAt: !meal.eaten ? new Date().toISOString() : null, skipped: false } },
    });
  }

  async function skipMeal(slotId) {
    const meal = plan.slots[slotId];
    tap();
    await upsert("mealPlans", {
      ...plan,
      slots: { ...plan.slots, [slotId]: { ...meal, skipped: !meal.skipped, eaten: false } },
    });
  }

  async function logWater(delta) {
    tap();
    await upsert("mealPlans", { ...plan, waterCups: Math.max(0, (plan.waterCups || 0) + delta) });
  }

  async function setHunger(slotId, key, value) {
    const meal = plan.slots[slotId];
    await upsert("mealPlans", {
      ...plan,
      slots: { ...plan.slots, [slotId]: { ...meal, [key]: value } },
    });
  }

  return html`
    <div class="meals-day-head">
      <div>
        <strong>${fmtDate(today, { weekday: "long", month: "long", day: "numeric" })}</strong>
        <small class="muted">${eatenCount}/${totalCount} eaten · ${plan.waterCups || 0} cups water</small>
      </div>
      <button class="link" onClick=${clearPlan}>Reset</button>
    </div>

    <div class="card water-card">
      <div class="water-head">
        <span>💧 Water</span>
        <strong>${plan.waterCups || 0} / 8 cups</strong>
      </div>
      <div class="water-row">
        ${Array.from({ length: 8 }, (_, i) => html`
          <button class=${`water-cup ${i < (plan.waterCups || 0) ? "on" : ""}`}
                  onClick=${() => logWater(i < (plan.waterCups || 0) ? -1 : 1)} key=${i}>💧</button>
        `)}
      </div>
      <small class="muted">A glass of water before each meal kills 60% of the false-hunger noise.</small>
    </div>

    <div class="meals-plan">
      ${slotsArr.map(({ slot, meal }) => html`
        <${MealCard} key=${slot.id} slot=${slot} meal=${meal}
                     onToggleEaten=${() => markEaten(slot.id)}
                     onSkip=${() => skipMeal(slot.id)}
                     onSwap=${() => openSheet({ type: "meal-swap", planId: plan.id, slotId: slot.id })}
                     onHunger=${(k, v) => setHunger(slot.id, k, v)} />
      `)}
    </div>

    <div class="card sos-card">
      <div class="sos-head">
        <span>🌊 Craving SOS</span>
        <button class="link small" onClick=${() => setTip(pickTip(Math.random() * 1e9))}>New tip</button>
      </div>
      <p class="sos-body">${tip}</p>
    </div>

    <button class="btn-secondary" onClick=${generate}>↻ Regenerate plan</button>
  `;
}

function MealCard({ slot, meal, onToggleEaten, onSkip, onSwap, onHunger }) {
  const [expanded, setExpanded] = useState(false);
  if (!meal) {
    return html`
      <div class="meal-card ghost" style=${`--c:${slot.color}`}>
        <div class="meal-head">
          <span class="meal-time">${slot.time}</span>
          <span class="meal-slot">${slot.icon} ${slot.label}</span>
        </div>
        <p class="muted small">No match in your pantry. <button class="link inline" onClick=${onSwap}>Browse recipes</button></p>
      </div>
    `;
  }
  const status = meal.eaten ? "eaten" : meal.skipped ? "skipped" : "pending";
  return html`
    <div class=${`meal-card ${status}`} style=${`--c:${slot.color}`}>
      <div class="meal-head">
        <span class="meal-time">${meal.time}</span>
        <span class="meal-slot">${slot.icon} ${slot.label}</span>
        <button class="meal-swap" onClick=${onSwap} title="Swap">↻</button>
      </div>
      <button class="meal-body" onClick=${() => setExpanded(!expanded)}>
        <strong>${meal.name}</strong>
        <small class="muted">${meal.minutes}m · ${meal.ingredients.length} ingredients</small>
      </button>
      ${expanded && html`
        <div class="meal-detail">
          <div class="meal-ings">
            ${meal.ingredients.map((ing, i) => {
              const k = kindFor(ing.kind);
              return html`<span class=${`pill small ${ing.optional ? "ghost" : ""}`} key=${i}>${k?.icon || "•"} ${k?.label || ing.kind} · ${ing.qty} ${ing.unit}</span>`;
            })}
          </div>
          <ol class="meal-steps">
            ${meal.steps.map((s, i) => html`<li key=${i}>${s}</li>`)}
          </ol>
          ${meal.note && html`<p class="meal-note">💡 ${meal.note}</p>`}
          <div class="hunger-row">
            <div class="hunger-block">
              <small class="muted">Hunger before</small>
              <${HungerScale} value=${meal.hungerBefore} onChange=${(v) => onHunger("hungerBefore", v)} />
            </div>
            ${meal.eaten && html`
              <div class="hunger-block">
                <small class="muted">Fullness after</small>
                <${HungerScale} value=${meal.hungerAfter} onChange=${(v) => onHunger("hungerAfter", v)} />
              </div>
            `}
          </div>
        </div>
      `}
      <div class="meal-actions">
        <button class=${`btn-secondary small ${meal.skipped ? "active" : ""}`} onClick=${onSkip}>${meal.skipped ? "Un-skip" : "Skip"}</button>
        <button class=${`btn-primary small ${meal.eaten ? "done" : ""}`} onClick=${onToggleEaten}>${meal.eaten ? "✓ Eaten" : "Mark eaten"}</button>
      </div>
    </div>
  `;
}

function HungerScale({ value, onChange }) {
  return html`
    <div class="hunger-scale">
      ${[1,2,3,4,5,6,7,8,9,10].map((n) => html`
        <button class=${`h-dot ${value === n ? "on" : ""}`} key=${n} onClick=${() => onChange(n)}>${n}</button>
      `)}
    </div>
  `;
}

// -------------------- Pantry --------------------

function PantryView({ pantry, openSheet }) {
  const grouped = useMemo(() => {
    const byGroup = {};
    for (const item of pantry) {
      const k = kindFor(item.kind);
      const g = k?.group || "other";
      (byGroup[g] = byGroup[g] || []).push(item);
    }
    return byGroup;
  }, [pantry]);

  async function quickAdd(kindId) {
    const k = kindFor(kindId);
    if (!k) return;
    if (pantry.some((p) => p.kind === kindId)) return;
    success();
    await upsert("pantry", {
      id: uuid(),
      kind: kindId,
      qty: 1,
      unit: k.unit,
      location: k.cat,
      addedAt: new Date().toISOString(),
    });
  }

  async function clearAll() {
    if (!confirm("Clear your entire pantry?")) return;
    for (const item of pantry) await remove("pantry", item.id);
  }

  return html`
    <div class="pantry-actions">
      <button class="btn-primary small" onClick=${() => openSheet({ type: "pantry" })}>+ Add item</button>
      ${pantry.length > 0 && html`<button class="link" onClick=${clearAll}>Clear all</button>`}
    </div>

    ${pantry.length === 0 && html`
      <div class="card meals-empty">
        <div class="meals-art">🧺</div>
        <h3>Start with what's in front of you</h3>
        <p class="muted center">Tap a staple below — you can add specifics with the + button.</p>
      </div>
    `}

    <div class="card">
      <h3>Quick staples</h3>
      <p class="muted small">Tap any to add. They jump into your pantry instantly.</p>
      <div class="staples">
        ${PANTRY_KINDS.map((k) => {
          const have = pantry.some((p) => p.kind === k.id);
          return html`
            <button class=${`staple ${have ? "have" : ""}`} key=${k.id} onClick=${() => quickAdd(k.id)}>
              <span>${k.icon}</span>
              <small>${k.label}</small>
              ${have && html`<span class="staple-check">✓</span>`}
            </button>
          `;
        })}
      </div>
    </div>

    ${PANTRY_GROUPS.map((g) => {
      const items = grouped[g.id] || [];
      if (items.length === 0) return null;
      return html`
        <div class="block" key=${g.id}>
          <div class="block-head">
            <h2>${g.icon} ${g.label}</h2>
            <small class="muted">${items.length}</small>
          </div>
          <div class="pantry-list">
            ${items.map((item) => {
              const k = kindFor(item.kind);
              return html`
                <button class="pantry-row" key=${item.id} onClick=${() => openSheet({ type: "pantry", item })}>
                  <span class="pantry-icon" style=${`--c:${g.color}`}>${k?.icon || "•"}</span>
                  <span class="pantry-info">
                    <strong>${k?.label || item.kind}</strong>
                    <small class="muted">${item.qty} ${item.unit} · ${PANTRY_LOCATIONS.find((l) => l.id === item.location)?.label || item.location}</small>
                  </span>
                  <span class="chev">›</span>
                </button>
              `;
            })}
          </div>
        </div>
      `;
    })}
  `;
}

// -------------------- Recipes --------------------

function RecipesView({ pantry }) {
  const [filter, setFilter] = useState("all");
  const kindSet = useMemo(() => new Set(pantry.map((p) => p.kind)), [pantry]);

  const cards = useMemo(() => {
    return RECIPES.map((r) => {
      const required = r.needs.filter((n) => !n.optional);
      const missing = required.filter((n) => !kindSet.has(n.kind));
      const optHave = r.needs.filter((n) => n.optional && kindSet.has(n.kind)).length;
      return { r, missing, ready: missing.length === 0, optHave };
    }).sort((a, b) => Number(b.ready) - Number(a.ready) || a.missing.length - b.missing.length);
  }, [kindSet]);

  const filtered = cards.filter((c) => {
    if (filter === "ready") return c.ready;
    if (filter === "almost") return c.missing.length > 0 && c.missing.length <= 2;
    if (filter === "breakfast") return c.r.slot === "breakfast";
    if (filter === "lunch") return c.r.slot === "lunch";
    if (filter === "dinner") return c.r.slot === "dinner";
    if (filter === "snack") return c.r.slot.startsWith("snack");
    return true;
  });

  const filters = [
    { id: "all", label: "All" },
    { id: "ready", label: "Ready now" },
    { id: "almost", label: "Almost" },
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "snack", label: "Snack" },
  ];

  return html`
    <div class="tag-row">
      ${filters.map((f) => html`
        <button class=${`pill ${filter === f.id ? "active" : ""}`} onClick=${() => setFilter(f.id)} key=${f.id}>${f.label}</button>
      `)}
    </div>

    <div class="recipe-list">
      ${filtered.map(({ r, missing, ready, optHave }) => html`
        <div class=${`card recipe-card ${ready ? "ready" : ""}`} key=${r.id}>
          <div class="recipe-head">
            <strong>${r.name}</strong>
            <small class="muted">${slotFor(r.slot).icon} ${slotFor(r.slot).label} · ${r.minutes}m</small>
          </div>
          ${ready
            ? html`<span class="badge success">Ready · +${optHave} extras</span>`
            : html`<span class="muted small">Missing: ${missing.map((m) => kindFor(m.kind)?.label || m.kind).join(", ")}</span>`}
          <details class="recipe-detail">
            <summary class="link small">Show recipe</summary>
            <div class="recipe-ings">
              ${r.needs.map((n, i) => html`
                <span class=${`pill small ${n.optional ? "ghost" : ""} ${kindSet.has(n.kind) ? "" : "missing"}`} key=${i}>
                  ${kindFor(n.kind)?.icon || "•"} ${kindFor(n.kind)?.label || n.kind} · ${n.qty} ${n.unit}${n.optional ? " (opt)" : ""}
                </span>
              `)}
            </div>
            <ol class="meal-steps">
              ${r.steps.map((s, i) => html`<li key=${i}>${s}</li>`)}
            </ol>
            ${r.note && html`<p class="meal-note">💡 ${r.note}</p>`}
          </details>
        </div>
      `)}
    </div>
  `;
}
