import { generateSkill } from '../skillGenerator.js';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config.js';

async function testSkillGenerator() {
  const skillName = 'test-skill';
  const prompt = 'Test skill purpose';
  
  await generateSkill(skillName, prompt);
  
  const skillPath = path.join(config.workspaceRoot, config.skillsBuiltinDir, skillName, 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf8');
  
  assert.ok(content.includes('Test skill purpose'), 'Skill content missing');
  
  await fs.rm(path.join(config.workspaceRoot, config.skillsBuiltinDir, skillName), { recursive: true, force: true });
  console.log('SkillGenerator tests passed!');
}

testSkillGenerator().catch((err) => {
  console.error(err);
  process.exit(1);
});
