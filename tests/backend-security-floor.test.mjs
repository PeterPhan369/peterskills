import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SKILL_DIR = path.resolve('skills/engineering/backend-security-floor');
const MIRROR_DIR = path.resolve('.agents/skills/backend-security-floor');
const DOCS_PATH = path.resolve('docs/engineering/backend-security-floor.md');

const EXPECTED_LANG_FILES = [
  'c-cpp.md',
  'csharp.md',
  'go.md',
  'java.md',
  'javascript-typescript.md',
  'kotlin.md',
  'php.md',
  'python.md',
  'ruby.md',
  'rust.md',
  'swift.md',
];

const EXPECTED_PILLARS = [
  'Secrets and Configuration',
  'Authentication and Sessions',
  'Authorization and Access Control',
  'Input Boundaries and Deserialization',
  'Cryptography Ergonomics',
  'Error Handling and Observability',
];

test('backend-security-floor: SKILL.md frontmatter and openai.yaml enforce user-only invocation', () => {
  const skillPath = path.join(SKILL_DIR, 'SKILL.md');
  assert.ok(fs.existsSync(skillPath), 'skills/engineering/backend-security-floor/SKILL.md must exist');
  const skillContent = fs.readFileSync(skillPath, 'utf8');

  const fmMatch = skillContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fmMatch, 'SKILL.md must begin with YAML frontmatter');
  const fm = fmMatch[1];

  assert.match(fm, /^name:\s*backend-security-floor\s*$/m, 'Frontmatter must set name: backend-security-floor');
  assert.match(fm, /^disable-model-invocation:\s*true\s*$/m, 'Frontmatter must set disable-model-invocation: true');

  const descMatch = fm.match(/^description:\s*(.+)$/m);
  assert.ok(descMatch, 'Frontmatter must include a one-line description');
  const desc = descMatch[1].trim();
  assert.ok(desc.length > 20, 'Description must be meaningful');
  assert.doesNotMatch(
    desc,
    /\b(use when|use whenever|when the user|invoke when)\b/i,
    'User-invoked description must not include model trigger phrases'
  );

  const openaiPath = path.join(SKILL_DIR, 'agents/openai.yaml');
  assert.ok(fs.existsSync(openaiPath), 'agents/openai.yaml must exist');
  const openaiContent = fs.readFileSync(openaiPath, 'utf8');
  assert.match(openaiContent, /^interface:\s*$/m, 'openai.yaml must define interface:');
  assert.match(openaiContent, /^\s+display_name:\s*.+$/m, 'openai.yaml must define interface.display_name');
  assert.match(openaiContent, /^\s+short_description:\s*.+$/m, 'openai.yaml must define interface.short_description');
  assert.match(openaiContent, /^policy:\s*$/m, 'openai.yaml must define policy:');
  assert.match(
    openaiContent,
    /^\s+allow_implicit_invocation:\s*false\s*$/m,
    'openai.yaml must set policy.allow_implicit_invocation: false'
  );
});

test('backend-security-floor: SKILL.md defines 3 principles, 6 pillars, pointers, and 7 Defaults to Refuse', () => {
  const skillContent = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');
  const lines = skillContent.split(/\r?\n/);
  assert.ok(lines.length >= 60 && lines.length <= 140, `SKILL.md should stay concise (~90-120 lines), got ${lines.length}`);

  for (const principle of ['Pit of Success', 'Fail-Secure by Default', 'Deny-by-Default Authorization']) {
    assert.ok(skillContent.includes(principle), `SKILL.md must define core principle "${principle}"`);
  }

  for (const pillar of EXPECTED_PILLARS) {
    assert.ok(skillContent.includes(pillar), `SKILL.md must define pillar "${pillar}"`);
  }

  assert.match(skillContent, /SECURITY-RULES\.md/, 'SKILL.md must point to SECURITY-RULES.md');
  assert.match(skillContent, /lang\//, 'SKILL.md must point to lang/');

  const refuseMatch = skillContent.match(/## Defaults to Refuse\s+([\s\S]*?)(?=\n## |\n---|$)/);
  assert.ok(refuseMatch, 'SKILL.md must have a "## Defaults to Refuse" section');
  const refuseSection = refuseMatch[1];

  const requiredRefusals = [
    { name: 'fallback secrets', pattern: /fallback secret/i },
    { name: 'fail-open flags', pattern: /fail-open/i },
    { name: 'weak password hashing', pattern: /weak password hash/i },
    { name: 'non-constant-time token comparisons', pattern: /constant-time/i },
    { name: 'permissive CORS with credentials', pattern: /CORS[\s\S]*credentials/i },
    { name: 'stringly-typed authorization', pattern: /stringly-typed/i },
    { name: 'stack trace leaks', pattern: /stack trace/i },
  ];

  for (const { name, pattern } of requiredRefusals) {
    assert.match(refuseSection, pattern, `"Defaults to Refuse" must explicitly refuse ${name}`);
  }
});

test('backend-security-floor: SECURITY-RULES.md covers 6 categories in canonical order with deterministic rules and discriminators', () => {
  const rulesPath = path.join(SKILL_DIR, 'SECURITY-RULES.md');
  assert.ok(fs.existsSync(rulesPath), 'SECURITY-RULES.md must exist');
  const content = fs.readFileSync(rulesPath, 'utf8');

  let lastIndex = -1;
  for (let i = 0; i < EXPECTED_PILLARS.length; i++) {
    const heading = `## ${i + 1}. ${EXPECTED_PILLARS[i]}`;
    const idx = content.indexOf(heading);
    assert.ok(idx !== -1, `SECURITY-RULES.md must include heading "${heading}"`);
    assert.ok(idx > lastIndex, `Heading "${heading}" must appear in canonical order`);
    lastIndex = idx;
  }

  const ruleMatches = [...content.matchAll(/^### (\d+)\.\s+`([a-z0-9-]+)`\s*$/gm)];
  assert.ok(ruleMatches.length >= 24, `SECURITY-RULES.md must define a comprehensive deterministic rule catalog, got ${ruleMatches.length}`);

  const seenIds = new Set();
  for (let i = 0; i < ruleMatches.length; i++) {
    const expectedNum = i + 1;
    const actualNum = parseInt(ruleMatches[i][1], 10);
    const ruleId = ruleMatches[i][2];
    assert.strictEqual(actualNum, expectedNum, `Rule index ${i} should be numbered ${expectedNum}, got ${actualNum}`);
    assert.ok(!seenIds.has(ruleId), `Duplicate rule ID: ${ruleId}`);
    seenIds.add(ruleId);

    const start = ruleMatches[i].index;
    const end = i + 1 < ruleMatches.length ? ruleMatches[i + 1].index : content.length;
    const block = content.slice(start, end);

    assert.match(block, /Fail-Secure vs\. Fail-Open/i, `Rule ${ruleId} must document Fail-Secure vs. Fail-Open check`);
    assert.match(block, /Vulnerable/i, `Rule ${ruleId} must include a Vulnerable example`);
    assert.match(block, /Secure/i, `Rule ${ruleId} must include a Secure example`);
    assert.match(block, /\*\*Report when\*\*:/i, `Rule ${ruleId} must include a "Report when" discriminator`);
    assert.match(block, /\*\*Skip when\*\*:/i, `Rule ${ruleId} must include a "Skip when" discriminator`);
  }
});

test('backend-security-floor: all 11 modular language packs exist with sharp edges, examples, and discriminators', () => {
  const langDir = path.join(SKILL_DIR, 'lang');
  assert.ok(fs.existsSync(langDir), 'skills/engineering/backend-security-floor/lang/ must exist');

  const actualFiles = fs.readdirSync(langDir).filter(f => f.endsWith('.md')).sort();
  assert.deepStrictEqual(actualFiles, [...EXPECTED_LANG_FILES].sort(), 'lang/ must contain exact 11 language packs');

  const expectedTopicsByLang = {
    'c-cpp.md': [/strcpy|sprintf|printf/i, /rand\(/i, /memcmp/i],
    'csharp.md': [/BinaryFormatter/i, /TypeNameHandling/i, /FixedTimeEquals/i],
    'go.md': [/text\/template/i, /math\/rand/i, /InsecureSkipVerify/i, /filepath\.Join/i],
    'java.md': [/ObjectInputStream/i, /DocumentBuilderFactory|XXE/i, /SecureRandom/i, /MessageDigest\.isEqual/i],
    'javascript-typescript.md': [/__proto__/i, /ReDoS|RegExp/i, /await/i, /eval\(|new Function/i, /\bas\b/],
    'kotlin.md': [/!!|platform type/i, /Spring Security|authorizeHttpRequests/i, /ObjectInputStream|Polymorphic/i, /coroutine|GlobalScope|ThreadLocal/i],
    'php.md': [/unserialize/i, /hash_equals/i, /shell_exec/i, /include|require/i],
    'python.md': [/pickle|yaml\.load/i, /shell=True/i, /mutable default|def .*\[\]/i, /format/i, /os\.environ\.get/i],
    'ruby.md': [/Marshal\.load|YAML\.load/i, /constantize|public_send|\.send\(/i, /permit!|mass assignment/i, /secure_compare/i],
    'rust.md': [/unsafe/i, /overflow|checked_/i, /\.unwrap\(/i, /subtle/i],
    'swift.md': [/URLSession|serverTrust/i, /Keychain|kSecAttrAccessible/i, /UserDefaults/i, /Data/i],
  };

  for (const file of EXPECTED_LANG_FILES) {
    const content = fs.readFileSync(path.join(langDir, file), 'utf8');
    const rules = [...content.matchAll(/^### \d+\.\s+`([a-z0-9-]+)`\s*$/gm)];
    assert.ok(rules.length >= 4, `${file} must have at least 4 numbered sharp-edge rules, got ${rules.length}`);

    for (let i = 0; i < rules.length; i++) {
      const start = rules[i].index;
      const end = i + 1 < rules.length ? rules[i + 1].index : content.length;
      const block = content.slice(start, end);
      const id = rules[i][1];

      assert.match(block, /Vulnerable/i, `${file} rule ${id} must include a Vulnerable snippet`);
      assert.match(block, /Secure/i, `${file} rule ${id} must include a Secure snippet`);
      assert.match(block, /\*\*Report when\*\*:/i, `${file} rule ${id} must include "Report when"`);
      assert.match(block, /\*\*Skip when\*\*:/i, `${file} rule ${id} must include "Skip when"`);
    }

    for (const topicRegex of expectedTopicsByLang[file]) {
      assert.match(content, topicRegex, `${file} must cover sharp edge matching ${topicRegex}`);
    }
  }
});

test('backend-security-floor: docs page conforms to .agents/writing-docs.md', () => {
  assert.ok(fs.existsSync(DOCS_PATH), 'docs/engineering/backend-security-floor.md must exist');
  const content = fs.readFileSync(DOCS_PATH, 'utf8');

  assert.doesNotMatch(content, /^#\s+/m, 'Docs page must not contain an H1 heading');
  assert.doesNotMatch(content, /\b(npx skills|claude plugin|codex plugin)\b/i, 'Docs page must not contain install commands');
  assert.doesNotMatch(content, /skills\/engineering\//i, 'Docs page must not link to internal skill source files');
  assert.doesNotMatch(content, /github\.com\/(mattpocock\/skills|PeterPhan369\/peterskills)/i, 'Docs page must not contain source repo links');
  const proseOnly = content
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\b(ask-matt|setup-matt-pocock-skills)\b/g, '');
  assert.doesNotMatch(proseOnly, /\b(matt|pocock|peter)\b/i, 'Docs page must not name authors');

  // Verify every markdown link is absolute https://
  const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m => m[1]);
  assert.ok(links.length > 0, 'Docs page must contain links');
  for (const href of links) {
    assert.match(href, /^https:\/\//, `Every link in docs page must be absolute https://, found "${href}"`);
  }

  const requiredHeadings = [
    '## What it does',
    '## When to reach for it',
    '## Common questions',
    "## It's working if",
    '## Where it fits',
  ];

  let lastIdx = -1;
  for (const heading of requiredHeadings) {
    const idx = content.indexOf(heading);
    assert.ok(idx !== -1, `Docs page must include "${heading}"`);
    assert.ok(idx > lastIdx, `Docs heading "${heading}" must appear in template order`);
    lastIdx = idx;
  }

  assert.ok(
    content.includes('https://aihero.dev/skills-ask-matt'),
    'Docs page must link to https://aihero.dev/skills-ask-matt'
  );
  assert.match(content, /\/backend-security-floor/, 'Docs page must document user-invoked /backend-security-floor command');
});

test('backend-security-floor: .agents/skills mirror is byte-identical and contains zero em-dashes', () => {
  const expectedRelativePaths = [
    'SKILL.md',
    'SECURITY-RULES.md',
    'agents/openai.yaml',
    ...EXPECTED_LANG_FILES.map(f => `lang/${f}`),
  ];

  for (const rel of expectedRelativePaths) {
    const srcPath = path.join(SKILL_DIR, rel);
    const dstPath = path.join(MIRROR_DIR, rel);

    assert.ok(fs.existsSync(srcPath), `Missing source file: ${srcPath}`);
    assert.ok(fs.existsSync(dstPath), `Missing mirror file: ${dstPath}`);

    const srcBuf = fs.readFileSync(srcPath);
    const dstBuf = fs.readFileSync(dstPath);
    assert.ok(
      srcBuf.equals(dstBuf),
      `Mirror file .agents/skills/backend-security-floor/${rel} must be byte-identical to skills/engineering/backend-security-floor/${rel}`
    );

    const text = srcBuf.toString('utf8');
    assert.ok(!text.includes('\u2014'), `File ${rel} must not contain em-dashes (\\u2014)`);
  }

  // Ensure no extra files exist in mirror lang/
  const mirrorLangFiles = fs.readdirSync(path.join(MIRROR_DIR, 'lang')).filter(f => f.endsWith('.md')).sort();
  assert.deepStrictEqual(mirrorLangFiles, [...EXPECTED_LANG_FILES].sort(), 'Mirror lang/ must not contain extra files');

  const docsText = fs.readFileSync(DOCS_PATH, 'utf8');
  assert.ok(!docsText.includes('\u2014'), 'docs/engineering/backend-security-floor.md must not contain em-dashes (\\u2014)');
});
