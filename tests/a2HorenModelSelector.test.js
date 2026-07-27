/**
 * Free A2 Hören Trainer — model selector UI contract.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { a2HorenModels } from '../src/data/a2HorenCatalog.js';

const ROOT = process.cwd();

function readSrc(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('A2 Hören model selector', () => {
  it('lists every catalog model in the dropdown', () => {
    const screen = readSrc('src/app/screens/HorenScreen.jsx');
    expect(screen).toMatch(/Hörmodell auswählen/);
    expect(screen).toMatch(/a2HorenModels\.map/);
    expect(screen).toMatch(/Modell \{modelIndex \+ 1\} — \{item\.title\}/);
    expect(a2HorenModels.length).toBeGreaterThan(0);
  });

  it('defaults to the first catalog model', () => {
    const screen = readSrc('src/app/screens/HorenScreen.jsx');
    expect(screen).toMatch(/a2HorenModels\[0\]\?\.model_id/);
  });

  it('renders only the selected model panel', () => {
    const screen = readSrc('src/app/screens/HorenScreen.jsx');
    expect(screen).toMatch(/key=\{selectedModelId\}/);
    expect(screen).toMatch(/<A2HorenGuidedPanel/);
    expect(screen).not.toMatch(/<A2HorenGuidedPanel[\s\S]*<A2HorenGuidedPanel/);
  });

  it('persists per-model session state when switching', () => {
    const screen = readSrc('src/app/screens/HorenScreen.jsx');
    const panel = readSrc('src/app/screens/horen/A2HorenGuidedPanel.jsx');
    expect(screen).toMatch(/modelSessions/);
    expect(screen).toMatch(/persistedState=\{modelSessions\[selectedModelId\]\}/);
    expect(screen).toMatch(/onPersistState=/);
    expect(panel).toMatch(/persistedState/);
    expect(panel).toMatch(/onPersistState/);
  });
});
