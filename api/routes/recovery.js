import { Router } from "express";
import { getState, update } from "../data/store.js";
import { recoveryPathways } from "../data/seed.js";
import { awardXp } from "../services/progression.js";

const router = Router();

router.get("/triggers", (_req, res) => {
  res.json(
    Object.entries(recoveryPathways).map(([id, p]) => ({
      id,
      label: p.label,
      intro: p.intro,
      stepCount: p.steps.length,
    }))
  );
});

router.get("/active", (_req, res) => {
  const a = getState().recovery.active;
  if (!a) return res.json({ active: false });
  const pathway = recoveryPathways[a.trigger];
  res.json({
    active: true,
    trigger: a.trigger,
    label: pathway.label,
    intro: pathway.intro,
    startedAt: a.startedAt,
    steps: pathway.steps.map((s) => ({
      ...s,
      done: a.completedSteps.includes(s.id),
    })),
    progress: Math.round((a.completedSteps.length / pathway.steps.length) * 100),
  });
});

router.post("/start", (req, res) => {
  const { trigger } = req.body ?? {};
  if (!trigger || !recoveryPathways[trigger]) {
    return res.status(400).json({ error: "unknown trigger" });
  }
  update((s) => {
    s.recovery.active = {
      trigger,
      completedSteps: [],
      startedAt: new Date().toISOString(),
    };
  });
  awardXp("recovery_started", { trigger });
  const pathway = recoveryPathways[trigger];
  res.json({
    trigger,
    label: pathway.label,
    intro: pathway.intro,
    steps: pathway.steps.map((s) => ({ ...s, done: false })),
  });
});

router.post("/step/:id", (req, res) => {
  const { id } = req.params;
  const s = getState();
  const active = s.recovery.active;
  if (!active) return res.status(400).json({ error: "no active recovery" });
  const pathway = recoveryPathways[active.trigger];
  if (!pathway.steps.find((st) => st.id === id)) {
    return res.status(404).json({ error: "step not in pathway" });
  }
  let added = false;
  update((draft) => {
    if (!draft.recovery.active.completedSteps.includes(id)) {
      draft.recovery.active.completedSteps.push(id);
      added = true;
    }
  });
  if (added) awardXp("recovery_step", { trigger: active.trigger, step: id });

  const updated = getState().recovery.active;
  const complete = updated.completedSteps.length === pathway.steps.length;
  if (complete) {
    update((draft) => {
      draft.history.recoveries.push({
        trigger: draft.recovery.active.trigger,
        startedAt: draft.recovery.active.startedAt,
        completedAt: new Date().toISOString(),
      });
      draft.recovery.active = null;
    });
    awardXp("recovery_completed", { trigger: active.trigger });
  }
  res.json({ complete, progress: Math.round((updated.completedSteps.length / pathway.steps.length) * 100) });
});

router.post("/cancel", (_req, res) => {
  update((s) => { s.recovery.active = null; });
  res.json({ ok: true });
});

export default router;
