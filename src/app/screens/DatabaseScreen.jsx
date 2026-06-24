import React, { useEffect, useState } from 'react';
import { models } from '../../data/models';

import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';
export function DatabaseScreen({ setActiveTab, onOpenWriting }) {
  const [level, setLevel] = useState('B1');
  const [showPremiumHint, setShowPremiumHint] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [adminItems, setAdminItems] = useState([]);

useEffect(() => {
  const saved =
    JSON.parse(localStorage.getItem('austriaPathAdminData')) || [];
  setAdminItems(saved);

  const visits =
    Number(localStorage.getItem('databaseVisits') || 0) + 1;

  localStorage.setItem('databaseVisits', visits);

  if (visits >= 4) {
    setShowPremiumHint(true);
  }
}, []);

  const adminModels = adminItems
  .filter((item) => item.status === 'published')
  .map((item) => {
    const baseModel = {
  id: `admin-${item.id}`,
  title: item.title,
  level: item.level,
  stadt: item.city,
  bundesland: item.state,

  examType: item.examType,
  center: item.examCenter,
  examDate: item.examDate,
  imageUrl: item.imageUrl,

  confirmations: item.confirmations || 1,
  lastConfirmed: item.lastConfirmed,
      notes: item.content,
      source: 'admin',
      status: item.status || 'active',
      emails: [],
      planning: [],
      imageGroups: [],
      speaking: [],
      lesen: null,
      hoeren: null,
    };

    if (item.type === 'schreiben') {
      baseModel.emails = [
        {
          id: item.id,
          title: item.title,
          task: item.content,
          points: [],
        },
      ];
    }

    if (item.type === 'planung') {
      baseModel.planning = [
        {
          id: item.id,
          title: item.title,
          task: item.content,
          points: [],
        },
      ];
    }

    if (item.type === 'bildbeschreibung') {
      baseModel.imageGroups = [
        {
          id: item.id,
          title: item.title,
          category: item.content,
          images: [],
        },
      ];
    }

    if (item.type === 'sprechen') {
      baseModel.speaking = [
        {
          id: item.id,
          title: item.title,
        },
      ];
    }

    if (item.type === 'lesen') {
      baseModel.lesen = {
        title: item.title,
        parts: [item.content],
      };
    }

    if (item.type === 'hoeren') {
      baseModel.hoeren = {
        title: item.title,
        transcript: item.content,
      };
    }

    return baseModel;
  });
const language =
  localStorage.getItem('userLanguage') || 'Deutsch';

const premiumMessage =
  getSmartPremiumMessage(language, 'database');
  const examModels = [...models, ...adminModels]
    .filter((model) => model.level === level)
    .map((model) => ({
      ...model,
      calculatedStatus: getModelStatus(model),
      importanceScore: getImportanceScore(model),
    }))
    .filter((model) => showArchived || model.calculatedStatus !== 'archived')
    .sort((a, b) => b.importanceScore - a.importanceScore);

  return (
  <div style={containerStyle}>

    

    <button
      onClick={() => setActiveTab('home')}
      style={homeButtonStyle}
    >
      ← Zurück
    </button>

      <h2 style={titleStyle}>Prüfungsdatenbank</h2>

      <p style={subtitleStyle}>
        Häufige Prüfungsthemen nach Niveau, Bundesland und Stadt. Die Datenbank ist derzeit
        kuratiert und wird vom AustriaPath-Team geprüft.
      </p>

      <div style={noticeStyle}>
        🔒 Neue Erfahrungen können aktuell nicht direkt veröffentlicht werden.
        So vermeiden wir doppelte, falsche oder ungeprüfte Inhalte.
      </div>

      <div style={levelTabsStyle}>
        {['A2', 'B1', 'B2'].map((item) => (
          <button
            key={item}
            onClick={() => {
              setLevel(item);
              setSelectedModel(null);
              setSelectedEmail(null);
            }}
            style={{
              ...levelButtonStyle,
              backgroundColor: level === item ? '#2563eb' : '#ffffff',
              color: level === item ? '#ffffff' : '#2563eb',
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowArchived(!showArchived)}
        style={archiveToggleStyle}
      >
        {showArchived ? 'Archiv ausblenden' : 'Archiv anzeigen'}
      </button>

      {!selectedModel && (
        <>
          {examModels.length === 0 && (
            <div style={emptyStyle}>
              Noch keine geprüften Modelle für dieses Niveau.
            </div>
          )}

          {examModels.map((model) => (
            <div
              key={model.id}
              style={{
                ...cardStyle,
                opacity: model.calculatedStatus === 'archived' ? 0.55 : 1,
              }}
            >
              <div style={statusRowStyle}>
                <div>
                  <h3 style={cardTitleStyle}>{model.title}</h3>

                
                </div>

                <StatusBadge status={model.calculatedStatus} />
              </div>

              <p style={metaStyle}>
  🔥 {model.confirmations || 0} Bestätigung
  {model.confirmations > 1 ? 'en' : ''}
  {model.lastConfirmed ? ` · ${model.lastConfirmed}` : ''}
</p>

              

              <div style={quickTopicsStyle}>
                {model.emails?.[0]?.title && <p>📧 Schreiben: {model.emails[0].title}</p>}
                {model.planning?.[0]?.title && <p>🗓 Planung: {model.planning[0].title}</p>}
                {model.imageGroups?.[0]?.title && <p>🖼 Bild: {model.imageGroups[0].title}</p>}
                {model.speaking?.[0]?.title && <p>🎤 Sprechen: {model.speaking[0].title}</p>}
                {model.lesen?.title && <p>📖 Lesen: {model.lesen.title}</p>}
                {model.hoeren?.title && <p>🎧 Hören: {model.hoeren.title}</p>}
              </div>


              <button
                style={primaryButtonStyle}
                onClick={() => {
                  setSelectedModel(model);
                  setSelectedEmail(null);
                }}
              >
                Modell öffnen
              </button>
            </div>
          ))}
        </>
      )}

      {selectedModel && (
        <div>
          <button
            style={backButtonStyle}
            onClick={() => {
              setSelectedModel(null);
              setSelectedEmail(null);
            }}
          >
            ← Zurück zur Datenbank
          </button>

          <div style={cardStyle}>
            <div style={statusRowStyle}>
              <div>
                <h3 style={cardTitleStyle}>{selectedModel.title}</h3>

               
              </div>

              <StatusBadge status={selectedModel.calculatedStatus} />
            </div>

          <p style={metaStyle}>
  🔥 {selectedModel.confirmations || 0} Bestätigungen
  {selectedModel.lastConfirmed
    ? ` · ${selectedModel.lastConfirmed}`
    : ''}
</p>

            

            <SectionTitle title="✉️ Schreiben" />
            {selectedModel.emails?.length ? (
              selectedModel.emails.map((email) => (
                <button
                  key={email.id}
                  style={topicButtonStyle}
                  onClick={() => setSelectedEmail(email)}
                >
                  {email.title}
                </button>
              ))
            ) : (
              <div style={miniCardStyle}>Kein Schreibthema vorhanden.</div>
            )}

            {selectedEmail && (
              <div style={studyBoxStyle}>
                <h3>✉️ {selectedEmail.title}</h3>
                <p>{selectedEmail.task}</p>

                <ul>
                  {selectedEmail.points?.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>

                <button
                  style={premiumButtonStyle}
                  onClick={() => {
                    localStorage.setItem('selectedWritingTopic', JSON.stringify(selectedEmail));
                    if (onOpenWriting) onOpenWriting();
                  }}
                >
                  ✍️ Schreiben trainieren
                </button>

                <button
                  style={closeButtonStyle}
                  onClick={() => setSelectedEmail(null)}
                >
                  Schließen
                </button>
              </div>
            )}

            <SectionTitle title="🗓️ Planung" />
            {selectedModel.planning?.length ? (
              selectedModel.planning.map((item) => (
                <div key={item.id} style={miniCardStyle}>
                  <strong>{item.title}</strong>
                  <p>{item.task}</p>
                  {item.points?.length ? (
                    <ul>
                      {item.points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            ) : (
              <div style={miniCardStyle}>Kein Planungsthema vorhanden.</div>
            )}

            <SectionTitle title="🖼️ Bildbeschreibung" />
            {selectedModel.imageGroups?.length ? (
              selectedModel.imageGroups.map((group) => (
                <div key={group.id} style={miniCardStyle}>
                  <strong>{group.title}</strong>
                  {group.category && <p>Kategorie: {group.category}</p>}
                  {group.images?.map((image, index) => (
                    <p key={index}>{index + 1}. {image.title}</p>
                  ))}
                </div>
              ))
            ) : (
              <div style={miniCardStyle}>Kein Bildthema vorhanden.</div>
            )}

            <SectionTitle title="🎤 Sprechen" />
            <div style={miniCardStyle}>
              {selectedModel.speaking?.length ? (
                selectedModel.speaking.map((item, index) => (
                  <p key={index}>{item.title}</p>
                ))
              ) : (
                <p style={mutedTextStyle}>Kein Sprechen-Thema vorhanden.</p>
              )}
            </div>

            <SectionTitle title="📖 Lesen" />
            <div style={miniCardStyle}>
              <strong>{selectedModel.lesen?.title || 'Lesen-Thema folgt.'}</strong>
              {selectedModel.lesen?.parts?.length ? (
                <ul>
                  {selectedModel.lesen.parts.map((part, index) => (
                    <li key={index}>{part}</li>
                  ))}
                </ul>
              ) : (
                <p style={mutedTextStyle}>Lesen wird schrittweise ergänzt.</p>
              )}
            </div>

            <SectionTitle title="🎧 Hören" />
            <div style={miniCardStyle}>
              <strong>{selectedModel.hoeren?.title || 'Hören-Thema folgt.'}</strong>
              {selectedModel.hoeren?.transcript && (
                <p>{selectedModel.hoeren.transcript}</p>
              )}
              {!selectedModel.hoeren?.transcript && (
                <p style={mutedTextStyle}>Kostenlose Hören-Modelle werden ergänzt.</p>
              )}
            </div>

            {selectedModel.notes && (
              <>
                <SectionTitle title="📝 Notizen" />
                <div style={miniCardStyle}>{selectedModel.notes}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getModelStatus(model) {
  if (model.status === 'archived') return 'archived';

  const confirmations = model.confirmations || 0;

  if (!model.lastConfirmed) {
    return confirmations >= 5 ? 'hot' : 'active';
  }

  const today = new Date();
  const lastDate = new Date(model.lastConfirmed);
  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays > 365) return 'archived';
  if (confirmations >= 5 && diffDays <= 180) return 'hot';
  if (diffDays > 180) return 'old';

  return 'active';
}

function getImportanceScore(model) {
  const confirmations = model.confirmations || 0;

  if (!model.lastConfirmed) {
    return confirmations * 10;
  }

  const today = new Date();
  const lastDate = new Date(model.lastConfirmed);
  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  const freshnessPenalty = Math.floor(diffDays / 30);
  return confirmations * 10 - freshnessPenalty;
}

function StatusBadge({ status }) {
  const data = {
    hot: {
      text: '🔥 Häufig',
      style: { backgroundColor: '#fee2e2', color: '#991b1b' },
    },
    active: {
      text: '✅ Aktiv',
      style: { backgroundColor: '#dcfce7', color: '#166534' },
    },
    old: {
      text: '⏳ Alt',
      style: { backgroundColor: '#fef3c7', color: '#92400e' },
    },
    archived: {
      text: '📦 Archiv',
      style: { backgroundColor: '#e5e7eb', color: '#374151' },
    },
  };

  const current = data[status] || data.active;

  return (
    <span style={{ ...statusBadgeStyle, ...current.style }}>
      {current.text}
    </span>
  );
}

function Badge({ text }) {
  return <div style={badgeStyle}>{text}</div>;
}

function SectionTitle({ title }) {
  return <h4 style={sectionTitle}>{title}</h4>;
}

const containerStyle = {
  padding: '20px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '100px',
};

const homeButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '16px',
};

const titleStyle = {
  color: '#0f172a',
  fontSize: '26px',
  marginBottom: '8px',
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5',
};

const noticeStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  color: '#9a3412',
  borderRadius: '16px',
  padding: '14px',
  margin: '16px 0',
  lineHeight: '1.5',
  fontWeight: '600',
};

const levelTabsStyle = {
  display: 'flex',
  gap: '8px',
  marginBottom: '14px',
};

const levelButtonStyle = {
  padding: '10px 16px',
  borderRadius: '999px',
  border: '1px solid #dbeafe',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const archiveToggleStyle = {
  width: '100%',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#334155',
  padding: '11px',
  borderRadius: '14px',
  fontWeight: '700',
  cursor: 'pointer',
  marginBottom: '14px',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '18px',
  marginBottom: '16px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  border: '1px solid #e2e8f0',
};

const statusRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '10px',
  alignItems: 'flex-start',
};

const adminBadgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '5px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const cardTitleStyle = {
  marginTop: 0,
  color: '#0f172a',
};

const statusBadgeStyle = {
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '800',
  whiteSpace: 'nowrap',
};

const metaStyle = {
  color: '#64748b',
  lineHeight: '1.5',
};

const importanceBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '10px',
  color: '#334155',
  fontSize: '13px',
  fontWeight: '700',
  margin: '12px 0',
};

const quickTopicsStyle = {
  backgroundColor: '#f8fafc',
  borderRadius: '14px',
  padding: '12px',
  margin: '12px 0',
  color: '#334155',
  lineHeight: '1.4',
};

const badgeGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '8px',
  margin: '14px 0',
};

const badgeStyle = {
  backgroundColor: '#eff6ff',
  color: '#2563eb',
  padding: '8px 10px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 'bold',
  textAlign: 'center',
};

const miniCardStyle = {
  backgroundColor: '#f8fafc',
  borderRadius: '14px',
  padding: '14px',
  marginBottom: '10px',
  border: '1px solid #e2e8f0',
};

const studyBoxStyle = {
  backgroundColor: '#eff6ff',
  borderRadius: '18px',
  padding: '18px',
  marginBottom: '18px',
  border: '1px solid #bfdbfe',
};

const topicButtonStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #dbeafe',
  backgroundColor: '#ffffff',
  color: '#2563eb',
  fontWeight: 'bold',
  marginBottom: '8px',
  cursor: 'pointer',
};

const sectionTitle = {
  color: '#2563eb',
  marginBottom: '8px',
  marginTop: '18px',
};

const primaryButtonStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '8px',
};

const premiumButtonStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: 'none',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  fontWeight: 'bold',
  marginTop: '10px',
  cursor: 'pointer',
};

const closeButtonStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '14px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  marginTop: '8px',
  cursor: 'pointer',
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: 'transparent',
  color: '#2563eb',
  fontWeight: 'bold',
  marginBottom: '12px',
  cursor: 'pointer',
};

const emptyStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '20px',
  textAlign: 'center',
  color: '#64748b',
  border: '1px dashed #cbd5e1',
  marginBottom: '16px',
};

const mutedTextStyle = {
  color: '#64748b',
};