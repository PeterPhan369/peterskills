import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SETUP_DIR = path.resolve('skills/engineering/setup-matt-pocock-skills');
const SETUP_MIRROR_DIR = path.resolve('.agents/skills/setup-matt-pocock-skills');
const ARCH_DIR = path.resolve('skills/engineering/improve-codebase-architecture');
const ARCH_MIRROR_DIR = path.resolve('.agents/skills/improve-codebase-architecture');

const SETUP_DOC_PATH = path.resolve('docs/engineering/setup-matt-pocock-skills.md');
const ARCH_DOC_PATH = path.resolve('docs/engineering/improve-codebase-architecture.md');

const EXPECTED_BACKEND_LANGS = [
  { slug: 'c-cpp', manifestPattern: /CMakeLists\.txt|Makefile|meson\.build/i },
  { slug: 'csharp', manifestPattern: /\.csproj|\.sln/i },
  { slug: 'go', manifestPattern: /go\.mod/i },
  { slug: 'java', manifestPattern: /pom\.xml|build\.gradle/i },
  { slug: 'javascript-typescript', manifestPattern: /package\.json|tsconfig\.json|deno\.json|bun\.lock/i },
  { slug: 'kotlin', manifestPattern: /build\.gradle\.kts|settings\.gradle\.kts/i },
  { slug: 'php', manifestPattern: /composer\.json/i },
  { slug: 'python', manifestPattern: /pyproject\.toml|requirements\.txt|setup\.py|Pipfile/i },
  { slug: 'ruby', manifestPattern: /Gemfile/i },
  { slug: 'rust', manifestPattern: /Cargo\.toml/i },
  { slug: 'swift', manifestPattern: /Package\.swift/i },
];

const USER_INVOKED_DOMAIN_SKILLS = [
  'ui-craft-floor',
  'ui-review',
  'ui-polish',
  'ui-shape',
  'backend-security-floor',
  'security-review',
];

const KNOWN_DICTIONARY_SLUGS = new Set([
  'afk',
  'agent',
  'agent-mode',
  'agents-md',
  'automated-check',
  'clearing',
  'compaction',
  'context',
  'context-pointer',
  'context-window',
  'effort',
  'environment',
  'grilling',
  'harness',
  'human-in-the-loop',
  'human-review',
  'mcp',
  'memory-system',
  'model',
  'parametric-knowledge',
  'primary-source',
  'progressive-disclosure',
  'prototyping',
  'secondary-source',
  'session',
  'skill',
  'smart-zone',
  'spec',
  'stateful',
  'stateless',
  'subagent',
  'ticket',
  'token',
  'tool',
  'tool-call',
  'turn',
  'vibe-coding',
]);

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

function extractFrontmatter(markdown, filePath) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${filePath} must begin with YAML frontmatter`);
  return match[1];
}

function assertUserInvokedMetadata(skillDir, expectedName) {
  const skillPath = path.join(skillDir, 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');
  const fm = extractFrontmatter(content, skillPath);

  assert.match(fm, new RegExp(`^name:\\s*${expectedName}\\s*$`, 'm'), `${expectedName} frontmatter must declare name`);
  assert.match(fm, /^disable-model-invocation:\s*true\s*$/m, `${expectedName} must keep disable-model-invocation: true`);

  const yamlPath = path.join(skillDir, 'agents/openai.yaml');
  assert.ok(fs.existsSync(yamlPath), `${expectedName} agents/openai.yaml must exist`);
  const yaml = fs.readFileSync(yamlPath, 'utf8');
  assert.match(
    yaml,
    /^policy:\s*\r?\n(?:[ \t]+.*\r?\n)*?[ \t]+allow_implicit_invocation:\s*false\s*$/m,
    `${expectedName} agents/openai.yaml must set policy.allow_implicit_invocation: false`
  );
  return content;
}

function assertNoSkillToolOnUserInvoked(content, label) {
  for (const skill of USER_INVOKED_DOMAIN_SKILLS) {
    const callPattern = new RegExp(`Call the Skill tool[^\\n]*["'\`]${skill}["'\`]`, 'i');
    assert.doesNotMatch(
      content,
      callPattern,
      `${label} must never instruct calling the Skill tool on user-invoked skill "${skill}"`
    );
  }
}

function collectFilesRecursive(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = entry.name;
    const full = path.join(dir, rel);
    if (entry.isDirectory()) {
      for (const child of collectFilesRecursive(full)) {
        files.push(path.join(rel, child));
      }
    } else {
      files.push(rel);
    }
  }
  return files.sort();
}

function assertDocsCompliance(content, fileLabel, requiredHeadings) {
  assert.doesNotMatch(content, /^#\s+/m, `${fileLabel} must not contain an H1 heading`);
  assert.doesNotMatch(
    content,
    /\b(npx skills|claude plugin|codex plugin|gemini skills)\b/i,
    `${fileLabel} must not contain install commands`
  );
  assert.doesNotMatch(content, /skills\/engineering\//i, `${fileLabel} must not link to internal skill source files`);
  assert.doesNotMatch(
    content,
    /github\.com\/(mattpocock\/skills|PeterPhan369\/peterskills)/i,
    `${fileLabel} must not contain source repo links`
  );

  const proseWithoutSlugs = content
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\b(ask-matt|setup-matt-pocock-skills)\b/g, '');
  assert.doesNotMatch(proseWithoutSlugs, /\b(matt|pocock|peter)\b/i, `${fileLabel} must not name authors`);

  const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(links.length > 0, `${fileLabel} must contain links`);
  for (const href of links) {
    assert.match(href, /^https:\/\//, `${fileLabel} links must all be absolute https://, found "${href}"`);
  }

  // Verify AI Coding Dictionary links are valid slugs and linked on first use only
  const dictLinks = links.filter((href) => href.startsWith('https://www.aihero.dev/ai-coding-dictionary/'));
  const seenSlugs = new Set();
  for (const href of dictLinks) {
    const slug = href.replace('https://www.aihero.dev/ai-coding-dictionary/', '');
    assert.ok(KNOWN_DICTIONARY_SLUGS.has(slug), `${fileLabel} references unknown AI Coding Dictionary slug "${slug}"`);
    assert.ok(!seenSlugs.has(slug), `${fileLabel} must link AI Coding Dictionary slug "${slug}" on first use only`);
    seenSlugs.add(slug);
  }

  let lastIdx = -1;
  for (const heading of requiredHeadings) {
    const idx = content.indexOf(heading);
    assert.ok(idx !== -1, `${fileLabel} must include heading "${heading}"`);
    assert.ok(idx > lastIdx, `${fileLabel} heading "${heading}" must preserve template order`);
    lastIdx = idx;
  }

  assert.ok(
    content.includes('https://aihero.dev/skills-ask-matt'),
    `${fileLabel} must link to https://aihero.dev/skills-ask-matt`
  );
}

test('setup-matt-pocock-skills: SKILL.md Step 1 detects frontend/backend Stack profile signals and all 11 backend languages', () => {
  const content = assertUserInvokedMetadata(SETUP_DIR, 'setup-matt-pocock-skills');
  assertNoSkillToolOnUserInvoked(content, 'setup-matt-pocock-skills/SKILL.md');

  const step1Match = content.match(/### 1\. Explore([\s\S]*?)### 2\. Present findings and ask/);
  assert.ok(step1Match, 'setup-matt-pocock-skills/SKILL.md must include Step 1 Explore');
  const step1 = step1Match[1];

  assert.match(step1, /Stack profile/i, 'Step 1 must explore Stack profile signals');
  assert.match(step1, /frontend/i, 'Step 1 must include frontend root manifest signals');
  assert.match(step1, /backend/i, 'Step 1 must include backend root manifest signals');
  assert.match(
    step1,
    /next\.config|vite\.config|astro\.config|svelte\.config|angular\.json/i,
    'Step 1 must inspect frontend root config/manifest filenames'
  );
  assert.match(
    step1,
    /\.claude\/skills|\.agents\/skills/,
    'Step 1 must check for local .claude/skills or .agents/skills directories'
  );

  for (const { slug, manifestPattern } of EXPECTED_BACKEND_LANGS) {
    assert.ok(
      step1.includes(slug),
      `Step 1 must reference supported backend language "${slug}"`
    );
    assert.match(
      step1,
      manifestPattern,
      `Step 1 must include root manifest filename signal for "${slug}"`
    );
  }
});

test('setup-matt-pocock-skills: Step 2 Section D, Step 3, and Step 4 handle Stack profile, compilation, and local pruning', () => {
  const content = fs.readFileSync(path.join(SETUP_DIR, 'SKILL.md'), 'utf8');

  const step2Match = content.match(/### 2\. Present findings and ask([\s\S]*?)### 3\. Confirm and edit/);
  assert.ok(step2Match, 'SKILL.md must include Step 2');
  const step2 = step2Match[1];

  assert.match(
    step2,
    /\*\*Section D:\s*Stack profile/i,
    'Step 2 must include Section D: Stack profile'
  );
  assert.match(step2, /`frontend`/i, 'Section D must confirm frontend option');
  assert.match(step2, /`backend`/i, 'Section D must confirm backend option');
  assert.match(
    step2,
    /language/i,
    'Section D must ask user to confirm target backend language(s) when backend is selected'
  );

  const step3Match = content.match(/### 3\. Confirm and edit([\s\S]*?)### 4\. Write/);
  assert.ok(step3Match, 'SKILL.md must include Step 3');
  const step3 = step3Match[1];

  assert.match(step3, /docs\/agents\/quality-floor\.md/, 'Step 3 must draft docs/agents/quality-floor.md');
  assert.match(step3, /docs\/agents\/security-rules\.md/, 'Step 3 must draft docs/agents/security-rules.md for backend');

  const step4Match = content.match(/### 4\. Write([\s\S]*?)### 5\. Done/);
  assert.ok(step4Match, 'SKILL.md must include Step 4');
  const step4 = step4Match[1];

  assert.match(step4, /### Quality floor/, 'Step 4 Agent skills block must include ### Quality floor');
  assert.match(step4, /docs\/agents\/quality-floor\.md/, 'Step 4 Quality floor pointer must link docs/agents/quality-floor.md');
  assert.match(step4, /docs\/agents\/security-rules\.md/, 'Step 4 must reference docs/agents/security-rules.md for backend');
  assert.match(step4, /quality-floor-frontend\.md/, 'Step 4 must reference seed template quality-floor-frontend.md');
  assert.match(step4, /quality-floor-backend\.md/, 'Step 4 must reference seed template quality-floor-backend.md');

  // Compiling tailored backend security-rules.md
  assert.match(
    step4,
    /SECURITY-RULES\.md/,
    'Step 4 must instruct compiling docs/agents/security-rules.md from backend-security-floor/SECURITY-RULES.md'
  );
  assert.match(
    step4,
    /lang\/<lang>\.md|lang\/.*confirmed/i,
    'Step 4 must compile ONLY the confirmed lang/<lang>.md pack(s)'
  );

  // Local skill directory pruning
  assert.match(step4, /\.claude\/skills/, 'Step 4 must handle local .claude/skills/ directory pruning');
  assert.match(step4, /\.agents\/skills/, 'Step 4 must handle local .agents/skills/ directory pruning');
  for (const skillFolder of USER_INVOKED_DOMAIN_SKILLS) {
    assert.ok(
      step4.includes(skillFolder),
      `Step 4 pruning rules must name domain skill folder "${skillFolder}"`
    );
  }
  assert.match(
    step4,
    /unselected[\s\S]*lang\/|lang\/[\s\S]*unselected/i,
    'Step 4 must instruct deleting unselected lang/*.md files in local backend-security-floor installations'
  );
});

test('setup-matt-pocock-skills: seed templates quality-floor-frontend.md and quality-floor-backend.md exist, are concise and pointer-gated', () => {
  const fePath = path.join(SETUP_DIR, 'quality-floor-frontend.md');
  const bePath = path.join(SETUP_DIR, 'quality-floor-backend.md');

  assert.ok(fs.existsSync(fePath), 'quality-floor-frontend.md seed template must exist');
  assert.ok(fs.existsSync(bePath), 'quality-floor-backend.md seed template must exist');

  const fe = fs.readFileSync(fePath, 'utf8');
  const be = fs.readFileSync(bePath, 'utf8');

  assert.ok(fe.split(/\r?\n/).length <= 100, 'quality-floor-frontend.md should stay concise (<= 100 lines)');
  assert.ok(be.split(/\r?\n/).length <= 100, 'quality-floor-backend.md should stay concise (<= 100 lines)');

  assertNoSkillToolOnUserInvoked(fe, 'quality-floor-frontend.md');
  assertNoSkillToolOnUserInvoked(be, 'quality-floor-backend.md');

  // Frontend template checks
  assert.match(fe, /frontend/i, 'quality-floor-frontend.md must state frontend Stack profile');
  assert.match(fe, /Contrast/i, 'quality-floor-frontend.md must cover Contrast');
  assert.match(fe, /Typography/i, 'quality-floor-frontend.md must cover Typography');
  assert.match(fe, /Spatial/i, 'quality-floor-frontend.md must cover Spatial rhythm');
  assert.match(fe, /Elevation|Depth/i, 'quality-floor-frontend.md must cover Depth/Elevation');
  assert.match(fe, /Interaction/i, 'quality-floor-frontend.md must cover Interaction and States');
  assert.match(fe, /Motion/i, 'quality-floor-frontend.md must cover Motion');
  assert.match(fe, /\/ui-craft-floor/, 'quality-floor-frontend.md must point to /ui-craft-floor');
  assert.doesNotMatch(fe, /### 75\./, 'quality-floor-frontend.md must stay pointer-gated, not inline all 75 rules');

  // Backend template checks
  assert.match(be, /backend/i, 'quality-floor-backend.md must state backend Stack profile');
  assert.match(be, /Pit of Success/, 'quality-floor-backend.md must include Pit of Success');
  assert.match(be, /Fail-Secure by Default/i, 'quality-floor-backend.md must include Fail-Secure by Default');
  assert.match(be, /Deny-by-Default Authorization/i, 'quality-floor-backend.md must include Deny-by-Default Authorization');
  assert.match(be, /docs\/agents\/security-rules\.md/, 'quality-floor-backend.md must point to docs/agents/security-rules.md');
  assert.match(be, /\/backend-security-floor/, 'quality-floor-backend.md must point to /backend-security-floor');
  assert.match(be, /\/security-review/, 'quality-floor-backend.md must point to /security-review');
  assert.doesNotMatch(be, /### 42\./, 'quality-floor-backend.md must stay pointer-gated, not inline all 42 rules');
});

test('improve-codebase-architecture: SKILL.md maintains invocation rules, fresh context sub-agent, and integrates Quality floor', () => {
  const content = assertUserInvokedMetadata(ARCH_DIR, 'improve-codebase-architecture');
  assertNoSkillToolOnUserInvoked(content, 'improve-codebase-architecture/SKILL.md');

  const step1Match = content.match(/### 1\. Explore([\s\S]*?)### 2\. Present candidates/);
  assert.ok(step1Match, 'improve-codebase-architecture/SKILL.md must include Step 1 Explore');
  const step1 = step1Match[1];

  assert.match(step1, /fresh context window/i, 'Step 1 must explicitly require a fresh context window for the sub-agent');
  assert.match(step1, /docs\/agents\/quality-floor\.md/, 'Step 1 must instruct reading docs/agents/quality-floor.md');
  assert.match(
    step1,
    /docs\/agents\/security-rules\.md/,
    'Step 1 must instruct reading docs/agents/security-rules.md when present'
  );
  assert.match(
    step1,
    /Quality floor/i,
    'Step 1 must pass the active Quality floor into the exploration sub-agent'
  );

  // Profile-specific shallow module signals
  assert.match(step1, /frontend/i, 'Step 1 must address frontend Quality floor exploration');
  assert.match(
    step1,
    /component[\s\S]*state[\s\S]*seam|seam[\s\S]*component[\s\S]*state/i,
    'Step 1 must guide frontend exploration to spot scattered component/state seams'
  );
  assert.match(step1, /backend/i, 'Step 1 must address backend Quality floor exploration');
  assert.match(
    step1,
    /authorization/i,
    'Step 1 must guide backend exploration to spot scattered authorization checks'
  );
  assert.match(
    step1,
    /configuration|config/i,
    'Step 1 must guide backend exploration to spot raw configuration lookups or cliffs'
  );
  assert.match(
    step1,
    /cryptograph|primitive/i,
    'Step 1 must guide backend exploration to spot footgun cryptographic/primitive APIs'
  );
  assert.match(step1, /Pit of Success/i, 'Step 1 must direct backend deepening toward Pit of Success interfaces');
});

test('docs: setup-matt-pocock-skills.md and improve-codebase-architecture.md document new behavior per .agents/writing-docs.md', () => {
  const setupDoc = fs.readFileSync(SETUP_DOC_PATH, 'utf8');
  assertDocsCompliance(setupDoc, 'docs/engineering/setup-matt-pocock-skills.md', [
    '## What it does',
    '## When to reach for it',
    '## Prerequisites',
    '## The four decisions',
    '## Common questions',
    "## It's working if",
    '## Where it fits',
  ]);
  assert.doesNotMatch(
    setupDoc,
    /answers three questions|configures three things/i,
    'docs/engineering/setup-matt-pocock-skills.md must update stale "three" counts to four'
  );
  assert.match(setupDoc, /Stack profile/i, 'setup doc must document Stack profile');
  assert.match(setupDoc, /`frontend`/i, 'setup doc must document frontend profile');
  assert.match(setupDoc, /`backend`/i, 'setup doc must document backend profile');
  assert.match(setupDoc, /docs\/agents\/quality-floor\.md/, 'setup doc must document docs/agents/quality-floor.md');
  assert.match(setupDoc, /docs\/agents\/security-rules\.md/, 'setup doc must document docs/agents/security-rules.md');
  assert.match(setupDoc, /11/, 'setup doc must mention compiling from the 11 backend language packs');
  assert.match(setupDoc, /\.claude\/skills|\.agents\/skills|prune|removes unselected/i, 'setup doc must document local skill pruning');

  const archDoc = fs.readFileSync(ARCH_DOC_PATH, 'utf8');
  assertDocsCompliance(archDoc, 'docs/engineering/improve-codebase-architecture.md', [
    '## What it does',
    '## When to reach for it',
    '## Prerequisites',
    '## Depth, and the report that hunts for it',
    '## What happens after you pick one',
    '## Common questions',
    "## It's working if",
    '## Where it fits',
  ]);
  assert.match(archDoc, /docs\/agents\/quality-floor\.md/, 'architecture doc must reference docs/agents/quality-floor.md');
  assert.match(archDoc, /docs\/agents\/security-rules\.md/, 'architecture doc must reference docs/agents/security-rules.md');
  assert.match(archDoc, /Stack profile/i, 'architecture doc must mention Stack profile');
  assert.match(archDoc, /Pit of Success/i, 'architecture doc must reference Pit of Success');
});

test('mirrors and invariants: .agents/skills mirrors match byte-for-byte (normalized) with zero em-dashes or avoided terms', () => {
  const mirrorPairs = [
    { name: 'setup-matt-pocock-skills', src: SETUP_DIR, dst: SETUP_MIRROR_DIR },
    { name: 'improve-codebase-architecture', src: ARCH_DIR, dst: ARCH_MIRROR_DIR },
  ];

  const filesToScan = [SETUP_DOC_PATH, ARCH_DOC_PATH];

  for (const { name, src, dst } of mirrorPairs) {
    assert.ok(fs.existsSync(dst), `.agents/skills/${name} directory must exist`);
    const srcFiles = collectFilesRecursive(src);
    const dstFiles = collectFilesRecursive(dst);
    assert.deepStrictEqual(dstFiles, srcFiles, `.agents/skills/${name} must have exact same file tree as skills/engineering/${name}`);

    for (const rel of srcFiles) {
      const srcPath = path.join(src, rel);
      const dstPath = path.join(dst, rel);
      const srcText = fs.readFileSync(srcPath, 'utf8');
      const dstText = fs.readFileSync(dstPath, 'utf8');

      assert.strictEqual(
        normalizeNewlines(dstText),
        normalizeNewlines(srcText),
        `.agents/skills/${name}/${rel} must match skills/engineering/${name}/${rel}`
      );

      filesToScan.push(srcPath, dstPath);
    }
  }

  const avoidedGlossarySynonyms = /\b(coding aspect|skillset mode|domain mode|embedded rules|rule pack|baseline rules)\b/i;
  for (const filePath of filesToScan) {
    const text = fs.readFileSync(filePath, 'utf8');
    assert.ok(!text.includes('\u2014'), `${filePath} must contain zero em-dashes (\\u2014)`);
    assert.doesNotMatch(text, avoidedGlossarySynonyms, `${filePath} must use Glossary terms instead of avoided synonyms`);
  }
});
