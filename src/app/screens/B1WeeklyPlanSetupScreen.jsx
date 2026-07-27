import React, { useEffect, useMemo, useState } from 'react';
import { mapFocusListForWeeklyPlan } from '../../data/utils/placementReport.js';
import {
  B1_SELECTION_COUNT_PER_CATEGORY,
  getB1WeeklyPlanSelectableCatalog,
  b1WeeklyPlanHoerenSelectionBlocked,
} from '../../data/weekly-plan/b1/index.js';
import {
  createEmptyB1SetupDraft,
  getB1CategoryBlocker,
  getB1CategorySelectionCount,
  getB1SetupSelectionSummary,
  isB1SetupSelectionComplete,
  loadB1SetupDraft,
  saveB1SetupDraft,
  toggleB1ModelSelection,
} from '../../data/utils/b1WeeklyPlanSetupState.js';
import {
  recordWeeklyPlanAnalyticsEvent,
  WeeklyPlanAnalyticsEvents,
} from '../../data/utils/weeklyPlanAnalytics.js';
import { isCoachV1Plan, loadWeeklyPlan } from '../../data/utils/weeklyPlanCoachState.js';
import {
  weeklyBackButtonStyle,
  weeklyCardStyle,
  weeklyHeroStyle,
  weeklyMutedStyle,
  weeklyPageStyle,
  weeklyPrimaryButtonStyle,
  weeklySectionTitleStyle,
} from './weeklyPlan/weeklyPlanStyles.js';
import { AdminQaBadge } from './weeklyPlan/AdminQaBadge.jsx';
import {
  B1SelbstvorstellungInfoPanel,
  B1WeeklyPlanCategoryAccordion,
} from './weeklyPlan/B1WeeklyPlanCategoryAccordion.jsx';

const SELECTABLE_CATEGORIES = ['schreiben', 'hoeren', 'bildbeschreibung', 'planung'];

const B1_CATEGORY_UI = Object.freeze({
  selbstvorstellung: { icon: '🧑', title: 'Selbstvorstellung', defaultExpanded: true },
  schreiben: { icon: '✉️', title: 'Schreiben', defaultExpanded: false },
  hoeren: { icon: '🎧', title: 'Hören', defaultExpanded: false },
  bildbeschreibung: { icon: '🖼️', title: 'Bildbeschreibung', defaultExpanded: false },
  planung: { icon: '🤝', title: 'Planung', defaultExpanded: false },
});

const CATEGORY_ORDER = [
  'selbstvorstellung',
  'schreiben',
  'hoeren',
  'bildbeschreibung',
  'planung',
];

function buildDefaultExpandedState() {
  return CATEGORY_ORDER.reduce((acc, key) => {
    acc[key] = B1_CATEGORY_UI[key].defaultExpanded;
    return acc;
  }, {});
}

export default function B1WeeklyPlanSetupScreen({ setActiveTab }) {
  const placementProfile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('austriaPathPlacementProfile'));
    } catch {
      return null;
    }
  }, []);

  const existingPlan = useMemo(() => loadWeeklyPlan(), []);
  const hasActivePlan = isCoachV1Plan(existingPlan);

  const placementLevel = placementProfile?.level || null;
  const placementFocus = useMemo(
    () =>
      mapFocusListForWeeklyPlan(
        placementProfile?.recommendedFocus || placementProfile?.focusAreas || []
      ),
    [placementProfile]
  );

  const [draft, setDraft] = useState(() => {
    const saved = loadB1SetupDraft();
    if (saved) return saved;
    return createEmptyB1SetupDraft({ placementLevel, placementFocus });
  });

  const [expanded, setExpanded] = useState(buildDefaultExpandedState);

  useEffect(() => {
    recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B1_SETUP_STARTED, {
      placementLevel,
      selectedTrainingLevel: 'B1',
    });
  }, [placementLevel]);

  useEffect(() => {
    saveB1SetupDraft(draft);
  }, [draft]);

  const summary = useMemo(() => getB1SetupSelectionSummary(draft), [draft]);
  const selectionComplete = isB1SetupSelectionComplete(draft);

  const toggleExpanded = (category) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleModel = (category, modelId) => {
    setDraft((prev) => ({
      ...prev,
      [category]: toggleB1ModelSelection(category, prev[category] || [], modelId),
    }));
  };

  const handleContinueToPreview = () => {
    if (!selectionComplete) return;
    SELECTABLE_CATEGORIES.forEach((category) => {
      recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B1_CATEGORY_SELECTION_COMPLETED, {
        category,
        selectedCount: getB1CategorySelectionCount(draft, category),
        selectedTrainingLevel: 'B1',
      });
    });
    setDraft((prev) => ({ ...prev, step: 'preview' }));
    saveB1SetupDraft({ ...draft, step: 'preview' });
    recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B1_PLAN_PREVIEW_OPENED, {
      selectedTrainingLevel: 'B1',
      placementLevel,
    });
    setActiveTab('b1WeeklyPlanPreview');
  };

  const renderSelectableCategory = (category) => {
    const ui = B1_CATEGORY_UI[category];
    const blocker = getB1CategoryBlocker(category);
    const catalog = getB1WeeklyPlanSelectableCatalog(category);
    const selected = draft[category] || [];
    const count = selected.length;
    const counterLabel = `${count} / ${B1_SELECTION_COUNT_PER_CATEGORY}`;

    return (
      <B1WeeklyPlanCategoryAccordion
        key={category}
        icon={ui.icon}
        title={ui.title}
        counterLabel={counterLabel}
        expanded={expanded[category]}
        onToggle={() => toggleExpanded(category)}
      >
        {blocker && (
          <p style={{ color: '#b45309', fontWeight: 700, lineHeight: 1.5, marginTop: 0 }}>
            ⚠️ {blocker}
          </p>
        )}
        {category === 'hoeren' && b1WeeklyPlanHoerenSelectionBlocked && (
          <p style={weeklyMutedStyle}>
            Blocker: Hören kann erst bestätigt werden, wenn mindestens 7 genehmigte Modelle
            vorliegen. Aktuell: {catalog.length} genehmigt.
          </p>
        )}
        <div style={{ display: 'grid', gap: '10px' }}>
          {catalog.map((model) => {
            const active = selected.includes(model.id);
            return (
              <button
                key={model.id}
                type="button"
                disabled={Boolean(blocker)}
                onClick={() => toggleModel(category, model.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: active ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: active ? '#eff6ff' : '#ffffff',
                  cursor: blocker ? 'not-allowed' : 'pointer',
                  opacity: blocker ? 0.6 : 1,
                }}
              >
                <div style={{ fontWeight: 800 }}>{active ? '✓ ' : ''}{model.title}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {model.shortDescription || model.description}
                </div>
              </button>
            );
          })}
        </div>
      </B1WeeklyPlanCategoryAccordion>
    );
  };

  return (
    <div style={weeklyPageStyle}>
      <AdminQaBadge />
      <button
        type="button"
        style={weeklyBackButtonStyle}
        onClick={() => {
          recordWeeklyPlanAnalyticsEvent(WeeklyPlanAnalyticsEvents.B1_SETUP_ABANDONED, {
            step: 'selection',
            selectedTrainingLevel: 'B1',
          });
          setActiveTab('weeklyPlanSetup');
        }}
      >
        ← Zurück zur Niveauauswahl
      </button>

      {hasActivePlan && (
        <div style={{ ...weeklyCardStyle, backgroundColor: '#fff7ed' }}>
          <p style={weeklyMutedStyle}>
            Ein aktiver Wochenplan existiert. Diese Auswahl ändert ihn erst nach der Bestätigung in
            der Vorschau.
          </p>
        </div>
      )}

      <div style={weeklyHeroStyle}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>B1 Wochenplan — Modelle wählen</h1>
        <p style={{ margin: '10px 0 0', lineHeight: 1.6 }}>
          Wähle je Kategorie genau sieben Prüfungsmodelle. Selbstvorstellung wird automatisch an Tag
          1, 4 und 7 eingeplant.
        </p>
      </div>

      <B1WeeklyPlanCategoryAccordion
        icon={B1_CATEGORY_UI.selbstvorstellung.icon}
        title={B1_CATEGORY_UI.selbstvorstellung.title}
        counterLabel="Pflicht"
        expanded={expanded.selbstvorstellung}
        onToggle={() => toggleExpanded('selbstvorstellung')}
      >
        <B1SelbstvorstellungInfoPanel />
      </B1WeeklyPlanCategoryAccordion>

      {SELECTABLE_CATEGORIES.map((category) => renderSelectableCategory(category))}

      <div style={weeklyCardStyle}>
        <h2 style={weeklySectionTitleStyle}>Auswahl-Status</h2>
        <ul style={{ lineHeight: 1.8, margin: 0, paddingLeft: '18px' }}>
          <li>
            {B1_CATEGORY_UI.selbstvorstellung.icon} Selbstvorstellung: Pflicht (3× pro Woche)
          </li>
          {SELECTABLE_CATEGORIES.map((category) => (
            <li key={category}>
              {B1_CATEGORY_UI[category].icon} {B1_CATEGORY_UI[category].title}:{' '}
              {summary[category]?.selected || 0} / {B1_SELECTION_COUNT_PER_CATEGORY}
              {summary[category]?.blocker ? ' — blockiert' : ''}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        style={{
          ...weeklyPrimaryButtonStyle,
          opacity: selectionComplete ? 1 : 0.5,
          cursor: selectionComplete ? 'pointer' : 'not-allowed',
        }}
        disabled={!selectionComplete}
        onClick={handleContinueToPreview}
      >
        Vorschau anzeigen
      </button>
    </div>
  );
}
