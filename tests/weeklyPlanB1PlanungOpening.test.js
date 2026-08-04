/**
 * Planung opening message tests.
 */
import { describe, expect, it } from 'vitest';
import { buildPlanungOpeningMessage } from '../server/src/weekly-training-ai/core/planungOpening.js';

describe('buildPlanungOpeningMessage', () => {
  it('uses first dialog line without speaker prefix', () => {
    const message = buildPlanungOpeningMessage({
      title: 'Einen Ausflug planen',
      dialog: ['A: Hallo, wollen wir zusammen einen Ausflug planen?'],
    });
    expect(message).toBe('Hallo, wollen wir zusammen einen Ausflug planen?');
  });

  it('falls back to title-based greeting', () => {
    const message = buildPlanungOpeningMessage({ title: 'Eine Reise planen' });
    expect(message).toContain('Eine Reise planen');
  });
});
