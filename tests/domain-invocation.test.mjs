import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_SKILLS = ['ui-craft-floor', 'ui-polish', 'ui-review', 'ui-shape'];

function extractFrontmatter(markdown, filePath) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${filePath} must begin with YAML frontmatter`);
  return match[1];
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

function collectFilesRecursive(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFilesRecursive(full, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

test('domain invocation: all 4 frontend skills enforce user-only invocation in SKILL.md and openai.yaml', () => {
  for (const skill of FRONTEND_SKILLS) {
    const skillPath = path.resolve('skills/engineering', skill, 'SKILL.md');
    const yamlPath = path.resolve('skills/engineering', skill, 'agents/openai.yaml');

    const skillContent = fs.readFileSync(skillPath, 'utf8');
    const frontmatter = extractFrontmatter(skillContent, skillPath);
    assert.match(
      frontmatter,
      /^disable-model-invocation:\s*true\s*$/m,
      `${skill}/SKILL.md must set disable-model-invocation: true`
    );

    assert.ok(fs.existsSync(yamlPath), `${skill}/agents/openai.yaml must exist`);
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    assert.match(
      yamlContent,
      /^policy:\s*\r?\n(?:[ \t]+.*\r?\n)*?[ \t]+allow_implicit_invocation:\s*false\s*$/m,
      `${skill}/agents/openai.yaml must set policy.allow_implicit_invocation: false`
    );
  }
});

test('domain invocation: ui-craft-floor SKILL.md description is human-facing without model triggers', () => {
  const skillPath = path.resolve('skills/engineering/ui-craft-floor/SKILL.md');
  const frontmatter = extractFrontmatter(fs.readFileSync(skillPath, 'utf8'), skillPath);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
  assert.ok(descMatch, 'ui-craft-floor/SKILL.md frontmatter must declare description');

  const description = descMatch[1].trim();
  assert.ok(description.length > 0, 'ui-craft-floor description must not be empty');
  assert.doesNotMatch(
    description,
    /\bUse when(?:ever)?\b/i,
    'ui-craft-floor description must be human-facing and omit model-trigger phrasing like "Use whenever"'
  );
});

test('domain invocation: README.md and skills/engineering/README.md list ui-craft-floor under User-invoked only', () => {
  const rootReadme = fs.readFileSync(path.resolve('README.md'), 'utf8');
  const rootEngMatch = rootReadme.match(
    /### Engineering[\s\S]*?\*\*User-invoked\*\*([\s\S]*?)\*\*Model-invoked\*\*([\s\S]*?)### Productivity/
  );
  assert.ok(rootEngMatch, 'README.md must have Engineering User-invoked and Model-invoked sections');

  const [, rootUserInvoked, rootModelInvoked] = rootEngMatch;
  assert.ok(
    rootUserInvoked.includes('[ui-craft-floor](./skills/engineering/ui-craft-floor/SKILL.md)'),
    'README.md must list ui-craft-floor under Engineering User-invoked'
  );
  assert.ok(
    !rootModelInvoked.includes('ui-craft-floor'),
    'README.md must not list ui-craft-floor under Engineering Model-invoked'
  );

  const engReadme = fs.readFileSync(path.resolve('skills/engineering/README.md'), 'utf8');
  const engSectionsMatch = engReadme.match(
    /## User-invoked([\s\S]*?)## Model-invoked([\s\S]*)$/
  );
  assert.ok(engSectionsMatch, 'skills/engineering/README.md must have User-invoked and Model-invoked sections');

  const [, engUserInvoked, engModelInvoked] = engSectionsMatch;
  assert.ok(
    engUserInvoked.includes('[ui-craft-floor](./ui-craft-floor/SKILL.md)'),
    'skills/engineering/README.md must list ui-craft-floor under User-invoked'
  );
  assert.ok(
    !engModelInvoked.includes('ui-craft-floor'),
    'skills/engineering/README.md must not list ui-craft-floor under Model-invoked'
  );
});

test('domain invocation: docs/engineering/ui-craft-floor.md documents user invocation and frontend Stack profile activation', () => {
  const docPath = path.resolve('docs/engineering/ui-craft-floor.md');
  const doc = fs.readFileSync(docPath, 'utf8');

  assert.doesNotMatch(doc, /^#\s/m, 'docs/engineering/ui-craft-floor.md must have no H1');
  assert.doesNotMatch(
    doc,
    /\]\(\.\.?\/[^)]+\)/,
    'docs/engineering/ui-craft-floor.md must use absolute links only'
  );
  assert.doesNotMatch(
    doc,
    /npx skills|claude plugin|codex plugin|gemini skills/i,
    'docs/engineering/ui-craft-floor.md must carry no install commands'
  );
  const docWithoutSkillSlugs = doc.replace(/setup-matt-pocock-skills|ask-matt/g, '');
  assert.doesNotMatch(
    docWithoutSkillSlugs,
    /\bMatt(?:\s+Pocock)?\b/i,
    'docs/engineering/ui-craft-floor.md must name no author'
  );

  const requiredHeadings = [
    '## What it does',
    '## When to reach for it',
    '## The craft floor and anti-pattern catalog',
    '## Common questions',
    "## It's working if",
    '## Where it fits',
  ];
  let prevIndex = -1;
  for (const heading of requiredHeadings) {
    const idx = doc.indexOf(heading);
    assert.ok(idx !== -1, `docs/engineering/ui-craft-floor.md must include "${heading}"`);
    assert.ok(idx > prevIndex, `"${heading}" must appear in canonical template order`);
    prevIndex = idx;
  }
  assert.ok(
    doc.includes('https://aihero.dev/skills-ask-matt'),
    'docs/engineering/ui-craft-floor.md must link to ask-matt'
  );

  assert.ok(
    doc.includes('`/ui-craft-floor`'),
    'docs/engineering/ui-craft-floor.md must document `/ui-craft-floor` invocation'
  );
  assert.match(
    doc,
    /won't reach for it on its own/i,
    'docs/engineering/ui-craft-floor.md must state the agent does not reach for it automatically'
  );
  assert.doesNotMatch(
    doc,
    /reaches for it automatically|Model applies craft floor automatically/i,
    'docs/engineering/ui-craft-floor.md must remove stale model-invoked auto-trigger prose'
  );

  assert.match(
    doc,
    /`frontend`[\s\S]*Stack profile|Stack profile[\s\S]*`frontend`/i,
    'docs/engineering/ui-craft-floor.md must document per-repo activation via the frontend Stack profile'
  );
  assert.match(
    doc,
    /setup-matt-pocock-skills/i,
    'docs/engineering/ui-craft-floor.md must mention setup-matt-pocock-skills'
  );
  assert.match(
    doc,
    /docs\/agents\/quality-floor\.md/,
    'docs/engineering/ui-craft-floor.md must mention seeding docs/agents/quality-floor.md'
  );
  assert.match(
    doc,
    /CLAUDE\.md[\s\S]*AGENTS\.md|AGENTS\.md[\s\S]*CLAUDE\.md/,
    'docs/engineering/ui-craft-floor.md must mention pointing from CLAUDE.md or AGENTS.md'
  );
});

test('domain invocation: .agents/skills/ui-craft-floor mirrors SKILL.md, DETECTOR-RULES.md, and agents/openai.yaml', () => {
  const filesToMirror = ['SKILL.md', 'DETECTOR-RULES.md', 'agents/openai.yaml'];

  for (const relPath of filesToMirror) {
    const sourcePath = path.resolve('skills/engineering/ui-craft-floor', relPath);
    const mirrorPath = path.resolve('.agents/skills/ui-craft-floor', relPath);

    assert.ok(fs.existsSync(sourcePath), `Missing source file ${sourcePath}`);
    assert.ok(fs.existsSync(mirrorPath), `Missing mirror file ${mirrorPath}`);

    const sourceContent = normalizeNewlines(fs.readFileSync(sourcePath, 'utf8'));
    const mirrorContent = normalizeNewlines(fs.readFileSync(mirrorPath, 'utf8'));
    assert.strictEqual(
      mirrorContent,
      sourceContent,
      `.agents/skills/ui-craft-floor/${relPath} must identically mirror skills/engineering/ui-craft-floor/${relPath}`
    );
  }
});

test('domain invocation: zero em-dashes across all 4 frontend skills and touched docs', () => {
  const filesToCheck = [
    path.resolve('README.md'),
    path.resolve('skills/engineering/README.md'),
  ];

  for (const skill of FRONTEND_SKILLS) {
    filesToCheck.push(
      ...collectFilesRecursive(path.resolve('skills/engineering', skill), ['.md', '.yaml']),
      ...collectFilesRecursive(path.resolve('.agents/skills', skill), ['.md', '.yaml']),
      path.resolve('docs/engineering', `${skill}.md`)
    );
  }

  const violations = filesToCheck.filter((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('\u2014');
  });

  assert.deepStrictEqual(
    violations,
    [],
    `Found em-dashes (\u2014) in: ${violations.join(', ')}`
  );
});
