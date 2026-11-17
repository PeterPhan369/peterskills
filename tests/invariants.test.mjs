import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

test('invariants: zero em-dashes across all touched skills and documentation', () => {
  const dirsToScan = [
    'skills/engineering',
    'docs/engineering',
    '.agents/skills/ask-matt',
    '.agents/skills/ui-craft-floor',
    '.agents/skills/ui-polish',
    '.agents/skills/ui-review',
    '.agents/skills/ui-shape',
  ];

  const filesToScan = ['README.md', 'CLAUDE.md', 'CONTRIBUTING.md'];

  function collectMdFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectMdFiles(full);
      } else if (entry.name.endsWith('.md')) {
        filesToScan.push(full);
      }
    }
  }

  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      collectMdFiles(dir);
    }
  }

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

test('invariants: plugin version check passes', () => {
  const output = execSync('node scripts/sync-plugin-version.mjs --check', { encoding: 'utf8' });
  assert.ok(output.includes('already in sync'), 'Plugin version must be in sync');
});
