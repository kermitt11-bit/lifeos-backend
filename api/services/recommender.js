import { getState } from "../data/store.js";
import {
  morningReset,
  mvpDay,
  recoveryPathways,
  workouts,
  mealTemplates,
  safeMeals,
  environmentFlows,
} from "../data/seed.js";

const minutesAgo = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 60000 : Infinity);
const hoursAgo = (iso) => minutesAgo(iso) / 60;

const localHour = () => new Date().getHours();
const dayPart = (h = localHour()) => {
  if (h < 5) return "late_night";
  if (h < 11) return "morning";
  if (h < 14) return "midday";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
};

const mealById = (id) => Object.values(mealTemplates).flat().find((m) => m.id === id);

const lastMealMinutes = (s) => {
  const list = s.history.meals;
  if (!list.length) return Infinity;
  return minutesAgo(list[list.length - 1].at);
};

const workoutToday = (s) =>
  s.history.workouts.some((w) => w.date === s.today.date);

const roomResetThisWeek = (s) => {
  const week = 7 * 24 * 60;
  return s.history.roomResets.some((r) => minutesAgo(r.at) < week);
};

const undoneMorning = (s) =>
  morningReset.find((step) => !s.today.completedSteps.includes(step.id));

const undoneMvp = (s) =>
  mvpDay.find((step) => !s.today.completedSteps.includes(step.id));

const undoneRecoveryStep = (s) => {
  const a = s.recovery.active;
  if (!a) return null;
  const pathway = recoveryPathways[a.trigger];
  return pathway.steps.find((step) => !a.completedSteps.includes(step.id));
};

const safeMeal = () => mealById(safeMeals[Math.floor(Math.random() * safeMeals.length)]);

const recommend = () => {
  const s = getState();
  const part = dayPart();
  const mode = s.today.mode;

  // 1. Active recovery wins above all else.
  const recStep = undoneRecoveryStep(s);
  if (recStep) {
    return {
      priority: "recovery",
      headline: "Continue your recovery",
      detail: recStep.label,
      why: "You're already in recovery mode. One step at a time. Don't open new tabs.",
      action: { type: "complete_recovery_step", stepId: recStep.id },
    };
  }

  // 2. Soft-day override if body is asking for it.
  if (["sick", "period"].includes(mode.health) || mode.energy === "depleted") {
    if (!s.today.mvp) {
      return {
        priority: "soft_day",
        headline: "Switch on Minimum Viable Day",
        detail: "Your body is doing real work. Today is not for optimisation.",
        why: `Health=${mode.health}, energy=${mode.energy}. We protect tomorrow by not pushing today.`,
        action: { type: "enable_mvp" },
      };
    }
    const step = undoneMvp(s);
    if (step) {
      return {
        priority: "soft_day",
        headline: step.label,
        detail: "One gentle win at a time.",
        why: "MVP day. Five wins is the whole goal.",
        action: { type: "complete_step", stepId: step.id },
      };
    }
  }

  // 3. Late-night hard stop — no new starts after 11pm.
  if (part === "late_night" || (part === "night" && localHour() >= 23)) {
    return {
      priority: "wind_down",
      headline: "Bedtime, gently.",
      detail: "Phone out of arm's reach, lamp off, eyes closed.",
      why: "Sleep is the most underrated input for everything else you're trying to do.",
      action: { type: "open_flow", flowId: "night_routine" },
    };
  }

  // 4. Morning — capture intention.
  if (part === "morning") {
    if (!s.today.focus) {
      return {
        priority: "morning_focus",
        headline: "Set one focus for today",
        detail: "Just one. Not a to-do list. One thing.",
        why: "Mornings without a focus get hijacked by inputs.",
        action: { type: "set_focus" },
      };
    }
    const step = undoneMorning(s);
    if (step) {
      return {
        priority: "morning_reset",
        headline: step.label,
        detail: `Takes about ${step.est}.`,
        why: "Stacking the small ones early makes the rest of the day quieter.",
        action: { type: "complete_step", stepId: step.id },
      };
    }
  }

  // 5. Mood check-in — quick anchor, especially mid-day.
  if (!s.today.mood && (part === "midday" || part === "afternoon")) {
    return {
      priority: "mood",
      headline: "Quick mood check-in",
      detail: "One word. No judgment. Just data.",
      why: "Noticing the feeling is half the work of not getting hijacked by it.",
      action: { type: "mood_checkin" },
    };
  }

  // 6. Food — based on time since last meal.
  const sinceMeal = lastMealMinutes(s);
  if (part === "morning" && sinceMeal > 240) {
    return {
      priority: "food",
      headline: "Have something with protein",
      detail: `Try: ${safeMeal().name}`,
      why: "Going past mid-morning unfed sets up an afternoon crash and an evening crave.",
      action: { type: "log_meal", suggested: safeMeal().id, slot: "breakfast" },
    };
  }
  if ((part === "midday") && sinceMeal > 240) {
    return {
      priority: "food",
      headline: "Lunch time",
      detail: `Try: ${safeMeal().name}`,
      why: "Don't 'push through' to dinner — that's binge fuel.",
      action: { type: "log_meal", suggested: safeMeal().id, slot: "lunch" },
    };
  }
  if (part === "afternoon" && sinceMeal > 180) {
    return {
      priority: "food",
      headline: "Protein-led snack",
      detail: "Greek yoghurt, cheese, edamame, or a piece of fruit + nut butter.",
      why: "A real snack now prevents '5pm I'll eat anything' mode.",
      action: { type: "log_meal", slot: "snack" },
    };
  }

  // 7. Movement.
  if (!workoutToday(s) && mode.training !== "rest" && (part === "afternoon" || part === "evening")) {
    const pick = (workouts[mode.training] ?? [])[0];
    if (pick) {
      return {
        priority: "movement",
        headline: `Today's movement: ${pick.name}`,
        detail: `~${pick.duration} min, intensity ${pick.intensity}.`,
        why: "Outfit on, door open, go. The hard part is the first 90 seconds.",
        action: { type: "open_workout", workoutId: pick.id, mode: mode.training },
      };
    }
  }
  if (!workoutToday(s) && mode.energy !== "depleted" && part === "evening") {
    const em = workouts.emergency_15[0];
    return {
      priority: "movement",
      headline: "Emergency 15",
      detail: em.name,
      why: "Something > nothing. 15 minutes is enough to keep the identity intact.",
      action: { type: "open_workout", workoutId: em.id, mode: "emergency_15" },
    };
  }

  // 8. Environment.
  if (!roomResetThisWeek(s) && ["afternoon", "evening"].includes(part)) {
    return {
      priority: "environment",
      headline: "10-min room reset",
      detail: environmentFlows.room_reset_10.label,
      why: "Your room is part of your nervous system. A clear surface = a clearer head.",
      action: { type: "open_flow", flowId: "room_reset_10" },
    };
  }

  // 9. Evening wind-down.
  if (part === "evening" || part === "night") {
    return {
      priority: "wind_down",
      headline: "Start the wind-down",
      detail: environmentFlows.night_routine.label,
      why: "How you end the day shapes how the next one starts.",
      action: { type: "open_flow", flowId: "night_routine" },
    };
  }

  // 10. Default — you're doing fine.
  return {
    priority: "all_good",
    headline: "You're doing fine.",
    detail: "Nothing urgent. Pick one thing from Today's Flow when you're ready.",
    why: "Not every moment needs a next action. This is also a system.",
    action: { type: "none" },
  };
};

export const nextAction = () => {
  const rec = recommend();
  const s = getState();
  return {
    at: new Date().toISOString(),
    dayPart: dayPart(),
    hour: localHour(),
    ...rec,
    context: {
      mood: s.today.mood?.feeling ?? null,
      mode: s.today.mode,
      mvp: s.today.mvp,
      focus: s.today.focus,
      recoveryActive: !!s.recovery.active,
      workoutDoneToday: workoutToday(s),
      lastMealMinutesAgo: Number.isFinite(lastMealMinutes(s)) ? Math.round(lastMealMinutes(s)) : null,
    },
  };
};
