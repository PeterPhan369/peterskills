import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertDocsCompliance,
  collectFilesRecursive,
  extractFrontmatter,
  normalizeNewlines,
} from './helpers.mjs';

const SKILL_DIR = path.resolve('skills/engineering/security-review');
const MIRROR_DIR = path.resolve('.agents/skills/security-review');
const DOCS_PATH = path.resolve('docs/engineering/security-review.md');
const TEST_PATH = path.resolve('tests/security-review.test.mjs');

test('security-review: SKILL.md frontmatter and openai.yaml enforce user-only invocation', () => {
  const skillPath = path.join(SKILL_DIR, 'SKILL.md');
  assert.ok(fs.existsSync(skillPath), 'skills/engineering/security-review/SKILL.md must exist');
  const skillContent = fs.readFileSync(skillPath, 'utf8');

  const fm = extractFrontmatter(skillContent, skillPath);

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

  assert.doesNotMatch(
    skillContent,
    /\bbaseline\s+rules\b/i,
    'SKILL.md must not contain avoided glossary synonym "baseline rules"'
  );
  assert.doesNotMatch(
    skillContent,
    /\.\.\/backend-security-floor\//,
    'SKILL.md must not contain deep relative ../backend-security-floor/ markdown cross-links'
  );

  assert.match(
    skillContent,
    /^##\s+1\.\s+Load the Active Quality Floor\s*$/m,
    'Step 1 heading must use Quality floor instead of Baseline Rules'
  );
  assert.match(skillContent, /active\s+\*\*Quality floor\*\*/i, 'SKILL.md must refer to active Quality floor');
  assert.match(
    skillContent,
    /primary external references/i,
    'Step 1 must name repo quality-floor.md and security-rules.md as primary external references'
  );
  assert.match(skillContent, /docs\/agents\/quality-floor\.md/, 'SKILL.md must read docs/agents/quality-floor.md');
  assert.match(skillContent, /docs\/agents\/security-rules\.md/, 'SKILL.md must read docs/agents/security-rules.md');
  assert.match(
    skillContent,
    /\/setup-matt-pocock-skills/,
    'Step 1 must tell the user /setup-matt-pocock-skills creates missing repo files'
  );
  assert.match(
    skillContent,
    /backend-security-floor[\s\S]*SKILL\.md/,
    'SKILL.md must fall back directly to installed backend-security-floor SKILL.md in plain prose'
  );
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
  assert.doesNotMatch(
    skillContent,
    /spawning\s+nested\s+agents|invoking\s+`?\/security-review`?/i,
    'SKILL.md must not include out-of-scope subagent recursion guards'
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
  const tierBlocks = [];
  for (let i = 0; i < tiers.length; i++) {
    const start = skillContent.indexOf(tiers[i]);
    assert.ok(start !== -1, `Output template must include ${tiers[i]}`);
    const end = i + 1 < tiers.length
      ? skillContent.indexOf(tiers[i + 1], start)
      : skillContent.indexOf('## Refuted Candidates', start);
    assert.ok(end > start, `Output template section order must place ${tiers[i]} before the next section`);
    tierBlocks.push(skillContent.slice(start, end));
  }

  const p0Block = tierBlocks[0];
  assert.match(p0Block, /Attacker Model/i, '### P0 template must include Attacker Model');
  assert.match(p0Block, /Source-to-Sink/i, '### P0 template must include Source-to-Sink trace');
  assert.match(p0Block, /Exploit Scenario/i, '### P0 template must include Exploit Scenario');
  assert.match(p0Block, /Remediation/i, '### P0 template must include Remediation');
  assert.match(p0Block, /```diff/i, '### P0 template must include a diff code fence for remediation');

  for (let i = 1; i < tiers.length; i++) {
    assert.match(
      tierBlocks[i],
      /P0\s+(?:finding\s+)?schema|Attacker Model[\s\S]*Source-to-Sink[\s\S]*Exploit Scenario[\s\S]*Remediation/i,
      `${tiers[i]} must concisely reference the P0 finding schema`
    );
    assert.doesNotMatch(
      tierBlocks[i],
      /```diff/i,
      `${tiers[i]} must reference the P0 schema instead of repeating the diff fence block`
    );
  }

  const refutedIdx = skillContent.indexOf('## Refuted Candidates');
  const verdictIdx = skillContent.indexOf('## Verdict');
  assert.ok(refutedIdx !== -1, 'Report template must include ## Refuted Candidates');
  assert.ok(verdictIdx > refutedIdx, 'Report template must include ## Verdict after ## Refuted Candidates');
});

test('security-review: docs/engineering/security-review.md adheres strictly to .agents/writing-docs.md', () => {
  assert.ok(fs.existsSync(DOCS_PATH), 'docs/engineering/security-review.md must exist');
  const content = fs.readFileSync(DOCS_PATH, 'utf8');

  assertDocsCompliance(content, 'docs/engineering/security-review.md', [
    '## What it does',
    '## When to reach for it',
    '## Common questions',
    "## It's working if",
    '## Where it fits',
  ]);

  for (const requiredUrl of [
    'https://aihero.dev/skills-ask-matt',
    'https://aihero.dev/skills-code-review',
    'https://aihero.dev/skills-backend-security-floor',
  ]) {
    assert.ok(content.includes(requiredUrl), `Docs page must link to ${requiredUrl}`);
  }

  assert.match(content, /\/security-review/, 'Docs page must document user-invoked /security-review command');
  assert.match(content, /won't reach for it on its own/i, 'Docs page must state user-only invocation boundary');
  assert.doesNotMatch(content, /\bbaseline\s+rules\b/i, 'Docs page must not contain avoided glossary synonym "baseline rules"');
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

  const actualSrcFiles = collectFilesRecursive(SKILL_DIR, { relative: true });
  const actualMirrorFiles = collectFilesRecursive(MIRROR_DIR, { relative: true });
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
