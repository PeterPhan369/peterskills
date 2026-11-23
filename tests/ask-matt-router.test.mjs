import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ASK_MATT_SKILL_PATH = path.resolve('skills/engineering/ask-matt/SKILL.md');
const ASK_MATT_YAML_PATH = path.resolve('skills/engineering/ask-matt/agents/openai.yaml');
const ASK_MATT_MIRROR_PATH = path.resolve('.agents/skills/ask-matt/SKILL.md');
const ASK_MATT_DOC_PATH = path.resolve('docs/engineering/ask-matt.md');

const USER_INVOKED_SKILLS = [
  'ask-matt',
  'grill-with-docs',
  'triage',
  'improve-codebase-architecture',
  'setup-matt-pocock-skills',
  'to-spec',
  'to-tickets',
  'implement',
  'implement-spec',
  'wayfinder',
  'retro',
  'ui-craft-floor',
  'ui-polish',
  'ui-review',
  'ui-shape',
  'backend-security-floor',
  'security-review',
  'grill-me',
  'handoff',
  'teach',
  'to-questionnaire',
  'wait-what',
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

function extractFrontmatter(markdown, filePath) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${filePath} must begin with YAML frontmatter`);
  return match[1];
}

function extractSection(markdown, heading, nextHeading) {
  const startIdx = markdown.indexOf(heading);
  assert.ok(startIdx !== -1, `Missing section "${heading}"`);
  const bodyStart = startIdx + heading.length;
  if (!nextHeading) {
    return markdown.slice(bodyStart);
  }
  const endIdx = markdown.indexOf(nextHeading, bodyStart);
  assert.ok(endIdx !== -1, `Missing section "${nextHeading}" after "${heading}"`);
  return markdown.slice(bodyStart, endIdx);
}

test('ask-matt: enforces user-only invocation and never instructs calling Skill tool on user-invoked skills', () => {
  const skill = fs.readFileSync(ASK_MATT_SKILL_PATH, 'utf8');
  const frontmatter = extractFrontmatter(skill, ASK_MATT_SKILL_PATH);

  assert.match(frontmatter, /^name:\s*ask-matt\s*$/m, 'ask-matt frontmatter must declare name');
  assert.match(
    frontmatter,
    /^disable-model-invocation:\s*true\s*$/m,
    'ask-matt/SKILL.md must keep disable-model-invocation: true'
  );

  const yaml = fs.readFileSync(ASK_MATT_YAML_PATH, 'utf8');
  assert.match(
    yaml,
    /^policy:\s*\r?\n(?:[ \t]+.*\r?\n)*?[ \t]+allow_implicit_invocation:\s*false\s*$/m,
    'ask-matt/agents/openai.yaml must set policy.allow_implicit_invocation: false'
  );

  for (const userSkill of USER_INVOKED_SKILLS) {
    assert.doesNotMatch(
      skill,
      new RegExp(`Call the Skill tool[^\\n]*["'\`]${userSkill}["'\`]`, 'i'),
      `ask-matt/SKILL.md must never call Skill tool on user-invoked skill "${userSkill}"`
    );
  }
});

test('ask-matt: Precondition routes setup by frontend vs. backend Stack profile and language packs', () => {
  const skill = fs.readFileSync(ASK_MATT_SKILL_PATH, 'utf8');
  const precondition = extractSection(skill, '## Precondition', null);

  assert.match(precondition, /\/setup-matt-pocock-skills/, 'Precondition must name /setup-matt-pocock-skills');
  assert.match(precondition, /Stack profile/i, 'Precondition must explain Stack profile configuration');
  assert.match(precondition, /`frontend`/i, 'Precondition must mention frontend Stack profile');
  assert.match(precondition, /`backend`/i, 'Precondition must mention backend Stack profile');
  assert.match(
    precondition,
    /language pack/i,
    'Precondition must mention backend language packs compiled during setup'
  );
  assert.match(
    precondition,
    /docs\/agents\/quality-floor\.md/,
    'Precondition must mention docs/agents/quality-floor.md'
  );
  assert.match(
    precondition,
    /docs\/agents\/security-rules\.md/,
    'Precondition must mention docs/agents/security-rules.md for backend'
  );
});

test('ask-matt: Main flow Step 2 and Step 3 branch cleanly by frontend vs. backend Stack profile', () => {
  const skill = fs.readFileSync(ASK_MATT_SKILL_PATH, 'utf8');
  const mainFlow = extractSection(skill, '## The main flow: idea → ship', '### Context hygiene');

  const step2Match = mainFlow.match(/2\.\s+\*\*Branch:[\s\S]*?(?=\r?\n3\.\s+\*\*Branch:)/);
  assert.ok(step2Match, 'Main flow must include Step 2');
  const step2 = step2Match[0];

  assert.match(step2, /`frontend`|frontend/i, 'Step 2 must address frontend profile');
  assert.match(step2, /\/ui-shape/, 'Step 2 must route frontend UI shaping to /ui-shape');
  assert.match(step2, /`backend`|backend/i, 'Step 2 must address backend profile');
  assert.match(
    step2,
    /threat[- ]boundar|fail-secure|API/i,
    'Step 2 must route backend questions to threat-boundary, API, or fail-secure validation'
  );
  assert.match(step2, /\/prototype/, 'Step 2 must still cover /prototype');

  const step3Match = mainFlow.match(/3\.\s+\*\*Branch:[\s\S]*?(?=\r?\n4\.\s+)/);
  assert.ok(step3Match, 'Main flow must include Step 3');
  const step3 = step3Match[0];

  assert.match(
    step3,
    /\/ui-polish[\s\S]*\/ui-review[\s\S]*\/code-review|\/ui-review[\s\S]*\/ui-polish[\s\S]*\/code-review/i,
    'Step 3 must route frontend builds through /ui-polish and /ui-review before /code-review'
  );
  assert.match(
    step3,
    /\/security-review[\s\S]*\/code-review|\/code-review[\s\S]*\/security-review/i,
    'Step 3 must route backend builds to /security-review alongside /code-review'
  );
});

test('ask-matt: Codebase health covers active Quality floor architecture deepening, UI skills, and security-review', () => {
  const skill = fs.readFileSync(ASK_MATT_SKILL_PATH, 'utf8');
  const health = extractSection(skill, '## Codebase health', '## Vocabulary underneath');

  assert.match(
    health,
    /\/improve-codebase-architecture/,
    'Codebase health must include /improve-codebase-architecture'
  );
  assert.match(
    health,
    /Quality floor/i,
    'Codebase health must note /improve-codebase-architecture reads the active Quality floor'
  );
  assert.match(health, /\/ui-review/, 'Codebase health must include /ui-review for frontend');
  assert.match(health, /\/ui-polish/, 'Codebase health must include /ui-polish for frontend');
  assert.match(health, /\/security-review/, 'Codebase health must include /security-review for backend');
});

test('ask-matt: Vocabulary underneath distinguishes 2 model-invoked references from pointer-gated user-invoked Quality floors', () => {
  const skill = fs.readFileSync(ASK_MATT_SKILL_PATH, 'utf8');
  const vocab = extractSection(skill, '## Vocabulary underneath', '## Phase boundaries');

  assert.doesNotMatch(
    vocab,
    /Three model-invoked references/i,
    'Vocabulary underneath must not claim three model-invoked references'
  );
  assert.match(
    vocab,
    /Two model-invoked references/i,
    'Vocabulary underneath must specify two model-invoked references'
  );
  assert.match(vocab, /\/domain-modeling/, 'Vocabulary underneath must include /domain-modeling');
  assert.match(vocab, /\/codebase-design/, 'Vocabulary underneath must include /codebase-design');
  assert.match(
    vocab,
    /user-invoked/i,
    'Vocabulary underneath must distinguish pointer-gated user-invoked Quality floors'
  );
  assert.match(vocab, /Quality floor/i, 'Vocabulary underneath must name Quality floor');
  assert.match(vocab, /\/ui-craft-floor/, 'Vocabulary underneath must include /ui-craft-floor');
  assert.match(vocab, /\/backend-security-floor/, 'Vocabulary underneath must include /backend-security-floor');
  assert.match(
    vocab,
    /docs\/agents\/quality-floor\.md/,
    'Vocabulary underneath must explain pointer gating via docs/agents/quality-floor.md'
  );
});

test('ask-matt: Standalone lists all backend and frontend domain skills', () => {
  const skill = fs.readFileSync(ASK_MATT_SKILL_PATH, 'utf8');
  const standalone = extractSection(skill, '## Standalone', '## Precondition');

  for (const name of [
    '/security-review',
    '/backend-security-floor',
    '/ui-craft-floor',
    '/ui-shape',
    '/ui-review',
    '/ui-polish',
  ]) {
    assert.ok(standalone.includes(name), `Standalone section must list ${name}`);
  }
});

test('ask-matt: docs/engineering/ask-matt.md obeys .agents/writing-docs.md and reflects Stack profile routing', () => {
  const doc = fs.readFileSync(ASK_MATT_DOC_PATH, 'utf8');

  assert.doesNotMatch(doc, /^#\s+/m, 'docs/engineering/ask-matt.md must have no H1');
  assert.doesNotMatch(
    doc,
    /(?:npx skills@latest add|claude plugin (?:marketplace )?add|claude plugin install|codex plugin|gemini skills install)/i,
    'docs/engineering/ask-matt.md must carry no install commands'
  );
  assert.doesNotMatch(
    doc,
    /github\.com\/(mattpocock\/skills|PeterPhan369\/peterskills)/i,
    'docs/engineering/ask-matt.md must contain no source repo links'
  );
  assert.doesNotMatch(
    doc,
    /skills\/engineering\//i,
    'docs/engineering/ask-matt.md must not link to internal skill source files'
  );

  const proseWithoutSlugs = doc
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\b(ask-matt|setup-matt-pocock-skills)\b/g, '');
  assert.doesNotMatch(
    proseWithoutSlugs,
    /\b(matt|pocock|peter)\b/i,
    'docs/engineering/ask-matt.md must name no author'
  );

  const links = [...doc.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(links.length > 0, 'docs/engineering/ask-matt.md must contain links');
  for (const href of links) {
    assert.match(href, /^https:\/\//, `Every link must be absolute https://, found "${href}"`);
  }

  const dictLinks = links.filter((href) => href.startsWith('https://www.aihero.dev/ai-coding-dictionary/'));
  const seenSlugs = new Set();
  for (const href of dictLinks) {
    const slug = href.replace('https://www.aihero.dev/ai-coding-dictionary/', '');
    assert.ok(KNOWN_DICTIONARY_SLUGS.has(slug), `Unknown dictionary slug "${slug}"`);
    assert.ok(!seenSlugs.has(slug), `Dictionary slug "${slug}" must be linked on first use only`);
    seenSlugs.add(slug);
  }

  const requiredHeadings = [
    '## What it does',
    '## When to reach for it',
    '## Prerequisites',
    '## Flows, not skills',
    '## The phase boundary',
    '## Common questions',
    "## It's working if",
    '## Where it fits',
  ];
  let lastIdx = -1;
  for (const heading of requiredHeadings) {
    const idx = doc.indexOf(heading);
    assert.ok(idx !== -1, `docs/engineering/ask-matt.md must include "${heading}"`);
    assert.ok(idx > lastIdx, `"${heading}" must appear in canonical template order`);
    lastIdx = idx;
  }

  assert.doesNotMatch(
    doc,
    /Sixteen of the plugin's twenty-seven skills/i,
    'docs/engineering/ask-matt.md must update stale 16/27 skill count'
  );
  assert.match(
    doc,
    /Twenty-two of the plugin's thirty-three skills/i,
    'docs/engineering/ask-matt.md must reflect accurate 22/33 user-invoked skill count'
  );
  assert.match(doc, /Stack profile/i, 'docs/engineering/ask-matt.md must document Stack profile');
  assert.match(doc, /`frontend`/i, 'docs/engineering/ask-matt.md must mention frontend profile');
  assert.match(doc, /`backend`/i, 'docs/engineering/ask-matt.md must mention backend profile');
  assert.match(doc, /Quality floor/i, 'docs/engineering/ask-matt.md must document Quality floor');

  for (const url of [
    'https://aihero.dev/skills-setup-matt-pocock-skills',
    'https://aihero.dev/skills-ui-craft-floor',
    'https://aihero.dev/skills-backend-security-floor',
    'https://aihero.dev/skills-security-review',
  ]) {
    assert.ok(doc.includes(url), `docs/engineering/ask-matt.md must link to ${url}`);
  }
});

test('ask-matt: zero em-dashes and zero avoided glossary synonyms across skill, mirror, and doc', () => {
  const avoidedGlossarySynonyms = /\b(coding aspect|skillset mode|domain mode|embedded rules|rule pack|baseline rules)\b/i;

  for (const filePath of [ASK_MATT_SKILL_PATH, ASK_MATT_MIRROR_PATH, ASK_MATT_DOC_PATH]) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(!content.includes('\u2014'), `${filePath} must contain zero em-dashes`);
    assert.doesNotMatch(
      content,
      avoidedGlossarySynonyms,
      `${filePath} must use GLOSSARY.md terms instead of avoided synonyms`
    );
  }
});
