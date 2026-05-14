const api = (p, opts = {}) =>
  fetch(`/api${p}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then((r) => r.json());

const $ = (id) => document.getElementById(id);

const state = { today: null, options: null, triggers: null, recovery: null, progression: null };

const renderModeRow = () => {
  const modes = state.options;
  const cur = state.today.mode;
  const row = $("modeRow");
  row.innerHTML = "";
  const groups = [
    ["dayType", "day", modes.dayTypes],
    ["energy", "energy", modes.energyLevels],
    ["training", "training", modes.trainingModes],
    ["health", "health", modes.healthModes],
  ];
  for (const [key, label, opts] of groups) {
    const wrap = document.createElement("div");
    wrap.className = "mode-group";
    const lbl = document.createElement("span");
    lbl.className = "label";
    lbl.textContent = label;
    const sel = document.createElement("select");
    for (const o of opts) {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      if (cur[key] === o) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", async () => {
      await api("/daily/mode", { method: "POST", body: { [key]: sel.value } });
      await loadAll();
    });
    wrap.appendChild(lbl);
    wrap.appendChild(sel);
    row.appendChild(wrap);
  }
};

const renderFlow = () => {
  const t = state.today;
  $("flowHeadline").textContent = t.flow.headline;
  $("flowSubline").textContent = t.flow.subline;
  $("mvpToggle").checked = t.mvp;
  $("focusInput").value = t.focus ?? "";
  const list = $("checklist");
  list.innerHTML = "";
  for (const step of t.flow.checklist) {
    const li = document.createElement("li");
    if (t.completedSteps.includes(step.id)) li.classList.add("done");
    li.innerHTML = `<span>${step.label}</span>${step.est ? `<span class="est">${step.est}</span>` : ""}`;
    li.addEventListener("click", async () => {
      await api(`/daily/step/${step.id}`, { method: "POST" });
      await loadAll();
    });
    list.appendChild(li);
  }
};

const renderMeals = () => {
  const m = state.today.meals;
  const ul = $("mealList");
  ul.innerHTML = "";
  for (const slot of ["breakfast", "lunch", "dinner", "snack"]) {
    const meal = m[slot];
    if (!meal) continue;
    const li = document.createElement("li");
    li.innerHTML = `<strong style="text-transform:capitalize">${slot}</strong> — ${meal.name}`;
    li.style.cursor = "pointer";
    li.addEventListener("click", async () => {
      await api("/food/log", { method: "POST", body: { mealId: meal.id, slot } });
      await loadAll();
    });
    ul.appendChild(li);
  }
  if (m.mode === "safe_defaults") {
    const hint = document.createElement("li");
    hint.className = "small muted";
    hint.textContent = "Safe defaults — easy mode based on how you're feeling.";
    ul.appendChild(hint);
  }
};

const renderWorkout = () => {
  const w = state.today.workout;
  $("workoutLabel").textContent = w ? w.name : "Rest day.";
  const ul = $("workoutBlocks");
  ul.innerHTML = "";
  if (w?.blocks) for (const b of w.blocks) {
    const li = document.createElement("li");
    li.textContent = b;
    ul.appendChild(li);
  }
  $("completeWorkoutBtn").onclick = async () => {
    if (!w) return;
    await api("/fitness/complete", { method: "POST", body: { workoutId: w.id, mode: state.today.mode.training } });
    await loadAll();
  };
};

const renderRoom = () => {
  const flow = state.today.quickReset;
  $("roomLabel").textContent = `${flow.label} · ${flow.estimate}`;
  const ul = $("roomSteps");
  ul.innerHTML = "";
  const checked = new Set();
  for (const step of flow.steps) {
    const li = document.createElement("li");
    li.innerHTML = `<input type="checkbox" style="margin-right:8px"> ${step.label}`;
    const cb = li.querySelector("input");
    cb.addEventListener("change", () => {
      if (cb.checked) checked.add(step.id); else checked.delete(step.id);
    });
    ul.appendChild(li);
  }
  $("logRoomBtn").onclick = async () => {
    await api("/environment/log", {
      method: "POST",
      body: { flowId: "room_reset_10", stepIds: [...checked] },
    });
    await loadAll();
  };
};

const renderRecovery = async () => {
  const triggers = state.triggers;
  const tgEl = $("recoveryTriggers");
  tgEl.innerHTML = "";
  for (const t of triggers) {
    const b = document.createElement("button");
    b.textContent = t.label;
    b.addEventListener("click", async () => {
      await api("/recovery/start", { method: "POST", body: { trigger: t.id } });
      await loadAll();
    });
    tgEl.appendChild(b);
  }
  const wrap = $("recoveryActive");
  wrap.innerHTML = "";
  const active = state.recovery;
  if (!active.active) {
    $("recoveryStatus").textContent = "Nothing active. That's okay.";
    return;
  }
  $("recoveryStatus").textContent = `In recovery: ${active.label} — ${active.progress}%`;
  const intro = document.createElement("div");
  intro.className = "recovery-intro";
  intro.textContent = active.intro;
  wrap.appendChild(intro);
  const list = document.createElement("ul");
  list.className = "checklist tight";
  for (const step of active.steps) {
    const li = document.createElement("li");
    if (step.done) li.classList.add("done");
    li.textContent = step.label;
    li.addEventListener("click", async () => {
      await api(`/recovery/step/${step.id}`, { method: "POST" });
      await loadAll();
    });
    list.appendChild(li);
  }
  wrap.appendChild(list);
  const cancel = document.createElement("button");
  cancel.className = "chips";
  cancel.textContent = "Exit recovery";
  cancel.style.marginTop = "8px";
  cancel.addEventListener("click", async () => {
    await api("/recovery/cancel", { method: "POST" });
    await loadAll();
  });
  wrap.appendChild(cancel);
};

const renderProgression = () => {
  const p = state.progression;
  $("progressPill").textContent = `${p.identityStage.name} · L${p.level} · ${p.xp} xp`;
  $("stageName").textContent = `${p.identityStage.name} · Level ${p.level}`;
  $("stageNote").textContent = p.identityStage.note;
  $("xpBar").style.width = `${p.progressInLevel}%`;
  $("xpDetail").textContent = `${p.intoLevel} / ${p.nextLevelNeeds} xp to next level`;
  const ul = $("streaks");
  ul.innerHTML = "";
  for (const [k, v] of Object.entries(p.streaks)) {
    if (k === "lastCheckinDate" || k === "lastDates" || typeof v !== "number") continue;
    const li = document.createElement("li");
    li.textContent = `${k}: ${v}`;
    ul.appendChild(li);
  }
};

const wireMood = () => {
  for (const btn of document.querySelectorAll("#moodChips button")) {
    btn.addEventListener("click", async () => {
      await api("/daily/mood", { method: "POST", body: { feeling: btn.dataset.mood } });
      await loadAll();
    });
  }
};

const wireCrave = () => {
  $("craveSelect").addEventListener("change", async (e) => {
    const v = e.target.value;
    const ol = $("craveAdvice");
    ol.innerHTML = "";
    if (!v) return;
    const r = await api(`/food/crave?craving=${v}`);
    for (const s of r.steps) {
      const li = document.createElement("li");
      li.textContent = s;
      ol.appendChild(li);
    }
  });
};

const wireMvpAndFocus = () => {
  $("mvpToggle").addEventListener("change", async (e) => {
    await api("/daily/mvp", { method: "POST", body: { on: e.target.checked } });
    await loadAll();
  });
  let focusTimer;
  $("focusInput").addEventListener("input", (e) => {
    clearTimeout(focusTimer);
    focusTimer = setTimeout(async () => {
      await api("/daily/focus", { method: "POST", body: { focus: e.target.value } });
    }, 400);
  });
};

const renderMoodNote = () => {
  const m = state.today.mood;
  $("moodNote").textContent = m ? `Last check-in: ${m.feeling}${m.note ? " — " + m.note : ""}` : "No check-in yet today.";
  for (const btn of document.querySelectorAll("#moodChips button")) {
    btn.classList.toggle("active", m && m.feeling === btn.dataset.mood);
  }
};

const loadAll = async () => {
  [state.today, state.options, state.triggers, state.recovery, state.progression] = await Promise.all([
    api("/daily/today"),
    api("/daily/options"),
    api("/recovery/triggers"),
    api("/recovery/active"),
    api("/progression/"),
  ]);
  renderModeRow();
  renderFlow();
  renderMeals();
  renderWorkout();
  renderRoom();
  renderRecovery();
  renderProgression();
  renderMoodNote();
};

wireMood();
wireCrave();
wireMvpAndFocus();
loadAll();
