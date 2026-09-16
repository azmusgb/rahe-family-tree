import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const stylesDir = path.join(root, 'src', 'styles');

const moveExperienceToMobile = new Set([
  '#family-mobile-dock .mobile-more>div',
]);

const moveMobileToExperience = new Set([
  '.family-person-preview',
  '.family-person-preview-actions',
  '.family-person-preview-handle',
  '.family-person-preview-head h2',
  'body[data-route="tree"] #content.mobile-tree-surface',
  'body[data-route="tree"] #content.mobile-tree-surface .v161-tree-toolbar',
]);

function normalize(value) {
  return value.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ').trim();
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

function extractSelectors(css, selectors, ancestry = []) {
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
    const header = normalize(rawHeader);
    const body = css.slice(delimiter.index + 1, close);

    if (header.startsWith('@')) {
      const lower = header.toLowerCase();
      if (lower.startsWith('@keyframes') || lower.startsWith('@-webkit-keyframes')) {
        out += css.slice(contentStart, close + 1);
      } else {
        const nested = extractSelectors(body, selectors, [...ancestry, header]);
        out += `${rawHeader}{${nested.css}}`;
        moved.push(...nested.moved);
      }
    } else if (selectors.has(header)) {
      moved.push({ selector: header, ancestry, rule: css.slice(contentStart, close + 1) });
    } else {
      out += css.slice(contentStart, close + 1);
    }

    pos = close + 1;
  }

  return { css: out, moved };
}

function wrap(entry) {
  let text = entry.rule.trim();
  for (let i = entry.ancestry.length - 1; i >= 0; i -= 1) {
    text = `${entry.ancestry[i]}{\n${text}\n}`;
  }
  return text;
}

function section(title, explanation, entries) {
  return [
    '/* ==========================================================================',
    `   ${title}`,
    '   ========================================================================== */',
    explanation,
    ...entries.map(wrap),
    '',
  ].join('\n');
}

const experiencePath = path.join(stylesDir, 'experience.css');
const mobilePath = path.join(stylesDir, 'mobile.css');
const originalExperience = fs.readFileSync(experiencePath, 'utf8');
const originalMobile = fs.readFileSync(mobilePath, 'utf8');

const experienceResult = extractSelectors(originalExperience, moveExperienceToMobile);
const mobileResult = extractSelectors(originalMobile, moveMobileToExperience);

if (!experienceResult.moved.length) throw new Error('Expected experience -> mobile ownership rules were not found.');
if (!mobileResult.moved.length) throw new Error('Expected mobile -> experience ownership rules were not found.');

const mobileMarkerCandidates = [
  '/* ==========================================================================\n   Ownership migration: interaction -> mobile',
  '/* ==========================================================================\n   Source:',
];
let mobileInsert = -1;
for (const marker of mobileMarkerCandidates) {
  mobileInsert = mobileResult.css.indexOf(marker);
  if (mobileInsert >= 0) break;
}
if (mobileInsert < 0) throw new Error('Could not find a safe mobile.css insertion point.');

const experienceToMobileSection = section(
  'Ownership migration: experience -> mobile shell',
  '/* Mobile More sheet geometry belongs to the mobile shell. Inserted before later mobile layers so established mobile overrides retain precedence. */',
  experienceResult.moved,
);
const nextMobile = `${mobileResult.css.slice(0, mobileInsert)}${experienceToMobileSection}${mobileResult.css.slice(mobileInsert)}`;

const mobileToExperienceSection = section(
  'Ownership migration: mobile -> Family Graph / Tree experience',
  '/* Family Graph preview and Tree workspace rules belong to the route experience. These were previously late mobile overrides and remain last inside the experience owner. */',
  mobileResult.moved,
);
const nextExperience = `${experienceResult.css.trimEnd()}\n\n${mobileToExperienceSection}`;

fs.writeFileSync(experiencePath, nextExperience);
fs.writeFileSync(mobilePath, nextMobile);

console.log(`Moved ${experienceResult.moved.length} experience rule block(s) to mobile.css.`);
console.log(`Moved ${mobileResult.moved.length} mobile rule block(s) to experience.css.`);
