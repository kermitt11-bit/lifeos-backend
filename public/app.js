// Vanilla mobile SPA for Life OS. Uses fetch + tiny utilities.
// In demo mode (default deploy), auth is just an X-Demo-User header.

const LS_KEY = 'lifeos.user';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let userId = localStorage.getItem(LS_KEY) || '';

// --- HTTP -----------------------------------------------------------------

async function api(path, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  if (userId) headers['x-demo-user'] = userId;
  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) {
    let err;
    try { err = await res.json(); } catch { err = { error: res.statusText }; }
    throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { status: res.status, body: err });
  }
  if (res.status === 204) return null;
  return res.json();
}

function toast(msg, ms = 1800) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), ms);
}

// --- Auth (demo) ----------------------------------------------------------

function showApp() {
  $('#login').hidden = true;
  $('#app').hidden = false;
  $('#user-id').textContent = userId;
  const greet = $('#greeting-name');
  if (greet) greet.textContent = userId;
  loadAll();
}
function showLogin() {
  $('#login').hidden = false;
  $('#app').hidden = true;
}

$('#login-btn').onclick = () => {
  const v = $('#login-name').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!v) { toast('Pick a handle'); return; }
  userId = v;
  localStorage.setItem(LS_KEY, userId);
  showApp();
};
$('#login-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#login-btn').click(); });

$('#logout').onclick = () => {
  localStorage.removeItem(LS_KEY);
  userId = '';
  showLogin();
};

// --- Tabs -----------------------------------------------------------------

const TABS = ['today', 'chat', 'tasks', 'goals', 'habits', 'journal', 'plan'];
function showTab(tab) {
  for (const t of TABS) $(`#screen-${t}`).hidden = (t !== tab);
  $$('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'today') loadToday();
  if (tab === 'tasks') loadTasks();
  if (tab === 'goals') loadGoals();
  if (tab === 'habits') loadHabits();
  if (tab === 'journal') loadJournal();
}
$$('.tabbar button').forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));

// --- Today ----------------------------------------------------------------

const QUOTES = [
  ['What you do every day matters more than what you do once in a while.', 'Gretchen Rubin'],
  ['Discipline is choosing between what you want now and what you want most.', 'Augusta F. Kantra'],
  ['Small daily improvements are the key to staggering long-term results.', 'James Clear'],
  ['You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear'],
  ['The way to get started is to quit talking and begin doing.', 'Walt Disney'],
  ['Action is the antidote to anxiety.', '—'],
  ['The present moment is the only moment available to us, and it is the door to all moments.', 'Thich Nhat Hanh'],
  ['Begin doing what you want to do now.', 'Marie Beynon Ray'],
  ['Direction is more important than speed.', '—'],
  ['It always seems impossible until it’s done.', 'Nelson Mandela'],
];

function dailyQuote() {
  const seed = Math.floor(Date.now() / 86400000);
  const q = QUOTES[seed % QUOTES.length];
  return q;
}

async function loadToday() {
  const [quote, author] = dailyQuote();
  const dateEl = $('#today-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const qEl = $('#today-quote');
  if (qEl) qEl.innerHTML = `&ldquo;${escapeHtml(quote)}&rdquo; <span class="quote-author">— ${escapeHtml(author)}</span>`;

  let data;
  try { data = await api('/api/today'); }
  catch (e) { toast(e.message || 'Could not load today'); return; }

  // Events
  const ev = $('#today-events');
  ev.innerHTML = '';
  if (!data.events.length) {
    ev.innerHTML = emptyState('—', 'Nothing on the calendar today.');
  } else {
    for (const e of data.events) {
      const li = document.createElement('li');
      li.className = 'card';
      const s = new Date(e.starts_at);
      const en = new Date(e.ends_at);
      const time = `${s.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})} – ${en.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}`;
      li.innerHTML = `
        <div class="body">
          <div class="title">${escapeHtml(e.title)}</div>
          <div class="meta"><span class="pill">${escapeHtml(time)}</span>${e.location ? `<span class="pill">${escapeHtml(e.location)}</span>` : ''}</div>
        </div>`;
      ev.appendChild(li);
    }
  }

  // Tasks (scheduled today + due today, deduped)
  const tasks = $('#today-tasks');
  tasks.innerHTML = '';
  const byId = new Map();
  for (const t of [...data.scheduled_tasks, ...data.due_tasks]) byId.set(t.id, t);
  const todayTasks = [...byId.values()];
  if (!todayTasks.length) {
    tasks.innerHTML = emptyState('—', 'No tasks scheduled or due today. Plan some on the Plan tab.');
  } else {
    for (const t of todayTasks) {
      const li = document.createElement('li');
      li.className = `card${t.status === 'done' ? ' done' : ''}`;
      const checked = t.status === 'done';
      const when = t.scheduled_start ? new Date(t.scheduled_start).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}) : (t.due_at ? 'due today' : '');
      li.innerHTML = `
        <button class="checkbox ${checked ? 'checked' : ''}" data-id="${t.id}">${checked ? '✓' : ''}</button>
        <div class="body">
          <div class="title">${escapeHtml(t.title)}</div>
          <div class="meta">${priorityPill(t.priority)}${when ? `<span class="pill">${escapeHtml(when)}</span>` : ''}</div>
        </div>`;
      li.querySelector('.checkbox').onclick = async () => {
        const next = t.status === 'done' ? 'todo' : 'done';
        await api(`/api/tasks/${t.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
        loadToday();
      };
      tasks.appendChild(li);
    }
  }

  // Habits (chips)
  const habits = $('#today-habits');
  habits.innerHTML = '';
  if (!data.habits.length) {
    habits.innerHTML = `<li class="empty"><div class="why">No habits tracked yet.</div></li>`;
  } else {
    for (const h of data.habits) {
      const li = document.createElement('li');
      li.className = `habit-chip${h.logged_today ? ' logged' : ''}`;
      li.innerHTML = `<span>${escapeHtml(h.name)}</span>${h.logged_today ? '<span class="check">✓</span>' : ''}`;
      li.onclick = async () => {
        await api(`/api/habits/${h.id}/log`, { method: 'POST', body: '{}' });
        toast(`Logged ${h.name}`);
        loadToday();
      };
      habits.appendChild(li);
    }
  }

  // Journal
  const jl = $('#today-journal');
  jl.innerHTML = '';
  if (!data.recent_journal.length) {
    jl.innerHTML = emptyState('—', 'No entries yet. Tap the chat: "journal: ..."');
  } else {
    for (const j of data.recent_journal.slice(0, 2)) {
      const li = document.createElement('li');
      li.className = 'card';
      li.innerHTML = `
        <div class="body">
          <div class="title">${escapeHtml(j.title || j.entry_date)}</div>
          <div class="meta"><span class="pill">${escapeHtml(j.entry_date)}</span>${j.mood ? `<span class="pill tag-mood">mood ${j.mood}/10</span>` : ''}</div>
          <div class="meta-body">${escapeHtml((j.body || '').slice(0, 180))}${(j.body || '').length > 180 ? '…' : ''}</div>
        </div>`;
      jl.appendChild(li);
    }
  }
}

// --- Modal helper ---------------------------------------------------------

function openModal(title, fields, onSave) {
  $('#modal-title').textContent = title;
  const root = $('#modal-fields');
  root.innerHTML = '';
  for (const f of fields) {
    const lab = document.createElement('label');
    lab.textContent = f.label;
    let input;
    if (f.type === 'textarea') input = document.createElement('textarea');
    else if (f.type === 'select') {
      input = document.createElement('select');
      for (const o of f.options) {
        const opt = document.createElement('option');
        opt.value = o.value; opt.textContent = o.label;
        if (o.value === (f.value || '')) opt.selected = true;
        input.appendChild(opt);
      }
    } else {
      input = document.createElement('input');
      input.type = f.type || 'text';
    }
    if (f.placeholder) input.placeholder = f.placeholder;
    if (f.value != null && f.type !== 'select') input.value = f.value;
    if (f.required) input.required = true;
    input.name = f.name;
    lab.appendChild(input);
    root.appendChild(lab);
  }
  const dlg = $('#modal');
  dlg.showModal();
  $('#modal-form').onsubmit = (e) => {
    if (e.submitter && e.submitter.value === 'cancel') { dlg.close(); return; }
    e.preventDefault();
    const fd = new FormData($('#modal-form'));
    const out = {};
    for (const [k, v] of fd.entries()) if (v !== '') out[k] = v;
    Promise.resolve(onSave(out))
      .then(() => dlg.close())
      .catch((err) => toast(err.message || 'Error'));
  };
}

// --- Chat -----------------------------------------------------------------

const chatHistory = [];

function addBubble(text, who, opts = {}) {
  const div = document.createElement('div');
  div.className = `bubble ${who}${opts.thinking ? ' thinking' : ''}`;
  div.textContent = text;
  $('#chat-log').appendChild(div);
  $('#chat-log').scrollTop = $('#chat-log').scrollHeight;
  return div;
}

async function sendChat() {
  const msg = $('#chat-input').value.trim();
  if (!msg) return;
  $('#chat-input').value = '';
  $('#chat-input').style.height = '';
  addBubble(msg, 'user');
  const ph = addBubble('thinking…', 'bot', { thinking: true });
  try {
    const data = await api('/api/agent', { method: 'POST', body: JSON.stringify({ message: msg }) });
    ph.classList.remove('thinking');
    ph.textContent = data.reply || '(no response)';
    chatHistory.push({ role: 'user', content: msg }, { role: 'assistant', content: data.reply });
    if (data.mode === 'demo' && !$('#chat-mode-hint').textContent) {
      $('#chat-mode-hint').textContent = 'Demo agent — set ANTHROPIC_API_KEY for full natural-language planner.';
    }
    refreshAllInBackground();
  } catch (e) {
    ph.classList.remove('thinking');
    ph.textContent = `⚠ ${e.message}`;
  }
}

$('#chat-form').onsubmit = (e) => { e.preventDefault(); sendChat(); };
$('#chat-input').addEventListener('input', (e) => {
  e.target.style.height = 'auto';
  e.target.style.height = Math.min(e.target.scrollHeight, window.innerHeight * 0.3) + 'px';
});
$('#chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
});

// --- Tasks ----------------------------------------------------------------

function priorityPill(p) {
  const labels = { 1: 'urgent', 2: 'high', 3: 'normal', 4: 'low', 5: 'someday' };
  const cls = p === 1 ? 'tag-priority-1' : p === 2 ? 'tag-priority-2' : 'tag-priority-3';
  return `<span class="pill ${cls}">${labels[p] || 'normal'}</span>`;
}

function emptyState(glyph, why) {
  return `<li><div class="empty"><div class="glyph">${escapeHtml(glyph)}</div><div class="why">${escapeHtml(why)}</div></div></li>`;
}

async function loadTasks() {
  const status = $('#task-status').value;
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const { tasks } = await api(`/api/tasks${qs}`);
  const list = $('#task-list');
  list.innerHTML = '';
  if (!tasks.length) {
    list.innerHTML = emptyState('—', 'Nothing here yet. Ask the chat: "add task: write README".');
    return;
  }
  for (const t of tasks) {
    const li = document.createElement('li');
    li.className = `card${t.status === 'done' ? ' done' : ''}`;
    const checked = t.status === 'done';
    li.innerHTML = `
      <button class="checkbox ${checked ? 'checked' : ''}" data-id="${t.id}">${checked ? '✓' : ''}</button>
      <div class="body">
        <div class="title">${escapeHtml(t.title)}</div>
        <div class="meta">
          ${priorityPill(t.priority)}
          ${t.estimate_minutes ? `<span class="pill">${t.estimate_minutes}m</span>` : ''}
          ${t.due_at ? `<span class="pill">due ${t.due_at.slice(0,10)}</span>` : ''}
          ${t.scheduled_start ? `<span class="pill">@ ${new Date(t.scheduled_start).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'numeric', day: 'numeric' })}</span>` : ''}
        </div>
      </div>
      <div class="row-actions">
        <button class="action" data-edit="${t.id}">✎</button>
        <button class="action" data-del="${t.id}">✕</button>
      </div>
    `;
    li.querySelector('.checkbox').onclick = async () => {
      const next = t.status === 'done' ? 'todo' : 'done';
      await api(`/api/tasks/${t.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      loadTasks();
    };
    li.querySelector('[data-edit]').onclick = () => editTask(t);
    li.querySelector('[data-del]').onclick = async () => {
      if (!confirm(`Delete "${t.title}"?`)) return;
      await api(`/api/tasks/${t.id}`, { method: 'DELETE' });
      loadTasks();
    };
    list.appendChild(li);
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function editTask(t) {
  openModal('Edit task', [
    { name: 'title', label: 'Title', value: t.title, required: true },
    { name: 'priority', label: 'Priority (1=highest)', type: 'number', value: t.priority },
    { name: 'estimate_minutes', label: 'Estimate (minutes)', type: 'number', value: t.estimate_minutes || '' },
    { name: 'due_at', label: 'Due', type: 'datetime-local', value: t.due_at ? t.due_at.slice(0, 16) : '' },
    { name: 'notes', label: 'Notes', type: 'textarea', value: t.notes || '' },
    {
      name: 'status', label: 'Status', type: 'select', value: t.status,
      options: ['todo','doing','blocked','done','cancelled'].map((v) => ({ value: v, label: v })),
    },
  ], async (vals) => {
    if (vals.priority) vals.priority = parseInt(vals.priority, 10);
    if (vals.estimate_minutes) vals.estimate_minutes = parseInt(vals.estimate_minutes, 10);
    if (vals.due_at) vals.due_at = new Date(vals.due_at).toISOString();
    await api(`/api/tasks/${t.id}`, { method: 'PATCH', body: JSON.stringify(vals) });
    toast('Saved');
    loadTasks();
  });
}

$('#new-task-btn').onclick = () => {
  openModal('New task', [
    { name: 'title', label: 'Title', required: true, placeholder: 'What needs doing?' },
    { name: 'priority', label: 'Priority (1=highest)', type: 'number', value: 3 },
    { name: 'estimate_minutes', label: 'Estimate (minutes)', type: 'number', value: 30 },
    { name: 'due_at', label: 'Due', type: 'datetime-local' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ], async (vals) => {
    if (vals.priority) vals.priority = parseInt(vals.priority, 10);
    if (vals.estimate_minutes) vals.estimate_minutes = parseInt(vals.estimate_minutes, 10);
    if (vals.due_at) vals.due_at = new Date(vals.due_at).toISOString();
    await api('/api/tasks', { method: 'POST', body: JSON.stringify(vals) });
    toast('Added');
    loadTasks();
  });
};
$('#task-status').onchange = loadTasks;

// --- Goals ----------------------------------------------------------------

async function loadGoals() {
  const { goals } = await api('/api/goals');
  const list = $('#goal-list');
  list.innerHTML = '';
  if (!goals.length) {
    list.innerHTML = emptyState('—', 'No goals yet. What would you like to move toward?');
    return;
  }
  for (const g of goals) {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <div class="body">
        <div class="title">${escapeHtml(g.title)}</div>
        <div class="meta">
          <span class="pill tag-status">${escapeHtml(g.status)}</span>
          ${g.target_date ? `<span class="pill">by ${escapeHtml(g.target_date)}</span>` : ''}
        </div>
        ${g.description ? `<div class="meta-body">${escapeHtml(g.description)}</div>` : ''}
      </div>
      <div class="row-actions">
        <button class="action" data-del="${g.id}" aria-label="Delete">✕</button>
      </div>
    `;
    li.querySelector('[data-del]').onclick = async () => {
      if (!confirm(`Delete goal "${g.title}"?`)) return;
      await api(`/api/goals/${g.id}`, { method: 'DELETE' });
      loadGoals();
    };
    list.appendChild(li);
  }
}

$('#new-goal-btn').onclick = () => {
  openModal('New goal', [
    { name: 'title', label: 'Title', required: true },
    { name: 'description', label: 'Why does this matter?', type: 'textarea' },
    { name: 'target_date', label: 'Target date', type: 'date' },
  ], async (vals) => {
    await api('/api/goals', { method: 'POST', body: JSON.stringify(vals) });
    toast('Added');
    loadGoals();
  });
};

// --- Habits ---------------------------------------------------------------

async function loadHabits() {
  const { habits } = await api('/api/habits');
  const list = $('#habit-list');
  list.innerHTML = '';
  if (!habits.length) {
    list.innerHTML = emptyState('—', 'No habits tracked. Small consistent actions add up.');
    return;
  }
  for (const h of habits) {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <div class="body">
        <div class="title">${escapeHtml(h.name)}</div>
        <div class="meta">
          <span class="pill">${h.cadence}</span>
          <span class="pill">target ${h.target_per_period}/period</span>
          <span class="pill" data-streak="${h.id}">streak —</span>
        </div>
      </div>
      <div class="row-actions">
        <button class="primary" data-log="${h.id}">Log</button>
      </div>
    `;
    li.querySelector('[data-log]').onclick = async () => {
      await api(`/api/habits/${h.id}/log`, { method: 'POST', body: '{}' });
      toast(`Logged ${h.name}`);
      refreshStreak(h.id, li.querySelector('[data-streak]'));
    };
    list.appendChild(li);
    refreshStreak(h.id, li.querySelector('[data-streak]'));
  }
}

async function refreshStreak(id, el) {
  try {
    const r = await api(`/api/habits/${id}/streak`);
    el.textContent = `streak ${r.streak}`;
  } catch { /* ignore */ }
}

$('#new-habit-btn').onclick = () => {
  openModal('New habit', [
    { name: 'name', label: 'Name', required: true },
    {
      name: 'cadence', label: 'Cadence', type: 'select', value: 'daily',
      options: [
        { value: 'daily', label: 'daily' },
        { value: 'weekly', label: 'weekly' },
        { value: 'custom', label: 'custom' },
      ],
    },
    { name: 'target_per_period', label: 'Target per period', type: 'number', value: 1 },
  ], async (vals) => {
    if (vals.target_per_period) vals.target_per_period = parseInt(vals.target_per_period, 10);
    await api('/api/habits', { method: 'POST', body: JSON.stringify(vals) });
    toast('Added');
    loadHabits();
  });
};

// --- Journal --------------------------------------------------------------

async function loadJournal() {
  const { entries } = await api('/api/journal');
  const list = $('#journal-list');
  list.innerHTML = '';
  if (!entries.length) {
    list.innerHTML = emptyState('—', 'A blank page. What\'s on your mind today?');
    return;
  }
  for (const j of entries) {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <div class="body">
        <div class="title">${escapeHtml(j.title || j.entry_date)}</div>
        <div class="meta">
          <span class="pill">${escapeHtml(j.entry_date)}</span>
          ${j.mood ? `<span class="pill tag-mood">mood ${j.mood}/10</span>` : ''}
          ${(j.tags||[]).map((t) => `<span class="pill">#${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="meta-body">${escapeHtml(j.body)}</div>
      </div>
      <div class="row-actions">
        <button class="action" data-del="${j.id}" aria-label="Delete">✕</button>
      </div>
    `;
    li.querySelector('[data-del]').onclick = async () => {
      if (!confirm('Delete this entry?')) return;
      await api(`/api/journal/${j.id}`, { method: 'DELETE' });
      loadJournal();
    };
    list.appendChild(li);
  }
}

$('#new-journal-btn').onclick = () => {
  openModal('New journal entry', [
    { name: 'title', label: 'Title (optional)' },
    { name: 'body', label: 'Body', type: 'textarea', required: true },
    { name: 'mood', label: 'Mood (1–10)', type: 'number' },
    { name: 'tags', label: 'Tags (comma separated)' },
  ], async (vals) => {
    if (vals.mood) vals.mood = parseInt(vals.mood, 10);
    if (vals.tags) vals.tags = vals.tags.split(',').map((s) => s.trim()).filter(Boolean);
    await api('/api/journal', { method: 'POST', body: JSON.stringify(vals) });
    toast('Saved');
    loadJournal();
  });
};

// --- Plan -----------------------------------------------------------------

async function planPreview() {
  const from = parseInt($('#plan-from').value, 10);
  const to = parseInt($('#plan-to').value, 10);
  const data = await api('/api/plan/preview', {
    method: 'POST',
    body: JSON.stringify({ workStartHour: from, workEndHour: to, horizonDays: 7 }),
  });
  renderPlan(data);
}
async function planApply() {
  const data = await api('/api/plan/apply', { method: 'POST', body: '{}' });
  toast(`Scheduled ${data.updated?.length || 0} tasks`);
  renderPlan({ plan: { placements: data.updated.map((u) => ({ task_id: u.id, start: u.scheduled_start, end: u.scheduled_end })) } });
}
function renderPlan(data) {
  const out = $('#plan-output');
  out.innerHTML = '';
  if (data.critical_path?.critical?.length) {
    const cp = document.createElement('div');
    cp.className = 'plan-row highlight';
    cp.innerHTML = `<span class="when">Critical path</span><span class="what">${data.critical_path.critical.length} tasks · ${data.critical_path.projectEnd} min total</span>`;
    out.appendChild(cp);
  }
  for (const p of (data.plan?.placements || [])) {
    const row = document.createElement('div');
    row.className = 'plan-row';
    const start = new Date(p.start);
    const when = start.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    row.innerHTML = `<span class="when">${escapeHtml(when)}</span><span class="what">${escapeHtml(p.title || p.task_id)}</span>`;
    out.appendChild(row);
  }
  if (!out.children.length) {
    out.innerHTML = `<div class="plan-row"><span class="what muted">Nothing to schedule.</span></div>`;
  }
}
$('#plan-preview-btn').onclick = () => planPreview().catch((e) => toast(e.message));
$('#plan-apply-btn').onclick = () => planApply().catch((e) => toast(e.message));

// --- Bootstrap ------------------------------------------------------------

function refreshAllInBackground() {
  loadTasks().catch(() => {});
  loadGoals().catch(() => {});
  loadJournal().catch(() => {});
}

async function loadAll() {
  showTab('today');
  $('#chat-log').innerHTML = '';
  addBubble(
    'Tell me what\'s on your mind, or try:\n  • add task: buy oat milk\n  • add goal: learn to surf\n  • journal: felt steady today\n  • show my tasks',
    'bot',
  );
  refreshAllInBackground();
}

if (userId) showApp(); else showLogin();
