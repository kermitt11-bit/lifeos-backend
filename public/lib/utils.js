export function uuid() {
  return crypto.randomUUID();
}

export function todayKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function diffDays(a, b) {
  return Math.round((startOfDay(a) - startOfDay(b)) / 86_400_000);
}

export function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

export function startOfMonth(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export function fmtDate(d, opts = { weekday: "short", month: "short", day: "numeric" }) {
  return new Date(d).toLocaleDateString(undefined, opts);
}

export function fmtTime(d) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function moodEmoji(score) {
  if (score <= 1) return "😞";
  if (score <= 3) return "😕";
  if (score <= 5) return "😐";
  if (score <= 7) return "🙂";
  if (score <= 9) return "😊";
  return "🤩";
}

export function moodLabel(score) {
  if (score <= 2) return "Low";
  if (score <= 4) return "Meh";
  if (score <= 6) return "Okay";
  if (score <= 8) return "Good";
  return "Great";
}

export function energyLabel(score) {
  if (score <= 3) return "Low";
  if (score <= 6) return "Medium";
  return "High";
}

export function greeting(name) {
  const h = new Date().getHours();
  let base;
  if (h < 6) base = "Resting hours";
  else if (h < 12) base = "Good morning";
  else if (h < 17) base = "Good afternoon";
  else if (h < 22) base = "Good evening";
  else base = "Hello";
  return name ? `${base}, ${name}` : base;
}

export const PROMPTS = [
  "What's one thing you're proud of today?",
  "Who or what are you grateful for right now?",
  "What energy do you want to bring to tomorrow?",
  "What did today teach you about yourself?",
  "Where did you grow this week?",
  "What's a small win you almost overlooked?",
  "What's been on your mind that you haven't said out loud?",
  "If today were a chapter title, what would it be?",
  "What's one thing you can let go of tonight?",
  "What's the next right step?",
  "What did your body need today?",
  "What hobby made you feel like yourself this week?",
];

export function randomPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export const TASK_CATEGORIES = [
  { id: "personal", label: "Personal", color: "#C77B7B", icon: "🌸" },
  { id: "work",     label: "Work",     color: "#7B92AE", icon: "💼" },
  { id: "health",   label: "Health",   color: "#8FB89C", icon: "❤️" },
  { id: "learning", label: "Learning", color: "#D4A574", icon: "📚" },
  { id: "errand",   label: "Errand",   color: "#B59E9E", icon: "🛒" },
  { id: "social",   label: "Social",   color: "#A88BB8", icon: "👥" },
  { id: "finance",  label: "Finance",  color: "#6FA88C", icon: "💰" },
  { id: "creative", label: "Creative", color: "#C98863", icon: "🎨" },
];

export const PRIORITIES = [
  { id: 0, label: "Low",    color: "#B59E9E" },
  { id: 1, label: "Medium", color: "#7B92AE" },
  { id: 2, label: "High",   color: "#D4A574" },
  { id: 3, label: "Urgent", color: "#B85A5A" },
];

export const GOAL_AREAS = [
  { id: "health",        label: "Health",       icon: "❤️" },
  { id: "career",        label: "Career",       icon: "💼" },
  { id: "relationships", label: "Relationships",icon: "👥" },
  { id: "finance",       label: "Finance",      icon: "💰" },
  { id: "learning",      label: "Learning",     icon: "📚" },
  { id: "creative",      label: "Creative",     icon: "🎨" },
  { id: "mindfulness",   label: "Mindfulness",  icon: "🧘" },
  { id: "adventure",     label: "Adventure",    icon: "🏔️" },
];

export const GOAL_TIMEFRAMES = [
  { id: "week",     label: "This Week" },
  { id: "month",    label: "This Month" },
  { id: "quarter",  label: "This Quarter" },
  { id: "year",     label: "This Year" },
  { id: "longTerm", label: "Long Term" },
];

export const HABIT_FREQUENCIES = [
  { id: "daily",    label: "Every day" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekends", label: "Weekends" },
  { id: "weekly",   label: "Weekly" },
];

export function categoryFor(id) {
  return TASK_CATEGORIES.find((c) => c.id === id) || TASK_CATEGORIES[0];
}
export function priorityFor(id) {
  return PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];
}
export function areaFor(id) {
  return GOAL_AREAS.find((a) => a.id === id) || GOAL_AREAS[0];
}

export function streakFor(logs, habitId) {
  const set = new Set(
    logs
      .filter((l) => l.habitId === habitId && l.completed)
      .map((l) => startOfDay(l.date).getTime())
  );
  let day = startOfDay(new Date());
  let n = 0;
  while (set.has(day.getTime())) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

export function completionsThisWeek(logs, habitId) {
  const weekStart = startOfWeek(new Date()).getTime();
  return logs.filter(
    (l) => l.habitId === habitId && l.completed && startOfDay(l.date).getTime() >= weekStart
  ).length;
}

export function wordCount(s) {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

/* ───────────────────────── FOOD ───────────────────────── */

export const FOOD_CATEGORIES = [
  { id: "protein", label: "Protein",  icon: "🍗" },
  { id: "carb",    label: "Carbs",    icon: "🍞" },
  { id: "veg",     label: "Veggies",  icon: "🥦" },
  { id: "fruit",   label: "Fruit",    icon: "🍎" },
  { id: "fat",     label: "Fats",     icon: "🥑" },
  { id: "dairy",   label: "Dairy",    icon: "🧀" },
  { id: "snack",   label: "Snack Box",icon: "🍫" },
  { id: "drink",   label: "Drink",    icon: "🥤" },
];

/* Approved ingredients (no eggs, per the rules) */
export const APPROVED_FOODS = {
  protein: ["chicken breast", "chicken thigh", "salmon", "tuna", "cod", "shrimp", "ground turkey", "lean beef", "tofu", "tempeh", "chickpeas", "lentils", "black beans", "greek yogurt", "cottage cheese", "whey protein"],
  carb:    ["rice", "brown rice", "quinoa", "oats", "sweet potato", "potato", "pasta", "whole-wheat bread", "tortilla", "couscous", "soba"],
  veg:     ["spinach", "kale", "broccoli", "cauliflower", "carrot", "bell pepper", "cucumber", "tomato", "onion", "garlic", "zucchini", "mushroom", "arugula", "cabbage", "asparagus"],
  fruit:   ["banana", "apple", "berries", "orange", "lemon", "lime", "pear", "mango", "grapes", "kiwi", "pineapple"],
  fat:     ["olive oil", "avocado", "almonds", "walnuts", "peanut butter", "tahini", "chia seeds", "flax", "pumpkin seeds"],
  dairy:   ["milk", "feta", "parmesan", "mozzarella", "cheddar", "yogurt"],
  drink:   ["water", "tea", "coffee", "sparkling water", "lemon water"],
  snack:   ["dark chocolate", "popcorn", "trail mix"],
};

/* Meal templates — explicit portions, fallback friendly */
export const MEAL_TEMPLATES = [
  {
    id: "tpl-oats",
    slot: "breakfast",
    name: "Berry Almond Oats",
    emoji: "🥣",
    kcal: 410, protein: 18, carbs: 58, fat: 14,
    needs: ["oats", "berries", "almonds"],
    nice:  ["greek yogurt", "milk", "banana", "peanut butter"],
    portion: "½ cup oats · 1 cup berries · 15g almonds · ¾ cup milk",
    steps: "Cook oats in milk 4 min. Top with berries and almonds.",
  },
  {
    id: "tpl-yogurt-bowl",
    slot: "breakfast",
    name: "Greek Yogurt Bowl",
    emoji: "🍓",
    kcal: 360, protein: 28, carbs: 38, fat: 10,
    needs: ["greek yogurt"],
    nice:  ["berries", "oats", "almonds", "peanut butter", "banana"],
    portion: "1 cup yogurt · ⅓ cup oats · ½ cup berries",
    steps: "Layer yogurt, oats, fruit. Add a drizzle of honey if you want.",
  },
  {
    id: "tpl-chicken-bowl",
    slot: "lunch",
    name: "Chicken Rice Bowl",
    emoji: "🍚",
    kcal: 540, protein: 42, carbs: 55, fat: 16,
    needs: ["chicken breast", "rice"],
    nice:  ["broccoli", "bell pepper", "olive oil", "garlic", "lime"],
    portion: "150g chicken · ¾ cup rice · 1½ cups veg",
    steps: "Pan-sear chicken in olive oil. Steam veg. Plate over rice with squeeze of lime.",
  },
  {
    id: "tpl-salmon-quinoa",
    slot: "dinner",
    name: "Salmon & Quinoa Plate",
    emoji: "🐟",
    kcal: 580, protein: 38, carbs: 42, fat: 24,
    needs: ["salmon", "quinoa"],
    nice:  ["asparagus", "lemon", "olive oil", "spinach"],
    portion: "150g salmon · ¾ cup quinoa · 1 cup greens",
    steps: "Bake salmon 12 min at 400°F. Serve over quinoa with greens, lemon, oil.",
  },
  {
    id: "tpl-tofu-stirfry",
    slot: "dinner",
    name: "Tofu Stir-Fry",
    emoji: "🥬",
    kcal: 460, protein: 28, carbs: 48, fat: 14,
    needs: ["tofu", "rice"],
    nice:  ["broccoli", "bell pepper", "garlic", "onion", "olive oil"],
    portion: "200g tofu · ¾ cup rice · 1½ cups veg",
    steps: "Press tofu, cube and crisp in oil. Add veg, soy splash, garlic. Serve over rice.",
  },
  {
    id: "tpl-pasta-veg",
    slot: "lunch",
    name: "Garlic Veggie Pasta",
    emoji: "🍝",
    kcal: 510, protein: 18, carbs: 76, fat: 12,
    needs: ["pasta"],
    nice:  ["spinach", "tomato", "garlic", "parmesan", "olive oil"],
    portion: "85g pasta · 2 cups veg · 1 tbsp olive oil",
    steps: "Boil pasta. Sauté garlic + veg in oil. Toss everything with a little pasta water and cheese.",
  },
  {
    id: "tpl-buddha-bowl",
    slot: "lunch",
    name: "Chickpea Buddha Bowl",
    emoji: "🥗",
    kcal: 520, protein: 22, carbs: 64, fat: 18,
    needs: ["chickpeas"],
    nice:  ["quinoa", "spinach", "tahini", "cucumber", "tomato", "lemon"],
    portion: "1 cup chickpeas · ⅔ cup quinoa · 2 cups greens",
    steps: "Layer greens, quinoa, chickpeas, veg. Drizzle tahini-lemon.",
  },
  {
    id: "tpl-tuna-toast",
    slot: "lunch",
    name: "Tuna & Avocado Toast",
    emoji: "🥑",
    kcal: 420, protein: 26, carbs: 36, fat: 18,
    needs: ["tuna", "whole-wheat bread"],
    nice:  ["avocado", "lemon", "arugula"],
    portion: "1 can tuna · 2 slices toast · ½ avocado",
    steps: "Mash avocado on toast. Top with tuna, arugula, lemon.",
  },
  {
    id: "tpl-burrito-bowl",
    slot: "dinner",
    name: "Turkey Burrito Bowl",
    emoji: "🌯",
    kcal: 560, protein: 38, carbs: 58, fat: 16,
    needs: ["ground turkey", "rice"],
    nice:  ["black beans", "tomato", "bell pepper", "onion", "avocado", "lime"],
    portion: "150g turkey · ¾ cup rice · 1 cup beans/veg",
    steps: "Brown turkey with onion & pepper. Build bowl: rice, turkey, beans, veg, avocado.",
  },
  {
    id: "tpl-soba",
    slot: "lunch",
    name: "Sesame Soba Noodles",
    emoji: "🍜",
    kcal: 470, protein: 22, carbs: 64, fat: 12,
    needs: ["soba"],
    nice:  ["tofu", "broccoli", "carrot", "sesame seeds", "tahini"],
    portion: "85g soba · 1 cup veg · 100g tofu",
    steps: "Boil soba. Rinse cold. Toss with tahini-soy, top with crisp tofu and veg.",
  },
  {
    id: "tpl-cottage-fruit",
    slot: "snack",
    name: "Cottage Cheese & Fruit",
    emoji: "🍇",
    kcal: 220, protein: 18, carbs: 22, fat: 6,
    needs: ["cottage cheese"],
    nice:  ["berries", "banana", "grapes"],
    portion: "¾ cup cottage cheese · 1 cup fruit",
    steps: "Spoon, top, eat.",
  },
  {
    id: "tpl-apple-pb",
    slot: "snack",
    name: "Apple + Peanut Butter",
    emoji: "🍎",
    kcal: 240, protein: 8, carbs: 28, fat: 12,
    needs: ["apple", "peanut butter"],
    nice:  [],
    portion: "1 apple · 2 tbsp peanut butter",
    steps: "Slice and dip.",
  },
  {
    id: "tpl-yogurt-honey",
    slot: "snack",
    name: "Yogurt + Honey",
    emoji: "🍯",
    kcal: 200, protein: 18, carbs: 22, fat: 4,
    needs: ["greek yogurt"],
    nice:  ["walnuts", "berries"],
    portion: "¾ cup yogurt · drizzle honey",
    steps: "Stir, top with walnuts if you have them.",
  },
  {
    id: "tpl-trailmix",
    slot: "snack",
    name: "Snack Box",
    emoji: "🍫",
    kcal: 280, protein: 7, carbs: 22, fat: 18,
    needs: [],
    nice:  ["dark chocolate", "almonds", "trail mix", "berries"],
    portion: "Small handful · treat slot",
    steps: "Build a tiny snack box. Treats live here on purpose.",
  },
];

/* Score templates against pantry: needs satisfied = required, nice = bonus */
export function suggestMeals(pantryNames, slot, limit = 3) {
  const have = new Set(pantryNames.map((n) => n.toLowerCase()));
  const scored = MEAL_TEMPLATES
    .filter((m) => !slot || m.slot === slot)
    .map((m) => {
      const needsHit = m.needs.filter((n) => have.has(n)).length;
      const needsMiss = m.needs.length - needsHit;
      const niceHit = m.nice.filter((n) => have.has(n)).length;
      // require at least half of "needs" to consider, or a snack with no requirements
      const score = needsHit * 3 + niceHit - needsMiss * 2;
      return { template: m, score, needsHit, needsMiss, niceHit };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}

/* ────────────────────── WORKOUT ────────────────────── */

export const EQUIPMENT = [
  { id: "none",      label: "None / bodyweight" },
  { id: "mat",       label: "Yoga mat" },
  { id: "dumbbell",  label: "Dumbbells" },
  { id: "kettlebell",label: "Kettlebell" },
  { id: "band",      label: "Resistance band" },
  { id: "gym",       label: "Full gym" },
];

export const WORKOUT_TEMPLATES = [
  // Low energy
  {
    id: "w-walk",
    name: "Easy Walk",
    energy: "low", minutes: 20,
    equipment: ["none"],
    emoji: "🚶", color: "#8FB89C",
    exercises: [
      { name: "Outdoor walk", reps: "20 min", note: "Pace that lets you chat" },
    ],
  },
  {
    id: "w-stretch",
    name: "Gentle Mobility",
    energy: "low", minutes: 15,
    equipment: ["mat"],
    emoji: "🧘", color: "#A88BB8",
    exercises: [
      { name: "Cat-cow",          reps: "8 reps" },
      { name: "Child's pose",     reps: "60 sec" },
      { name: "Hip openers",      reps: "60 sec / side" },
      { name: "Thread the needle",reps: "8 / side" },
      { name: "Down dog",         reps: "60 sec" },
      { name: "Forward fold",     reps: "60 sec" },
    ],
  },
  {
    id: "w-yoga-flow",
    name: "Restorative Flow",
    energy: "low", minutes: 20,
    equipment: ["mat"],
    emoji: "🌿", color: "#8FB89C",
    exercises: [
      { name: "Sun A",            reps: "3 rounds" },
      { name: "Sun B",            reps: "3 rounds" },
      { name: "Lizard",           reps: "60 sec / side" },
      { name: "Pigeon",           reps: "90 sec / side" },
      { name: "Savasana",         reps: "5 min" },
    ],
  },

  // Medium energy
  {
    id: "w-bodyweight-15",
    name: "Bodyweight Express",
    energy: "medium", minutes: 18,
    equipment: ["none"],
    emoji: "💪", color: "#D4A574",
    exercises: [
      { name: "Squats",     reps: "3 × 15" },
      { name: "Push-ups",   reps: "3 × 10" },
      { name: "Glute bridge",reps: "3 × 15" },
      { name: "Plank",      reps: "3 × 40 sec" },
      { name: "Reverse lunges", reps: "3 × 10/leg" },
    ],
  },
  {
    id: "w-dumbbell-full",
    name: "Dumbbell Full-Body",
    energy: "medium", minutes: 25,
    equipment: ["dumbbell"],
    emoji: "🏋️", color: "#C77B7B",
    exercises: [
      { name: "Goblet squat",      reps: "3 × 12" },
      { name: "DB row",            reps: "3 × 10/side" },
      { name: "DB press",          reps: "3 × 10" },
      { name: "Romanian deadlift", reps: "3 × 12" },
      { name: "DB curl + press",   reps: "3 × 10" },
    ],
  },
  {
    id: "w-band-pull",
    name: "Band Pull Day",
    energy: "medium", minutes: 20,
    equipment: ["band"],
    emoji: "🎯", color: "#7B92AE",
    exercises: [
      { name: "Band row",        reps: "3 × 15" },
      { name: "Band pull-apart", reps: "3 × 15" },
      { name: "Face pull",       reps: "3 × 15" },
      { name: "Bicep curl",      reps: "3 × 15" },
    ],
  },

  // High energy
  {
    id: "w-hiit-30",
    name: "HIIT Cardio",
    energy: "high", minutes: 30,
    equipment: ["none"],
    emoji: "🔥", color: "#B85A5A",
    exercises: [
      { name: "Jump squats",      reps: "40s on / 20 off · ×4" },
      { name: "Mountain climbers",reps: "40 / 20 · ×4" },
      { name: "Burpees",          reps: "40 / 20 · ×4" },
      { name: "High knees",       reps: "40 / 20 · ×4" },
      { name: "Cool walk",        reps: "5 min" },
    ],
  },
  {
    id: "w-strength-45",
    name: "Strength Day",
    energy: "high", minutes: 45,
    equipment: ["gym", "dumbbell"],
    emoji: "🏋️‍♀️", color: "#C77B7B",
    exercises: [
      { name: "Back squat",         reps: "4 × 6" },
      { name: "Bench / DB press",   reps: "4 × 8" },
      { name: "Pull-up or lat pull",reps: "4 × 8" },
      { name: "Romanian deadlift",  reps: "4 × 8" },
      { name: "Plank + side plank", reps: "3 × 45 sec" },
    ],
  },
  {
    id: "w-run-30",
    name: "30-Min Run",
    energy: "high", minutes: 30,
    equipment: ["none"],
    emoji: "🏃", color: "#7B92AE",
    exercises: [
      { name: "Warm-up walk",     reps: "5 min" },
      { name: "Easy run",         reps: "20 min" },
      { name: "Cool walk",        reps: "5 min" },
    ],
  },
];

export function suggestWorkouts({ energy = "medium", equipment = "none", minutes = 25 }, limit = 3) {
  return WORKOUT_TEMPLATES
    .map((w) => {
      const energyMatch = w.energy === energy ? 3 : (Math.abs(rank(w.energy) - rank(energy)) === 1 ? 1 : 0);
      const equipMatch = w.equipment.includes(equipment) || w.equipment.includes("none") ? 2 : 0;
      const timeMatch = 2 - Math.min(2, Math.abs(w.minutes - minutes) / 10);
      return { tpl: w, score: energyMatch + equipMatch + timeMatch };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.tpl);
}
function rank(e) { return e === "low" ? 0 : e === "medium" ? 1 : 2; }

/* ────────────────────── HOBBIES ────────────────────── */

export const HOBBY_CATEGORIES = [
  { id: "creative",    label: "Creative",     icon: "🎨", color: "#C98863" },
  { id: "skill",       label: "Skill",        icon: "🎯", color: "#7B92AE" },
  { id: "restorative", label: "Restorative",  icon: "🌿", color: "#8FB89C" },
  { id: "social",      label: "Social",       icon: "👥", color: "#A88BB8" },
];

export const HOBBY_LIBRARY = [
  { id: "drawing",   name: "Drawing",        category: "creative",    emoji: "✏️", min: 5,  energy: "low",    mood: "any",     intro: "Doodle a single object you can see right now.", deep: "30-min observational sketch of a still life or hand." },
  { id: "crochet",   name: "Crochet",        category: "creative",    emoji: "🧶", min: 10, energy: "low",    mood: "calm",    intro: "10 chains + 10 single crochet rows.", deep: "Finish a small granny square or part of a project." },
  { id: "knitting",  name: "Knitting",       category: "creative",    emoji: "🧵", min: 10, energy: "low",    mood: "calm",    intro: "Just 10 stitches across one row.", deep: "Knit for one full podcast episode." },
  { id: "guitar",    name: "Guitar",         category: "skill",       emoji: "🎸", min: 5,  energy: "medium", mood: "any",     intro: "Play one chord progression you already know.", deep: "Learn one new chord change cleanly at 80 bpm." },
  { id: "piano",     name: "Piano",          category: "skill",       emoji: "🎹", min: 5,  energy: "medium", mood: "any",     intro: "Play scales: C major hands together, 4 reps.", deep: "Sight-read one new short piece slowly." },
  { id: "coding",    name: "Coding",         category: "skill",       emoji: "💻", min: 10, energy: "high",   mood: "focused", intro: "Read one section of your project README.", deep: "Ship one tiny commit on a side project." },
  { id: "reading",   name: "Reading",        category: "restorative", emoji: "📖", min: 5,  energy: "low",    mood: "any",     intro: "Read 2 pages of anything beside your bed.", deep: "Read for one full chapter or 25 min." },
  { id: "photo",     name: "Photography",    category: "creative",    emoji: "📷", min: 5,  energy: "medium", mood: "curious", intro: "Take 3 photos of light in your home.", deep: "Walk somewhere new and shoot a small set." },
  { id: "cooking",   name: "Cooking",        category: "skill",       emoji: "🍳", min: 15, energy: "medium", mood: "any",     intro: "Try one new spice combination on what you're already making.", deep: "Cook a new recipe end-to-end." },
  { id: "baking",    name: "Baking",         category: "creative",    emoji: "🥐", min: 30, energy: "medium", mood: "calm",    intro: "Prep ingredients in mise-en-place style.", deep: "Bake a full recipe and journal what to change next time." },
  { id: "journal",   name: "Journaling",     category: "restorative", emoji: "📝", min: 5,  energy: "low",    mood: "any",     intro: "Write three sentences. Anything.", deep: "Free-write 20 minutes, no editing." },
  { id: "language",  name: "Language",       category: "skill",       emoji: "🗣️", min: 5,  energy: "low",    mood: "any",     intro: "Open Duolingo / Anki for one short lesson.", deep: "Listen to 15 min of native podcast / show with subs." },
  { id: "walk",      name: "Walks",          category: "restorative", emoji: "🚶", min: 10, energy: "any",    mood: "any",     intro: "Walk around the block, leave the phone.", deep: "Walk somewhere you've never been." },
  { id: "music",     name: "Music",          category: "restorative", emoji: "🎧", min: 5,  energy: "low",    mood: "any",     intro: "One favorite album, no other screens.", deep: "Discover a new artist; save a playlist of 5 tracks." },
  { id: "puzzles",   name: "Puzzles",        category: "restorative", emoji: "🧩", min: 5,  energy: "low",    mood: "calm",    intro: "5 minutes on a daily puzzle.", deep: "30 min on a physical jigsaw or sudoku." },
  { id: "garden",    name: "Plants",         category: "restorative", emoji: "🪴", min: 5,  energy: "low",    mood: "calm",    intro: "Check and water plants.", deep: "Repot or propagate a cutting." },
  { id: "stretch",   name: "Stretching",     category: "restorative", emoji: "🧘", min: 5,  energy: "low",    mood: "any",     intro: "One forward fold, one twist.", deep: "Full 20-min mobility flow." },
  { id: "calls",     name: "Catch up call",  category: "social",      emoji: "📞", min: 10, energy: "medium", mood: "any",     intro: "Send a 'thinking of you' voice note.", deep: "Call someone you've been meaning to reach for 20 minutes." },
];

/* Filter hobbies by mood/energy/time */
export function suggestHobbies({ mood = "any", energy = "any", minutes = 10 }, limit = 6) {
  return HOBBY_LIBRARY
    .map((h) => {
      let score = 0;
      if (energy === "any" || h.energy === "any" || h.energy === energy) score += 2;
      else if (Math.abs(rank(h.energy) - rank(energy)) === 1) score += 1;
      if (mood === "any" || h.mood === "any" || h.mood === mood) score += 1;
      if (h.min <= minutes) score += 2;
      return { hobby: h, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.hobby);
}

export function hobbyCategoryFor(id) {
  return HOBBY_CATEGORIES.find((c) => c.id === id) || HOBBY_CATEGORIES[0];
}

/* ────────────────────── HEALTH ────────────────────── */

export const SUPPLEMENTS_DEFAULT = ["Vitamin D", "Magnesium", "Omega-3", "B-complex"];

export function todaysHealth(logs, date = new Date()) {
  return logs.filter((l) => isSameDay(l.date, date));
}

export function sumWater(logs, date = new Date()) {
  return todaysHealth(logs, date)
    .filter((l) => l.kind === "water")
    .reduce((s, l) => s + (l.amount || 0), 0);
}

export function lastSleep(logs, date = new Date()) {
  const today = todaysHealth(logs, date).filter((l) => l.kind === "sleep");
  if (today.length) return today[today.length - 1];
  // also look at last night recorded the day before
  const ystr = todaysHealth(logs, addDays(date, -1)).filter((l) => l.kind === "sleep");
  return ystr.length ? ystr[ystr.length - 1] : null;
}

export function todaySteps(logs, date = new Date()) {
  const t = todaysHealth(logs, date).filter((l) => l.kind === "steps");
  if (!t.length) return 0;
  return t[t.length - 1].amount || 0;
}

/* ────────────────────── INTEGRATIONS ────────────────────── */

export const INTEGRATIONS = [
  {
    id: "applehealth",
    name: "Apple Health",
    icon: "❤️",
    color: "#C77B7B",
    note: "Import steps, sleep, and weight via the native iOS companion. PWAs can't access HealthKit directly — use the Native app or the JSON import below.",
    capabilities: ["steps", "sleep", "weight", "heart rate"],
    direction: "in",
  },
  {
    id: "mynetdiary",
    name: "MyNetDiary",
    icon: "🥗",
    color: "#8FB89C",
    note: "Paste your daily export or paste a meal copied from MyNetDiary. We map to meals + macros.",
    capabilities: ["calories", "protein/carbs/fat", "weight"],
    direction: "in",
  },
  {
    id: "justfit",
    name: "JustFit",
    icon: "🏋️",
    color: "#D4A574",
    note: "Paste your finished workout. We log it to your Workout history.",
    capabilities: ["sessions", "minutes", "kcal burned"],
    direction: "in",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "🪄",
    color: "#A88BB8",
    note: "Connect an OpenAI key to power AI meal plans, workouts, reviews, and reset prompts.",
    capabilities: ["plan", "suggest", "review", "reset"],
    direction: "out",
  },
];

/* Best-effort parser for typical MyNetDiary copy-paste */
export function parseMyNetDiary(text) {
  const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const meals = [];
  let slot = "snack";
  for (const ln of lines) {
    const lower = ln.toLowerCase();
    if (/^breakfast/.test(lower)) { slot = "breakfast"; continue; }
    if (/^lunch/.test(lower))     { slot = "lunch"; continue; }
    if (/^dinner/.test(lower))    { slot = "dinner"; continue; }
    if (/^snack/.test(lower))     { slot = "snack"; continue; }
    // try patterns like "Greek yogurt — 200 kcal · 20p 24c 6f"
    const m = ln.match(/(.*?)[\s—-]+(\d+)\s*kcal\D*(\d+)\s*p?\D*(\d+)\s*c?\D*(\d+)\s*f?/i);
    if (m) {
      meals.push({
        slot,
        name: m[1].trim(),
        kcal: Number(m[2]),
        protein: Number(m[3]),
        carbs: Number(m[4]),
        fat: Number(m[5]),
      });
      continue;
    }
    // try simpler "Greek yogurt - 200 kcal"
    const m2 = ln.match(/(.*?)\s*[-—]\s*(\d+)\s*kcal/i);
    if (m2) meals.push({ slot, name: m2[1].trim(), kcal: Number(m2[2]), protein: 0, carbs: 0, fat: 0 });
  }
  return meals;
}

export function parseJustFit(text) {
  const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const out = { name: "JustFit Session", minutes: 0, kcal: 0, exercises: [] };
  for (const ln of lines) {
    const mt = ln.match(/duration[:\s]+(\d+)\s*min/i);
    if (mt) out.minutes = Number(mt[1]);
    const mc = ln.match(/(?:calories|kcal)[:\s]+(\d+)/i);
    if (mc) out.kcal = Number(mc[1]);
    const mn = ln.match(/^(?:title|workout|name)[:\s]+(.+)$/i);
    if (mn) out.name = mn[1];
    const mex = ln.match(/^[•\-*]\s*(.+)\s+(\d+x\d+)/i);
    if (mex) out.exercises.push({ name: mex[1], reps: mex[2] });
  }
  return out;
}
