import { html, useState, useEffect } from "../lib/ui.js";
import { state, upsert, remove } from "../lib/store.js";
import {
  TASK_CATEGORIES, PRIORITIES, GOAL_AREAS, GOAL_TIMEFRAMES, HABIT_FREQUENCIES,
  FOOD_CATEGORIES, APPROVED_FOODS,
  uuid, todayKey, randomPrompt, moodEmoji,
} from "../lib/utils.js";

export function Sheet({ payload, onClose }) {
  if (!payload) return null;
  let content = null;
  if (payload.type === "task") content = html`<${TaskSheet} task=${payload.task} defaultDate=${payload.defaultDate} onClose=${onClose} />`;
  if (payload.type === "journal") content = html`<${JournalSheet} entry=${payload.entry} onClose=${onClose} />`;
  if (payload.type === "mood") content = html`<${MoodSheet} onClose=${onClose} />`;
  if (payload.type === "habit") content = html`<${HabitSheet} habit=${payload.habit} onClose=${onClose} />`;
  if (payload.type === "goal") content = html`<${GoalSheet} goal=${payload.goal} onClose=${onClose} />`;
  if (payload.type === "pantry") content = html`<${PantrySheet} onClose=${onClose} />`;
  if (payload.type === "block")  content = html`<${BlockSheet} defaultDate=${payload.defaultDate} replaces=${payload.replaces} onClose=${onClose} />`;
  if (!content) return null;
  return html`
    <div class="sheet-backdrop" onClick=${onClose}>
      <div class="sheet" onClick=${(e) => e.stopPropagation()}>
        <div class="sheet-grabber"></div>
        ${content}
      </div>
    </div>
  `;
}

function TaskSheet({ task, defaultDate, onClose }) {
  const editing = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? toLocalDT(task.dueDate) : toLocalDT(defaultDate || new Date().toISOString())
  );
  const [priority, setPriority] = useState(task?.priority ?? 1);
  const [category, setCategory] = useState(task?.category ?? "personal");
  const [estimate, setEstimate] = useState(task?.estimateMinutes ?? 30);

  async function save() {
    if (!title.trim()) return;
    await upsert("tasks", {
      id: task?.id || uuid(),
      title: title.trim(),
      notes,
      dueDate: new Date(dueDate).toISOString(),
      priority,
      category,
      estimateMinutes: Number(estimate) || 0,
      completed: task?.completed || false,
      completedAt: task?.completedAt || null,
    });
    onClose();
  }

  async function del() {
    if (!task) return onClose();
    if (!confirm("Delete this task?")) return;
    await remove("tasks", task.id);
    onClose();
  }

  return html`
    <div class="sheet-head">
      <button class="link" onClick=${onClose}>Cancel</button>
      <h2>${editing ? "Edit task" : "New task"}</h2>
      <button class="link primary" onClick=${save} disabled=${!title.trim()}>Save</button>
    </div>
    <div class="sheet-body">
      <label class="field">
        <span>Title</span>
        <input value=${title} onInput=${(e) => setTitle(e.target.value)} placeholder="What's the task?" autofocus />
      </label>
      <label class="field">
        <span>Notes</span>
        <textarea rows="3" value=${notes} onInput=${(e) => setNotes(e.target.value)}></textarea>
      </label>
      <label class="field">
        <span>Due</span>
        <input type="datetime-local" value=${dueDate} onInput=${(e) => setDueDate(e.target.value)} />
      </label>
      <label class="field">
        <span>Estimate (min)</span>
        <input type="number" min="5" max="480" step="5" value=${estimate} onInput=${(e) => setEstimate(e.target.value)} />
      </label>
      <div class="field">
        <span>Priority</span>
        <div class="seg-row">
          ${PRIORITIES.map((p) => html`
            <button class=${`seg ${priority === p.id ? "active" : ""}`}
                    style=${`--c:${p.color}`}
                    onClick=${() => setPriority(p.id)}>${p.label}</button>
          `)}
        </div>
      </div>
      <div class="field">
        <span>Category</span>
        <div class="cat-grid">
          ${TASK_CATEGORIES.map((c) => html`
            <button class=${`cat ${category === c.id ? "active" : ""}`}
                    style=${`--c:${c.color}`}
                    onClick=${() => setCategory(c.id)}>${c.icon} ${c.label}</button>
          `)}
        </div>
      </div>
      ${editing && html`<button class="btn-danger" onClick=${del}>Delete task</button>`}
    </div>
  `;
}

function JournalSheet({ entry, onClose }) {
  const todays = state.entries.value.find(
    (e) => new Date(e.date).toDateString() === new Date().toDateString()
  );
  const target = entry || todays;
  const [title, setTitle] = useState(target?.title ?? "");
  const [body, setBody] = useState(target?.body ?? "");
  const [mood, setMood] = useState(target?.moodScore ?? 6);
  const [gratitude, setGratitude] = useState(
    target?.gratitude && target.gratitude.length ? [...target.gratitude, "", "", ""].slice(0, 3) : ["", "", ""]
  );
  const [highlights, setHighlights] = useState(target?.highlights?.length ? target.highlights : [""]);
  const [challenges, setChallenges] = useState(target?.challenges ?? "");
  const [tomorrow, setTomorrow] = useState(target?.tomorrowFocus ?? "");
  const [tagsText, setTagsText] = useState((target?.tags || []).join(", "));
  const [prompt] = useState(randomPrompt());

  async function save() {
    const tags = tagsText.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const cleanGratitude = gratitude.map((g) => g.trim()).filter(Boolean);
    const cleanHighlights = highlights.map((h) => h.trim()).filter(Boolean);
    const id = target?.id || uuid();
    await upsert("entries", {
      id,
      date: target?.date || new Date().toISOString(),
      title: title.trim(),
      body,
      moodScore: mood,
      gratitude: cleanGratitude,
      highlights: cleanHighlights,
      challenges,
      tomorrowFocus: tomorrow,
      tags,
      updatedAt: new Date().toISOString(),
    });
    if (!target) {
      await upsert("moods", {
        id: uuid(),
        date: new Date().toISOString(),
        score: mood,
        energy: mood,
        stress: 10 - mood,
      });
    }
    onClose();
  }

  async function del() {
    if (!target) return onClose();
    if (!confirm("Delete this entry?")) return;
    await remove("entries", target.id);
    onClose();
  }

  return html`
    <div class="sheet-head">
      <button class="link" onClick=${onClose}>Cancel</button>
      <h2>${target ? "Edit entry" : "Today's entry"}</h2>
      <button class="link primary" onClick=${save}>Save</button>
    </div>
    <div class="sheet-body">
      <div class="prompt-inline">✨ <em>${prompt}</em></div>
      <label class="field">
        <span>Title</span>
        <input value=${title} onInput=${(e) => setTitle(e.target.value)} placeholder="Optional" />
      </label>
      <div class="field">
        <span>Mood ${moodEmoji(mood)} <small class="muted">${mood}/10</small></span>
        <input type="range" min="0" max="10" value=${mood} onInput=${(e) => setMood(Number(e.target.value))} />
      </div>
      <label class="field">
        <span>Reflection</span>
        <textarea rows="6" value=${body} onInput=${(e) => setBody(e.target.value)} placeholder="Write your thoughts…"></textarea>
      </label>
      <div class="field">
        <span>Three things I'm grateful for</span>
        ${[0, 1, 2].map((i) => html`
          <input key=${i} placeholder=${`Gratitude ${i + 1}`} value=${gratitude[i] || ""}
                 onInput=${(e) => {
                   const copy = [...gratitude];
                   copy[i] = e.target.value;
                   setGratitude(copy);
                 }} />
        `)}
      </div>
      <div class="field">
        <span>Highlights</span>
        ${highlights.map((h, i) => html`
          <input key=${i} placeholder=${`Highlight ${i + 1}`} value=${h}
                 onInput=${(e) => {
                   const copy = [...highlights];
                   copy[i] = e.target.value;
                   setHighlights(copy);
                 }} />
        `)}
        <button class="btn-secondary small" onClick=${() => setHighlights([...highlights, ""])}>+ Add highlight</button>
      </div>
      <label class="field">
        <span>Challenges</span>
        <textarea rows="2" value=${challenges} onInput=${(e) => setChallenges(e.target.value)}></textarea>
      </label>
      <label class="field">
        <span>Tomorrow's focus</span>
        <textarea rows="2" value=${tomorrow} onInput=${(e) => setTomorrow(e.target.value)}></textarea>
      </label>
      <label class="field">
        <span>Tags</span>
        <input value=${tagsText} onInput=${(e) => setTagsText(e.target.value)} placeholder="comma, separated" />
      </label>
      ${target && html`<button class="btn-danger" onClick=${del}>Delete entry</button>`}
    </div>
  `;
}

function MoodSheet({ onClose }) {
  const [mood, setMood] = useState(6);
  const [energy, setEnergy] = useState(6);
  const [stress, setStress] = useState(4);
  const [notes, setNotes] = useState("");

  async function save() {
    await upsert("moods", {
      id: uuid(),
      date: new Date().toISOString(),
      score: mood, energy, stress, notes,
    });
    onClose();
  }

  return html`
    <div class="sheet-head">
      <button class="link" onClick=${onClose}>Cancel</button>
      <h2>Mood check-in</h2>
      <button class="link primary" onClick=${save}>Save</button>
    </div>
    <div class="sheet-body">
      <div class="mood-big">${moodEmoji(mood)}</div>
      <${Slider} label="Mood" value=${mood} onChange=${setMood} />
      <${Slider} label="Energy" value=${energy} onChange=${setEnergy} color="#10B981" />
      <${Slider} label="Stress" value=${stress} onChange=${setStress} color="#EF4444" />
      <label class="field">
        <span>Notes</span>
        <textarea rows="3" value=${notes} onInput=${(e) => setNotes(e.target.value)}></textarea>
      </label>
    </div>
  `;
}

function HabitSheet({ habit, onClose }) {
  const editing = !!habit;
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [icon, setIcon] = useState(habit?.icon ?? "✓");
  const [color, setColor] = useState(habit?.color ?? "#10B981");
  const [frequency, setFrequency] = useState(habit?.frequency ?? "daily");
  const [targetPerWeek, setTarget] = useState(habit?.targetPerWeek ?? 7);

  const icons = ["✓", "💧", "🏃", "📚", "🧘", "🥗", "🏋️", "🧠", "🌱", "❤️", "✏️", "🎵"];
  const colors = ["#10B981", "#3B82F6", "#7C3AED", "#F59E0B", "#EC4899", "#14B8A6", "#EF4444", "#22D3EE"];

  async function save() {
    if (!name.trim()) return;
    await upsert("habits", {
      id: habit?.id || uuid(),
      name: name.trim(),
      description,
      icon, color, frequency,
      targetPerWeek: Number(targetPerWeek) || 7,
      createdAt: habit?.createdAt || new Date().toISOString(),
    });
    onClose();
  }

  async function del() {
    if (!habit) return onClose();
    if (!confirm("Delete this habit?")) return;
    await remove("habits", habit.id);
    onClose();
  }

  return html`
    <div class="sheet-head">
      <button class="link" onClick=${onClose}>Cancel</button>
      <h2>${editing ? "Edit habit" : "New habit"}</h2>
      <button class="link primary" onClick=${save} disabled=${!name.trim()}>Save</button>
    </div>
    <div class="sheet-body">
      <label class="field">
        <span>Name</span>
        <input value=${name} onInput=${(e) => setName(e.target.value)} placeholder="e.g. Drink water" autofocus />
      </label>
      <label class="field">
        <span>Why this matters</span>
        <textarea rows="2" value=${description} onInput=${(e) => setDescription(e.target.value)}></textarea>
      </label>
      <div class="field">
        <span>Repeats</span>
        <div class="seg-row">
          ${HABIT_FREQUENCIES.map((f) => html`
            <button class=${`seg ${frequency === f.id ? "active" : ""}`} onClick=${() => setFrequency(f.id)}>${f.label}</button>
          `)}
        </div>
      </div>
      <label class="field">
        <span>Target per week</span>
        <input type="number" min="1" max="7" value=${targetPerWeek} onInput=${(e) => setTarget(e.target.value)} />
      </label>
      <div class="field">
        <span>Icon</span>
        <div class="icon-grid">
          ${icons.map((i) => html`
            <button class=${`icon-pick ${icon === i ? "active" : ""}`} style=${`--c:${color}`} onClick=${() => setIcon(i)}>${i}</button>
          `)}
        </div>
      </div>
      <div class="field">
        <span>Color</span>
        <div class="color-row">
          ${colors.map((c) => html`
            <button class=${`color-dot ${color === c ? "active" : ""}`} style=${`background:${c}`} onClick=${() => setColor(c)}></button>
          `)}
        </div>
      </div>
      ${editing && html`<button class="btn-danger" onClick=${del}>Delete habit</button>`}
    </div>
  `;
}

function GoalSheet({ goal, onClose }) {
  const editing = !!goal;
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [area, setArea] = useState(goal?.area ?? "career");
  const [timeframe, setTimeframe] = useState(goal?.timeframe ?? "month");
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ? toLocalDate(goal.targetDate) : toLocalDate(addMonths(new Date(), 1).toISOString())
  );
  const [progress, setProgress] = useState(Math.round((goal?.progress || 0) * 100));
  const [completed, setCompleted] = useState(goal?.completed || false);
  const [milestones, setMilestones] = useState(goal?.milestones ?? "");

  async function save() {
    if (!title.trim()) return;
    await upsert("goals", {
      id: goal?.id || uuid(),
      title: title.trim(),
      description,
      area, timeframe,
      targetDate: new Date(targetDate).toISOString(),
      progress: progress / 100,
      completed,
      milestones,
      createdAt: goal?.createdAt || new Date().toISOString(),
    });
    onClose();
  }

  async function del() {
    if (!goal) return onClose();
    if (!confirm("Delete this goal?")) return;
    await remove("goals", goal.id);
    onClose();
  }

  return html`
    <div class="sheet-head">
      <button class="link" onClick=${onClose}>Cancel</button>
      <h2>${editing ? "Edit goal" : "New goal"}</h2>
      <button class="link primary" onClick=${save} disabled=${!title.trim()}>Save</button>
    </div>
    <div class="sheet-body">
      <label class="field">
        <span>Title</span>
        <input value=${title} onInput=${(e) => setTitle(e.target.value)} placeholder="What do you want?" autofocus />
      </label>
      <label class="field">
        <span>Why this matters</span>
        <textarea rows="3" value=${description} onInput=${(e) => setDescription(e.target.value)}></textarea>
      </label>
      <div class="field">
        <span>Area</span>
        <div class="cat-grid">
          ${GOAL_AREAS.map((a) => html`
            <button class=${`cat ${area === a.id ? "active" : ""}`} onClick=${() => setArea(a.id)}>${a.icon} ${a.label}</button>
          `)}
        </div>
      </div>
      <div class="field">
        <span>Timeframe</span>
        <div class="seg-row wrap">
          ${GOAL_TIMEFRAMES.map((t) => html`
            <button class=${`seg ${timeframe === t.id ? "active" : ""}`} onClick=${() => setTimeframe(t.id)}>${t.label}</button>
          `)}
        </div>
      </div>
      <label class="field">
        <span>Target date</span>
        <input type="date" value=${targetDate} onInput=${(e) => setTargetDate(e.target.value)} />
      </label>
      <div class="field">
        <span>Progress: ${progress}%</span>
        <input type="range" min="0" max="100" step="5" value=${progress} onInput=${(e) => setProgress(Number(e.target.value))} />
      </div>
      <label class="row">
        <span>Mark as completed</span>
        <input type="checkbox" checked=${completed} onChange=${(e) => setCompleted(e.target.checked)} />
      </label>
      <label class="field">
        <span>Milestones</span>
        <textarea rows="4" value=${milestones} onInput=${(e) => setMilestones(e.target.value)} placeholder="Free-form notes"></textarea>
      </label>
      ${editing && html`<button class="btn-danger" onClick=${del}>Delete goal</button>`}
    </div>
  `;
}

function PantrySheet({ onClose }) {
  const items = state.pantry.value;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("protein");

  async function add() {
    if (!name.trim()) return;
    await upsert("pantry", {
      id: uuid(),
      name: name.trim().toLowerCase(),
      category,
      addedAt: new Date().toISOString(),
    });
    setName("");
  }
  async function del(id) { await remove("pantry", id); }
  async function quickAdd(n, cat) {
    if (items.some((i) => i.name === n)) return;
    await upsert("pantry", { id: uuid(), name: n, category: cat, addedAt: new Date().toISOString() });
  }

  return html`
    <div class="sheet-head">
      <button class="link" onClick=${onClose}>Done</button>
      <h2>Pantry</h2>
      <span></span>
    </div>
    <div class="sheet-body">
      <small class="muted">Approved ingredients only. No eggs (rule).</small>
      <label class="field">
        <span>Add ingredient</span>
        <input value=${name} onInput=${(e) => setName(e.target.value)} placeholder="e.g. salmon" onKeyDown=${(e) => { if (e.key === "Enter") add(); }} />
      </label>
      <div class="field">
        <span>Category</span>
        <div class="seg-row">
          ${FOOD_CATEGORIES.map((c) => html`
            <button class=${`pill ${category === c.id ? "active" : ""}`} onClick=${() => setCategory(c.id)} key=${c.id}>${c.icon} ${c.label}</button>
          `)}
        </div>
      </div>
      <button class="btn-primary" onClick=${add}>Add to pantry</button>

      ${FOOD_CATEGORIES.map((c) => html`
        <div key=${c.id}>
          <h3>${c.icon} ${c.label}</h3>
          <div class="seg-row">
            ${(APPROVED_FOODS[c.id] || []).map((f) => {
              const have = items.some((i) => i.name === f);
              return html`<button class=${`pill ${have ? "active" : ""}`} onClick=${() => quickAdd(f, c.id)} key=${f}>${have ? "✓ " : "+ "}${f}</button>`;
            })}
          </div>
        </div>
      `)}

      ${items.length > 0 && html`
        <h3>In pantry</h3>
        <div class="seg-row">
          ${items.map((i) => html`<button class="pill outline" key=${i.id} onClick=${() => del(i.id)}>${i.name} ×</button>`)}
        </div>
      `}
    </div>
  `;
}

function BlockSheet({ defaultDate, replaces, onClose }) {
  const editing = !!replaces;
  const [title, setTitle] = useState(replaces?.title ?? "");
  const [icon, setIcon] = useState(replaces?.icon ?? "🌿");
  const [startMin, setStartMin] = useState(replaces?.startMin ?? 9 * 60);
  const [endMin, setEndMin] = useState(replaces?.endMin ?? 10 * 60);
  const [category, setCategory] = useState(replaces?.category ?? "personal");
  const date = defaultDate || new Date().toISOString();

  const icons = ["🌿","💧","🥣","🏃","🧠","💼","🥗","🎨","📓","🛀","📞","🧘","🍽️","🌙"];

  async function save() {
    if (!title.trim()) return;
    if (replaces) {
      await upsert("actualBlocks", {
        id: uuid(),
        date, presetId: replaces.id,
        startMin: Number(startMin), endMin: Number(endMin),
        title: title.trim(), icon, category,
        completed: true, skipped: false, notes: "",
      });
    } else {
      await upsert("actualBlocks", {
        id: uuid(),
        date, presetId: null,
        startMin: Number(startMin), endMin: Number(endMin),
        title: title.trim(), icon, category,
        completed: false, skipped: false, notes: "",
      });
    }
    onClose();
  }

  return html`
    <div class="sheet-head">
      <button class="link" onClick=${onClose}>Cancel</button>
      <h2>${editing ? "Replace block" : "New block"}</h2>
      <button class="link primary" onClick=${save} disabled=${!title.trim()}>Save</button>
    </div>
    <div class="sheet-body">
      ${editing && html`<div class="prompt-inline">Replacing original: <b>${replaces.title}</b>. Original stays visible.</div>`}
      <label class="field">
        <span>Title</span>
        <input value=${title} onInput=${(e) => setTitle(e.target.value)} placeholder="e.g. Walk + audiobook" autofocus />
      </label>
      <div class="field">
        <span>Icon</span>
        <div class="icon-grid">
          ${icons.map((i) => html`<button class=${`icon-pick ${icon === i ? "active" : ""}`} style=${`--c:#C77B7B`} onClick=${() => setIcon(i)} key=${i}>${i}</button>`)}
        </div>
      </div>
      <div class="row">
        <span>Start</span>
        <input type="time" value=${minToTimeStr(startMin)} onInput=${(e) => setStartMin(timeStrToMin(e.target.value))} style="max-width:140px;" />
      </div>
      <div class="row">
        <span>End</span>
        <input type="time" value=${minToTimeStr(endMin)} onInput=${(e) => setEndMin(timeStrToMin(e.target.value))} style="max-width:140px;" />
      </div>
      <div class="field">
        <span>Category</span>
        <div class="cat-grid">
          ${TASK_CATEGORIES.map((c) => html`
            <button class=${`cat ${category === c.id ? "active" : ""}`} style=${`--c:${c.color}`} onClick=${() => setCategory(c.id)} key=${c.id}>${c.icon} ${c.label}</button>
          `)}
        </div>
      </div>
    </div>
  `;
}

function minToTimeStr(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function timeStrToMin(s) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

function Slider({ label, value, onChange, color = "#C77B7B" }) {
  return html`
    <div class="field">
      <span>${label} <small class="muted">${value}/10</small></span>
      <input type="range" min="0" max="10" value=${value} style=${`accent-color:${color}`}
             onInput=${(e) => onChange(Number(e.target.value))} />
    </div>
  `;
}

function toLocalDT(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}
