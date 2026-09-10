const SEARCH_LIMITS = Object.freeze({ people: 10, families: 8, claims: 8, sources: 8, tasks: 8, sections: 8 });

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const normalize = value => String(value ?? '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^\x00-\x7F]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const queryTokens = query => [...new Set(normalize(query).split(/\s+/).filter(Boolean))];

const searchableText = value => normalize(JSON.stringify(value ?? {}));

function matchesQuery(value, query) {
  const q = normalize(query);
  if (!q) return true;
  const text = searchableText(value);
  if (text.includes(q)) return true;
  const tokens = queryTokens(query);
  return tokens.length > 0 && tokens.every(token => text.includes(token));
}

function score(value, query, primary = '') {
  const q = normalize(query);
  if (!q) return 0;
  const text = searchableText(value);
  const main = normalize(primary);
  const tokens = queryTokens(query);
  let points = 0;
  if (main === q) points += 1000;
  if (main.startsWith(q)) points += 500;
  if (main.includes(q)) points += 350;
  if (text.includes(q)) points += 200;
  for (const token of tokens) {
    if (main.split(' ').some(part => part.startsWith(token))) points += 45;
    else if (main.includes(token)) points += 30;
    else if (text.includes(token)) points += 10;
  }
  return points;
}

function stateMatches(value, state) {
  if (!state) return true;
  return String(value?.state ?? value?.canonicalTreatment ?? '')
    .toUpperCase()
    .includes(String(state).toUpperCase());
}

function branchMatches(value, branch) {
  if (!branch) return true;
  const target = normalize(branch);
  const direct = normalize(value?.branch ?? '');
  if (direct.includes(target)) return true;
  return searchableText(value).includes(target);
}

function ranked(items, query, branch, state, primary, limit, supports = { branch: true, state: true }) {
  return (items ?? [])
    .filter(item => matchesQuery(item, query))
    .filter(item => !supports.branch || branchMatches(item, branch))
    .filter(item => !supports.state || stateMatches(item, state))
    .map(item => ({ item, score: score(item, query, primary(item)) }))
    .sort((a, b) => b.score - a.score || String(primary(a.item)).localeCompare(String(primary(b.item))))
    .slice(0, limit)
    .map(entry => entry.item);
}

function familyGroups(model) {
  return [
    ...(model?.familyGroups ?? []),
    ...(model?.familySupplement?.familyGroups ?? [])
  ];
}

function publicPeople(model) {
  const people = [
    ...(model?.people ?? []),
    ...(model?.familySupplement?.people ?? [])
  ];
  const superseded = model?.familySupplement?.aggregateReplacement?.canonicalPersonId;
  return superseded ? people.filter(person => person.id !== superseded) : people;
}

let model = null;
let corpus = null;
let loadPromise = null;

async function loadSearchData() {
  if (model && corpus) return;
  if (!loadPromise) {
    loadPromise = Promise.all([
      fetch('research-model.json', { cache: 'no-store' }),
      fetch('corpus.json', { cache: 'no-store' })
    ]).then(async ([modelResponse, corpusResponse]) => {
      if (!modelResponse.ok || !corpusResponse.ok) {
        throw new Error(`Search data unavailable (${modelResponse.status}/${corpusResponse.status})`);
      }
      [model, corpus] = await Promise.all([modelResponse.json(), corpusResponse.json()]);
    });
  }
  return loadPromise;
}

function filters() {
  return {
    q: document.querySelector('#search')?.value.trim() ?? '',
    branch: document.querySelector('#branch')?.value ?? '',
    state: document.querySelector('#state')?.value ?? ''
  };
}

function resultButton(kind, id, title, meta) {
  return `<button class="search-hit human" type="button" data-${kind}="${esc(id)}"><b>${esc(title)}</b><small>${esc(meta)}</small></button>`;
}

function resultLink(href, title, meta) {
  return `<a class="search-hit human" href="${esc(href)}"><b>${esc(title)}</b><small>${esc(meta)}</small></a>`;
}

function group(label, count, rows) {
  if (!rows.length) return '';
  return `<section class="search-group"><h3>${esc(label)} <span>${count}</span></h3>${rows.join('')}</section>`;
}

function fullCount(items, q, branch, state, supports = { branch: true, state: true }) {
  return (items ?? []).filter(item => matchesQuery(item, q))
    .filter(item => !supports.branch || branchMatches(item, branch))
    .filter(item => !supports.state || stateMatches(item, state)).length;
}

function renderOverlay() {
  if (!model || !corpus) return;
  const content = document.querySelector('#content');
  if (!content) return;

  content.querySelector('#search-v13-1-results')?.remove();
  content.querySelector('.family-search')?.remove();

  const { q, branch, state } = filters();
  if (!q) return;

  const people = publicPeople(model);
  const families = familyGroups(model);
  const claims = model.claims ?? [];
  const sources = model.sources ?? [];
  const tasks = model.researchTasks ?? [];
  const sections = corpus.sections ?? [];

  const peopleHits = ranked(people, q, branch, state, person => person.name ?? person.id, SEARCH_LIMITS.people);
  const familyHits = ranked(families, q, branch, state, family => family.label ?? family.id, SEARCH_LIMITS.families);
  const claimHits = ranked(claims, q, branch, state, claim => claim.claim ?? claim.id, SEARCH_LIMITS.claims);
  const sourceHits = ranked(sources, q, branch, state, source => `${source.id ?? ''} ${source.name ?? ''}`, SEARCH_LIMITS.sources, { branch: true, state: false });
  const taskHits = ranked(tasks, q, branch, state, task => task.record ?? task.id, SEARCH_LIMITS.tasks, { branch: true, state: false });
  const sectionHits = ranked(sections, q, branch, state, section => section.title ?? section.id, SEARCH_LIMITS.sections, { branch: true, state: false });

  const counts = {
    people: fullCount(people, q, branch, state),
    families: fullCount(families, q, branch, state),
    claims: fullCount(claims, q, branch, state),
    sources: fullCount(sources, q, branch, state, { branch: true, state: false }),
    tasks: fullCount(tasks, q, branch, state, { branch: true, state: false }),
    sections: fullCount(sections, q, branch, state, { branch: true, state: false })
  };
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const activeFilters = [branch ? `Branch: ${branch}` : '', state ? `Evidence: ${state}` : ''].filter(Boolean).join(' · ');
  const html = `
    <section id="search-v13-1-results" class="search-results family-search" aria-label="Search results">
      <div class="section-title search-summary">
        <div>
          <p class="eyebrow">SEARCH</p>
          <h2>Results for “${esc(q)}”</h2>
          <small>Word-order independent search across people, family groups, evidence, sources, research tasks, and archive text${activeFilters ? ` · ${esc(activeFilters)}` : ''}</small>
        </div>
        <div class="search-summary-count"><b>${total}</b><span>matching records</span><button type="reset" form="filters" class="text-link">Clear all</button></div>
      </div>
      <div class="search-groups">
        ${group('People', counts.people, peopleHits.map(person => resultButton('person', person.id, person.name ?? person.id, `${person.branch ?? 'Family'} · ${person.state ?? ''}`)))}
        ${group('Family groups', counts.families, familyHits.map(family => resultLink('#families', family.label ?? family.id, `${family.branch ?? 'Family'} · ${(family.childIds ?? []).length} child record(s)`)))}
        ${group('Evidence', counts.claims, claimHits.map(claim => resultButton('claim', claim.id, claim.claim ?? claim.id, `${claim.id ?? ''} · ${claim.state ?? ''}`)))}
        ${group('Sources', counts.sources, sourceHits.map(source => resultButton('source', source.id, `${source.id ?? ''} · ${source.name ?? ''}`, `${source.class ?? 'Source'} · ${source.weight ?? ''}`)))}
        ${group('Research tasks', counts.tasks, taskHits.map(task => resultButton('task', task.id, task.record ?? task.id, `${task.priority ?? ''} · ${task.branch ?? ''}`)))}
        ${group('Archive', counts.sections, sectionHits.map(section => resultLink(`#archive/${section.id}`, section.title ?? section.id, `${section.legacy ? 'Legacy annex' : 'Canonical/control'} · ${section.id}`)))}
        ${total === 0 ? '<div class="empty compact"><div class="empty-mark">0</div><div><b>No matching records</b><p>Try fewer words, a spelling variant, or clear the branch/evidence filters.</p></div></div>' : ''}
      </div>
    </section>`;

  content.insertAdjacentHTML('afterbegin', html);
}

function scheduleRender() {
  requestAnimationFrame(() => requestAnimationFrame(renderOverlay));
}

async function init() {
  try {
    await loadSearchData();
    scheduleRender();
  } catch (error) {
    console.error('Enhanced search failed to initialize:', error);
  }
}

const filtersForm = document.querySelector('#filters');
filtersForm?.addEventListener('input', scheduleRender);
filtersForm?.addEventListener('change', scheduleRender);
filtersForm?.addEventListener('reset', () => setTimeout(scheduleRender, 0));
window.addEventListener('hashchange', scheduleRender);
window.addEventListener('popstate', scheduleRender);

document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
    if (!typing) {
      event.preventDefault();
      document.querySelector('#search')?.focus();
    }
  }
  if (event.key === 'Escape' && document.activeElement?.id === 'search') {
    const input = document.querySelector('#search');
    if (input?.value) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
});

init();
