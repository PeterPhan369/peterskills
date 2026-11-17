import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('detector-rules: 75 rules across 6 exact domain sections in canonical order', () => {
  const content = fs.readFileSync(path.resolve('skills/engineering/ui-craft-floor/DETECTOR-RULES.md'), 'utf8');

  const expectedSections = [
    '## 1. Visual and Structural',
    '## 2. Copy and Voice',
    '## 3. Layout and Composition',
    '## 4. Color and Contrast',
    '## 5. Typography',
    '## 6. Components and Interactions',
  ];

  // Verify all sections exist in exact order
  let lastIndex = -1;
  for (const section of expectedSections) {
    const idx = content.indexOf(section);
    assert.ok(idx !== -1, `Section "${section}" must exist in DETECTOR-RULES.md`);
    assert.ok(idx > lastIndex, `Section "${section}" must appear after preceding section`);
    lastIndex = idx;
  }

  // Verify rule numbering from 1 to 75
  const ruleMatches = [...content.matchAll(/### (\d+)\.\s+`([^`]+)`/g)];
  assert.strictEqual(ruleMatches.length, 75, 'Catalog must contain exactly 75 rules');

  for (let i = 0; i < 75; i++) {
    const expectedNum = i + 1;
    const actualNum = parseInt(ruleMatches[i][1], 10);
    assert.strictEqual(
      actualNum,
      expectedNum,
      `Rule index ${i} should be numbered ${expectedNum}, got ${actualNum}`
    );
  }
});
