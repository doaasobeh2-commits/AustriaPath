import { getCurrentUserAllowedLevels } from '../userAccess';

export default function LevelSelectScreen({ onSelectLevel }) {
  const allowedLevels = ['A2', 'B1', 'B2'];

  const levels = [
    {
      id: 'A2',
      title: 'A2 Level',
      description: 'Einfache Gespräche, kurze E-Mails und Alltagssituationen.',
    },
    {
      id: 'B1',
      title: 'B1 Level',
      description: 'Prüfungstraining mit Sprechen, Schreiben, Lesen und Hören.',
    },
    {
      id: 'B2',
      title: 'B2 Level',
      description: 'Fortgeschrittene Themen, Diskussionen und komplexere Texte.',
    },
  ];

  const visibleLevels = levels.filter((level) =>
    allowedLevels.includes(level.id)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Wähle dein Niveau</h1>

      <p style={{ color: '#64748b' }}>
        Wählen Sie ein freigeschaltetes Niveau, um mit dem Training zu beginnen.
      </p>

      <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
        {visibleLevels.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelectLevel(level.id)}
            style={{
              textAlign: 'left',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ margin: 0 }}>{level.title}</h2>
            <p style={{ color: '#64748b' }}>{level.description}</p>
          </button>
        ))}
      </div>

      {visibleLevels.length === 0 && (
        <div
          style={{
            marginTop: '24px',
            padding: '18px',
            borderRadius: '16px',
            background: '#fff7ed',
            color: '#9a3412',
            fontWeight: '700',
          }}
        >
          Für Ihr Konto ist noch kein Niveau freigeschaltet.
        </div>
      )}
    </div>
  );
}