import { config } from '../config.js';

export class TokenBudget {
  constructor(maxTokens) {
    this.maxTokens = maxTokens;
    this.tokensUsed = 0;
  }

  addUsage(tokens) {
    this.tokensUsed += tokens;
  }

  needsCheckpoint() {
    return (this.tokensUsed / this.maxTokens) > 0.7;
  }

  getBudgetStatus() {
    return {
      used: this.tokensUsed,
      max: this.maxTokens,
      percentage: (this.tokensUsed / this.maxTokens) * 100
    };
  }
}
