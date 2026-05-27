import { runTool } from '../tools/registry.js';
import { config } from '../config.js';
import path from 'node:path';

export async function generateSkill(skillName, prompt) {
  const skillDir = path.join(config.skillsBuiltinDir, skillName);
  
  // Create directory
  await runTool('make_dir', { path: skillDir }, config.workspaceRoot);
  
  // Generate SKILL.md template
  const content = `# Skill: ${skillName}

## Purpose
${prompt}

## Workflow
1. Analyze objective.
2. Delegate to appropriate sub-agents.
3. Validate result.
`;
  await runTool('write_file', { path: path.join(skillDir, 'SKILL.md'), content }, config.workspaceRoot);
  
  return { status: 'success', path: skillDir };
}
