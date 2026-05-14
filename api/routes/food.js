import { Router } from "express";
import { getState, update } from "../data/store.js";
import { mealTemplates, safeMeals, cravingDecisions, decisionTrees } from "../data/seed.js";
import { awardXp, bumpStreak } from "../services/progression.js";

const router = Router();

const allMeals = () => Object.values(mealTemplates).flat();
const mealById = (id) => allMeals().find((m) => m.id === id);

router.get("/templates", (_req, res) => {
  res.json(mealTemplates);
});

router.get("/safe-meals", (_req, res) => {
  res.json(safeMeals.map(mealById).filter(Boolean));
});

router.get("/crave", (req, res) => {
  const craving = String(req.query.craving ?? "").toLowerCase();
  const advice = cravingDecisions[craving];
  if (!advice) {
    return res.status(400).json({
      error: "unknown craving",
      allowed: Object.keys(cravingDecisions),
    });
  }
  res.json({ craving, steps: advice });
});

router.get("/decision/:key", (req, res) => {
  const tree = decisionTrees[req.params.key];
  if (!tree) return res.status(404).json({ error: "unknown decision tree", allowed: Object.keys(decisionTrees) });
  res.json(tree);
});

router.get("/decisions", (_req, res) => {
  res.json(Object.entries(decisionTrees).map(([key, t]) => ({ key, title: t.title })));
});

router.post("/log", (req, res) => {
  const { mealId, slot, custom, note } = req.body ?? {};
  const meal = mealId ? mealById(mealId) : null;
  if (!meal && !custom) return res.status(400).json({ error: "mealId or custom required" });
  update((s) => {
    s.history.meals.push({
      at: new Date().toISOString(),
      date: s.today.date,
      slot: slot ?? null,
      mealId: meal?.id ?? null,
      name: meal?.name ?? custom,
      note: note ?? null,
    });
  });
  bumpStreak("foodLog");
  awardXp("meal_logged", { mealId: meal?.id, slot });
  res.json({ ok: true });
});

router.get("/log/today", (_req, res) => {
  const s = getState();
  res.json(s.history.meals.filter((m) => m.date === s.today.date));
});

export default router;
