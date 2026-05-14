import { Router } from "express";
import { getState, update } from "../data/store.js";
import { environmentFlows } from "../data/seed.js";
import { awardXp, bumpStreak } from "../services/progression.js";

const router = Router();

router.get("/flows", (_req, res) => {
  res.json(
    Object.entries(environmentFlows).map(([id, f]) => ({
      id,
      label: f.label,
      estimate: f.estimate,
      stepCount: f.steps.length,
    }))
  );
});

router.get("/flows/:id", (req, res) => {
  const flow = environmentFlows[req.params.id];
  if (!flow) return res.status(404).json({ error: "unknown flow" });
  res.json({ id: req.params.id, ...flow });
});

router.post("/log", (req, res) => {
  const { flowId, stepIds, note } = req.body ?? {};
  const flow = environmentFlows[flowId];
  if (!flow) return res.status(400).json({ error: "unknown flowId" });
  const validIds = new Set(flow.steps.map((s) => s.id));
  const cleanSteps = Array.isArray(stepIds) ? stepIds.filter((s) => validIds.has(s)) : [];
  const completed = cleanSteps.length === flow.steps.length;
  update((s) => {
    s.history.roomResets.push({
      at: new Date().toISOString(),
      date: s.today.date,
      flowId,
      stepIds: cleanSteps,
      completed,
      note: note ?? null,
    });
  });
  cleanSteps.forEach(() => awardXp("room_reset_step"));
  if (completed) {
    awardXp("room_reset_completed", { flowId });
    bumpStreak("roomReset");
  }
  res.json({ ok: true, completed });
});

router.get("/log/recent", (_req, res) => {
  res.json(getState().history.roomResets.slice(-10).reverse());
});

export default router;
