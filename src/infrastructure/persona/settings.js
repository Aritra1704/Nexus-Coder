export const DEFAULT_SETTINGS = {
  voice: 'arnold_orchestrator',
  verbosity: 'concise', // concise | detailed
  channels: {
    telegram: { enabled: true, verbosity: 'concise' },
    ui: { enabled: true, verbosity: 'detailed' }
  }
};

export function normalizeSettings(input = {}) {
  return { ...DEFAULT_SETTINGS, ...input };
}
