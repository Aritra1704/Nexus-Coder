import { buildNarrative } from '../narrative.js';
import { strict as assert } from 'node:assert';

async function testPersona() {
  const task = { title: 'Setup DB' };
  const result = { toolRuns: [{ summary: 'Created table' }] };
  
  const narrative = buildNarrative(task, result, 'done');
  assert.ok(narrative.includes('I am Arnold'), 'Missing persona intro');
  assert.ok(narrative.includes('completed successfully'), 'Incorrect status summary');
  assert.ok(narrative.includes('Created table'), 'Missing tool highlights');
  
  console.log('Persona tests passed!');
}

testPersona().catch((err) => {
  console.error(err);
  process.exit(1);
});
