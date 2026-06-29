import React from 'react';

export function B2ModelScreen({ model, setActiveTab }) {
  if (!model) {
    return (
      <div style={pageStyle}>
        <button onClick={() => setActiveTab('practice')} style={backButtonStyle}>
          ← Zurück
        </button>
        <h2>Kein B2 Modell ausgewählt.</h2>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('practice')} style={backButtonStyle}>
        ← Zurück
      </button>

      <div style={headerCardStyle}>
        <p style={badgeStyle}>B2 Modell {model.id}</p>
        <h1 style={titleStyle}>{model.title}</h1>
        <p style={subtitleStyle}>
          Themenübersicht: Schreiben, Lesen, Hören, Diskussion, Planung und Sprachbausteine.
        </p>
      </div>

      <TopicCard icon="✍️" title="Schreiben A" text={model.schreibenA} />
      <TopicCard icon="✍️" title="Schreiben B" text={model.schreibenB} />
      <TopicCard icon="🧩" title="Sprachbausteine" text={model.sprachbausteine} />

      <TopicList
        icon="📚"
        title="Wichtige Wörter für dieses Modell"
        items={model.words}
      />

      <div style={academyNoteStyle}>
        <h3 style={academyTitleStyle}>🎓 Hinweis für Akademie B2</h3>
        <p style={academyTextStyle}>
          Wichtige Verben, schwierige Satzstrukturen und Grammatik aus diesem Modell
          werden später in Akademie B2 gesammelt und erklärt.
        </p>
      </div>
    </div>
  );
}

function TopicCard({ icon, title, text }) {
  return (
    <div style={cardStyle}>
      <h2 style={sectionTitleStyle}>
        {icon} {title}
      </h2>

      {renderContent(text)}
    </div>
  );
}

function TopicList({ icon, title, items }) {
  return (
    <div style={cardStyle}>
      <h2 style={sectionTitleStyle}>
        {icon} {title}
      </h2>

      {Array.isArray(items) && items.length > 0 ? (
        <ul style={listStyle}>
          {items.map((item, index) => (
            <li key={index}>{renderPlainText(item)}</li>
          ))}
        </ul>
      ) : (
        <p style={textStyle}>Keine Inhalte vorhanden.</p>
      )}
    </div>
  );
}

function renderContent(value) {
  if (!value) {
    return <p style={textStyle}>Thema wird später ergänzt.</p>;
  }

  if (typeof value === 'string') {
    return <p style={textStyle}>{value}</p>;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => (
      <p key={index} style={textStyle}>
        {renderPlainText(item)}
      </p>
    ));
  }

  if (typeof value === 'object') {
    return (
      <>
        {value.title && <h3 style={smallTitleStyle}>{value.title}</h3>}
        {value.description && <p style={textStyle}>{value.description}</p>}
        {value.teil1 && <p style={textStyle}>{renderPlainText(value.teil1)}</p>}
        {value.teil2 && <p style={textStyle}>{renderPlainText(value.teil2)}</p>}
        {value.text && <p style={textStyle}>{renderPlainText(value.text)}</p>}
      </>
    );
  }

  return <p style={textStyle}>{String(value)}</p>;
}

function renderPlainText(value) {
  if (!value) return '';

  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    return value.map(renderPlainText).join('\n');
  }

  if (typeof value === 'object') {
    return (
      value.title ||
      value.description ||
      value.text ||
      value.teil1 ||
      value.teil2 ||
      value.modelId ||
      ''
    );
  }

  return String(value);
}

const pageStyle = {
  padding: '22px',
  paddingBottom: '100px',
  fontFamily: 'system-ui, sans-serif',
};

const backButtonStyle = {
  border: 'none',
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  padding: '10px 16px',
  borderRadius: '999px',
  fontWeight: '700',
  cursor: 'pointer',
  marginBottom: '18px',
};

const headerCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '22px',
  padding: '20px',
  marginBottom: '16px',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.07)',
  border: '1px solid #e2e8f0',
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '800',
  margin: '0 0 12px',
};

const titleStyle = {
  margin: 0,
  color: '#0f172a',
  fontSize: '26px',
  lineHeight: 1.2,
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: 1.5,
  marginBottom: 0,
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '18px',
  marginBottom: '12px',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
  border: '1px solid #e2e8f0',
};

const sectionTitleStyle = {
  marginTop: 0,
  color: '#0f172a',
  fontSize: '20px',
};

const smallTitleStyle = {
  margin: '0 0 8px',
  color: '#1e293b',
  fontSize: '17px',
};

const textStyle = {
  whiteSpace: 'pre-line',
  color: '#334155',
  lineHeight: 1.65,
  marginBottom: 0,
};

const listStyle = {
  margin: 0,
  paddingLeft: '22px',
  color: '#334155',
  lineHeight: 1.8,
};

const academyNoteStyle = {
  backgroundColor: '#fef9c3',
  border: '1px solid #fde68a',
  borderRadius: '20px',
  padding: '16px',
  marginTop: '16px',
};

const academyTitleStyle = {
  margin: '0 0 8px',
  color: '#854d0e',
  fontSize: '18px',
};

const academyTextStyle = {
  margin: 0,
  color: '#713f12',
  lineHeight: 1.6,
};