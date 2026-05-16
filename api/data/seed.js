export const dayTypes = ["work", "weekend", "wfh", "sick", "travel"];
export const energyLevels = ["depleted", "low", "medium", "high"];
export const trainingModes = ["rest", "lazy_gym", "incline_walk", "pilates", "strength", "emergency_15", "period"];
export const healthModes = ["ok", "tired", "period", "sick", "low_mood"];

export const morningReset = [
  { id: "hydrate", label: "Glass of water before phone", est: "1m" },
  { id: "sunlight", label: "Open curtains, get daylight on face", est: "2m" },
  { id: "movement", label: "Stretch or walk around for 3 minutes", est: "3m" },
  { id: "intentions", label: "Set one focus for today (just one)", est: "1m" },
  { id: "make_bed", label: "Make the bed", est: "2m" },
];

export const mvpDay = [
  { id: "mvp_water", label: "3 glasses of water spread through the day" },
  { id: "mvp_protein", label: "One protein-led meal" },
  { id: "mvp_move", label: "10 minutes of any movement" },
  { id: "mvp_reset", label: "Clear one surface in your room" },
  { id: "mvp_mood", label: "Note how you actually feel (no judgment)" },
];

export const recoveryPathways = {
  binge: {
    label: "I binged",
    intro: "This is information, not failure. We are not running punishment protocol. We're running steady-the-ship protocol.",
    steps: [
      { id: "no_restrict", label: "Do NOT skip the next meal. Restriction = next binge." },
      { id: "water_500", label: "500ml of water, slowly. No chugging." },
      { id: "walk_10", label: "10 minutes of walking, gentle. Phone optional." },
      { id: "next_meal", label: "Plan next meal: protein + something green. Keep it normal-sized." },
      { id: "note_trigger", label: "One sentence: what was happening before? (hunger, emotion, environment, time of day)" },
      { id: "tomorrow_normal", label: "Tomorrow is a normal day. Not 'making up for it'." },
    ],
  },
  skipped_gym: {
    label: "I skipped gym",
    intro: "Skipping one session doesn't undo anything. Skipping for a week because you skipped once would.",
    steps: [
      { id: "no_spiral", label: "Decide right now: when is the next session? (Day + time.)" },
      { id: "tiny_movement", label: "Do something tiny today — 5 min walk, 10 squats, stretch." },
      { id: "lay_out", label: "Lay out the gym outfit for next time." },
      { id: "remove_friction", label: "Remove one friction: pack the bag, set the alarm, plan the route." },
    ],
  },
  room_exploded: {
    label: "My room exploded",
    intro: "Your room is part of your nervous system. We reset, we don't deep clean.",
    steps: [
      { id: "music_on", label: "Put on music or a podcast you actually like." },
      { id: "trash_first", label: "10 minutes: rubbish into a bag. That's it. Don't sort, just collect." },
      { id: "laundry_pile", label: "Everything textile into one pile (don't fold yet)." },
      { id: "clear_surface", label: "Pick ONE surface (desk OR nightstand OR floor patch) and fully clear it." },
      { id: "make_bed", label: "Make the bed. This is the visual win." },
      { id: "stop", label: "Stop here. Notice it already feels different. Rest." },
    ],
  },
  feel_ugly: {
    label: "I feel ugly",
    intro: "This is almost never about your face. It's usually sleep, hormones, lighting, posture, hunger, or comparison loops.",
    steps: [
      { id: "check_basics", label: "When did you last eat? Sleep? Drink water? Step outside?" },
      { id: "off_phone", label: "Close social apps for the rest of the day (or the next 2 hours)." },
      { id: "wash_face", label: "Wash face with cold water. Brush hair. Lip balm." },
      { id: "change_clothes", label: "Change into something clean that fits well, even if you're not going out." },
      { id: "good_light", label: "Find a window. Daylight changes how you look at yourself — literally." },
      { id: "evidence", label: "Name one thing your body did for you today." },
    ],
  },
  exhausted: {
    label: "I'm exhausted",
    intro: "Exhaustion is a signal, not a character flaw. We pivot to MVP mode.",
    steps: [
      { id: "mvp_on", label: "Switch on Minimum Viable Day mode." },
      { id: "no_decisions", label: "No new commitments today. Cancel what's optional." },
      { id: "easy_food", label: "Eat something easy with protein. Frozen meals count." },
      { id: "horizontal_10", label: "10 minutes lying down with eyes closed. Not scrolling." },
      { id: "early_sleep", label: "Decide bedtime now. Phone out of the bed." },
    ],
  },
  wasted_day: {
    label: "I wasted the day",
    intro: "A day is not 'wasted' if you're still in it. We salvage the last hour or two.",
    steps: [
      { id: "current_time", label: "Look at the clock. How many hours left until sleep?" },
      { id: "one_thing", label: "Pick ONE thing that would make tomorrow easier. Just one." },
      { id: "do_it", label: "Do that one thing. (Often: shower, prep clothes, prep food, clear desk.)" },
      { id: "shutdown", label: "Wind-down: dim lights, no new tasks, phone out of reach 30 min before bed." },
    ],
  },
};

export const mealTemplates = {
  breakfast: [
    { id: "bf_eggs", name: "Eggs + toast + fruit", protein: "high", effort: "low", tags: ["safe"] },
    { id: "bf_greekyog", name: "Greek yoghurt + berries + granola", protein: "high", effort: "very_low", tags: ["safe"] },
    { id: "bf_oats", name: "Protein oats + banana + peanut butter", protein: "medium", effort: "low" },
    { id: "bf_smoothie", name: "Protein smoothie (banana, oats, milk, protein powder)", protein: "high", effort: "very_low", tags: ["safe", "rushed"] },
  ],
  lunch: [
    { id: "lu_chicken_rice", name: "Chicken, rice, salad", protein: "high", effort: "medium", tags: ["safe"] },
    { id: "lu_wrap", name: "Chicken wrap with veg", protein: "high", effort: "low" },
    { id: "lu_pasta", name: "Pasta with tuna + tomato + veg", protein: "high", effort: "low" },
    { id: "lu_leftovers", name: "Last night's leftovers + extra veg", protein: "varies", effort: "very_low", tags: ["safe"] },
  ],
  dinner: [
    { id: "di_stirfry", name: "Stir fry: chicken/tofu + veg + noodles", protein: "high", effort: "medium" },
    { id: "di_salmon", name: "Salmon, sweet potato, greens", protein: "high", effort: "medium" },
    { id: "di_curry", name: "Quick curry with chickpeas + rice", protein: "medium", effort: "medium" },
    { id: "di_eggsdinner", name: "Breakfast-for-dinner: eggs, beans, toast", protein: "high", effort: "very_low", tags: ["safe", "tired"] },
  ],
  snack: [
    { id: "sn_yog", name: "Greek yoghurt + honey", portion: "1 small pot" },
    { id: "sn_fruit_pb", name: "Apple + peanut butter", portion: "1 apple + 1 tbsp PB" },
    { id: "sn_cheese", name: "Cheese + crackers", portion: "30g cheese + 4 crackers" },
    { id: "sn_choc", name: "Dark chocolate", portion: "2 squares, eat slowly" },
    { id: "sn_popcorn", name: "Popcorn", portion: "1 small bowl" },
  ],
};

export const cravingDecisions = {
  sweet: [
    "Have you eaten enough protein today? If no — eat that first, crave will fade.",
    "Greek yoghurt + honey or berries.",
    "Dark chocolate, 2 squares, eat slowly without a screen.",
    "If still want sweet: have a proper portion of what you actually want, slowly.",
  ],
  salty: [
    "Water + a snack with crunch (popcorn, crackers, edamame).",
    "Cheese + crackers if it's been a few hours since eating.",
    "If still want crisps: portion into a bowl, put the bag away, eat without scrolling.",
  ],
  crunchy: [
    "Apple, carrots, popcorn, rice cakes, edamame.",
    "If craving doesn't go after 10 min, it's a real craving — honour it in portion form.",
  ],
  emotional: [
    "Pause. Name the emotion in one word.",
    "Water + 5 minutes away from where you were sitting.",
    "Decide: do I want food, or do I want to not feel this? Both are okay answers.",
    "If food: choose something comforting AND nourishing (warm + protein).",
  ],
};

export const decisionTrees = {
  alreadyAte: {
    title: "I'm hungry but I already ate",
    flow: [
      "How long ago was the last meal? Under 2 hours = probably not hungry, likely thirst/boredom/emotion. Over 3 hours = real hunger, eat.",
      "Drink a glass of water. Wait 10 minutes.",
      "If still hungry: protein-led snack (yoghurt, cheese, eggs, edamame). Not crisps/sweets first — those don't end the hunger.",
      "If still wanting to eat but not hungry: change rooms, do something with your hands for 15 minutes.",
    ],
  },
  starbucks: {
    title: "Starbucks strategy",
    flow: [
      "Default order: tall/grande coffee + small protein item (egg bites, oat bar). Saves you from a 600cal frappuccino spiral.",
      "Want sweet drink: choose ONE — sweet drink OR pastry, not both.",
      "Frappuccinos: tall size, skinny version if it exists. It's a dessert, eat it sat down, not on the walk.",
    ],
  },
  workSnacks: {
    title: "Work snack structure",
    flow: [
      "Pack 2 snacks: one protein (yoghurt/cheese/nuts), one fruit/crunch.",
      "Eat at fixed times — not when bored. 11am + 4pm works for most.",
      "Keep a water bottle visible. Thirst masquerades as hunger constantly at desks.",
    ],
  },
};

export const safeMeals = [
  "bf_eggs", "bf_greekyog", "bf_smoothie",
  "lu_chicken_rice", "lu_leftovers",
  "di_eggsdinner",
];

export const workouts = {
  rest: [
    { id: "rest_walk", name: "20 min relaxed walk", duration: 20, intensity: "low" },
    { id: "rest_stretch", name: "10 min mobility/stretch", duration: 10, intensity: "very_low" },
  ],
  lazy_gym: [
    { id: "lg_walk_incline", name: "Treadmill incline walk, 30 min @ 10–12% / 5 km/h", duration: 30, intensity: "low" },
    { id: "lg_stretch_sauna", name: "Light stretch + stretch flow, optional sauna", duration: 25, intensity: "very_low" },
  ],
  incline_walk: [
    { id: "iw_30", name: "Incline walk 30 min, 12% / 5 km/h", duration: 30, intensity: "moderate" },
    { id: "iw_45", name: "Incline walk 45 min, 10% / 5 km/h", duration: 45, intensity: "moderate" },
  ],
  pilates: [
    { id: "pi_mat", name: "Mat pilates flow, 30 min", duration: 30, intensity: "moderate" },
    { id: "pi_core", name: "Core + glutes pilates, 25 min", duration: 25, intensity: "moderate" },
  ],
  strength: [
    {
      id: "st_lower",
      name: "Lower body dumbbell strength",
      duration: 45,
      intensity: "high",
      blocks: [
        "Goblet squat 3x10",
        "RDL 3x10",
        "Reverse lunge 3x8 each leg",
        "Hip thrust 3x12",
        "Calf raise 3x15",
      ],
    },
    {
      id: "st_upper",
      name: "Upper body dumbbell strength",
      duration: 40,
      intensity: "high",
      blocks: [
        "DB bench/floor press 3x10",
        "One-arm row 3x10 each",
        "Shoulder press 3x10",
        "Lateral raise 3x12",
        "Bicep curl 3x12",
      ],
    },
    {
      id: "st_full",
      name: "Full body dumbbell strength",
      duration: 35,
      intensity: "moderate",
      blocks: [
        "Goblet squat 3x10",
        "Row 3x10",
        "Press 3x10",
        "Hip thrust 3x12",
        "Carry 3x30s",
      ],
    },
  ],
  emergency_15: [
    {
      id: "em_15_full",
      name: "15 min emergency full body",
      duration: 15,
      intensity: "moderate",
      blocks: [
        "Squats 40s / rest 20s",
        "Push-ups 40s / rest 20s",
        "Glute bridge 40s / rest 20s",
        "Plank 40s / rest 20s",
        "Repeat x3",
      ],
    },
  ],
  period: [
    { id: "pr_walk", name: "Gentle 20 min walk", duration: 20, intensity: "very_low" },
    { id: "pr_yoga", name: "Restorative yoga, 20 min", duration: 20, intensity: "very_low" },
  ],
};

export const environmentFlows = {
  room_reset_10: {
    label: "10-min room reset",
    estimate: "10 min",
    steps: [
      { id: "rr_music", label: "Music on, phone face-down" },
      { id: "rr_trash", label: "3 min: collect rubbish into a bag" },
      { id: "rr_textiles", label: "2 min: all clothes/textiles into one pile" },
      { id: "rr_surface", label: "3 min: clear ONE surface fully (desk or nightstand)" },
      { id: "rr_bed", label: "2 min: make the bed properly" },
    ],
  },
  desk_setup: {
    label: "Desk reset for focus",
    estimate: "8 min",
    steps: [
      { id: "ds_clear", label: "Everything off the desk, onto floor/bed" },
      { id: "ds_wipe", label: "Wipe the surface" },
      { id: "ds_essentials", label: "Back on desk: laptop, water, notebook, ONE thing for joy (candle/plant)" },
      { id: "ds_chargers", label: "Cables tidied or hidden" },
      { id: "ds_light", label: "Light source on, overhead off if possible" },
    ],
  },
  night_routine: {
    label: "Wind-down for the night",
    estimate: "20 min",
    steps: [
      { id: "nr_dim", label: "Dim main lights, turn on lamp/fairy lights" },
      { id: "nr_phone_out", label: "Phone out of arm's reach of the bed" },
      { id: "nr_tomorrow", label: "Lay out clothes / pack bag for tomorrow" },
      { id: "nr_skin", label: "Wash face, skincare, water by bed" },
      { id: "nr_book", label: "10 min reading or audiobook in bed" },
    ],
  },
  anti_depression: {
    label: "Anti-depression room rescue",
    estimate: "30 min, gentle pace",
    steps: [
      { id: "ad_open", label: "Open the curtains. Crack the window if you can." },
      { id: "ad_water", label: "Glass of water within reach." },
      { id: "ad_smell", label: "Change the smell: candle, spray, open window, fresh sheets corner of mind." },
      { id: "ad_bed", label: "Strip the bed if sheets are old. Even if you can't change them yet, just strip." },
      { id: "ad_clothes_floor", label: "Anything on the floor into ONE bin/basket. Don't sort." },
      { id: "ad_surface", label: "One surface fully clear. Eyes need a resting spot." },
      { id: "ad_lamp", label: "Switch from overhead to lamp." },
    ],
  },
};

export const identityStages = [
  { min: 0, name: "Seedling", note: "Just beginning to put down roots." },
  { min: 200, name: "Sprout", note: "Showing up. Visible movement." },
  { min: 600, name: "Sapling", note: "Routines starting to hold." },
  { min: 1500, name: "Grove", note: "Recovery is a skill, not a panic." },
  { min: 3500, name: "Garden", note: "You are the system now." },
  { min: 7000, name: "Sanctuary", note: "Calm operating system. Hard to knock off course." },
];

export const journalPrompts = [
  "What's one thing your body did for you today?",
  "What is taking up the most space in your head right now?",
  "If today had a weather report, what would it be?",
  "What's one thing future-you will thank present-you for?",
  "What did you eat today that you actually enjoyed?",
  "Where did you spend energy you didn't need to?",
  "What's a small kindness you can show yourself in the next hour?",
  "What's underneath the feeling you're trying to push away?",
  "What would 'good enough' look like for the rest of today?",
  "What's something you noticed today that you wouldn't have noticed a month ago?",
];

export const xpRules = {
  mood_checkin: 5,
  day_mode_set: 3,
  meal_logged: 8,
  workout_completed: 25,
  workout_emergency: 10,
  recovery_started: 5,
  recovery_step: 4,
  recovery_completed: 30,
  room_reset_step: 3,
  room_reset_completed: 20,
  morning_reset_step: 2,
  morning_reset_completed: 15,
  mvp_day_completed: 20,
  journal_entry: 6,
};
