// Pantry kinds — a curated, user-friendly set. Each has a category for grouping,
// an emoji, default unit, and an optional default qty hint.
export const PANTRY_KINDS = [
  // proteins
  { id: "egg",            label: "Eggs",            cat: "fridge",  group: "protein", icon: "🥚", unit: "ea" },
  { id: "chicken",        label: "Chicken",         cat: "fridge",  group: "protein", icon: "🍗", unit: "g" },
  { id: "beef-ground",    label: "Ground beef",     cat: "fridge",  group: "protein", icon: "🥩", unit: "g" },
  { id: "fish",           label: "Fish",            cat: "fridge",  group: "protein", icon: "🐟", unit: "g" },
  { id: "tuna-canned",    label: "Canned tuna",     cat: "pantry",  group: "protein", icon: "🐟", unit: "can" },
  { id: "tofu",           label: "Tofu",            cat: "fridge",  group: "protein", icon: "🧈", unit: "g" },
  { id: "beans-canned",   label: "Canned beans",    cat: "pantry",  group: "protein", icon: "🫘", unit: "can" },
  { id: "lentils",        label: "Lentils",         cat: "pantry",  group: "protein", icon: "🫘", unit: "g" },
  { id: "chickpeas",      label: "Chickpeas",       cat: "pantry",  group: "protein", icon: "🫘", unit: "can" },
  { id: "deli-meat",      label: "Deli meat",       cat: "fridge",  group: "protein", icon: "🥓", unit: "g" },
  { id: "yogurt-greek",   label: "Greek yogurt",    cat: "fridge",  group: "protein", icon: "🥣", unit: "g" },
  { id: "cottage",        label: "Cottage cheese",  cat: "fridge",  group: "protein", icon: "🥣", unit: "g" },
  { id: "pb",             label: "Peanut butter",   cat: "pantry",  group: "protein", icon: "🥜", unit: "tbsp" },

  // carbs
  { id: "bread",          label: "Bread",           cat: "pantry",  group: "carb", icon: "🍞", unit: "slice" },
  { id: "oats",           label: "Oats",            cat: "pantry",  group: "carb", icon: "🌾", unit: "g" },
  { id: "rice",           label: "Rice",            cat: "pantry",  group: "carb", icon: "🍚", unit: "g" },
  { id: "pasta",          label: "Pasta",           cat: "pantry",  group: "carb", icon: "🍝", unit: "g" },
  { id: "tortilla",       label: "Tortilla",        cat: "pantry",  group: "carb", icon: "🫓", unit: "ea" },
  { id: "potato",         label: "Potatoes",        cat: "pantry",  group: "carb", icon: "🥔", unit: "ea" },
  { id: "sweet-potato",   label: "Sweet potato",    cat: "pantry",  group: "carb", icon: "🍠", unit: "ea" },
  { id: "crackers",       label: "Crackers",        cat: "pantry",  group: "carb", icon: "🍘", unit: "ea" },
  { id: "noodles",        label: "Noodles",         cat: "pantry",  group: "carb", icon: "🍜", unit: "g" },

  // veg
  { id: "spinach",        label: "Spinach",         cat: "fridge",  group: "veg", icon: "🥬", unit: "handful" },
  { id: "lettuce",        label: "Lettuce",         cat: "fridge",  group: "veg", icon: "🥬", unit: "handful" },
  { id: "tomato",         label: "Tomato",          cat: "fridge",  group: "veg", icon: "🍅", unit: "ea" },
  { id: "cucumber",       label: "Cucumber",        cat: "fridge",  group: "veg", icon: "🥒", unit: "ea" },
  { id: "onion",          label: "Onion",           cat: "pantry",  group: "veg", icon: "🧅", unit: "ea" },
  { id: "garlic",         label: "Garlic",          cat: "pantry",  group: "veg", icon: "🧄", unit: "clove" },
  { id: "carrot",         label: "Carrot",          cat: "fridge",  group: "veg", icon: "🥕", unit: "ea" },
  { id: "bell-pepper",    label: "Bell pepper",     cat: "fridge",  group: "veg", icon: "🫑", unit: "ea" },
  { id: "broccoli",       label: "Broccoli",        cat: "fridge",  group: "veg", icon: "🥦", unit: "handful" },
  { id: "frozen-veg",     label: "Frozen veg mix",  cat: "freezer", group: "veg", icon: "🥦", unit: "handful" },
  { id: "mushroom",       label: "Mushrooms",       cat: "fridge",  group: "veg", icon: "🍄", unit: "handful" },
  { id: "zucchini",       label: "Zucchini",        cat: "fridge",  group: "veg", icon: "🥒", unit: "ea" },

  // fruit
  { id: "banana",         label: "Banana",          cat: "pantry",  group: "fruit", icon: "🍌", unit: "ea" },
  { id: "apple",          label: "Apple",           cat: "pantry",  group: "fruit", icon: "🍎", unit: "ea" },
  { id: "berries",        label: "Berries",         cat: "freezer", group: "fruit", icon: "🫐", unit: "handful" },
  { id: "orange",         label: "Orange",          cat: "pantry",  group: "fruit", icon: "🍊", unit: "ea" },
  { id: "lemon",          label: "Lemon",           cat: "fridge",  group: "fruit", icon: "🍋", unit: "ea" },

  // dairy
  { id: "milk",           label: "Milk",            cat: "fridge",  group: "dairy", icon: "🥛", unit: "ml" },
  { id: "cheese",         label: "Cheese",          cat: "fridge",  group: "dairy", icon: "🧀", unit: "g" },
  { id: "butter",         label: "Butter",          cat: "fridge",  group: "dairy", icon: "🧈", unit: "tbsp" },

  // fats / extras
  { id: "oil",            label: "Oil",             cat: "pantry",  group: "fat", icon: "🫒", unit: "tbsp" },
  { id: "avocado",        label: "Avocado",         cat: "pantry",  group: "fat", icon: "🥑", unit: "ea" },
  { id: "nuts",           label: "Nuts",            cat: "pantry",  group: "fat", icon: "🥜", unit: "handful" },
  { id: "seeds",          label: "Seeds",           cat: "pantry",  group: "fat", icon: "🌰", unit: "tbsp" },
  { id: "hummus",         label: "Hummus",          cat: "fridge",  group: "fat", icon: "🥣", unit: "tbsp" },

  // sauces / staples
  { id: "tomato-canned",  label: "Canned tomato",   cat: "pantry",  group: "sauce", icon: "🥫", unit: "can" },
  { id: "marinara",       label: "Marinara",        cat: "pantry",  group: "sauce", icon: "🥫", unit: "cup" },
  { id: "salsa",          label: "Salsa",           cat: "fridge",  group: "sauce", icon: "🌶️", unit: "tbsp" },
  { id: "soy",            label: "Soy sauce",       cat: "pantry",  group: "sauce", icon: "🥢", unit: "tbsp" },
  { id: "honey",          label: "Honey",           cat: "pantry",  group: "sauce", icon: "🍯", unit: "tsp" },
  { id: "mustard",        label: "Mustard",         cat: "pantry",  group: "sauce", icon: "🌭", unit: "tsp" },
  { id: "mayo",           label: "Mayo",            cat: "fridge",  group: "sauce", icon: "🥚", unit: "tbsp" },
];

export function kindFor(id) {
  return PANTRY_KINDS.find((k) => k.id === id) || null;
}

export const PANTRY_GROUPS = [
  { id: "protein", label: "Protein", icon: "💪", color: "#E07A5F" },
  { id: "carb",    label: "Carbs",   icon: "🌾", color: "#D4A574" },
  { id: "veg",     label: "Veg",     icon: "🥬", color: "#7CA982" },
  { id: "fruit",   label: "Fruit",   icon: "🍎", color: "#E8A0BF" },
  { id: "dairy",   label: "Dairy",   icon: "🥛", color: "#C9C2B0" },
  { id: "fat",     label: "Fats",    icon: "🫒", color: "#A8B79A" },
  { id: "sauce",   label: "Sauces",  icon: "🫙", color: "#B08968" },
];

export const PANTRY_LOCATIONS = [
  { id: "fridge",  label: "Fridge",  icon: "🧊" },
  { id: "freezer", label: "Freezer", icon: "❄️" },
  { id: "pantry",  label: "Pantry",  icon: "🥫" },
];

// Slot definitions for the day. Times are HH:MM, user can override per plan.
export const SLOTS = [
  { id: "breakfast", label: "Breakfast",  time: "08:00", icon: "🌅", color: "#F4A460", anchor: "morning" },
  { id: "snack-am",  label: "Mid-morning",time: "10:30", icon: "🍎", color: "#E8A0BF", anchor: "morning" },
  { id: "lunch",     label: "Lunch",      time: "13:00", icon: "🥗", color: "#7CA982", anchor: "midday" },
  { id: "snack-pm",  label: "Afternoon",  time: "16:00", icon: "🥜", color: "#C9A26B", anchor: "afternoon" },
  { id: "dinner",    label: "Dinner",     time: "19:00", icon: "🍲", color: "#9F7AEA", anchor: "evening" },
];

export function slotFor(id) {
  return SLOTS.find((s) => s.id === id) || SLOTS[0];
}

// Recipe library. `needs` references PANTRY_KIND ids. `optional` items improve the
// dish but aren't required. Seasoning (salt, pepper, herbs) is assumed available.
export const RECIPES = [
  // ---------- Breakfast ----------
  {
    id: "yogurt-bowl",
    name: "Greek yogurt bowl",
    slot: "breakfast",
    minutes: 3,
    vibe: ["high-protein", "no-cook"],
    needs: [
      { kind: "yogurt-greek", qty: 200, unit: "g" },
      { kind: "berries", qty: 1, unit: "handful", optional: true },
      { kind: "banana", qty: 1, unit: "ea", optional: true },
      { kind: "honey", qty: 1, unit: "tsp", optional: true },
      { kind: "oats", qty: 2, unit: "tbsp", optional: true },
      { kind: "nuts", qty: 1, unit: "handful", optional: true },
    ],
    steps: [
      "Spoon yogurt into a bowl.",
      "Top with fruit, a drizzle of honey, and a crunch (oats or nuts).",
    ],
    note: "Highest-protein breakfast for the lowest effort.",
  },
  {
    id: "scrambled-toast",
    name: "Scrambled eggs on toast",
    slot: "breakfast",
    minutes: 8,
    vibe: ["high-protein", "warm"],
    needs: [
      { kind: "egg", qty: 2, unit: "ea" },
      { kind: "bread", qty: 2, unit: "slice" },
      { kind: "butter", qty: 1, unit: "tbsp", optional: true },
      { kind: "cheese", qty: 30, unit: "g", optional: true },
      { kind: "spinach", qty: 1, unit: "handful", optional: true },
    ],
    steps: [
      "Toast the bread. Melt a little butter or oil in a pan.",
      "Whisk eggs with salt; scramble low and slow until just set.",
      "Pile onto toast, add cheese or wilted spinach.",
    ],
  },
  {
    id: "overnight-oats",
    name: "Overnight oats",
    slot: "breakfast",
    minutes: 2,
    vibe: ["prep-ahead", "no-cook"],
    needs: [
      { kind: "oats", qty: 50, unit: "g" },
      { kind: "milk", qty: 150, unit: "ml" },
      { kind: "yogurt-greek", qty: 60, unit: "g", optional: true },
      { kind: "pb", qty: 1, unit: "tbsp", optional: true },
      { kind: "banana", qty: 1, unit: "ea", optional: true },
      { kind: "berries", qty: 1, unit: "handful", optional: true },
      { kind: "seeds", qty: 1, unit: "tbsp", optional: true },
    ],
    steps: [
      "Combine oats and milk (or yogurt) in a jar tonight.",
      "Stir in pb, fruit, seeds. Cover and fridge overnight.",
      "Eat cold straight from the jar.",
    ],
    note: "Build it the night before so morning-you doesn't reach for junk.",
  },
  {
    id: "savory-avo-toast",
    name: "Avocado + egg toast",
    slot: "breakfast",
    minutes: 7,
    vibe: ["balanced"],
    needs: [
      { kind: "bread", qty: 2, unit: "slice" },
      { kind: "avocado", qty: 1, unit: "ea" },
      { kind: "egg", qty: 1, unit: "ea", optional: true },
      { kind: "tomato", qty: 1, unit: "ea", optional: true },
      { kind: "lemon", qty: 1, unit: "ea", optional: true },
    ],
    steps: [
      "Toast bread. Smash avocado with salt and a squeeze of lemon.",
      "Spread thick. Top with sliced tomato or a fried egg.",
    ],
  },
  {
    id: "cottage-bowl",
    name: "Cottage cheese + fruit",
    slot: "breakfast",
    minutes: 2,
    vibe: ["high-protein", "no-cook"],
    needs: [
      { kind: "cottage", qty: 200, unit: "g" },
      { kind: "berries", qty: 1, unit: "handful", optional: true },
      { kind: "banana", qty: 1, unit: "ea", optional: true },
      { kind: "honey", qty: 1, unit: "tsp", optional: true },
      { kind: "seeds", qty: 1, unit: "tbsp", optional: true },
    ],
    steps: ["Scoop cottage into bowl, top with fruit + honey + seeds."],
    note: "Wildly high protein, very low effort.",
  },
  {
    id: "pb-banana-toast",
    name: "PB + banana toast",
    slot: "breakfast",
    minutes: 4,
    vibe: ["fast", "filling"],
    needs: [
      { kind: "bread", qty: 2, unit: "slice" },
      { kind: "pb", qty: 2, unit: "tbsp" },
      { kind: "banana", qty: 1, unit: "ea" },
      { kind: "honey", qty: 1, unit: "tsp", optional: true },
    ],
    steps: ["Toast. Spread pb. Slice banana on top. Drizzle honey."],
  },
  {
    id: "veggie-scramble",
    name: "Veggie scramble",
    slot: "breakfast",
    minutes: 10,
    vibe: ["high-protein", "warm"],
    needs: [
      { kind: "egg", qty: 3, unit: "ea" },
      { kind: "spinach", qty: 1, unit: "handful", optional: true },
      { kind: "tomato", qty: 1, unit: "ea", optional: true },
      { kind: "onion", qty: 0.25, unit: "ea", optional: true },
      { kind: "cheese", qty: 30, unit: "g", optional: true },
      { kind: "oil", qty: 1, unit: "tsp" },
    ],
    steps: [
      "Sauté onion in oil 2 min. Add chopped tomato and spinach until wilted.",
      "Pour over whisked eggs, fold gently until set.",
    ],
  },

  // ---------- Lunch ----------
  {
    id: "big-salad",
    name: "Big protein salad",
    slot: "lunch",
    minutes: 8,
    vibe: ["light", "no-cook"],
    needs: [
      { kind: "lettuce", qty: 2, unit: "handful" },
      { kind: "cucumber", qty: 0.5, unit: "ea", optional: true },
      { kind: "tomato", qty: 1, unit: "ea", optional: true },
      { kind: "tuna-canned", qty: 1, unit: "can", optional: true },
      { kind: "egg", qty: 2, unit: "ea", optional: true },
      { kind: "chickpeas", qty: 0.5, unit: "can", optional: true },
      { kind: "cheese", qty: 30, unit: "g", optional: true },
      { kind: "oil", qty: 1, unit: "tbsp" },
      { kind: "lemon", qty: 0.5, unit: "ea", optional: true },
    ],
    steps: [
      "Tear lettuce into a big bowl with chopped veg.",
      "Add at least one protein (tuna, egg, chickpeas, cheese).",
      "Dress with oil, lemon or vinegar, salt, pepper.",
    ],
    note: "Aim for the bowl to be 50% leaves, 25% protein, 25% extras.",
  },
  {
    id: "grain-bowl",
    name: "Use-it-up grain bowl",
    slot: "lunch",
    minutes: 15,
    vibe: ["filling", "balanced"],
    needs: [
      { kind: "rice", qty: 80, unit: "g", optional: true },
      { kind: "potato", qty: 1, unit: "ea", optional: true },
      { kind: "chicken", qty: 120, unit: "g", optional: true },
      { kind: "beans-canned", qty: 0.5, unit: "can", optional: true },
      { kind: "egg", qty: 1, unit: "ea", optional: true },
      { kind: "spinach", qty: 1, unit: "handful", optional: true },
      { kind: "frozen-veg", qty: 1, unit: "handful", optional: true },
      { kind: "avocado", qty: 0.5, unit: "ea", optional: true },
      { kind: "soy", qty: 1, unit: "tbsp", optional: true },
    ],
    steps: [
      "Pick a base: rice or potato. Cook it.",
      "Pick a protein: chicken, beans, or egg. Cook it.",
      "Pile in a bowl with any veg you have. Drizzle soy or olive oil.",
    ],
    note: "Always 1 base + 1 protein + 1 veg. That's the formula.",
  },
  {
    id: "tuna-melt",
    name: "Tuna melt",
    slot: "lunch",
    minutes: 8,
    vibe: ["warm", "comforting"],
    needs: [
      { kind: "tuna-canned", qty: 1, unit: "can" },
      { kind: "bread", qty: 2, unit: "slice" },
      { kind: "cheese", qty: 40, unit: "g" },
      { kind: "mayo", qty: 1, unit: "tbsp", optional: true },
      { kind: "mustard", qty: 1, unit: "tsp", optional: true },
      { kind: "tomato", qty: 1, unit: "ea", optional: true },
    ],
    steps: [
      "Mix tuna with mayo or mustard, salt, pepper.",
      "Stack on bread with tomato + cheese. Toast in pan or oven until melted.",
    ],
  },
  {
    id: "quick-pasta",
    name: "Pantry pasta",
    slot: "lunch",
    minutes: 12,
    vibe: ["comforting"],
    needs: [
      { kind: "pasta", qty: 90, unit: "g" },
      { kind: "tomato-canned", qty: 0.5, unit: "can", optional: true },
      { kind: "marinara", qty: 0.5, unit: "cup", optional: true },
      { kind: "garlic", qty: 2, unit: "clove", optional: true },
      { kind: "oil", qty: 1, unit: "tbsp" },
      { kind: "cheese", qty: 30, unit: "g", optional: true },
      { kind: "spinach", qty: 1, unit: "handful", optional: true },
    ],
    steps: [
      "Boil pasta in salted water.",
      "Warm oil + sliced garlic in a pan. Add tomato or marinara.",
      "Toss pasta in sauce with wilted spinach + cheese on top.",
    ],
  },
  {
    id: "loaded-wrap",
    name: "Loaded wrap",
    slot: "lunch",
    minutes: 6,
    vibe: ["portable", "no-cook"],
    needs: [
      { kind: "tortilla", qty: 1, unit: "ea" },
      { kind: "deli-meat", qty: 60, unit: "g", optional: true },
      { kind: "egg", qty: 1, unit: "ea", optional: true },
      { kind: "cheese", qty: 30, unit: "g", optional: true },
      { kind: "hummus", qty: 2, unit: "tbsp", optional: true },
      { kind: "lettuce", qty: 1, unit: "handful", optional: true },
      { kind: "tomato", qty: 0.5, unit: "ea", optional: true },
    ],
    steps: [
      "Spread hummus on tortilla.",
      "Layer protein, cheese, leaves, tomato. Roll tight, cut in half.",
    ],
  },
  {
    id: "loaded-sweet-potato",
    name: "Loaded sweet potato",
    slot: "lunch",
    minutes: 35,
    vibe: ["filling", "warm"],
    needs: [
      { kind: "sweet-potato", qty: 1, unit: "ea" },
      { kind: "beans-canned", qty: 0.5, unit: "can", optional: true },
      { kind: "chickpeas", qty: 0.5, unit: "can", optional: true },
      { kind: "cheese", qty: 30, unit: "g", optional: true },
      { kind: "salsa", qty: 2, unit: "tbsp", optional: true },
      { kind: "avocado", qty: 0.5, unit: "ea", optional: true },
    ],
    steps: [
      "Bake sweet potato at 200°C / 400°F for 30–40 min (or microwave 7 min).",
      "Split open, top with beans, cheese, salsa, avocado.",
    ],
    note: "Bake two — eat one now, save one for tomorrow.",
  },

  // ---------- Dinner ----------
  {
    id: "stir-fry",
    name: "Anything stir-fry",
    slot: "dinner",
    minutes: 15,
    vibe: ["fast", "warm"],
    needs: [
      { kind: "chicken", qty: 150, unit: "g", optional: true },
      { kind: "tofu", qty: 150, unit: "g", optional: true },
      { kind: "egg", qty: 2, unit: "ea", optional: true },
      { kind: "frozen-veg", qty: 2, unit: "handful", optional: true },
      { kind: "broccoli", qty: 1, unit: "handful", optional: true },
      { kind: "bell-pepper", qty: 1, unit: "ea", optional: true },
      { kind: "garlic", qty: 2, unit: "clove", optional: true },
      { kind: "soy", qty: 2, unit: "tbsp" },
      { kind: "rice", qty: 80, unit: "g", optional: true },
      { kind: "noodles", qty: 80, unit: "g", optional: true },
      { kind: "oil", qty: 1, unit: "tbsp" },
    ],
    steps: [
      "Cook rice or noodles. Heat oil in big pan over high heat.",
      "Sear protein, set aside. Throw in veg + garlic, stir 3 min.",
      "Return protein, add soy. Toss with rice/noodles.",
    ],
  },
  {
    id: "sheet-pan-chicken",
    name: "Sheet-pan chicken + veg",
    slot: "dinner",
    minutes: 35,
    vibe: ["hands-off", "warm"],
    needs: [
      { kind: "chicken", qty: 200, unit: "g" },
      { kind: "potato", qty: 2, unit: "ea", optional: true },
      { kind: "sweet-potato", qty: 1, unit: "ea", optional: true },
      { kind: "broccoli", qty: 2, unit: "handful", optional: true },
      { kind: "carrot", qty: 2, unit: "ea", optional: true },
      { kind: "bell-pepper", qty: 1, unit: "ea", optional: true },
      { kind: "oil", qty: 2, unit: "tbsp" },
      { kind: "garlic", qty: 3, unit: "clove", optional: true },
      { kind: "lemon", qty: 0.5, unit: "ea", optional: true },
    ],
    steps: [
      "Chop veg into chunks. Toss everything with oil, salt, pepper, garlic.",
      "Roast at 220°C / 425°F for 25–30 min until chicken is 75°C / 165°F.",
      "Squeeze lemon over the top.",
    ],
    note: "Bonus pan: roast extra veg for tomorrow's grain bowl.",
  },
  {
    id: "chickpea-curry",
    name: "Lazy chickpea curry",
    slot: "dinner",
    minutes: 20,
    vibe: ["comforting", "vegetarian"],
    needs: [
      { kind: "chickpeas", qty: 1, unit: "can" },
      { kind: "tomato-canned", qty: 1, unit: "can" },
      { kind: "onion", qty: 1, unit: "ea" },
      { kind: "garlic", qty: 3, unit: "clove" },
      { kind: "rice", qty: 80, unit: "g", optional: true },
      { kind: "spinach", qty: 1, unit: "handful", optional: true },
      { kind: "oil", qty: 1, unit: "tbsp" },
    ],
    steps: [
      "Soften chopped onion + garlic in oil with cumin or curry powder.",
      "Pour in canned tomato + chickpeas, simmer 10 min until thick.",
      "Stir in spinach. Serve over rice.",
    ],
  },
  {
    id: "marinara-pasta",
    name: "Marinara pasta + protein",
    slot: "dinner",
    minutes: 18,
    vibe: ["comforting"],
    needs: [
      { kind: "pasta", qty: 100, unit: "g" },
      { kind: "marinara", qty: 1, unit: "cup", optional: true },
      { kind: "tomato-canned", qty: 1, unit: "can", optional: true },
      { kind: "beef-ground", qty: 150, unit: "g", optional: true },
      { kind: "chicken", qty: 150, unit: "g", optional: true },
      { kind: "beans-canned", qty: 0.5, unit: "can", optional: true },
      { kind: "garlic", qty: 2, unit: "clove", optional: true },
      { kind: "cheese", qty: 30, unit: "g", optional: true },
      { kind: "oil", qty: 1, unit: "tbsp" },
    ],
    steps: [
      "Boil pasta. Brown protein with garlic in a pan.",
      "Add marinara or canned tomato, simmer 5 min.",
      "Toss with pasta, finish with cheese.",
    ],
  },
  {
    id: "veg-tacos",
    name: "Bean + cheese tacos",
    slot: "dinner",
    minutes: 12,
    vibe: ["fast", "vegetarian"],
    needs: [
      { kind: "tortilla", qty: 3, unit: "ea" },
      { kind: "beans-canned", qty: 1, unit: "can" },
      { kind: "cheese", qty: 60, unit: "g" },
      { kind: "salsa", qty: 3, unit: "tbsp", optional: true },
      { kind: "avocado", qty: 0.5, unit: "ea", optional: true },
      { kind: "lettuce", qty: 1, unit: "handful", optional: true },
    ],
    steps: [
      "Warm beans with a pinch of cumin + salt. Mash a bit.",
      "Warm tortillas in a dry pan. Fill with beans, cheese, toppings.",
    ],
  },
  {
    id: "omelette-dinner",
    name: "Big dinner omelette",
    slot: "dinner",
    minutes: 10,
    vibe: ["fast", "high-protein"],
    needs: [
      { kind: "egg", qty: 3, unit: "ea" },
      { kind: "cheese", qty: 40, unit: "g", optional: true },
      { kind: "spinach", qty: 1, unit: "handful", optional: true },
      { kind: "mushroom", qty: 1, unit: "handful", optional: true },
      { kind: "tomato", qty: 1, unit: "ea", optional: true },
      { kind: "bread", qty: 1, unit: "slice", optional: true },
      { kind: "oil", qty: 1, unit: "tsp" },
    ],
    steps: [
      "Sauté any veg until soft. Pour over whisked eggs.",
      "Cover 2 min until set, fold in cheese. Serve with toast.",
    ],
  },

  // ---------- Snacks ----------
  {
    id: "apple-pb",
    name: "Apple + peanut butter",
    slot: "snack-am",
    minutes: 1,
    vibe: ["balanced"],
    needs: [
      { kind: "apple", qty: 1, unit: "ea" },
      { kind: "pb", qty: 1, unit: "tbsp" },
    ],
    steps: ["Slice apple, dip in pb."],
  },
  {
    id: "yogurt-honey-nuts",
    name: "Yogurt + honey + nuts",
    slot: "snack-am",
    minutes: 1,
    vibe: ["high-protein"],
    needs: [
      { kind: "yogurt-greek", qty: 150, unit: "g" },
      { kind: "honey", qty: 1, unit: "tsp", optional: true },
      { kind: "nuts", qty: 1, unit: "handful", optional: true },
      { kind: "berries", qty: 1, unit: "handful", optional: true },
    ],
    steps: ["Bowl it. Drizzle honey, top with nuts or berries."],
  },
  {
    id: "cheese-crackers",
    name: "Cheese + crackers",
    slot: "snack-pm",
    minutes: 1,
    vibe: ["fast"],
    needs: [
      { kind: "cheese", qty: 40, unit: "g" },
      { kind: "crackers", qty: 6, unit: "ea" },
      { kind: "apple", qty: 0.5, unit: "ea", optional: true },
    ],
    steps: ["Slice. Snack. Eat sitting down — not over the sink."],
  },
  {
    id: "hummus-veg",
    name: "Hummus + veg sticks",
    slot: "snack-pm",
    minutes: 2,
    vibe: ["light"],
    needs: [
      { kind: "hummus", qty: 3, unit: "tbsp" },
      { kind: "carrot", qty: 1, unit: "ea", optional: true },
      { kind: "cucumber", qty: 0.5, unit: "ea", optional: true },
      { kind: "bell-pepper", qty: 0.5, unit: "ea", optional: true },
      { kind: "crackers", qty: 4, unit: "ea", optional: true },
    ],
    steps: ["Cut veg into sticks. Scoop hummus."],
  },
  {
    id: "boiled-egg-fruit",
    name: "Hard-boiled egg + fruit",
    slot: "snack-am",
    minutes: 1,
    vibe: ["high-protein"],
    needs: [
      { kind: "egg", qty: 2, unit: "ea" },
      { kind: "apple", qty: 1, unit: "ea", optional: true },
      { kind: "banana", qty: 1, unit: "ea", optional: true },
      { kind: "orange", qty: 1, unit: "ea", optional: true },
    ],
    steps: [
      "Boil eggs 9 min from cold water (do a batch on Sunday).",
      "Pair with a piece of fruit.",
    ],
    note: "Pre-boil 4–6 eggs at once so this is grab-and-go.",
  },
  {
    id: "banana-nuts",
    name: "Banana + nuts",
    slot: "snack-pm",
    minutes: 1,
    vibe: ["fast"],
    needs: [
      { kind: "banana", qty: 1, unit: "ea" },
      { kind: "nuts", qty: 1, unit: "handful" },
    ],
    steps: ["Eat banana. Chase with a small handful of nuts."],
  },
  {
    id: "cottage-fruit",
    name: "Cottage + fruit",
    slot: "snack-pm",
    minutes: 1,
    vibe: ["high-protein"],
    needs: [
      { kind: "cottage", qty: 150, unit: "g" },
      { kind: "berries", qty: 1, unit: "handful", optional: true },
      { kind: "apple", qty: 0.5, unit: "ea", optional: true },
      { kind: "seeds", qty: 1, unit: "tbsp", optional: true },
    ],
    steps: ["Bowl it. Top with chopped fruit and a sprinkle of seeds."],
  },
];

// Anti-binge tips — surfaced on hunger check-ins, on the "I'm craving junk" button.
export const BINGE_TIPS = [
  "Drink a full glass of water and set a 10-minute timer. If you're still hungry then, eat — but pick something with protein first.",
  "Bingeing often masks tiredness. Have you slept 7+ hours? If not, the craving is a fatigue signal.",
  "Eat the protein in your pantry first. Cravings dim once your blood sugar settles.",
  "You're not bad for craving junk — you're under-fed. Skipping meals all day is what teed up the binge. Eat the planned meal now.",
  "Sit down. Plate it. Don't eat standing or out of a bag. The same food eaten with intention satisfies more.",
  "If you do snack, put one portion on a plate and put the bag away. Make 'going back for more' a deliberate choice, not a default.",
  "Walk around the block. The craving wave usually peaks at minute 7 and passes by minute 20.",
  "You haven't ruined anything. The next meal is always the next chance — don't write today off.",
];

export function pickTip(seed = Date.now()) {
  return BINGE_TIPS[Math.abs(seed) % BINGE_TIPS.length];
}

// --- Plan generation ---

function recipeScore(recipe, pantryKindSet) {
  const required = recipe.needs.filter((n) => !n.optional);
  const optional = recipe.needs.filter((n) => n.optional);
  const haveRequired = required.filter((n) => pantryKindSet.has(n.kind)).length;
  if (haveRequired < required.length) {
    return { ok: false, missing: required.filter((n) => !pantryKindSet.has(n.kind)).map((n) => n.kind) };
  }
  const haveOptional = optional.filter((n) => pantryKindSet.has(n.kind)).length;
  // Recipes with all-optional needs (e.g. "use it up" bowls) shouldn't trigger
  // when the pantry has none of them — that's a phantom match.
  if (required.length === 0 && haveOptional === 0) {
    return { ok: false, missing: [] };
  }
  return {
    ok: true,
    score: required.length * 2 + haveOptional,
    optionalHave: haveOptional,
    optionalTotal: optional.length,
    missing: [],
  };
}

// Generate a meal plan for a date given pantry items. `usedRecipeIds` lets you
// avoid repeating across slots within the same day. Falls back to "closest match"
// when nothing perfectly fits.
export function generatePlan(date, pantryItems) {
  const kindSet = new Set(pantryItems.filter((p) => (p.qty ?? 1) > 0).map((p) => p.kind));
  const used = new Set();
  const plan = {};

  for (const slot of SLOTS) {
    // Snack slots share recipes (snack-am + snack-pm).
    const slotMatchId = slot.id.startsWith("snack") ? "snack" : slot.id;
    const candidates = RECIPES.filter((r) => {
      if (slotMatchId === "snack") return r.slot === "snack-am" || r.slot === "snack-pm";
      return r.slot === slotMatchId;
    });
    const scored = candidates
      .map((r) => ({ r, s: recipeScore(r, kindSet) }))
      .filter((x) => x.s.ok && !used.has(x.r.id))
      .sort((a, b) => b.s.score - a.s.score);

    if (scored.length > 0) {
      const winner = scored[0];
      used.add(winner.r.id);
      plan[slot.id] = {
        recipeId: winner.r.id,
        name: winner.r.name,
        time: slot.time,
        minutes: winner.r.minutes,
        steps: winner.r.steps,
        note: winner.r.note || null,
        ingredients: winner.r.needs
          .filter((n) => !n.optional || kindSet.has(n.kind))
          .map((n) => ({ kind: n.kind, qty: n.qty, unit: n.unit, optional: !!n.optional })),
        eaten: false,
        skipped: false,
        hungerBefore: null,
        hungerAfter: null,
      };
    } else {
      // Best partial fit: closest recipe + missing list
      const partial = candidates
        .filter((r) => !used.has(r.id))
        .map((r) => {
          const req = r.needs.filter((n) => !n.optional);
          const missing = req.filter((n) => !kindSet.has(n.kind));
          return { r, missingCount: missing.length, missing };
        })
        .sort((a, b) => a.missingCount - b.missingCount)[0];

      if (partial) used.add(partial.r.id);

      plan[slot.id] = partial
        ? {
            recipeId: partial.r.id,
            name: partial.r.name,
            time: slot.time,
            minutes: partial.r.minutes,
            steps: partial.r.steps,
            note: `Missing: ${partial.missing.map((m) => kindFor(m.kind)?.label || m.kind).join(", ")}`,
            ingredients: partial.r.needs.map((n) => ({ kind: n.kind, qty: n.qty, unit: n.unit, optional: !!n.optional })),
            eaten: false,
            skipped: false,
            hungerBefore: null,
            hungerAfter: null,
          }
        : null;
    }
  }

  return {
    id: dateKey(date),
    date: new Date(date).toISOString(),
    slots: plan,
    notes: "",
    waterCups: 0,
  };
}

export function dateKey(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function findNextSlot(plan, now = new Date()) {
  if (!plan?.slots) return null;
  const hh = now.getHours(), mm = now.getMinutes();
  const minutesNow = hh * 60 + mm;
  let best = null;
  for (const slot of SLOTS) {
    const m = plan.slots[slot.id];
    if (!m || m.eaten || m.skipped) continue;
    const [h, mn] = m.time.split(":").map(Number);
    const slotMinutes = h * 60 + mn;
    const distance = slotMinutes - minutesNow;
    // pick the next upcoming slot, OR the most-recent overdue one
    if (distance >= -60) {
      if (!best || Math.abs(distance) < Math.abs(best.distance)) {
        best = { slot, meal: m, distance };
      }
    }
  }
  // If everything is past, return the next unmarked slot (earliest)
  if (!best) {
    for (const slot of SLOTS) {
      const m = plan.slots[slot.id];
      if (m && !m.eaten && !m.skipped) return { slot, meal: m, distance: 0 };
    }
  }
  return best;
}
