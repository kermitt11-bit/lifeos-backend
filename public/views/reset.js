import { html, useState } from "../lib/ui.js";
import { state, upsert } from "../lib/store.js";
import { uuid, fmtDate, isSameDay } from "../lib/utils.js";
import { aiEnabled, ask } from "../lib/ai.js";
import { success } from "../lib/haptic.js";

const PRESETS = [
  {
    id: "overwhelmed",
    icon: "🌫",
    label: "Overwhelmed",
    blurb: "Too much in your head. Let's shrink the world for 30 minutes.",
    steps: [
      { t: "Stand up. One full breath in for 4, out for 6.", d: "60 seconds" },
      { t: "Drink a glass of water.", d: "1 minute" },
      { t: "Write down the 3 things looping in your head.", d: "3 minutes" },
      { t: "Pick ONLY the one with the smallest first step.", d: "2 minutes" },
      { t: "Do JUST that first step. Nothing else counts.", d: "15 minutes" },
      { t: "Notice you did the thing. Park the rest for later.", d: "1 minute" },
    ],
  },
  {
    id: "off-day",
    icon: "🧶",
    label: "After an off day",
    blurb: "Yesterday was a mess. We're not catching up — we're restarting gentle.",
    steps: [
      { t: "Open your planner. Drag yesterday's unfinished items to a 'maybe later' note.", d: "2 minutes" },
      { t: "Pick exactly ONE non-negotiable for today.", d: "1 minute" },
      { t: "Eat something with protein.", d: "10 minutes" },
      { t: "Walk for 10 minutes outside if you can.", d: "10 minutes" },
      { t: "Do the one non-negotiable.", d: "open" },
      { t: "Log a mood check-in tonight. No story, just the number.", d: "1 minute" },
    ],
  },
  {
    id: "low-energy",
    icon: "🔋",
    label: "Low energy",
    blurb: "Your fuel tank is low. We're not pushing — we're resourcing.",
    steps: [
      { t: "Snack-box mode: one savory + one sweet. Eat it.", d: "5 minutes" },
      { t: "Lie down and listen to one song.", d: "4 minutes" },
      { t: "Pick a 5-minute hobby from the joy engine.", d: "5 minutes" },
      { t: "Switch the workout to a 15-min easy walk.", d: "15 minutes" },
      { t: "Bed earlier tonight by 30 min.", d: "tonight" },
    ],
  },
  {
    id: "anxious",
    icon: "🌊",
    label: "Anxious",
    blurb: "Your nervous system is buzzing. We tell it: it's safe to come down.",
    steps: [
      { t: "Box breathing: 4 in, 4 hold, 4 out, 4 hold. Four rounds.", d: "2 minutes" },
      { t: "Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste.", d: "3 minutes" },
      { t: "Cold water on the inside of your wrists.", d: "30 seconds" },
      { t: "Write the worry as one sentence.", d: "2 minutes" },
      { t: "Write the next 1 cm of action.", d: "2 minutes" },
      { t: "Do that. Stop after.", d: "10 minutes" },
    ],
  },
];

export function ResetView({ goTab }) {
  const [active, setActive] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const moods = state.moods.value;
  const lastMood = moods[moods.length - 1];

  async function logUsed(preset) {
    success();
    await upsert("reviews", {
      id: uuid(),
      kind: "reset",
      label: preset.label,
      date: new Date().toISOString(),
    });
  }

  async function aiReset() {
    if (!aiEnabled()) { alert("Connect ChatGPT in Settings → Integrations."); return; }
    setBusy(true);
    try {
      const data = await ask({
        system: "You guide someone through a calm 30-minute reset. Be kind, never shame, never push. Use specific tiny steps. Acknowledge feelings. JSON only.",
        user: `Mood: ${lastMood?.score ?? "unknown"} / 10. Energy: ${lastMood?.energy ?? "unknown"}. The user feels off and wants the easiest path for the next 30 minutes. Return JSON: {blurb, steps:[{t, d}]}`,
        json: true,
      });
      setAiResult(data);
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  }

  return html`
    <section class="screen reset-screen">
      <div class="reset-hero">
        <p class="eyebrow">Reset</p>
        <h1>It's okay.</h1>
        <p class="muted" style="max-width:380px;margin:6px auto 0;">When you're off track, we shrink the world. No catching up, no shaming. Pick what's true right now.</p>
      </div>

      ${!active && !aiResult && html`
        <section class="block">
          <div class="block-head"><h2>Pick one</h2></div>
          <div class="hub-grid">
            ${PRESETS.map((p) => html`
              <button class="hub-tile" key=${p.id} style="--c:#C77B7B" onClick=${() => setActive(p)}>
                <span class="hub-ico">${p.icon}</span>
                <strong>${p.label}</strong>
                <small>${p.blurb}</small>
              </button>
            `)}
          </div>
        </section>

        <section class="block">
          <div class="block-head"><h2>Or build with AI</h2></div>
          <button class="btn-primary" onClick=${aiReset} disabled=${busy || !aiEnabled()}>${busy ? "Thinking…" : "Build me a reset for right now"}</button>
        </section>
      `}

      ${active && html`
        <section class="block">
          <div class="block-head"><h2>${active.icon} ${active.label}</h2><button class="link" onClick=${() => setActive(null)}>‹ back</button></div>
          <p class="muted">${active.blurb}</p>
          ${active.steps.map((s, i) => html`
            <div class="reset-step" key=${i}>
              <div class="reset-n">${i + 1}</div>
              <div><strong>${s.t}</strong><small>${s.d}</small></div>
            </div>
          `)}
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn-primary" onClick=${() => { logUsed(active); setActive(null); goTab("home"); }}>Done · go home</button>
            <button class="btn-secondary" onClick=${() => setActive(null)}>Pick different</button>
          </div>
        </section>
      `}

      ${aiResult && html`
        <section class="block">
          <div class="block-head"><h2>🪄 Custom reset</h2><button class="link" onClick=${() => setAiResult(null)}>‹ back</button></div>
          <p class="muted">${aiResult.blurb}</p>
          ${(aiResult.steps || []).map((s, i) => html`
            <div class="reset-step" key=${i}>
              <div class="reset-n">${i + 1}</div>
              <div><strong>${s.t}</strong>${s.d ? html`<small>${s.d}</small>` : null}</div>
            </div>
          `)}
          <button class="btn-primary" onClick=${() => { logUsed({ label: "AI reset" }); setAiResult(null); goTab("home"); }}>Done · go home</button>
        </section>
      `}
    </section>
  `;
}
