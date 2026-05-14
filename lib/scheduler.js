// DAG analysis + greedy calendar slot assignment for tasks.

export function topoSort(tasks, deps) {
  const ids = new Set(tasks.map((t) => t.id));
  const indeg = new Map(tasks.map((t) => [t.id, 0]));
  const adj = new Map(tasks.map((t) => [t.id, []]));
  for (const { parent_id, child_id } of deps) {
    if (!ids.has(parent_id) || !ids.has(child_id)) continue;
    adj.get(parent_id).push(child_id);
    indeg.set(child_id, indeg.get(child_id) + 1);
  }
  const queue = [];
  for (const [id, d] of indeg) if (d === 0) queue.push(id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const next of adj.get(id) || []) {
      indeg.set(next, indeg.get(next) - 1);
      if (indeg.get(next) === 0) queue.push(next);
    }
  }
  if (order.length !== tasks.length) {
    const remaining = tasks.filter((t) => !order.includes(t.id)).map((t) => t.id);
    return { error: 'cycle_detected', cycleMembers: remaining };
  }
  return { order, adj };
}

export function criticalPath(tasks, deps) {
  const sorted = topoSort(tasks, deps);
  if (sorted.error) return sorted;
  const { order, adj } = sorted;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const dur = (t) => Math.max(15, Number(t.estimate_minutes || 30));

  const es = new Map();
  for (const id of order) {
    let earliest = 0;
    for (const t of tasks) {
      const preds = (adj.get(t.id) || []).includes(id) ? [t.id] : [];
      for (const p of preds) earliest = Math.max(earliest, (es.get(p) || 0) + dur(byId.get(p)));
    }
    es.set(id, earliest);
  }
  const projectEnd = Math.max(0, ...order.map((id) => (es.get(id) || 0) + dur(byId.get(id))));

  const lf = new Map(order.map((id) => [id, projectEnd]));
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    const succ = adj.get(id) || [];
    if (succ.length) {
      let latest = Infinity;
      for (const s of succ) latest = Math.min(latest, (lf.get(s) || projectEnd) - dur(byId.get(s)));
      lf.set(id, latest);
    }
  }

  const items = order.map((id) => {
    const t = byId.get(id);
    const start = es.get(id) || 0;
    const finish = start + dur(t);
    const slack = (lf.get(id) || 0) - finish;
    return { id, title: t.title, est_minutes: dur(t), es: start, ef: finish, slack };
  });
  return { items, projectEnd, critical: items.filter((i) => i.slack === 0).map((i) => i.id) };
}

function withinWorkHours(d, startHour, endHour) {
  const h = d.getUTCHours();
  return h >= startHour && h < endHour;
}

function nextWorkSlot(d, startHour, endHour) {
  const out = new Date(d);
  out.setUTCSeconds(0, 0);
  const m = out.getUTCMinutes();
  out.setUTCMinutes(m + ((15 - (m % 15)) % 15));
  while (!withinWorkHours(out, startHour, endHour)) {
    if (out.getUTCHours() >= endHour) {
      out.setUTCDate(out.getUTCDate() + 1);
      out.setUTCHours(startHour, 0, 0, 0);
    } else {
      out.setUTCHours(startHour, 0, 0, 0);
    }
  }
  return out;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Greedy: walk forward from `now`, place each task (topo order) in the next
// free slot inside working hours that doesn't overlap an existing event.
export function autoSchedule(tasks, deps, events, opts = {}) {
  const {
    now = new Date(),
    workStartHour = 9,
    workEndHour = 18,
    bufferMinutes = 5,
  } = opts;
  const sorted = topoSort(tasks, deps);
  if (sorted.error) return sorted;
  const { order } = sorted;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const busy = events
    .map((e) => ({ start: new Date(e.starts_at), end: new Date(e.ends_at) }))
    .sort((a, b) => a.start - b.start);

  const placements = [];
  const finishedAt = new Map();

  for (const id of order) {
    const t = byId.get(id);
    const dur = Math.max(15, Number(t.estimate_minutes || 30));
    let earliest = now;
    for (const { parent_id, child_id } of deps) {
      if (child_id === id && finishedAt.has(parent_id)) {
        const pf = finishedAt.get(parent_id);
        if (pf > earliest) earliest = pf;
      }
    }
    let cursor = nextWorkSlot(earliest, workStartHour, workEndHour);
    while (true) {
      const end = new Date(cursor.getTime() + dur * 60_000);
      if (!withinWorkHours(new Date(end.getTime() - 1), workStartHour, workEndHour)) {
        const next = new Date(cursor);
        next.setUTCDate(next.getUTCDate() + 1);
        next.setUTCHours(workStartHour, 0, 0, 0);
        cursor = nextWorkSlot(next, workStartHour, workEndHour);
        continue;
      }
      const conflict = busy.find((b) => overlaps(cursor, end, b.start, b.end));
      if (conflict) {
        cursor = nextWorkSlot(
          new Date(conflict.end.getTime() + bufferMinutes * 60_000),
          workStartHour,
          workEndHour,
        );
        continue;
      }
      placements.push({ task_id: id, start: cursor.toISOString(), end: end.toISOString() });
      busy.push({ start: new Date(cursor), end });
      busy.sort((a, b) => a.start - b.start);
      finishedAt.set(id, new Date(end.getTime() + bufferMinutes * 60_000));
      break;
    }
  }

  return { placements };
}
