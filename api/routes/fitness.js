import { Router } from "express";
import { getState, update } from "../data/store.js";
import { workouts, trainingModes } from "../data/seed.js";
import { awardXp, bumpStreak } from "../services/progression.js";

const router = Router();

router.get("/modes", (_req, res) => {
  res.json(trainingModes.map((m) => ({ id: m, options: workouts[m]?.length ?? 0 })));
});

router.get("/workouts/:mode", (req, res) => {
  const list = workouts[req.params.mode];
  if (!list) return res.status(404).json({ error: "unknown mode" });
  res.json(list);
});

router.get("/today", (_req, res) => {
  const s = getState();
  const mode = s.today.mode.training;
  const list = workouts[mode] ?? workouts.rest;
  res.json({ mode, options: list });
});

router.post("/complete", (req, res) => {
  const { workoutId, mode, note, durationOverride } = req.body ?? {};
  const list = workouts[mode] ?? Object.values(workouts).flat();
  const workout = list.find((w) => w.id === workoutId);
  if (!workout) return res.status(404).json({ error: "unknown workout" });
  update((s) => {
    s.history.workouts.push({
      at: new Date().toISOString(),
      date: s.today.date,
      workoutId,
      mode: mode ?? null,
      duration: durationOverride ?? workout.duration,
      note: note ?? null,
    });
  });
  bumpStreak("movement");
  awardXp(mode === "emergency_15" ? "workout_emergency" : "workout_completed", { workoutId });
  res.json({ ok: true });
});

router.get("/log/recent", (_req, res) => {
  res.json(getState().history.workouts.slice(-20).reverse());
});

export default router;
