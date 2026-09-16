import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const stylesDir = path.join(root, 'src', 'styles');

const moveToMobile = new Map([
  ['experience.css', new Set([
    'html',
    '#family-mobile-dock .mobile-more>div>a',
    '#family-mobile-dock .mobile-more>div>button',
  ])],
  ['interaction.css', new Set([
    '#family-mobile-dock',
    '#family-mobile-dock .v158-mobile-more>div',
    '#family-mobile-dock>details>summary',
    'body[data-experience="family"] .site-header-actions button',
  ])],
]);

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
  let paren = 0;
  let bracket = 0;

  for (let i = 0; i <= header.length; i += 1) {
    const c = header[i] ?? ',';
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
      const selector = normalizeWhitespace(header.slice(start, i));
      if (selector) selectors.push(selector);
      start = i + 1;
    }
  }
  return selectors;
}

function skipTrivia(css, start) {
  let i = start;
  while (i < css.length) {
    if (/\s/.test(css[i])) {
      i += 1;
      continue;
    }
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) throw new Error('Unclosed CSS comment');
      i = end + 2;
      continue;
    }
    break;
  }
  return i;
}

function findDelimiter(css, start) {
  let quote = '';
  let escaped = false;
  let comment = false;
  let paren = 0;
  for (let i = start; i < css.length; i += 1) {
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
    if (c === '(') paren += 1;
    else if (c === ')') paren = Math.max(0, paren - 1);
    else if (paren === 0 && (c === '{' || c === ';')) return { index: i, char: c };
  }
  return null;
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

function wrapRule(selector, body, ancestry) {
  let text = `${selector}{${body}}`;
  for (let i = ancestry.length - 1; i >= 0; i -= 1) {
    text = `${ancestry[i]}{\n${text}\n}`;
  }
  return text;
}

function transform(css, file, ancestry = []) {
  let out = '';
  const moved = [];
  let pos = 0;

  while (pos < css.length) {
    const contentStart = skipTrivia(css, pos);
    out += css.slice(pos, contentStart);
    if (contentStart >= css.length) break;

    const delimiter = findDelimiter(css, contentStart);
    if (!delimiter) {
      out += css.slice(contentStart);
      break;
    }
    if (delimiter.char === ';') {
      out += css.slice(contentStart, delimiter.index + 1);
      pos = delimiter.index + 1;
      continue;
    }

    const close = findMatchingBrace(css, delimiter.index);
    const rawHeader = css.slice(contentStart, delimiter.index);
    const header = normalizeWhitespace(stripComments(rawHeader));
    const body = css.slice(delimiter.index + 1, close);

    if (header.startsWith('@')) {
      const lower = header.toLowerCase();
      if (lower.startsWith('@keyframes') || lower.startsWith('@-webkit-keyframes')) {
        out += css.slice(contentStart, close + 1);
      } else {
        const nested = transform(body, file, [...ancestry, header]);
        out += `${rawHeader}{${nested.css}}`;
        moved.push(...nested.moved);
      }
      pos = close + 1;
      continue;
    }

    const selectors = splitSelectorList(header);
    const moveSet = moveToMobile.get(file) ?? new Set();
    const removeForContract = file === 'mobile.css' && (
      (selectors.includes('.family-person-preview') && ancestry.some((entry) => entry.includes('prefers-reduced-motion'))) ||
      (selectors.includes('*') && ancestry.some((entry) => entry.includes('prefers-reduced-motion')))
    );

    const retained = [];
    for (const selector of selectors) {
      if (moveSet.has(selector)) {
        moved.push({ selector, body, ancestry: [...ancestry], source: file });
      } else if (removeForContract && (selector === '.family-person-preview' || selector === '*')) {
        // The same reduced-motion contract is already owned by experience.css or interaction.css.
      } else {
        retained.push(selector);
      }
    }

    if (retained.length) {
      out += `${retained.join(',')}{${body}}`;
    }
    pos = close + 1;
  }

  return { css: out, moved };
}

const moved = [];
for (const file of ['experience.css', 'interaction.css']) {
  const full = path.join(stylesDir, file);
  const original = fs.readFileSync(full, 'utf8');
  const result = transform(original, file);
  fs.writeFileSync(full, result.css);
  moved.push(...result.moved);
}

const mobilePath = path.join(stylesDir, 'mobile.css');
const mobileOriginal = fs.readFileSync(mobilePath, 'utf8');
const mobileResult = transform(mobileOriginal, 'mobile.css');
const migration = [
  '/* ==========================================================================',
  '   Selector-arm ownership reconciliation',
  '   ========================================================================== */',
  '/* Shell and responsive selector arms moved here from experience/interaction owners.',
  ' * Inserted before historical mobile layers so existing later declarations retain precedence. */',
  ...moved.map((entry) => wrapRule(entry.selector, entry.body, entry.ancestry)),
  '',
].join('\n');

const marker = '/* ==========================================================================';
const insertion = mobileResult.css.indexOf(marker);
if (insertion < 0) throw new Error('Could not find mobile.css insertion point');
const nextMobile = `${mobileResult.css.slice(0, insertion)}${migration}${mobileResult.css.slice(insertion)}`;
fs.writeFileSync(mobilePath, nextMobile);

console.log(`Moved ${moved.length} selector arm(s) into mobile.css.`);
console.log('Removed redundant reduced-motion selector arms from mobile.css.');
