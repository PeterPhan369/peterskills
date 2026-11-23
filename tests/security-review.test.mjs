import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SKILL_DIR = path.resolve('skills/engineering/security-review');
const MIRROR_DIR = path.resolve('.agents/skills/security-review');
const DOCS_PATH = path.resolve('docs/engineering/security-review.md');
const TEST_PATH = path.resolve('tests/security-review.test.mjs');

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

function collectFilesRecursive(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFilesRecursive(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

test('security-review: SKILL.md frontmatter and openai.yaml enforce user-only invocation', () => {
  const skillPath = path.join(SKILL_DIR, 'SKILL.md');
  assert.ok(fs.existsSync(skillPath), 'skills/engineering/security-review/SKILL.md must exist');
  const skillContent = fs.readFileSync(skillPath, 'utf8');

  const fmMatch = skillContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fmMatch, 'SKILL.md must begin with YAML frontmatter');
  const fm = fmMatch[1];

  assert.match(fm, /^name:\s*security-review\s*$/m, 'Frontmatter must set name: security-review');
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

test('security-review: reads repo quality floor and security rules with fallback instead of Skill tool invocation', () => {
  const skillContent = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');

  assert.doesNotMatch(
    skillContent,
    /Skill\s+tool[\s\S]{0,80}(backend-security-floor|setup-matt-pocock-skills)/i,
    'User-invoked skills must never be invoked via the Skill tool'
  );
  assert.doesNotMatch(
    skillContent,
    /call\s+(?:the\s+)?Skill\b[\s\S]{0,40}backend-security-floor/i,
    'SKILL.md must not instruct calling the Skill tool on backend-security-floor'
  );

  assert.match(skillContent, /docs\/agents\/quality-floor\.md/, 'SKILL.md must read docs/agents/quality-floor.md');
  assert.match(skillContent, /docs\/agents\/security-rules\.md/, 'SKILL.md must read docs/agents/security-rules.md');
  assert.match(skillContent, /\.\.\/backend-security-floor\/SKILL\.md/, 'SKILL.md must fall back to ../backend-security-floor/SKILL.md');
  assert.match(skillContent, /SECURITY-RULES\.md/, 'SKILL.md must reference SECURITY-RULES.md fallback');
  assert.match(skillContent, /lang\//, 'SKILL.md must reference matching lang/*.md files');
  assert.match(skillContent, /read-only|never edit|never modify/i, 'SKILL.md must declare read-only audit behavior');
});

test('security-review: defines Diff Mode and Surface Mode with regression hunting, blast radius, and sweep targets', () => {
  const skillContent = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');

  assert.match(skillContent, /Diff Mode/i, 'SKILL.md must define Diff Mode');
  assert.match(skillContent, /risk\s*(?:triage|scor)/i, 'Diff Mode must include risk triage/scoring');
  assert.match(skillContent, /git blame/i, 'Diff Mode must use git blame on removed checks');
  assert.match(skillContent, /git log -S/i, 'Diff Mode must use git log -S on removed checks');
  assert.match(skillContent, /blast[\s-]radius/i, 'Diff Mode must quantify caller blast radius');
  assert.match(skillContent, /test[\s\w-]*gap|untested/i, 'Diff Mode must elevate risk on test coverage gaps');

  assert.match(skillContent, /Surface Mode/i, 'SKILL.md must define Surface Mode');
  for (const surface of [
    /config(?:uration)?\s+accessor/i,
    /auth(?:entication)?/i,
    /authori[sz]ation|authz/i,
    /cryptograph/i,
    /(?:data|execution)\s+sink/i,
    /deployment\s+manifest/i,
  ]) {
    assert.match(skillContent, surface, `Surface Mode must sweep ${surface}`);
  }
});

test('security-review: spawns parallel fresh-context discovery sub-agents with zero-item scan guard', () => {
  const skillContent = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');

  assert.match(skillContent, /parallel/i, 'SKILL.md must dispatch discovery sub-agents in parallel');
  assert.match(
    skillContent,
    /fresh context window/i,
    'SKILL.md must explicitly instruct starting each sub-agent with a fresh context window'
  );
  assert.match(skillContent, /Insecure Defaults\s*&\s*Config Cliffs/i, 'Must include Insecure Defaults & Config Cliffs axis');
  assert.match(
    skillContent,
    /Sharp Edges,\s*Injection\s*&\s*Authz Logic/i,
    'Must include Sharp Edges, Injection & Authz Logic axis'
  );

  assert.match(
    skillContent,
    /zero[\s-]item|0\s+(?:files|targets)/i,
    'SKILL.md must enforce a zero-item scan guard'
  );
  assert.match(
    skillContent,
    /fail\s+loudly|abort|scan-failed/i,
    'Zero-item scan guard must fail loudly rather than reporting a clean pass'
  );
});

test('security-review: enforces 5-step false-positive refutation gate and Rationalizations to Reject', () => {
  const skillContent = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');

  assert.match(skillContent, /refuted:\s*true|refuted by default/i, 'Candidates must start from a refuted default');
  assert.match(skillContent, /5-step|five-step/i, 'Must explicitly name the 5-step false-positive refutation gate');

  const gateChecks = [
    { name: 'Gate 1: production reachability', pattern: /production\s+reachability/i },
    { name: 'Gate 2: fail-secure vs. fail-open behavior', pattern: /fail-secure\s+vs\.?\s*fail-open/i },
    { name: 'Gate 3: upstream validation or framework protection', pattern: /upstream\s+validation|framework\s+protection/i },
    { name: 'Gate 4: threat model WHO / ACCESS / INTERFACE and source-to-sink trace', pattern: /WHO[\s/|]+ACCESS[\s/|]+INTERFACE/i },
    { name: 'Gate 4: file:line trace', pattern: /file:line/i },
    { name: 'Gate 5: sibling variant check and abstraction ladder', pattern: /sibling\s+variant[\s\S]*abstraction\s+ladder|abstraction\s+ladder[\s\S]*sibling/i },
  ];

  for (const { name, pattern } of gateChecks) {
    assert.match(skillContent, pattern, `Refutation gate must cover ${name}`);
  }

  assert.match(skillContent, /##\s+Rationalizations to Reject/i, 'SKILL.md must include Rationalizations to Reject section');
});

test('security-review: output report template defines P0-P3 tiers, required evidence fields, and Refuted Candidates table', () => {
  const skillContent = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');

  const tiers = ['### P0', '### P1', '### P2', '### P3'];
  for (let i = 0; i < tiers.length; i++) {
    const start = skillContent.indexOf(tiers[i]);
    assert.ok(start !== -1, `Output template must include ${tiers[i]}`);
    const end = i + 1 < tiers.length
      ? skillContent.indexOf(tiers[i + 1], start)
      : skillContent.indexOf('## Refuted Candidates', start);
    assert.ok(end > start, `Output template section order must place ${tiers[i]} before the next section`);
    const tierBlock = skillContent.slice(start, end);

    assert.match(tierBlock, /Attacker Model/i, `${tiers[i]} template must include Attacker Model`);
    assert.match(tierBlock, /Source-to-Sink/i, `${tiers[i]} template must include Source-to-Sink trace`);
    assert.match(tierBlock, /Exploit Scenario/i, `${tiers[i]} template must include Exploit Scenario`);
    assert.match(tierBlock, /Remediation/i, `${tiers[i]} template must include Remediation`);
    assert.match(tierBlock, /```diff/i, `${tiers[i]} template must include a diff code fence for remediation`);
  }

  assert.match(skillContent, /##\s+Refuted Candidates/i, 'Report template must include Refuted Candidates table');
});

test('security-review: docs/engineering/security-review.md adheres strictly to .agents/writing-docs.md', () => {
  assert.ok(fs.existsSync(DOCS_PATH), 'docs/engineering/security-review.md must exist');
  const content = fs.readFileSync(DOCS_PATH, 'utf8');

  assert.doesNotMatch(content, /^#\s+/m, 'Docs page must not contain an H1 heading');
  assert.doesNotMatch(content, /\b(npx skills|claude plugin|codex plugin|gemini skills)\b/i, 'Docs page must not contain install commands');
  assert.doesNotMatch(content, /skills\/engineering\//i, 'Docs page must not link to internal skill source files');
  assert.doesNotMatch(content, /github\.com\/(mattpocock\/skills|PeterPhan369\/peterskills)/i, 'Docs page must not contain source repo links');

  const proseOnly = content
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\b(ask-matt|setup-matt-pocock-skills)\b/g, '');
  assert.doesNotMatch(proseOnly, /\b(matt|pocock|peter)\b/i, 'Docs page must not name authors');

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

  for (const requiredUrl of [
    'https://aihero.dev/skills-ask-matt',
    'https://aihero.dev/skills-code-review',
    'https://aihero.dev/skills-backend-security-floor',
  ]) {
    assert.ok(content.includes(requiredUrl), `Docs page must link to ${requiredUrl}`);
  }

  assert.match(content, /\/security-review/, 'Docs page must document user-invoked /security-review command');
  assert.match(content, /won't reach for it on its own/i, 'Docs page must state user-only invocation boundary');
});

test('security-review: .agents/skills/security-review mirrors source files identically and zero em-dashes exist', () => {
  const expectedRelativePaths = ['SKILL.md', 'agents/openai.yaml'];

  for (const rel of expectedRelativePaths) {
    const srcPath = path.join(SKILL_DIR, rel);
    const dstPath = path.join(MIRROR_DIR, rel);

    assert.ok(fs.existsSync(srcPath), `Missing source file: ${srcPath}`);
    assert.ok(fs.existsSync(dstPath), `Missing mirror file: ${dstPath}`);

    const srcNorm = normalizeNewlines(fs.readFileSync(srcPath, 'utf8'));
    const dstNorm = normalizeNewlines(fs.readFileSync(dstPath, 'utf8'));
    assert.strictEqual(
      dstNorm,
      srcNorm,
      `.agents/skills/security-review/${rel} must identically mirror skills/engineering/security-review/${rel}`
    );
  }

  const actualSrcFiles = collectFilesRecursive(SKILL_DIR).map(p => path.relative(SKILL_DIR, p).replace(/\\/g, '/')).sort();
  const actualMirrorFiles = collectFilesRecursive(MIRROR_DIR).map(p => path.relative(MIRROR_DIR, p).replace(/\\/g, '/')).sort();
  assert.deepStrictEqual(actualMirrorFiles, actualSrcFiles, 'Mirror directory must match source directory file set');

  const filesToScanForEmDash = [
    ...collectFilesRecursive(SKILL_DIR),
    ...collectFilesRecursive(MIRROR_DIR),
    DOCS_PATH,
    TEST_PATH,
  ];
  for (const file of filesToScanForEmDash) {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(!text.includes('\u2014'), `File ${file} must not contain em-dashes`);
  }
});
