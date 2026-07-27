/**
 * Guards against Rules of Hooks regressions in LesenScreen:
 * B1/B2 early returns must come after all useState/useMemo/useEffect calls.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src/app/screens/LesenScreen.jsx');

describe('LesenScreen hooks order', () => {
  const source = readFileSync(SRC, 'utf8');

  it('uses the A2 guided catalog inside LesenScreen', () => {
    expect(source).toMatch(/a2LesenCatalog/);
    expect(source).toMatch(/A2LesenGuidedPanel/);
    expect(source).toMatch(/a2LesenModels/);
    expect(source).toMatch(/useAdminLearningLevel/);
    expect(source).toMatch(/LearningLevelSelector/);
  });

  it('calls all hooks before B1/B2 early returns', () => {
    const fnStart = source.indexOf('export function LesenScreen');
    expect(fnStart).toBeGreaterThan(-1);

    const body = source.slice(fnStart);
    const b2Return = body.search(/if\s*\(\s*level\s*===\s*['"]B2['"]\s*\)/);
    const b1Return = body.search(/if\s*\(\s*level\s*===\s*['"]B1['"]\s*\)/);

    expect(b2Return).toBeGreaterThan(-1);
    expect(b1Return).toBeGreaterThan(-1);

    const firstEarlyReturn = Math.min(b2Return, b1Return);
    const beforeReturns = body.slice(0, firstEarlyReturn);

    expect(beforeReturns).toMatch(/useState\s*\(/);
    expect(beforeReturns).toMatch(/useMemo\s*\(/);
    expect(beforeReturns).toMatch(/useEffect\s*\(/);

    const afterReturns = body.slice(firstEarlyReturn);
    expect(afterReturns).not.toMatch(/\n\s*const\s+\[[^\]]+\]\s*=\s*useState\s*\(/);
    expect(afterReturns).not.toMatch(/\n\s*const\s+\w+\s*=\s*useMemo\s*\(/);
    expect(afterReturns).not.toMatch(/\n\s*useEffect\s*\(/);
  });

  it('preserves B1 and B2 gating to dedicated screens', () => {
    expect(source).toMatch(/return\s*<B1LesenScreen/);
    expect(source).toMatch(/<B2LesenScreen/);
  });
});
