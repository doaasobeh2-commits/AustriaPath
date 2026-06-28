import React, { useEffect, useMemo, useState } from 'react';
import { a2Images } from '../../data/a2Images';
import { b1Images } from '../../data/b1Images';
import { b2Images } from '../../data/b2Images';
import { getSmartPremiumMessage } from '../../data/smartPremiumMessages';
import { b2Grafiken } from '../../data/b2Grafiken';
import { isPremiumUser, trackSectionVisit } from '../../data/utils/premiumHint';


const imageModels = {
  A2: a2Images,
  B1: b1Images,
 B2: [...b2Images, ...b2Grafiken]
};
const splitLines = (value) => {
  if (!value) return [];
  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeStatus = (value) => String(value || '').toLowerCase();
const normalizeBereich = (value) => String(value || '').toLowerCase();


function getAdminImageModels() {
  try {
    const saved = localStorage.getItem('austriaPathAdminData');
    if (!saved) return [];

    const data = JSON.parse(saved);
    const list = Array.isArray(data) ? data : data.items || data.models || [];

    return list
      .filter((item) => {
        const bereich = normalizeBereich(item.bereich || item.area || item.type);
        const status = normalizeStatus(item.status);

        return (
          (bereich === 'bildbeschreibung' ||
            bereich === 'bild' ||
            bereich === 'image' ||
            bereich === 'images') &&
          status === 'published'
        );
      })
      .map((item) => ({
        title: item.title || 'Bildbeschreibung aus Admin',
        level: item.level || item.niveau || 'A2',
        imageUrl:
          item.imageUrl ||
          item.imageURL ||
          item.bildUrl ||
          item.bildURL ||
          item.image ||
          '',
        imageText: item.imageText || item.bildText || item.title || '🖼️ Bild aus Admin',
        description: item.description || item.content || item.text || item.notes || '',
        impression: item.impression || item.opinion || item.eindruck || '',
        opinion: item.opinion || item.impression || item.eindruck || '',
        experience: item.experience || item.erfahrung || '',
        words: Array.isArray(item.words)
          ? item.words
          : splitLines(item.words || item.vocabulary),
        verbs: Array.isArray(item.verbs) ? item.verbs : splitLines(item.verbs),
        sentences: Array.isArray(item.sentences)
          ? item.sentences
          : splitLines(item.sentences || item.satzbau || item.grammar),
        mistakes: Array.isArray(item.mistakes)
          ? item.mistakes
          : splitLines(item.mistakes),
        shortText: item.shortText || item.description || item.content || '',
        fromAdmin: true
      }));
  } catch (error) {
    console.error('Fehler beim Laden der Admin-Bildbeschreibung:', error);
    return [];
  }
}

export function ImageTrainingScreen({
  setActiveTab,
  userLevel = localStorage.getItem('userLevel') || 'A2'
}) {
  const level = userLevel;
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPremiumHint, setShowPremiumHint] = useState(false);

  const adminImages = useMemo(() => getAdminImageModels(), []);

  const modelsByLevel = useMemo(() => {
    const result = {
      A2: [...(imageModels.A2 || [])],
      B1: [...(imageModels.B1 || [])],
      B2: [...(imageModels.B2 || [])]
    };

    adminImages.forEach((item) => {
      const itemLevel = item.level || item.niveau || 'A2';
      if (!result[itemLevel]) result[itemLevel] = [];
      result[itemLevel].push(item);
    });

    return result;
  }, [adminImages]);

  const models = modelsByLevel[level] || [];

  const language =
    localStorage.getItem('austriaPathLanguage') ||
    localStorage.getItem('userLanguage') ||
    'Deutsch';

  const premiumMessage = getSmartPremiumMessage(language, 'bild');

useEffect(() => {
  if (!models.length) return;

  if (isPremiumUser()) {
    setShowPremiumHint(false);
    return;
  }

  const timer = setTimeout(() => {
    if (trackSectionVisit('bild')) {
      setShowPremiumHint(true);
    }
  }, 300);

  return () => clearTimeout(timer);
}, []);
  const openImage = (item) => {
    setSelectedImage(item);
  };

  if (selectedImage) {
    return (
      <div style={pageStyle}>
        <div style={topActionsStyle}>
          <button style={backButton} onClick={() => setSelectedImage(null)}>
            ← Zurück
          </button>

          <button style={homeButton} onClick={() => setActiveTab('home')}>
            🏠 Home
          </button>
        </div>

        <h2 style={titleStyle}>{selectedImage.title}</h2>

        {selectedImage.fromAdmin && (
          <span style={adminBadgeStyle}>Aus Admin</span>
        )}

        <div style={imageBox}>
     {(() => {
  const level = (selectedImage.level || 'B1').toLowerCase();
  const autoImage = `/images/${level}/${level}-${String(selectedImage.id).padStart(2, '0')}.jpeg`;
  const imageSrc = selectedImage.imageUrl || selectedImage.image || autoImage;

  return imageSrc ? (
    <img
      src={imageSrc}
      alt={selectedImage.title}
      style={realImageStyle}
    />
  ) : (
    selectedImage.imageText || selectedImage.title
  );
})()}
        </div>

        <Card title="📷 Beschreibung">
          {Array.isArray(selectedImage.description) ? (
            selectedImage.description.map((line, i) => <p key={i}>{line}</p>)
          ) : (
            <p style={{ whiteSpace: 'pre-line' }}>
              {selectedImage.description}
            </p>
          )}
        </Card>
{selectedImage.analysis && (
  <Card title="📊 Analyse">
    <p style={{ whiteSpace: 'pre-line' }}>{selectedImage.analysis}</p>
  </Card>
)}

{selectedImage.interpretation && (
  <Card title="🔍 Interpretation">
    <p style={{ whiteSpace: 'pre-line' }}>{selectedImage.interpretation}</p>
  </Card>
)}
        <Card
          title={
            level === 'A2'
              ? '💬 Persönliche Meinung'
              : '💬 Eigene Stellungnahme'
          }
        >
       {Array.isArray(
  selectedImage.personalOpinion ||
  selectedImage.opinion ||
  selectedImage.impression
) ? (
  (
    selectedImage.personalOpinion ||
    selectedImage.opinion ||
    selectedImage.impression
  ).map((line, i) => (
    <p key={i}>{line}</p>
  ))
) : (
  <p style={{ whiteSpace: 'pre-line' }}>
    {
      selectedImage.personalOpinion ||
      selectedImage.opinion ||
      selectedImage.impression
    }
  </p>
)}
        </Card>

        {level !== 'A2' && selectedImage.homeland && (
          <Card title="🌍 Situation in meiner Heimat">
            <p style={{ whiteSpace: 'pre-line' }}>{selectedImage.homeland}</p>
          </Card>
        )}

        <Card title="📌 Wichtige Wörter">
          <List items={selectedImage.words} />
        </Card>

        <Card title="💪 Wichtige Verben">
          <List items={selectedImage.verbs} />
        </Card>

        <Card title="🗣️ Nützliche Sätze">
          <List items={selectedImage.sentences || selectedImage.grammar} />
        </Card>
{selectedImage.possibleSolutions && selectedImage.possibleSolutions.length > 0 && (
  <Card title="💡 Mögliche Lösungen">
    <List items={selectedImage.possibleSolutions} />
  </Card>
)}

{selectedImage.examinerQuestions && selectedImage.examinerQuestions.length > 0 && (
  <Card title="❓ Prüferfragen">
    <List items={selectedImage.examinerQuestions} />
  </Card>
)}
        {selectedImage.mistakes && selectedImage.mistakes.length > 0 && (
          <Card title="⚠️ Häufige Fehler">
            <List items={selectedImage.mistakes} />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={topActionsStyle}>
        <button style={homeButton} onClick={() => setActiveTab('home')}>
          🏠 Home
        </button>
      </div>

      <h1 style={titleStyle}>
        {level === 'B2'
          ? '🖼️ B2 Bild- und Grafikbeschreibung'
          : '🖼️ Bildbeschreibung Trainer'}
      </h1>

      <p style={subtitleStyle}>
        {level === 'B2'
          ? 'Wähle ein B2-Thema und trainiere Beschreibung, Interpretation und eigene Meinung.'
          : 'Wähle ein Bild und lerne einfache Sätze für die Beschreibung.'}
      </p>

      <select style={inputStyle} value={level} disabled>
        <option value={level}>{level}</option>
      </select>

      {showPremiumHint && (
        <div style={premiumHintStyle}>
          <div style={{ fontSize: '30px' }}>{premiumMessage.icon}</div>

          <h3 style={{ margin: '8px 0', color: '#0f172a' }}>
            {premiumMessage.title}
          </h3>

          <p style={{ color: '#475569', lineHeight: 1.6 }}>
            {premiumMessage.text}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('premium')}
              style={premiumButtonStyle}
            >
              {premiumMessage.button}
            </button>

            <button
              onClick={() => {
                setShowPremiumHint(false);
              }}
              style={laterButtonStyle}
            >
              {premiumMessage.later}
            </button>
          </div>
        </div>
      )}

      <div style={infoBox}>
        {level === 'B2'
          ? 'Hier lernst du B2-Bilder und später auch Grafiken professionell zu analysieren.'
          : 'Hier lernst du Bilder Schritt für Schritt zu beschreiben.'}
      </div>

      {models.map((item, i) => (
        <div key={i} style={listCard} onClick={() => openImage(item)}>
          <div style={thumbBox}>
            {(item.imageUrl || item.image) ? (
              <img
                src={item.imageUrl || item.image}
                alt={item.title}
                style={thumbImageStyle}
              />
            ) : (
              item.imageText || '🖼️'
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={rowTitle}>
              <span style={numberCircle}>{i + 1}</span>
              {item.title}
              {item.fromAdmin && (
                <span style={smallAdminBadgeStyle}>Admin</span>
              )}
            </div>

            <p style={rowText}>
              {item.shortText ||
                (Array.isArray(item.description)
                  ? item.description[0]
                  : item.description)}
            </p>
          </div>

          <div style={arrow}>›</div>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={boxStyle}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function List({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <ul style={{ margin: 0, paddingLeft: '20px' }}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

const pageStyle = {
  padding: '22px',
  fontFamily: 'system-ui, sans-serif',
  paddingBottom: '90px',
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  boxSizing: 'border-box'
};

const topActionsStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '16px'
};

const titleStyle = {
  color: '#0f172a',
  marginBottom: '8px'
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: '1.5'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid #cbd5e1',
  marginBottom: '12px',
  fontSize: '15px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff'
};

const infoBox = {
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  borderRadius: '14px',
  padding: '14px',
  marginBottom: '14px',
  fontSize: '14px',
  lineHeight: '1.5'
};

const listCard = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '10px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer'
};

const thumbBox = {
  width: '82px',
  height: '62px',
  borderRadius: '12px',
  backgroundColor: '#dbeafe',
  color: '#2563eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '13px',
  padding: '6px',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const thumbImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '10px'
};

const realImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '18px'
};

const numberCircle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  borderRadius: '999px',
  width: '24px',
  height: '24px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  marginRight: '8px'
};

const rowTitle = {
  fontWeight: '700',
  color: '#0f172a'
};

const rowText = {
  color: '#64748b',
  margin: '6px 0 0',
  fontSize: '14px',
  lineHeight: '1.4'
};

const arrow = {
  fontSize: '28px',
  color: '#94a3b8'
};

const imageBox = {
  height: '190px',
  borderRadius: '18px',
  backgroundColor: '#dbeafe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#2563eb',
  fontWeight: 'bold',
  marginBottom: '14px',
  textAlign: 'center',
  padding: '12px',
  fontSize: '22px',
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const boxStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #e2e8f0',
  lineHeight: '1.6'
};

const backButton = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer'
};

const homeButton = {
  border: 'none',
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer'
};

const adminBadgeStyle = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: '999px',
  backgroundColor: '#dcfce7',
  color: '#166534',
  fontWeight: 'bold',
  marginBottom: '10px'
};

const smallAdminBadgeStyle = {
  display: 'inline-block',
  marginLeft: '8px',
  padding: '3px 8px',
  borderRadius: '999px',
  backgroundColor: '#dcfce7',
  color: '#166534',
  fontSize: '12px',
  fontWeight: '700'
};

const premiumHintStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '18px',
  padding: '16px',
  marginBottom: '14px',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)'
};

const premiumButtonStyle = {
  backgroundColor: '#f97316',
  color: '#ffffff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '700',
  cursor: 'pointer'
};

const laterButtonStyle = {
  backgroundColor: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer'
};