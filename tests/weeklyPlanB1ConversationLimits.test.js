/**
 * B1 interactive speaking — follow-up limits and transcript helpers.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  buildForcedClosingTurn,
  countAssistantTurns,
  isConversationMarkedComplete,
} from '../server/src/weekly-training-ai/core/conversationTranscript.js';
import { runB1InteractiveTurn } from '../server/src/weekly-training-ai/handlers/b1-interactive-turn.handler.js';
import * as openaiClient from '../server/src/weekly-training-ai/core/openaiClient.js';

describe('conversationTranscript helpers', () => {
  it('counts assistant turns and detects completion marker', () => {
    const transcript = [
      { role: 'learner', text: 'Hallo' },
      { role: 'assistant', text: 'Erzählen Sie mehr.' },
      { role: 'memory', kind: 'exercise_submission' },
    ];
    expect(countAssistantTurns(transcript)).toBe(1);
    expect(isConversationMarkedComplete(transcript)).toBe(false);

    const closed = buildForcedClosingTurn('selbstvorstellung', [{ id: 'identity', text: 'Name' }]);
    expect(closed.conversationComplete).toBe(true);
    expect(closed.transcriptEntry.conversationComplete).toBe(true);
    expect(isConversationMarkedComplete([closed.transcriptEntry])).toBe(true);
  });
});

describe('B1 coach language policy', () => {
  it('is included in every interactive coach system prompt', async () => {
    const { buildInteractiveSystemPrompt } = await import(
      '../server/src/weekly-training-ai/handlers/b1-interactive-turn.handler.js'
    );

    for (const category of ['bildbeschreibung', 'planung', 'selbstvorstellung']) {
      const prompt = buildInteractiveSystemPrompt(category);
      expect(prompt).toMatch(/weak-to-average B1 learners/i);
      expect(prompt).toMatch(/simple, natural, everyday German/i);
      expect(prompt).toMatch(/ONE clear question at a time/i);
      expect(prompt).toMatch(/not with harder vocabulary/i);
    }
  });
});

describe('runB1InteractiveTurn follow-up enforcement', () => {
  it('forces closing after two follow-ups for selbstvorstellung', async () => {
    const aiSpy = vi.spyOn(openaiClient, 'createB1WeeklyTrainingJsonCompletion');
    const session = {
      transcript: [
        { role: 'learner', text: 'Ich heiße Anna.' },
        { role: 'assistant', text: 'Was machen Sie beruflich?' },
        { role: 'learner', text: 'Ich arbeite in einem Büro.' },
        { role: 'assistant', text: 'Warum lernen Sie Deutsch?' },
      ],
      coveredPoints: [{ id: 'identity', text: 'Name' }],
    };

    const result = await runB1InteractiveTurn({
      category: 'selbstvorstellung',
      modelSnapshot: {
        semanticTopics: [{ id: 'identity', label: 'Persönliche Angaben' }],
      },
      session,
      learnerMessage: 'Weil ich in Österreich leben möchte.',
      followUpQuestionsAsked: 2,
    });

    expect(aiSpy).not.toHaveBeenCalled();
    expect(result.conversationComplete).toBe(true);
    expect(result.assistantMessage).toMatch(/reicht/i);
  });

  it('requires at least one follow-up for selbstvorstellung after first introduction', async () => {
    vi.spyOn(openaiClient, 'createB1WeeklyTrainingJsonCompletion').mockResolvedValue({
      assistantMessage: 'Danke, das reicht für heute.',
      coveredPoints: [{ id: 'identity', text: 'Name' }],
      missingPoints: [],
      allRequiredCovered: true,
      conversationComplete: true,
    });

    const result = await runB1InteractiveTurn({
      category: 'selbstvorstellung',
      modelSnapshot: {
        followUpQuestions: ['Was machen Sie beruflich?'],
        semanticTopics: [{ id: 'identity', label: 'Persönliche Angaben' }],
      },
      session: { transcript: [], coveredPoints: [] },
      learnerMessage: 'Ich heiße Anna und komme aus Syrien.',
      followUpQuestionsAsked: 0,
    });

    expect(result.conversationComplete).toBe(false);
    expect(result.assistantMessage).toMatch(/beruflich|Alltag/i);
    expect(result.transcriptEntry.mandatoryFollowUp).toBe(true);
  });

  it('requires at least one follow-up for bildbeschreibung after first description', async () => {
    vi.spyOn(openaiClient, 'createB1WeeklyTrainingJsonCompletion').mockResolvedValue({
      assistantMessage: 'Vielen Dank, das war sehr gut.',
      coveredPoints: [{ id: 'point-1', text: 'Person' }],
      missingPoints: [],
      allRequiredCovered: true,
      conversationComplete: true,
    });

    const result = await runB1InteractiveTurn({
      category: 'bildbeschreibung',
      modelSnapshot: {
        followUpQuestionPool: {
          opinion: ['Wie wirkt die Situation auf Sie?'],
        },
      },
      session: { transcript: [], coveredPoints: [] },
      learnerMessage: 'Auf dem Bild sehe ich einen Mechaniker.',
      followUpQuestionsAsked: 0,
    });

    expect(result.conversationComplete).toBe(false);
    expect(result.assistantMessage).toMatch(/Situation|Ähnliches|Beruf|arbeiten/i);
    expect(result.transcriptEntry.mandatoryFollowUp).toBe(true);
  });
});

describe('daily report v3 validation', () => {
  it('requires overall fields', async () => {
    const { validateDailyReportResponse } = await import(
      '../server/src/weekly-training-ai/handlers/b1-daily-report.handler.js'
    );

    const invalid = validateDailyReportResponse({
      summary: 'ok',
      exercises: [{ category: 'schreiben', title: 'E-Mail', originalText: 'x' }],
    });
    expect(invalid.ok).toBe(false);

    const valid = validateDailyReportResponse({
      summary: 'Guter Tag',
      overallPerformance: 'Solide B1-Leistung',
      strongestSkill: 'Schreiben',
      weakestSkill: 'Sprechen',
      tomorrowPriorities: ['a', 'b', 'c'],
      repeatedGrammarPatterns: {
        items: ['Artikel', 'Präpositionen'],
        encouragement:
          'Konzentrieren Sie sich im nächsten Training besonders auf diese wiederholten Grammatikmuster.',
      },
      exercises: [
        {
          category: 'selbstvorstellung',
          title: 'Selbst',
          originalText: 'Ich heiße Max.',
          correctedText: 'Ich heiße Max.',
          coveredPoints: [],
          missingPoints: [],
          feedback: 'Gut strukturiert.',
          cefrPerformance: 'B1',
        },
      ],
    });
    expect(valid.ok).toBe(true);
  });

  it('validates repeated grammar patterns section', async () => {
    const { validateDailyReportResponse } = await import(
      '../server/src/weekly-training-ai/handlers/b1-daily-report.handler.js'
    );
    const {
      normalizeRepeatedGrammarPatterns,
      validateRepeatedGrammarPatterns,
      buildDefaultRepeatedGrammarPatterns,
    } = await import('../server/src/weekly-training-ai/core/repeatedGrammarPatterns.js');

    const invalid = validateDailyReportResponse({
      summary: 'Guter Tag',
      overallPerformance: 'Solide B1-Leistung',
      strongestSkill: 'Schreiben',
      weakestSkill: 'Sprechen',
      tomorrowPriorities: ['a', 'b', 'c'],
      repeatedGrammarPatterns: { items: ['Artikel'], encouragement: '' },
      exercises: [
        {
          category: 'schreiben',
          title: 'E-Mail',
          originalText: 'x',
          correctedText: 'x',
          coveredPoints: [],
          missingPoints: [],
          feedback: 'ok',
          cefrPerformance: 'B1',
        },
      ],
    });
    expect(invalid.ok).toBe(false);

    const normalized = normalizeRepeatedGrammarPatterns({
      items: ['Artikel', 'Artikel', 'Präpositionen', 'Dativ', 'Genitiv'],
      encouragement: 'Weiter üben.',
    });
    expect(normalized.items).toEqual(['Artikel', 'Präpositionen', 'Dativ']);

    expect(validateRepeatedGrammarPatterns(normalized).ok).toBe(true);
    expect(buildDefaultRepeatedGrammarPatterns().items).toEqual([]);
    expect(buildDefaultRepeatedGrammarPatterns().encouragement).toMatch(/nächsten Training/i);
  });

  it('builds deterministic fallback when AI generation fails', async () => {
    const openaiClient = await import('../server/src/weekly-training-ai/core/openaiClient.js');
    const { runB1DailyReportGeneration, resetB1DailyReportCache } = await import(
      '../server/src/weekly-training-ai/handlers/b1-daily-report.handler.js'
    );

    resetB1DailyReportCache();
    vi.spyOn(openaiClient, 'createB1WeeklyTrainingJsonCompletion').mockRejectedValue(
      new Error('upstream unavailable')
    );

    const report = await runB1DailyReportGeneration({
      userId: 'user-1',
      planIndex: 1,
      planHash: 'fallback-plan',
      trainingMemories: [
        { category: 'schreiben', originalEmail: 'Hallo Frau Korma,' },
        { category: 'selbstvorstellung', transcript: 'Ich heiße Anna.' },
      ],
      idempotencyKey: 'fallback-test',
    });

    expect(report.source).toBe('deterministic_fallback');
    expect(report.summary).toBeTruthy();
    expect(report.exercises).toHaveLength(2);
    expect(report.repeatedGrammarPatterns?.encouragement).toMatch(/nächsten Training/i);
  });
});
