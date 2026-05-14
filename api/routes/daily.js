import { Router } from "express";
import { getState, update, ensureToday } from "../data/store.js";
import {
  morningReset,
  mvpDay,
  dayTypes,
  energyLevels,
  trainingModes,
  healthModes,
  workouts,
  mealTemplates,
  safeMeals,
  environmentFlows,
} from "../data/seed.js";
import { awardXp, bumpStreak } from "../services/progression.js";

const router = Router();

const flattenMeals = () =>
  Object.values(mealTemplates).flat().reduce((acc, m) => ({ ...acc, [m.id]: m }), {});

const adaptiveFlow = (s) => {
  const { mode, mvp } = s.today;
  if (mvp) {
    return {
      headline: "Minimum Viable Day",
      subline: "Five gentle wins. Nothing else is required of you today.",
      checklist: mvpDay,
    };
  }
  if (mode.health === "sick" || mode.health === "period") {
    return {
      headline: "Soft Day",
      subline: "Your body is doing real work. We are not running optimisation today.",
      checklist: [
        { id: "soft_hydrate", label: "Hydrate — water, herbal tea, broth" },
        { id: "soft_eat", label: "Eat something warm and easy" },
        { id: "soft_horizontal", label: "Permission to be horizontal" },
        { id: "soft_one_thing", label: "One small thing for future-you (e.g. wash face)" },
      ],
    };
  }
  if (mode.energy === "depleted") {
    return {
      headline: "Battery Saver",
      subline: "We protect tomorrow by not pushing today.",
      checklist: mvpDay,
    };
  }
  return {
    headline: mode.dayType === "weekend" ? "Weekend Flow" : "Today's Flow",
    subline: "Steady wins. Not perfect — present.",
    checklist: morningReset,
  };
};

const todaysWorkoutPick = (s) => {
  const list = workouts[s.today.mode.training] ?? workouts.rest;
  return list[0] ?? null;
};

const todaysMealPlan = (s) => {
  const meals = flattenMeals();
  const useSafe = s.today.mvp || ["depleted", "low"].includes(s.today.mode.energy) || s.today.mode.health !== "ok";
  if (useSafe) {
    return {
      mode: "safe_defaults",
      breakfast: meals["bf_greekyog"],
      lunch: meals["lu_leftovers"],
      dinner: meals["di_eggsdinner"],
      snack: meals["sn_yog"],
    };
  }
  return {
    mode: "regular",
    breakfast: mealTemplates.breakfast[0],
    lunch: mealTemplates.lunch[0],
    dinner: mealTemplates.dinner[0],
    snack: mealTemplates.snack[1],
  };
};

router.get("/today", (req, res) => {
  ensureToday();
  const s = getState();
  res.json({
    date: s.today.date,
    mode: s.today.mode,
    mvp: s.today.mvp,
    focus: s.today.focus,
    mood: s.today.mood,
    flow: adaptiveFlow(s),
    workout: todaysWorkoutPick(s),
    meals: todaysMealPlan(s),
    quickReset: environmentFlows.room_reset_10,
    completedSteps: s.today.completedSteps,
    recoveryActive: !!s.recovery.active,
  });
});

router.get("/options", (_req, res) => {
  res.json({ dayTypes, energyLevels, trainingModes, healthModes });
});

router.post("/mode", (req, res) => {
  const { dayType, energy, training, health } = req.body ?? {};
  update((s) => {
    if (dayType && dayTypes.includes(dayType)) s.today.mode.dayType = dayType;
    if (energy && energyLevels.includes(energy)) s.today.mode.energy = energy;
    if (training && trainingModes.includes(training)) s.today.mode.training = training;
    if (health && healthModes.includes(health)) s.today.mode.health = health;
  });
  awardXp("day_mode_set");
  res.json(getState().today);
});

router.post("/mood", (req, res) => {
  const { feeling, note } = req.body ?? {};
  if (!feeling) return res.status(400).json({ error: "feeling required" });
  update((s) => {
    s.today.mood = { feeling, note: note ?? null, at: new Date().toISOString() };
    s.history.moods.push({ ...s.today.mood, date: s.today.date });
  });
  bumpStreak("dailyCheckin");
  awardXp("mood_checkin", { feeling });
  res.json(getState().today.mood);
});

router.post("/focus", (req, res) => {
  const { focus } = req.body ?? {};
  update((s) => { s.today.focus = focus ?? null; });
  res.json({ focus: getState().today.focus });
});

router.post("/mvp", (req, res) => {
  const { on } = req.body ?? {};
  update((s) => { s.today.mvp = !!on; });
  res.json({ mvp: getState().today.mvp });
});

router.post("/step/:id", (req, res) => {
  const { id } = req.params;
  const allIds = new Set([
    ...morningReset.map((s) => s.id),
    ...mvpDay.map((s) => s.id),
    "soft_hydrate", "soft_eat", "soft_horizontal", "soft_one_thing",
  ]);
  if (!allIds.has(id)) return res.status(404).json({ error: "unknown step" });
  let alreadyDone = false;
  update((s) => {
    if (s.today.completedSteps.includes(id)) { alreadyDone = true; return; }
    s.today.completedSteps.push(id);
  });
  if (!alreadyDone) {
    awardXp(id.startsWith("mvp_") ? "morning_reset_step" : "morning_reset_step");
  }
  res.json({ completedSteps: getState().today.completedSteps });
});

export default router;
