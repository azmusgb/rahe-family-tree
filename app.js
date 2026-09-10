const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const routes = {
  tree: ["Tree", "Connected research graph for the canonical person inventory. Relationship styling preserves the source evidence state."],
  people: ["People", "Every direct-line, collateral, sponsor, spouse, and research-lead person or identity in Appendix F."],
  branches: ["Branches", "Branch documentary cores and branch-specific investigations, with current claim states preserved."],
  timeline: ["Timeline", "Source-dated entries extracted from canonical tables. Dates are displayed as recorded; no event semantics are silently inferred."],
  evidence: ["Evidence", "Claim-level evidence, promotion controls, relationship assertions, and completeness gates."],
  sources: ["Sources", "Canonical source register, verified web/repository sources, source-ID crosswalk, and retrieval procedures."],
  research: ["Research Queue", "Prioritized record acquisition, branch proof sequences, stop rules, and negative-search controls."],
  conflicts: ["Conflicts", "Rejected assertions, competing hypotheses, chronology quarantines, and unresolved identity questions."],
  migration: ["Migration", "Geographic and migration evidence, origin hypotheses, and repository pathways."],
  archive: ["Archive", "Part I canonical synthesis, Appendices A–G, v10 controls, Part II lossless legacy annexes, and final certification."]
};

const canonicalSectionRules = {
  branches: /^(?:[4-9]|10)\.|^(?:4|5|6|7|8|9|10)\.[1-9]/,
  evidence: /^(?:1\.|1\.[12]|3\.|16\.|19\.|19\.[12]|20\.|21\.|22\.|Appendix [DFG]|D\.|G\.)/,
  sources: /^(?:14\.|15\.|Appendix [BE]|E\.)/,
  research: /^(?:13\.|13\.1|17\.|18\.|18\.[123]|Appendix E|E\.[123])/,
  conflicts: /^(?:5\.1|5\.2|8\.|8\.1|12\.|Appendix D|D\.)/,
  migration: /^(?:11\.|7\.3)/
};

let data;
let route = "tree";
let shown = [];
let graphScale = 1;

function stateTokens(s = "") {
  return ["SUPPORTED", "PROVISIONAL", "UNRESOLVED", "REJECTED", "DERIVATIVE"]
    .filter(x => s.toUpperCase().includes(x));
}

function badges(s = "") {
  const tokens = stateTokens(s);
  return tokens.length
    ? tokens.map(x => `<span class="badge ${x.toLowerCase()}">${x}</span>`).join("")
    : `<span class="badge neutral">QUALIFIED</span>`;
}

function stateClass(s = "") {
  const u = s.toUpperCase();
  if (u.includes("REJECTED")) return "rejected";
  if (u.includes("UNRESOLVED")) return "unresolved";
  if (u.includes("PROVISIONAL")) return "provisional";
  if (u.includes("SUPPORTED")) return "supported";
  if (u.includes("DERIVATIVE")) return "derivative";
  return "neutral";
}

function queryState() {
  return {
    q: $("#search").value.trim(),
    branch: $("#branch").value,
    state: $("#state").value
  };
}

function syncUrl(replace = true) {
  const u = new URL(location.href);
  const { q, branch, state } = queryState();
  for (const [key, value] of Object.entries({ q, branch, state })) {
    if (value) u.searchParams.set(key, value);
    else u.searchParams.delete(key);
  }
  if (replace) history.replaceState(null, "", u);
}

function hydrateFiltersFromUrl() {
  const u = new URL(location.href);
  $("#search").value = u.searchParams.get("q") || "";
  $("#branch").value = u.searchParams.get("branch") || "";
  $("#state").value = u.searchParams.get("state") || "";
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function objectMatches(obj) {
  const { q, branch, state } = queryState();
  const raw = JSON.stringify(obj);
  const text = normalizeText(raw);
  return (!q || text.includes(q.toLowerCase()))
    && (!branch || text.includes(branch.toLowerCase()))
    && (!state || raw.toUpperCase().includes(state));
}

function highlight(text, q = queryState().q) {
  const safe = esc(text);
  if (!q) return safe;
  const terms = [...new Set(q.split(/\s+/).filter(Boolean))].sort((a, b) => b.length - a.length);
  let result = safe;
  for (const term of terms) {
    const pattern = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    result = result.replace(pattern, "<mark>$1</mark>");
  }
  return result;
}

function sourceLinks(text) {
  const safe = esc(text);
  return safe.replace(/\b([CWV]\d{3})\b/g, (m, id) => {
    return data.sources.some(s => s.id === id)
      ? `<button class="link-button" data-source="${id}">${id}</button>`
      : m;
  });
}

function rowToText(row) {
  return row.filter(Boolean).join(" · ");
}

function sectionBlockHtml(block, section) {
  if (block.type === "p") {
    return `<p>${sourceLinks(block.text)}</p>`;
  }
  const rows = block.rows || [];
  if (!rows.length) return "";
  return `
    <div class="table-wrap" tabindex="0" aria-label="Scrollable table from ${esc(section.title)}">
      <table>
        <thead><tr>${rows[0].map(c => `<th scope="col">${sourceLinks(c)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.slice(1).map((r, i) => `<tr id="${section.id}-r${i + 1}">${r.map(c => `<td>${sourceLinks(c)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

function sectionCard(section, open = false) {
  const layer = section.legacy
    ? `LEGACY ANNEX · ${esc(section.annex || "Historical layer")}`
    : section.title.startsWith("25.")
      ? "v10 FINAL CERTIFICATION"
      : "PART I · CANONICAL / CONTROL";
  return `
    <details class="dossier-section" id="${section.id}" ${open ? "open" : ""}>
      <summary>
        <span>${esc(section.title)}</span>
        <small>${layer} · ${section.id}</small>
      </summary>
      <div class="document">
        ${section.legacy ? `<div class="legacy-note"><b>Historical source layer.</b> Retained claims may be superseded, rejected, or differently qualified by later controls. This annex does not promote evidence.</div>` : ""}
        ${section.blocks.map(b => sectionBlockHtml(b, section)).join("")}
        <div class="section-actions">
          <a href="#archive/${section.id}">Deep link ↗</a>
        </div>
      </div>
    </details>`;
}

function personCard(p) {
  return `
    <button class="person-card state-${stateClass(p.state)}" data-person="${p.id}">
      <span class="eyebrow">${esc(p.branch)}</span>
      <h3>${esc(p.name)}</h3>
      <p class="dates">${esc(p.dates)}</p>
      <div>${badges(p.state)}</div>
      <p class="state-copy">${esc(p.state)}</p>
      <p>${esc(p.role)}</p>
    </button>`;
}

function showDialog(html) {
  $("#detail-content").innerHTML = html;
  const dlg = $("#detail");
  if (!dlg.open) dlg.showModal();
}

function relatedRelationships(personId) {
  return data.relationships.filter(r => r.from === personId || r.to === personId);
}

function personById(id) {
  return data.people.find(p => p.id === id);
}

function relationshipLabel(r, currentId) {
  const otherId = r.from === currentId ? r.to : r.from;
  const other = personById(otherId);
  if (!other) return null;
  let role = r.type;
  if (r.type === "parent-child") role = r.from === currentId ? "Child" : "Parent";
  if (r.type === "spouse") role = "Spouse";
  if (r.type === "identity-bridge") role = "Identity bridge";
  if (r.type === "direct-line-succession") role = r.from === currentId ? "Later direct-line generation" : "Earlier direct-line generation";
  return { other, role };
}

function relatedClaims(p) {
  const tokens = p.name.replace(/[“”]/g, "").split(/[ /]+/).filter(x => x.length > 3);
  return data.claims.filter(c => tokens.some(t => `${c.claim} ${c.basis}`.toLowerCase().includes(t.toLowerCase())));
}

function showPerson(id) {
  const p = personById(id);
  if (!p) return;
  const rels = relatedRelationships(id);
  const claims = relatedClaims(p);
  const refs = (p.references || []).map(id => data.sections.find(s => s.id === id)).filter(Boolean);
  showDialog(`
    <p class="eyebrow">${esc(p.branch)} · APPENDIX F · ${esc(p.id)}</p>
    <h2>${esc(p.name)}</h2>
    <div>${badges(p.state)}</div>
    <dl class="facts">
      <dt>Dates / lead</dt><dd>${esc(p.dates)}</dd>
      <dt>Relationship / role</dt><dd>${esc(p.role)}</dd>
      <dt>Canonical treatment</dt><dd>${esc(p.state)}</dd>
      <dt>Privacy</dt><dd>${p.living ? "Living-person birth details withheld in this public edition." : "Historical research record; source uncertainty retained."}</dd>
      <dt>Source location</dt><dd>Appendix F · ${esc(p.section)} · row ${p.row}</dd>
    </dl>

    <h3>Connected relatives / identity links</h3>
    <div class="relation-list">
      ${rels.length ? rels.map(r => {
        const v = relationshipLabel(r, id);
        if (!v) return "";
        return `<button class="relation state-${stateClass(r.state)}" data-person="${v.other.id}">
          <span>${esc(v.role)}</span><b>${esc(v.other.name)}</b>
          <small>${badges(r.state)} ${esc(r.state)}</small>
        </button>`;
      }).join("") : `<p class="muted">No structured edge is currently asserted for this roster row.</p>`}
    </div>

    <h3>Related claims</h3>
    <div class="claim-list">
      ${claims.length ? claims.slice(0, 12).map(claimCard).join("") : `<p class="muted">No direct claim-register text match. Use dossier references below for branch context.</p>`}
    </div>

    <h3>Dossier references</h3>
    <div class="refs">
      ${refs.slice(0, 30).map(s => `<a href="#archive/${s.id}" data-dismiss>${esc(s.title)} <small>${s.id}</small></a>`).join("")}
    </div>`);
}

function claimCard(c) {
  return `<article class="claim-card state-${stateClass(c.state)}">
    <div class="claim-head"><code>${esc(c.id)}</code><div>${badges(c.state)}</div></div>
    <h3>${esc(c.claim)}</h3>
    <p><b>State:</b> ${esc(c.state)}</p>
    <p><b>Current basis:</b> ${sourceLinks(c.basis)}</p>
    <p><b>Next action:</b> ${esc(c.nextAction)}</p>
    <a href="#archive/${c.location.section}" data-dismiss>Open claim register row ↗</a>
  </article>`;
}

function showSource(id) {
  const s = data.sources.find(x => x.id === id);
  if (!s) return;
  const claims = data.claims.filter(c => `${c.basis} ${c.nextAction}`.includes(id));
  showDialog(`
    <p class="eyebrow">SOURCE · ${esc(s.id)}</p>
    <h2>${esc(s.name)}</h2>
    <dl class="facts">
      <dt>Class / type</dt><dd>${esc(s.class)}</dd>
      <dt>Key use / caution</dt><dd>${esc(s.use)}</dd>
      <dt>Weight / control</dt><dd>${esc(s.weight)}</dd>
      <dt>Legacy ID(s)</dt><dd>${esc(s.legacyIds || "—")}</dd>
      <dt>Source location</dt><dd>${esc(s.location.section)} · row ${s.location.row}</dd>
    </dl>
    <h3>Claims citing this source ID</h3>
    <div class="claim-list">${claims.length ? claims.map(claimCard).join("") : `<p class="muted">No canonical claim-register row cites this ID verbatim.</p>`}</div>
    <a class="action" href="#archive/${s.location.section}" data-dismiss>Open source register ↗</a>`);
}

function graphData() {
  const people = data.people.filter(p => objectMatches(p));
  const visibleIds = new Set(people.map(p => p.id));
  let rels = data.relationships.filter(r => {
    if (r.state.toUpperCase().includes("REJECTED")) return false;
    if ($("#state").value && !r.state.toUpperCase().includes($("#state").value)) return false;
    return visibleIds.has(r.from) && visibleIds.has(r.to);
  });
  return { people, rels };
}

function graphLayout(people, rels) {
  const rank = new Map(people.map(p => [p.id, 0]));
  const structural = rels.filter(r => ["parent-child", "direct-line-succession"].includes(r.type));
  for (let pass = 0; pass < people.length; pass++) {
    let changed = false;
    for (const r of structural) {
      const next = Math.max(rank.get(r.to) || 0, (rank.get(r.from) || 0) + 1);
      if (next !== rank.get(r.to)) { rank.set(r.to, next); changed = true; }
    }
    if (!changed) break;
  }
  for (const r of rels.filter(r => r.type === "spouse")) {
    const m = Math.max(rank.get(r.from) || 0, rank.get(r.to) || 0);
    rank.set(r.from, m); rank.set(r.to, m);
  }

  const groups = new Map();
  for (const p of people) {
    const r = rank.get(p.id) || 0;
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(p);
  }
  for (const arr of groups.values()) arr.sort((a, b) => `${a.branch}|${a.name}`.localeCompare(`${b.branch}|${b.name}`));

  const gapX = 250, gapY = 150, nodeW = 210, nodeH = 92;
  const positions = new Map();
  let maxX = 0, maxRank = 0;
  for (const [r, arr] of [...groups.entries()].sort((a,b)=>a[0]-b[0])) {
    maxRank = Math.max(maxRank, r);
    arr.forEach((p, i) => {
      const x = 30 + i * gapX;
      const y = 30 + r * gapY;
      positions.set(p.id, { x, y, w: nodeW, h: nodeH });
      maxX = Math.max(maxX, x + nodeW);
    });
  }
  return { positions, width: Math.max(900, maxX + 40), height: Math.max(500, 60 + (maxRank + 1) * gapY) };
}

function edgeSvg(r, positions) {
  const a = positions.get(r.from), b = positions.get(r.to);
  if (!a || !b) return "";
  const x1 = a.x + a.w / 2, y1 = a.y + a.h / 2;
  const x2 = b.x + b.w / 2, y2 = b.y + b.h / 2;
  const cls = stateClass(r.state);
  const bridge = r.type === "identity-bridge" ? " bridge-edge" : "";
  const spouse = r.type === "spouse" ? " spouse-edge" : "";
  return `<line class="graph-edge ${cls}${bridge}${spouse}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
    <title>${esc(r.type)} · ${esc(r.state)}</title>
  </line>`;
}

function nodeSvg(p, pos) {
  const label = p.name.length > 28 ? `${p.name.slice(0, 26)}…` : p.name;
  const branch = p.branch.length > 24 ? `${p.branch.slice(0, 22)}…` : p.branch;
  return `<g class="graph-node state-${stateClass(p.state)}" data-person="${p.id}" tabindex="0" role="button"
      aria-label="${esc(p.name)}, ${esc(p.state)}" transform="translate(${pos.x},${pos.y})">
    <rect width="${pos.w}" height="${pos.h}" rx="10"></rect>
    <text class="node-branch" x="14" y="20">${esc(branch)}</text>
    <text class="node-name" x="14" y="45">${esc(label)}</text>
    <text class="node-state" x="14" y="70">${esc(stateTokens(p.state).join(" · ") || "QUALIFIED")}</text>
  </g>`;
}

function renderGraph() {
  const { people, rels } = graphData();
  const { positions, width, height } = graphLayout(people, rels);
  const structural = rels.filter(r => r.type !== "spouse");
  const spouse = rels.filter(r => r.type === "spouse");
  return `
    <section class="graph-panel">
      <div class="graph-toolbar">
        <div>
          <b>Connected research graph</b>
          <span>${people.length} nodes · ${rels.length} visible relationships</span>
        </div>
        <div class="graph-actions">
          <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
          <button type="button" data-zoom="reset">100%</button>
          <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
        </div>
      </div>
      <div class="graph-legend" aria-label="Relationship evidence legend">
        <span><i class="solid"></i> Supported</span>
        <span><i class="provisional"></i> Provisional</span>
        <span><i class="unresolved"></i> Unresolved</span>
        <span><i class="bridge"></i> Identity bridge</span>
      </div>
      <div class="graph-scroll" tabindex="0" aria-label="Scrollable and zoomable family research graph">
        <svg id="family-graph" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="transform:scale(${graphScale});transform-origin:top left">
          <g>${structural.map(r => edgeSvg(r, positions)).join("")}${spouse.map(r => edgeSvg(r, positions)).join("")}</g>
          <g>${people.map(p => nodeSvg(p, positions.get(p.id))).join("")}</g>
        </svg>
      </div>
      <p class="graph-note">Rejected claims are excluded from active graph edges. Direct-line succession edges are labeled separately where the source gives a generation sequence without explicitly naming a father/mother role.</p>
    </section>`;
}

function treeOverview() {
  const bridge = data.relationships.find(r => r.id === "REL-IDENTITY-BRIDGE");
  const a = bridge ? personById(bridge.from) : null;
  const b = bridge ? personById(bridge.to) : null;
  return `
    <div class="stats">
      <div class="stat"><strong>${data.meta.people}</strong><span>Person / identity entries</span></div>
      <div class="stat"><strong>${data.meta.relationships}</strong><span>Structured relationships</span></div>
      <div class="stat"><strong>${data.meta.claims}</strong><span>Claim-register items</span></div>
      <div class="stat"><strong>${data.meta.sources}</strong><span>Canonical / verified sources</span></div>
    </div>
    <div class="critical-note">
      <div>
        <span class="eyebrow">CENTRAL IDENTITY CONTROL</span>
        <h2>DeVine → Rahe remains unresolved</h2>
        <p>Edward Ellery DeVine/DeVeine and William John Rahe Sr. remain separate identity nodes. The source describes a probable same-person hypothesis; the transition mechanism is unresolved.</p>
      </div>
      ${a && b ? `<div class="bridge-cards">${personCard(a)}<div class="bridge-label">UNRESOLVED<br><span>probable identity bridge</span></div>${personCard(b)}</div>` : ""}
    </div>`;
}

function renderPeople() {
  shown = data.people.filter(objectMatches);
  return `<div class="grid people-grid">${shown.map(personCard).join("")}</div>`;
}

function renderTimeline() {
  shown = data.events.filter(objectMatches);
  const limited = shown.slice(0, 600);
  return `
    <div class="notice">
      <b>Event-based source timeline</b>
      <p>Entries come from dated canonical table rows. The timeline does not reinterpret a date as a verified birth, marriage, or death unless the source row itself says so.</p>
    </div>
    <div class="timeline">
      ${limited.map(e => `<article class="event state-${stateClass(e.state)}">
        <time>${e.year}</time>
        <div>
          <h3><a href="#archive/${e.location.section}">${esc(e.title)}</a></h3>
          <p>${sourceLinks(e.excerpt)}</p>
          <small>${e.state ? badges(e.state) + " " + esc(e.state) : "Source-dated entry"}</small>
        </div>
      </article>`).join("")}
    </div>
    ${shown.length > limited.length ? `<p class="muted">Showing first ${limited.length} of ${shown.length} matching timeline entries. Narrow the search or branch/state filters for more precision.</p>` : ""}`;
}

function sourceCard(s) {
  return `<button class="source-card" data-source="${s.id}">
    <div class="source-id">${esc(s.id)}</div>
    <h3>${esc(s.name)}</h3>
    <p>${esc(s.class)}</p>
    <small>${esc(s.weight)}</small>
  </button>`;
}

function renderSources() {
  const sources = data.sources.filter(objectMatches);
  const sections = data.sections.filter(s => !s.legacy && canonicalSectionRules.sources.test(s.title) && objectMatches(s));
  shown = sources;
  return `
    <div class="stats compact">
      <div class="stat"><strong>${sources.length}</strong><span>Matching source records</span></div>
      <div class="stat"><strong>${data.sources.filter(s=>s.id.startsWith("C")).length}</strong><span>Canonical C-series</span></div>
      <div class="stat"><strong>${data.sources.filter(s=>s.id.startsWith("W")).length}</strong><span>Web/derivative W-series</span></div>
      <div class="stat"><strong>${data.sources.filter(s=>s.id.startsWith("V")).length}</strong><span>Verified V-series</span></div>
    </div>
    <div class="grid sources-grid">${sources.map(sourceCard).join("")}</div>
    <h2 class="section-title">Source governance & retrieval procedures</h2>
    <div class="section-list">${sections.map(sectionCard).join("")}</div>`;
}

function renderEvidence() {
  const claims = data.claims.filter(objectMatches);
  shown = claims;
  const sections = data.sections.filter(s => !s.legacy && canonicalSectionRules.evidence.test(s.title) && objectMatches(s));
  return `
    <div class="notice"><b>Claim + source + state + next action</b><p>Claim state is not recalculated by the app. The exact source qualification is retained from the controlling dossier.</p></div>
    <div class="claim-list">${claims.map(claimCard).join("")}</div>
    <h2 class="section-title">Evidence protocol and controls</h2>
    <div class="section-list">${sections.map(sectionCard).join("")}</div>`;
}

function renderResearch() {
  const sections = data.sections.filter(s => !s.legacy && canonicalSectionRules.research.test(s.title) && objectMatches(s));
  shown = sections;
  const q = data.sections.find(s => !s.legacy && s.title.startsWith("17."));
  let priority = "";
  if (q) {
    const table = q.blocks.find(b => b.type === "table");
    if (table) {
      priority = `<div class="queue-grid">${table.rows.slice(1).map((r, i) => `<article class="queue-card">
        <span class="priority">${esc(r[0] || `#${i + 1}`)}</span>
        <h3>${esc(r[1] || "")}</h3>
        <p><b>${esc(r[2] || "")}</b></p>
        <p>${esc(r[3] || "")}</p>
        <a href="#archive/${q.id}">Open queue row ↗</a>
      </article>`).join("")}</div>`;
    }
  }
  return `${priority}<h2 class="section-title">Research controls & negative searches</h2><div class="section-list">${sections.map(sectionCard).join("")}</div>`;
}

function renderArchive(parts) {
  shown = data.sections.filter(objectMatches);
  const openId = parts[1];
  return `
    <div class="archive-control">
      <div>
        <span class="eyebrow">SOURCE FIDELITY & PRIVACY</span>
        <h2>Complete public corpus</h2>
        <p>${data.meta.sections} sections · ${data.meta.tables} tables · ${data.meta.annexes} legacy annexes. The v10 final certification is classified as canonical/control content, not as a legacy annex.</p>
        <p>${data.meta.privacyRedactions} living-person birth-detail occurrences are intentionally withheld. Every redaction has a location-only ledger entry; removed values are not published in that ledger.</p>
      </div>
      <div class="archive-actions">
        <a class="action" href="corpus.json" download>Public corpus JSON ↓</a>
        <a class="action" href="coverage.json" download>Coverage manifest ↓</a>
        <a class="action" href="redactions.json" download>Redaction ledger ↓</a>
      </div>
    </div>
    <div class="section-list">${shown.map(s => sectionCard(s, s.id === openId)).join("")}</div>`;
}

function renderSectionRoute(name) {
  shown = data.sections.filter(s => !s.legacy && canonicalSectionRules[name]?.test(s.title) && objectMatches(s));
  return `<div class="section-list">${shown.map(sectionCard).join("")}</div>`;
}

function searchExcerpt(section, q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  for (let bi = 0; bi < section.blocks.length; bi++) {
    const b = section.blocks[bi];
    if (b.type === "p") {
      const text = b.text;
      const lower = text.toLowerCase();
      if (terms.every(t => lower.includes(t))) return { text, anchor: section.id };
    } else {
      for (let ri = 1; ri < b.rows.length; ri++) {
        const text = rowToText(b.rows[ri]);
        const lower = text.toLowerCase();
        if (terms.every(t => lower.includes(t))) return { text, anchor: `${section.id}-r${ri}` };
      }
    }
  }
  const fallback = section.blocks.find(b => b.type === "p")?.text || section.title;
  return { text: fallback, anchor: section.id };
}

function renderSearchResults() {
  const { q } = queryState();
  const people = data.people.filter(objectMatches);
  const claims = data.claims.filter(objectMatches);
  const sources = data.sources.filter(objectMatches);
  const sections = data.sections.filter(objectMatches).slice(0, 80);
  shown = [...people, ...claims, ...sources, ...sections];
  return `
    <div class="search-summary">
      <b>Global search</b>
      <span>${people.length} people · ${claims.length} claims · ${sources.length} sources · ${sections.length}${data.sections.filter(objectMatches).length > 80 ? "+" : ""} sections</span>
    </div>

    ${people.length ? `<h2>People</h2><div class="grid people-grid">${people.slice(0,24).map(personCard).join("")}</div>` : ""}
    ${claims.length ? `<h2>Claims</h2><div class="claim-list">${claims.slice(0,20).map(claimCard).join("")}</div>` : ""}
    ${sources.length ? `<h2>Sources</h2><div class="grid sources-grid">${sources.slice(0,20).map(sourceCard).join("")}</div>` : ""}

    <h2>Source passages</h2>
    <div class="search-results">
      ${sections.map(s => {
        const hit = searchExcerpt(s, q);
        return `<article class="search-hit">
          <div class="hit-meta">${s.legacy ? "LEGACY ANNEX" : s.title.startsWith("25.") ? "v10 FINAL CERTIFICATION" : "CANONICAL"} · ${s.id}</div>
          <h3>${highlight(s.title)}</h3>
          <p>${highlight(hit.text)}</p>
          <a href="#archive/${s.id}">Open section ↗</a>
        </article>`;
      }).join("")}
    </div>`;
}

function render() {
  if (!data) return;
  const parts = location.hash.slice(1).split("/");
  route = routes[parts[0]] ? parts[0] : "tree";
  const [title, description] = routes[route];
  $("#title").textContent = title;
  $("#description").textContent = description;
  $("#crumb").textContent = title;
  $("#nav").innerHTML = Object.entries(routes).map(([key, [label]], i) =>
    `<a href="#${key}" class="${key === route ? "active" : ""}" ${key === route ? 'aria-current="page"' : ""}>
      <span>${String(i + 1).padStart(2, "0")}</span>${esc(label)}
    </a>`).join("");

  syncUrl();
  const q = queryState().q;
  let html = "";
  if (q) html = renderSearchResults();
  else if (route === "tree") {
    shown = data.people.filter(objectMatches);
    html = `${treeOverview()}${renderGraph()}<h2 class="section-title">All people in the current graph filter</h2><div class="grid people-grid">${shown.map(personCard).join("")}</div>`;
  } else if (route === "people") html = renderPeople();
  else if (route === "timeline") html = renderTimeline();
  else if (route === "sources") html = renderSources();
  else if (route === "evidence") html = renderEvidence();
  else if (route === "research") html = renderResearch();
  else if (route === "archive") html = renderArchive(parts);
  else html = renderSectionRoute(route);

  $("#content").innerHTML = html || `<div class="empty">No matching records. Try another search, branch, or evidence state.</div>`;
  $("#status").textContent = q
    ? `${shown.length} matching research objects across source layers`
    : `${shown.length} ${["tree","people","timeline","evidence","sources"].includes(route) ? "records" : "dossier sections"} · ${data.meta.edition}`;

  if (parts[1]) requestAnimationFrame(() => document.getElementById(parts[1])?.scrollIntoView({ block: "start" }));
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}

$("#filters").addEventListener("submit", e => e.preventDefault());
for (const id of ["search", "branch", "state"]) {
  $("#" + id).addEventListener("input", () => render());
}
$("#filters").addEventListener("reset", () => setTimeout(() => {
  const u = new URL(location.href);
  ["q","branch","state"].forEach(k => u.searchParams.delete(k));
  history.replaceState(null, "", u);
  render();
}));

window.addEventListener("hashchange", () => {
  if ($("#detail").open) $("#detail").close();
  render();
});

document.addEventListener("click", e => {
  const person = e.target.closest("[data-person]");
  if (person) { showPerson(person.dataset.person); return; }
  const source = e.target.closest("[data-source]");
  if (source) { showSource(source.dataset.source); return; }
  const dismiss = e.target.closest("[data-dismiss]");
  if (dismiss && $("#detail").open) $("#detail").close();
  const zoom = e.target.closest("[data-zoom]");
  if (zoom) {
    if (zoom.dataset.zoom === "in") graphScale = Math.min(1.75, graphScale + 0.15);
    if (zoom.dataset.zoom === "out") graphScale = Math.max(0.45, graphScale - 0.15);
    if (zoom.dataset.zoom === "reset") graphScale = 1;
    render();
  }
});

document.addEventListener("keydown", e => {
  const node = e.target.closest?.(".graph-node[data-person]");
  if (node && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    showPerson(node.dataset.person);
  }
});

$("#close-detail").addEventListener("click", () => $("#detail").close());
$("#print").addEventListener("click", () => {
  $$("details").forEach(d => d.open = true);
  window.print();
});
$("#share").addEventListener("click", async () => {
  syncUrl();
  try {
    await navigator.clipboard.writeText(location.href);
    toast("Shareable filtered link copied.");
  } catch {
    toast("Copy unavailable. Use the current address-bar URL.");
  }
});
$("#export").addEventListener("click", () => {
  const payload = {
    edition: data.meta.edition,
    sourceSha256: data.meta.sha256,
    view: route,
    filters: queryState(),
    records: shown
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rahe-${route}-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

try {
  const response = await fetch("corpus.json");
  if (!response.ok) throw new Error(`Dossier request failed: ${response.status}`);
  data = await response.json();

  const branchValues = [...new Set(data.people.flatMap(p => p.branch.split("/").map(x => x.trim())).filter(Boolean))].sort();
  $("#branch").innerHTML += branchValues.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join("");
  hydrateFiltersFromUrl();
  render();
} catch (error) {
  console.error(error);
  $("#status").textContent = "The research dossier could not load.";
  $("#content").innerHTML = `<div class="empty"><b>Research data unavailable.</b><p>Reload the page. If the problem persists, verify that corpus.json is present in the deployed build.</p></div>`;
}
