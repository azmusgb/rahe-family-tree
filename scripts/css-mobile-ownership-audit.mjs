import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const stylesDir = path.join(root, 'src', 'styles');
const files = ['experience.css', 'home-responsive.css', 'interaction.css', 'mobile.css'];

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripComments(value) {
  return value.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function findMatchingBrace(css, openIndex) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let comment = false;

  for (let i = openIndex; i < css.length; i += 1) {
    const c = css[i];
    const n = css[i + 1];

    if (comment) {
      if (c === '*' && n === '/') {
        comment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === '\\') {
        escaped = true;
        continue;
      }
      if (c === quote) quote = '';
      continue;
    }

    if (c === '/' && n === '*') {
      comment = true;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }

    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return i;
      if (depth < 0) throw new Error('Unexpected closing brace');
    }
  }

  throw new Error('Unbalanced CSS block');
}

function parseBlocks(css, file, start = 0, end = css.length, ancestry = []) {
  const rules = [];
  let cursor = start;

  while (cursor < end) {
    while (cursor < end && /\s/.test(css[cursor])) cursor += 1;
    if (cursor >= end) break;

    if (css[cursor] === '/' && css[cursor + 1] === '*') {
      const close = css.indexOf('*/', cursor + 2);
      if (close === -1) throw new Error(`Unclosed comment in ${file}`);
      cursor = close + 2;
      continue;
    }

    let headerEnd = cursor;
    let quote = '';
    let escaped = false;
    let comment = false;
    let paren = 0;

    for (; headerEnd < end; headerEnd += 1) {
      const c = css[headerEnd];
      const n = css[headerEnd + 1];

      if (comment) {
        if (c === '*' && n === '/') {
          comment = false;
          headerEnd += 1;
        }
        continue;
      }
      if (quote) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (c === '\\') {
          escaped = true;
          continue;
        }
        if (c === quote) quote = '';
        continue;
      }
      if (c === '/' && n === '*') {
        comment = true;
        headerEnd += 1;
        continue;
      }
      if (c === '"' || c === "'") {
        quote = c;
        continue;
      }
      if (c === '(') paren += 1;
      else if (c === ')') paren = Math.max(0, paren - 1);
      else if (paren === 0 && (c === '{' || c === ';')) break;
    }

    if (headerEnd >= end) break;

    const rawHeader = stripComments(css.slice(cursor, headerEnd));
    const header = normalizeWhitespace(rawHeader);
    const terminator = css[headerEnd];

    if (terminator === ';') {
      cursor = headerEnd + 1;
      continue;
    }

    const close = findMatchingBrace(css, headerEnd);
    const bodyStart = headerEnd + 1;
    const bodyEnd = close;

    if (header.startsWith('@')) {
      const lower = header.toLowerCase();
      if (!lower.startsWith('@keyframes') && !lower.startsWith('@-webkit-keyframes')) {
        rules.push(...parseBlocks(css, file, bodyStart, bodyEnd, [...ancestry, header]));
      }
    } else if (header) {
      const body = normalizeWhitespace(stripComments(css.slice(bodyStart, bodyEnd)));
      rules.push({
        file,
        selector: header,
        normalizedSelector: normalizeWhitespace(header),
        body,
        ancestry: ancestry.map(normalizeWhitespace),
      });
    }

    cursor = close + 1;
  }

  return rules;
}

function suggestedOwner(rule) {
  const selector = rule.normalizedSelector.toLowerCase();
  const context = rule.ancestry.join(' ').toLowerCase();

  if (context.includes('prefers-reduced-motion') || selector.includes(':focus-visible') || selector.includes('[hidden]')) {
    return 'interaction.css';
  }
  if (selector.includes('data-route="dashboard"') || selector.includes('home-') || selector.includes('dashboard-') || selector.includes('.v17-home')) {
    return 'home-responsive.css';
  }
  if (selector.includes('family-graph') || selector.includes('tree-') || selector.includes('graph-') || selector.includes('relationship-path')) {
    return 'experience.css';
  }
  if (context.includes('max-width') || selector.includes('mobile-') || selector.includes('family-mobile-dock') || selector.includes('site-header') || selector.includes('safe-area')) {
    return 'mobile.css';
  }
  return null;
}

const allRules = [];
for (const file of files) {
  const css = fs.readFileSync(path.join(stylesDir, file), 'utf8');
  allRules.push(...parseBlocks(css, file));
}

const bySelector = new Map();
for (const rule of allRules) {
  const list = bySelector.get(rule.normalizedSelector) ?? [];
  list.push(rule);
  bySelector.set(rule.normalizedSelector, list);
}

const overlaps = [];
for (const [selector, rules] of bySelector) {
  const distinctFiles = [...new Set(rules.map((rule) => rule.file))];
  if (distinctFiles.length < 2) continue;

  const ownerVotes = rules.map(suggestedOwner).filter(Boolean);
  const suggested = ownerVotes.length
    ? ownerVotes.sort((a, b) => ownerVotes.filter((v) => v === b).length - ownerVotes.filter((v) => v === a).length)[0]
    : null;

  overlaps.push({
    selector,
    files: distinctFiles,
    occurrences: rules.map((rule) => ({
      file: rule.file,
      ancestry: rule.ancestry,
      body: rule.body,
      suggestedOwner: suggestedOwner(rule),
    })),
    suggestedOwner: suggested,
  });
}

const ownerViolations = [];
for (const rule of allRules) {
  const owner = suggestedOwner(rule);
  if (owner && owner !== rule.file) {
    ownerViolations.push({
      file: rule.file,
      selector: rule.normalizedSelector,
      ancestry: rule.ancestry,
      suggestedOwner: owner,
    });
  }
}

const pairCounts = {};
for (const overlap of overlaps) {
  const sorted = [...overlap.files].sort();
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const key = `${sorted[i]} <-> ${sorted[j]}`;
      pairCounts[key] = (pairCounts[key] ?? 0) + 1;
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  files,
  totals: {
    rules: allRules.length,
    crossFileSelectorOverlaps: overlaps.length,
    ownerViolations: ownerViolations.length,
  },
  pairCounts,
  overlaps: overlaps.sort((a, b) => a.selector.localeCompare(b.selector)),
  ownerViolations: ownerViolations.sort((a, b) => a.file.localeCompare(b.file) || a.selector.localeCompare(b.selector)),
};

const outPath = path.join(root, 'docs', 'css-mobile-ownership-report.json');
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report.totals));
console.log(JSON.stringify(pairCounts, null, 2));
