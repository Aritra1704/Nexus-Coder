import { TokenBudget } from '../tokenBudget.js';
import { strict as assert } from 'node:assert';

async function testTokenBudget() {
  const budget = new TokenBudget(1000);

  // 1. Test usage tracking
  budget.addUsage(500);
  assert.strictEqual(budget.tokensUsed, 500);

  // 2. Test checkpoint threshold (70%)
  assert.strictEqual(budget.needsCheckpoint(), false, 'Should not need checkpoint at 50%');
  budget.addUsage(250); // 750/1000 = 75%
  assert.strictEqual(budget.needsCheckpoint(), true, 'Should need checkpoint at 75%');

  console.log('TokenBudget tests passed!');
}

testTokenBudget().catch((err) => {
  console.error(err);
  process.exit(1);
});
