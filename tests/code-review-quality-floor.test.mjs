import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertDocsCompliance,
  AVOIDED_GLOSSARY_SYNONYMS,
  collectFilesRecursive,
  normalizeNewlines,
} from './helpers.mjs';

const CODE_REVIEW_DIR = path.resolve('skills/engineering/code-review');
const CODE_REVIEW_MIRROR_DIR = path.resolve('.agents/skills/code-review');
const CODE_REVIEW_DOC_PATH = path.resolve('docs/engineering/code-review.md');

function assertDecoupledFromQualityFloor(text, label) {
  assert.doesNotMatch(
    text,
    /docs\/agents\/quality-floor\.md/,
    `${label} must not reference docs/agents/quality-floor.md`
  );
  assert.doesNotMatch(
    text,
    /docs\/agents\/security-rules\.md/,
    `${label} must not reference docs/agents/security-rules.md`
  );
  assert.doesNotMatch(text, /Quality floor/i, `${label} must stay decoupled from Quality floor`);
  assert.doesNotMatch(text, /Stack profile/i, `${label} must stay decoupled from Stack profile`);
}

test('code-review: Step 3 discovers repo standards docs and stays decoupled from Quality floors and security-rules', () => {
  const skillPath = path.join(CODE_REVIEW_DIR, 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');

  assert.match(content, /fresh context window/i, 'code-review/SKILL.md must require fresh context windows for sub-agents');

  const step3Match = content.match(/### 3\. Identify the standards sources([\s\S]*?)### 4\./);
  assert.ok(step3Match, 'code-review/SKILL.md must include Step 3: Identify the standards sources');
  const step3 = step3Match[1];

  assert.match(step3, /CODING_STANDARDS\.md/, 'Step 3 must require CODING_STANDARDS.md when present');
  assert.match(step3, /CONTRIBUTING\.md/, 'Step 3 must require CONTRIBUTING.md when present');
  assertDecoupledFromQualityFloor(content, 'code-review/SKILL.md');
});

test('code-review: .agents/skills/code-review mirrors source identically with zero em-dashes', () => {
  const srcFiles = collectFilesRecursive(CODE_REVIEW_DIR, { relative: true });
  const mirrorFiles = collectFilesRecursive(CODE_REVIEW_MIRROR_DIR, { relative: true });

  assert.ok(srcFiles.includes('SKILL.md'), 'skills/engineering/code-review/SKILL.md must exist');
  assert.deepStrictEqual(
    mirrorFiles,
    srcFiles,
    '.agents/skills/code-review file tree must match skills/engineering/code-review'
  );

  for (const rel of srcFiles) {
    const srcText = fs.readFileSync(path.join(CODE_REVIEW_DIR, rel), 'utf8');
    const mirrorText = fs.readFileSync(path.join(CODE_REVIEW_MIRROR_DIR, rel), 'utf8');
    assert.strictEqual(
      normalizeNewlines(mirrorText),
      normalizeNewlines(srcText),
      `.agents/skills/code-review/${rel} must identically mirror skills/engineering/code-review/${rel}`
    );
    assert.ok(!srcText.includes('\u2014'), `skills/engineering/code-review/${rel} must contain zero em-dashes`);
    assert.doesNotMatch(
      srcText,
      AVOIDED_GLOSSARY_SYNONYMS,
      `skills/engineering/code-review/${rel} must not contain avoided glossary synonyms`
    );
  }
});

test('code-review: docs/engineering/code-review.md follows .agents/writing-docs.md and Prerequisites stays decoupled from Quality floors', () => {
  const doc = fs.readFileSync(CODE_REVIEW_DOC_PATH, 'utf8');

  assertDocsCompliance(
    doc,
    'docs/engineering/code-review.md',
    [
      '## What it does',
      '## When to reach for it',
      '## Prerequisites',
      '## The two axes',
      '## Common questions',
      "## It's working if",
      '## Where it fits',
    ],
    { allowSkillsUpdateMention: true }
  );

  assert.ok(!doc.includes('\u2014'), 'docs/engineering/code-review.md must contain zero em-dashes');
  assert.doesNotMatch(
    doc,
    AVOIDED_GLOSSARY_SYNONYMS,
    'docs/engineering/code-review.md must not contain avoided glossary synonyms'
  );

  const prereqMatch = doc.match(/## Prerequisites([\s\S]*?)## The two axes/);
  assert.ok(prereqMatch, 'docs/engineering/code-review.md must contain ## Prerequisites');
  const prereq = prereqMatch[1];

  assert.match(prereq, /CODING_STANDARDS\.md/, 'Prerequisites must mention CODING_STANDARDS.md');
  assert.match(prereq, /CONTRIBUTING\.md/, 'Prerequisites must mention CONTRIBUTING.md');
  assertDecoupledFromQualityFloor(prereq, 'Prerequisites');
});
