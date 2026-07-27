import { B1_WEEKLY_PLAN_ID_PREFIX, B1_WEEKLY_PLAN_MODEL_VERSION } from './metadata.js';

/** @type {import('./metadata.js').B1WeeklyPlanModelBase & {
 *   required: true;
 *   semanticTopics: Array<{ id: string, label: string, description: string }>;
 *   coverageDefinitions: Record<string, string[]>;
 *   followUpQuestions: string[];
 *   maxFollowUpQuestions: number;
 *   futureReportSchema: { version: string; fields: string[] };
 * }} */
export const b1WeeklyPlanSelbstvorstellungModel = {
  id: `${B1_WEEKLY_PLAN_ID_PREFIX}-selbst-001`,
  modelVersion: B1_WEEKLY_PLAN_MODEL_VERSION,
  level: 'B1',
  title: 'Selbstvorstellung B1',
  description:
    'Pflichtübung: Stellen Sie sich vor und beantworten Sie bis zu zwei Nachfragen zu Arbeit, Alltag und Zielen.',
  required: true,
  source: {
    file: 'src/data/weeklyPlanLibrary.js',
    sourceId: 'selfIntroductionTasks.B1',
    note: 'Expanded for dedicated B1 Weekly Plan examiner semantics',
  },
  semanticTopics: [
    { id: 'identity', label: 'Persönliche Angaben', description: 'Name, Herkunft, Wohnsituation' },
    { id: 'work', label: 'Beruf und Arbeit', description: 'Aktuelle Tätigkeit, Berufswunsch, Erfahrung' },
    { id: 'daily_life', label: 'Alltag', description: 'Tagesablauf, Familie, Freizeit' },
    { id: 'german_learning', label: 'Deutschlernen', description: 'Motivation und Lernziele' },
    { id: 'future_goals', label: 'Zukunft in Österreich', description: 'Pläne, Ziele, Integration' },
  ],
  coverageDefinitions: {
    identity: ['name', 'herkunft', 'wohnen', 'alter', 'familie'],
    work: ['beruf', 'arbeit', 'ausbildung', 'kollegen', 'firma'],
    daily_life: ['alltag', 'morgen', 'abend', 'wochenende', 'hobby'],
    german_learning: ['deutsch lernen', 'kurs', 'prüfung', 'motivation'],
    future_goals: ['zukunft', 'ziel', 'österreich', 'plan', 'träumen'],
  },
  followUpQuestions: [
    'Warum lernen Sie Deutsch?',
    'Welche Pläne haben Sie für die Zukunft?',
    'Beschreiben Sie Ihren Alltag.',
    'Was machen Sie beruflich?',
    'Welche Ziele haben Sie in Österreich?',
    'Was möchten Sie in Zukunft erreichen?',
    'Erzählen Sie etwas über Ihre Familie.',
    'Was machen Sie in Ihrer Freizeit?',
  ],
  maxFollowUpQuestions: 2,
  futureReportSchema: {
    version: 'b1-selbst-report-v1',
    fields: [
      'originalTranscript',
      'correctedVersion',
      'coveredTopics',
      'missingTopics',
      'languageFeedback',
      'practiceAdvice',
      'followUpTranscripts',
    ],
  },
};

export const b1WeeklyPlanSelbstvorstellungCatalog = Object.freeze([b1WeeklyPlanSelbstvorstellungModel]);
