import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const stylesDir = path.join(root, 'src', 'styles');
const reportPath = path.join(root, 'docs', 'css-mobile-ownership-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const targetSelectors = new Set(
  report.overlaps
    .filter((entry) => entry.files.includes('interaction.css') && entry.files.includes('mobile.css'))
    .map((entry) => entry.selector.replace(/\s+/g, ' ').trim()),
);

if (!targetSelectors.size) {
  console.log('No interaction/mobile selector overlaps remain.');
  process.exit(0);
}

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

function transformScope(css, ancestry = []) {
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
        const nested = transformScope(body, [...ancestry, header]);
        out += `${rawHeader}{${nested.css}}`;
        moved.push(...nested.moved);
      }
    } else if (targetSelectors.has(header)) {
      moved.push({ selector: header, ancestry, rule: css.slice(contentStart, close + 1) });
    } else {
      out += css.slice(contentStart, close + 1);
    }

    pos = close + 1;
  }

  return { css: out, moved };
}

function wrapMovedRule(entry) {
  let text = entry.rule.trim();
  for (let i = entry.ancestry.length - 1; i >= 0; i -= 1) {
    text = `${entry.ancestry[i]}{\n${text}\n}`;
  }
  return text;
}

const interactionPath = path.join(stylesDir, 'interaction.css');
const mobilePath = path.join(stylesDir, 'mobile.css');
const interaction = fs.readFileSync(interactionPath, 'utf8');
const mobile = fs.readFileSync(mobilePath, 'utf8');

const transformed = transformScope(interaction);
if (!transformed.moved.length) {
  throw new Error(`Expected to move ${targetSelectors.size} overlapping selectors but found none.`);
}

const marker = '/* ==========================================================================\n   Source:';
const insertion = mobile.indexOf(marker);
if (insertion < 0) throw new Error('Could not find mobile.css source-section marker');

const migrationSection = [
  '/* ==========================================================================\n   Ownership migration: interaction -> mobile\n   ========================================================================== */',
  '/* Visual mobile-shell rules previously carried by interaction.css.\n * They are inserted before the historical mobile sections so existing mobile\n * declarations retain their later cascade precedence. */',
  ...transformed.moved.map(wrapMovedRule),
  '',
].join('\n');

const nextMobile = `${mobile.slice(0, insertion)}${migrationSection}${mobile.slice(insertion)}`;

fs.writeFileSync(interactionPath, transformed.css);
fs.writeFileSync(mobilePath, nextMobile);

console.log(`Moved ${transformed.moved.length} interaction/mobile rule blocks into mobile.css.`);
console.log(`Target selectors: ${targetSelectors.size}`);
