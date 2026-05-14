import { html, useState, useMemo } from "../lib/ui.js";
import { state, remove } from "../lib/store.js";
import { fmtDate, isSameDay, moodEmoji, wordCount, startOfDay, addDays } from "../lib/utils.js";

export function JournalView({ openSheet }) {
  const entries = state.entries.value;
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => {
        const matchQ =
          !q ||
          (e.title || "").toLowerCase().includes(q) ||
          (e.body || "").toLowerCase().includes(q) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchTag = !tagFilter || (e.tags || []).includes(tagFilter);
        return matchQ && matchTag;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries, query, tagFilter]);

  const allTags = useMemo(
    () => Array.from(new Set(entries.flatMap((e) => e.tags || []))).sort(),
    [entries]
  );

  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const key = new Date(e.date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const streak = useMemo(() => {
    const days = new Set(entries.map((e) => startOfDay(e.date).getTime()));
    let day = startOfDay(new Date());
    let n = 0;
    while (days.has(day.getTime())) {
      n += 1;
      day = addDays(day, -1);
    }
    return n;
  }, [entries]);

  const totalWords = useMemo(
    () => entries.reduce((acc, e) => acc + wordCount(e.body), 0),
    [entries]
  );

  return html`
    <section class="screen">
      <header class="hero compact">
        <h1>Journal</h1>
        <p class="hero-sub">${entries.length} ${entries.length === 1 ? "entry" : "entries"}</p>
      </header>

      <div class="stat-grid">
        <div class="stat-tile" style="--c:#3B82F6"><small>Entries</small><strong>${entries.length}</strong></div>
        <div class="stat-tile" style="--c:#F59E0B"><small>Streak</small><strong>${streak}🔥</strong></div>
        <div class="stat-tile" style="--c:#7C3AED"><small>Words</small><strong>${totalWords}</strong></div>
      </div>

      <input class="search" placeholder="Search entries…" value=${query}
             onInput=${(e) => setQuery(e.target.value)} />

      ${allTags.length > 0 && html`
        <div class="tag-row">
          <button class=${`pill ${!tagFilter ? "active" : ""}`} onClick=${() => setTagFilter(null)}>All</button>
          ${allTags.map((t) => html`
            <button class=${`pill ${tagFilter === t ? "active" : ""}`}
                    onClick=${() => setTagFilter(tagFilter === t ? null : t)}>#${t}</button>
          `)}
        </div>
      `}

      ${entries.length === 0
        ? html`<div class="card empty">
            <p>Your journal is empty.</p>
            <button class="btn-primary" onClick=${() => openSheet({ type: "journal" })}>Start writing</button>
          </div>`
        : grouped.map(([month, items]) => html`
            <div class="block" key=${month}>
              <div class="block-head"><h2 class="month-h">${month}</h2></div>
              ${items.map((e) => html`
                <button class="card entry-card" key=${e.id} onClick=${() => openSheet({ type: "journal", entry: e })}>
                  <div class="entry-head">
                    <div>
                      <strong>${e.title?.trim() || fmtDate(e.date)}</strong>
                      <small class="muted">${fmtDate(e.date, { weekday: "long", month: "short", day: "numeric" })}</small>
                    </div>
                    <span class="entry-emoji">${moodEmoji(e.moodScore)}</span>
                  </div>
                  ${e.body && html`<p class="entry-snippet">${e.body.slice(0, 240)}${e.body.length > 240 ? "…" : ""}</p>`}
                  ${(e.tags || []).length > 0 && html`
                    <div class="tag-row tight">
                      ${e.tags.map((t) => html`<span class="pill small">#${t}</span>`)}
                    </div>
                  `}
                </button>
              `)}
            </div>
          `)}

      <button class="fab" onClick=${() => openSheet({ type: "journal" })} aria-label="new entry">＋</button>
    </section>
  `;
}
