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
  const day = d.getDay(); // 0 Sun
  d.setDate(d.getDate() - day);
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

export function greeting(name) {
  const h = new Date().getHours();
  let base;
  if (h < 12) base = "Good morning";
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
];

export function randomPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export const TASK_CATEGORIES = [
  { id: "personal", label: "Personal", color: "#7C3AED", icon: "👤" },
  { id: "work", label: "Work", color: "#3B82F6", icon: "💼" },
  { id: "health", label: "Health", color: "#10B981", icon: "❤️" },
  { id: "learning", label: "Learning", color: "#F59E0B", icon: "📚" },
  { id: "errand", label: "Errand", color: "#6B7280", icon: "🛒" },
  { id: "social", label: "Social", color: "#EC4899", icon: "👥" },
  { id: "finance", label: "Finance", color: "#14B8A6", icon: "💰" },
  { id: "creative", label: "Creative", color: "#F472B6", icon: "🎨" },
];

export const PRIORITIES = [
  { id: 0, label: "Low", color: "#9CA3AF" },
  { id: 1, label: "Medium", color: "#3B82F6" },
  { id: 2, label: "High", color: "#F59E0B" },
  { id: 3, label: "Urgent", color: "#EF4444" },
];

export const GOAL_AREAS = [
  { id: "health", label: "Health", icon: "❤️" },
  { id: "career", label: "Career", icon: "💼" },
  { id: "relationships", label: "Relationships", icon: "👥" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "learning", label: "Learning", icon: "📚" },
  { id: "creative", label: "Creative", icon: "🎨" },
  { id: "mindfulness", label: "Mindfulness", icon: "🧘" },
  { id: "adventure", label: "Adventure", icon: "🏔️" },
];

export const GOAL_TIMEFRAMES = [
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "quarter", label: "This Quarter" },
  { id: "year", label: "This Year" },
  { id: "longTerm", label: "Long Term" },
];

export const HABIT_FREQUENCIES = [
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekends", label: "Weekends" },
  { id: "weekly", label: "Weekly" },
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
