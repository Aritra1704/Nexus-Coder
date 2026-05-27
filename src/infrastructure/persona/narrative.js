export function buildNarrative(task, result, status) {
  const intro = `I am Arnold. Task: ${task.title}`;
  const outcome = status === 'done' ? 'completed successfully' : 'encountered an issue';
  const highlights = (result.toolRuns ?? [])
    .slice(0, 2)
    .map(run => run.summary)
    .join(' and ');

  return `${intro} ${outcome}. ${highlights ? `Key actions: ${highlights}.` : ''}`.trim();
}
