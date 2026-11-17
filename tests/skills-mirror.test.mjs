import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('skills mirror: .agents/skills mirrors skills/engineering for all touched skills', () => {
  const skills = ['ask-matt', 'ui-craft-floor', 'ui-polish', 'ui-review', 'ui-shape'];

  for (const skill of skills) {
    const engDir = path.resolve('skills/engineering', skill);
    const agentDir = path.resolve('.agents/skills', skill);

    assert.ok(fs.existsSync(engDir), `skills/engineering/${skill} must exist`);
    assert.ok(fs.existsSync(agentDir), `.agents/skills/${skill} must exist`);

    const engFiles = fs.readdirSync(engDir).filter(f => f.endsWith('.md'));
    for (const file of engFiles) {
      const engContent = fs.readFileSync(path.join(engDir, file), 'utf8');
      const agentPath = path.join(agentDir, file);

      assert.ok(fs.existsSync(agentPath), `.agents/skills/${skill}/${file} must exist`);
      const agentContent = fs.readFileSync(agentPath, 'utf8');

      const normalize = (str) => str.replace(/\r\n/g, '\n');
      assert.strictEqual(
        normalize(agentContent),
        normalize(engContent),
        `.agents/skills/${skill}/${file} must mirror skills/engineering/${skill}/${file}`
      );
    }
  }
});
