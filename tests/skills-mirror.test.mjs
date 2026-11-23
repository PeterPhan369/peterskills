import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { collectFilesRecursive, normalizeNewlines, TOUCHED_AGENT_SKILLS } from './helpers.mjs';

const EXPECTED_EXTRA_FILES = {
  'ask-matt': ['PHASE-BOUNDARIES.md'],
  'ui-craft-floor': ['DETECTOR-RULES.md'],
  'ui-polish': ['PLAYBOOKS.md'],
  'backend-security-floor': [
    'SECURITY-RULES.md',
    'lang/c-cpp.md',
    'lang/csharp.md',
    'lang/go.md',
    'lang/java.md',
    'lang/javascript-typescript.md',
    'lang/kotlin.md',
    'lang/php.md',
    'lang/python.md',
    'lang/ruby.md',
    'lang/rust.md',
    'lang/swift.md',
  ],
  'setup-matt-pocock-skills': [
    'domain.md',
    'issue-tracker-github.md',
    'issue-tracker-gitlab.md',
    'issue-tracker-local.md',
    'triage-labels.md',
    'quality-floor-frontend.md',
    'quality-floor-backend.md',
  ],
  'improve-codebase-architecture': ['HTML-REPORT.md'],
};

test(`skills mirror: .agents/skills recursively mirrors every .md and .yaml file for all ${TOUCHED_AGENT_SKILLS.length} touched skills`, () => {
  for (const skill of TOUCHED_AGENT_SKILLS) {
    const engDir = path.resolve('skills/engineering', skill);
    const agentDir = path.resolve('.agents/skills', skill);

    assert.ok(fs.existsSync(engDir), `skills/engineering/${skill} must exist`);
    assert.ok(fs.existsSync(agentDir), `.agents/skills/${skill} must exist`);

    const engFiles = collectFilesRecursive(engDir, { extensions: ['.md', '.yaml'], relative: true });
    const agentFiles = collectFilesRecursive(agentDir, { extensions: ['.md', '.yaml'], relative: true });

    assert.deepStrictEqual(
      agentFiles,
      engFiles,
      `.agents/skills/${skill} file tree must match skills/engineering/${skill}`
    );

    for (const required of ['SKILL.md', 'agents/openai.yaml', ...(EXPECTED_EXTRA_FILES[skill] ?? [])]) {
      assert.ok(
        engFiles.includes(required),
        `skills/engineering/${skill} must include expected file ${required}`
      );
    }

    for (const relPath of engFiles) {
      const engContent = fs.readFileSync(path.join(engDir, relPath), 'utf8');
      const agentContent = fs.readFileSync(path.join(agentDir, relPath), 'utf8');

      assert.strictEqual(
        normalizeNewlines(agentContent),
        normalizeNewlines(engContent),
        `.agents/skills/${skill}/${relPath} must identically mirror skills/engineering/${skill}/${relPath}`
      );
    }
  }
});
