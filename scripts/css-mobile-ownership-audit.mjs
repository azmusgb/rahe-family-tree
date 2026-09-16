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

function splitSelectorList(header) {
  const selectors = [];
  let start = 0;
  let quote = '';
  let escaped = false;
  let comment = false;
  let paren = 0;
  let bracket = 0;

  for (let i = 0; i <= header.length; i += 1) {
    const c = header[i] ?? ',';
    const n = header[i + 1];

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
    if (c === '(') {
      paren += 1;
      continue;
    }
    if (c === ')') {
      paren = Math.max(0, paren - 1);
      continue;
    }
    if (c === '[') {
      bracket += 1;
      continue;
    }
    if (c === ']') {
      bracket = Math.max(0, bracket - 1);
      continue;
    }

    if (c === ',' && paren === 0 && bracket === 0) {
      const selector = normalizeWhitespace(stripComments(header.slice(start, i)));
      if (selector) selectors.push(selector);
      start = i + 1;
    }
  }

  return selectors;
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
    const header = normalizeWhitespace(stripComments(css.slice(cursor, headerEnd)));
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
      const normalizedAncestry = ancestry.map(normalizeWhitespace);
      const body = normalizeWhitespace(stripComments(css.slice(bodyStart, bodyEnd)));
      for (const selector of splitSelectorList(header)) {
        rules.push({ file, selector, ancestry: normalizedAncestry, body });
      }
    }

    cursor = close + 1;
  }

  return rules;
}

const allRules = files.flatMap((file) => {
  const css = fs.readFileSync(path.join(stylesDir, file), 'utf8');
  return parseBlocks(css, file);
});

const bySelector = new Map();
for (const rule of allRules) {
  const list = bySelector.get(rule.selector) ?? [];
  list.push(rule);
  bySelector.set(rule.selector, list);
}

const overlaps = [];
for (const [selector, rules] of bySelector) {
  const distinctFiles = [...new Set(rules.map((rule) => rule.file))];
  if (distinctFiles.length < 2) continue;
  overlaps.push({
    selector,
    files: distinctFiles.sort(),
    occurrences: rules.map(({ file, ancestry, body }) => ({ file, ancestry, body })),
  });
}

overlaps.sort((a, b) => a.selector.localeCompare(b.selector));

const pairCounts = {};
for (const overlap of overlaps) {
  for (let i = 0; i < overlap.files.length; i += 1) {
    for (let j = i + 1; j < overlap.files.length; j += 1) {
      const key = `${overlap.files[i]} <-> ${overlap.files[j]}`;
      pairCounts[key] = (pairCounts[key] ?? 0) + 1;
    }
  }
}

const report = {
  files,
  totals: {
    selectorArms: allRules.length,
    crossFileSelectorOverlaps: overlaps.length,
  },
  pairCounts,
  overlaps,
};

const outPath = path.join(root, 'docs', 'css-mobile-ownership-report.json');
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

if (process.argv.includes('--assert-clean') && overlaps.length > 0) {
  console.error(`Mobile CSS ownership audit failed: ${overlaps.length} cross-file selector overlap(s).`);
  console.error(JSON.stringify(pairCounts, null, 2));
  process.exitCode = 1;
}

console.log(JSON.stringify(report.totals));
console.log(JSON.stringify(pairCounts, null, 2));
