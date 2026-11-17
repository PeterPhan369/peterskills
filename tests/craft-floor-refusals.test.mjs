import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('craft-floor: Defaults to Refuse includes negative tracking floor and all sharpened bans', () => {
  const content = fs.readFileSync(path.resolve('skills/engineering/ui-craft-floor/SKILL.md'), 'utf8');

  // Extract the "Defaults to Refuse" section
  const sectionMatch = content.match(/## Defaults to Refuse\s+([\s\S]*?)(?=\n## |\n---|$)/);
  assert.ok(sectionMatch, 'ui-craft-floor/SKILL.md must have a "## Defaults to Refuse" section');

  const sectionText = sectionMatch[1];

  const requiredRefusals = [
    { name: 'kickers / eyebrows', pattern: /kicker|eyebrow/i },
    { name: 'ghost cards', pattern: /ghost card/i },
    { name: 'decorative gridlines', pattern: /grid-line|grid background/i },
    { name: 'fake sketch SVGs', pattern: /fake sketch|feTurbulence/i },
    { name: 'reflexive modals', pattern: /reflexive modal/i },
    { name: 'negative tracking floor (-0.04em)', pattern: /-0\.04em/i },
  ];

  for (const { name, pattern } of requiredRefusals) {
    assert.ok(
      pattern.test(sectionText),
      `"Defaults to Refuse" must explicitly refuse ${name}`
    );
  }
});
