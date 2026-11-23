import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TOUCHED_AGENT_SKILLS = [
  'ask-matt',
  'ui-craft-floor',
  'ui-polish',
  'ui-review',
  'ui-shape',
  'backend-security-floor',
  'security-review',
  'setup-matt-pocock-skills',
  'improve-codebase-architecture',
];

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

function listSubdirs(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

test('invariants: zero em-dashes across all touched skills, docs, ADRs, glossary, and mirrors', () => {
  const dirsToScan = [
    'skills/engineering',
    'docs/engineering',
    '.agents/adr',
    ...TOUCHED_AGENT_SKILLS.map((skill) => path.join('.agents/skills', skill)),
  ];

  const filesToScan = [
    'GLOSSARY.md',
    'README.md',
    'CLAUDE.md',
    'CONTRIBUTING.md',
    ...dirsToScan.flatMap((dir) => collectFilesRecursive(dir, ['.md', '.yaml'])),
  ];

  const violations = [];
  for (const file of filesToScan) {
    const content = fs.readFileSync(path.resolve(file), 'utf8');
    if (content.includes('\u2014')) {
      violations.push(file);
    }
  }

  assert.deepStrictEqual(
    violations,
    [],
    `The following files violate CLAUDE.md by containing em-dashes (\u2014): ${violations.join(', ')}`
  );
});

test('invariants: .claude-plugin/plugin.json is valid JSON and matches exact promoted skills', () => {
  const pluginRaw = fs.readFileSync(path.resolve('.claude-plugin/plugin.json'), 'utf8');
  const plugin = JSON.parse(pluginRaw);

  assert.ok(Array.isArray(plugin.skills), 'plugin.json must define a skills array');
  assert.ok(
    plugin.skills.includes('./skills/engineering/backend-security-floor'),
    'plugin.json must include ./skills/engineering/backend-security-floor'
  );
  assert.ok(
    plugin.skills.includes('./skills/engineering/security-review'),
    'plugin.json must include ./skills/engineering/security-review'
  );

  const uniqueSkills = new Set(plugin.skills);
  assert.strictEqual(uniqueSkills.size, plugin.skills.length, 'plugin.json skills array must not contain duplicates');

  for (const relSkillPath of plugin.skills) {
    const skillMd = path.resolve(relSkillPath, 'SKILL.md');
    assert.ok(fs.existsSync(skillMd), `plugin.json entry "${relSkillPath}" must have a SKILL.md`);
  }

  const promotedExpected = [
    ...listSubdirs('skills/engineering').map((name) => `./skills/engineering/${name}`),
    ...listSubdirs('skills/productivity').map((name) => `./skills/productivity/${name}`),
  ].sort();

  assert.deepStrictEqual(
    [...plugin.skills].sort(),
    promotedExpected,
    'plugin.json skills array must match exact promoted skill directories under skills/engineering/ and skills/productivity/'
  );
});

test('invariants: README.md and skills/engineering/README.md register backend skills under User-invoked and document Stack profile setup', () => {
  const rootReadme = fs.readFileSync(path.resolve('README.md'), 'utf8');
  const rootEngMatch = rootReadme.match(
    /### Engineering[\s\S]*?\*\*User-invoked\*\*([\s\S]*?)\*\*Model-invoked\*\*([\s\S]*?)### Productivity/
  );
  assert.ok(rootEngMatch, 'README.md must have Engineering User-invoked and Model-invoked sections');

  const [, rootUserInvoked, rootModelInvoked] = rootEngMatch;
  for (const skill of ['backend-security-floor', 'security-review']) {
    const linkTarget = `./skills/engineering/${skill}/SKILL.md`;
    assert.ok(
      rootUserInvoked.includes(`[${skill}](${linkTarget})`),
      `README.md must list ${skill} with valid link under Engineering User-invoked`
    );
    assert.ok(
      !rootModelInvoked.includes(skill),
      `README.md must not list ${skill} under Engineering Model-invoked`
    );
    assert.ok(fs.existsSync(path.resolve('skills/engineering', skill, 'SKILL.md')), `${linkTarget} must exist`);
  }

  assert.match(
    rootReadme,
    /Run `\/setup-matt-pocock-skills`[\s\S]*?Stack profile[\s\S]*?`frontend`[\s\S]*?`backend`/i,
    'README.md setup steps must mention Stack profile (frontend / backend)'
  );
  assert.match(
    rootUserInvoked,
    /\[setup-matt-pocock-skills\][^\n]*Stack profile/i,
    'README.md setup-matt-pocock-skills entry must mention Stack profile'
  );

  const engReadme = fs.readFileSync(path.resolve('skills/engineering/README.md'), 'utf8');
  const engSectionsMatch = engReadme.match(
    /## User-invoked([\s\S]*?)## Model-invoked([\s\S]*)$/
  );
  assert.ok(engSectionsMatch, 'skills/engineering/README.md must have User-invoked and Model-invoked sections');

  const [, engUserInvoked, engModelInvoked] = engSectionsMatch;
  for (const skill of ['backend-security-floor', 'security-review']) {
    const linkTarget = `./${skill}/SKILL.md`;
    assert.ok(
      engUserInvoked.includes(`[${skill}](${linkTarget})`),
      `skills/engineering/README.md must list ${skill} with valid link under User-invoked`
    );
    assert.ok(
      !engModelInvoked.includes(skill),
      `skills/engineering/README.md must not list ${skill} under Model-invoked`
    );
    assert.ok(fs.existsSync(path.resolve('skills/engineering', skill, 'SKILL.md')), `${linkTarget} must exist`);
  }

  assert.match(
    engUserInvoked,
    /\[setup-matt-pocock-skills\][^\n]*Stack profile/i,
    'skills/engineering/README.md setup-matt-pocock-skills entry must mention Stack profile'
  );
});

test('invariants: plugin version check passes', () => {
  const output = execSync('node scripts/sync-plugin-version.mjs --check', { encoding: 'utf8' });
  assert.ok(output.includes('already in sync'), 'Plugin version must be in sync');
});
