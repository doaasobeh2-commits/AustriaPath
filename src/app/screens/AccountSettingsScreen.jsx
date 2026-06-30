import React, { useEffect, useState } from 'react';

export default function AccountSettingsScreen({ setActiveTab }) {
  const currentUser =
  JSON.parse(localStorage.getItem("currentUser")) || {};

const [name, setName] = useState(
  localStorage.getItem("userName") ||
  currentUser.name ||
  "Fadi Sobeh"
);
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('A2');
  const [language, setLanguage] = useState('Deutsch');
  const [profileImage, setProfileImage] = useState('');
  const [saved, setSaved] = useState(false);

  const levelLocked =
    localStorage.getItem('placementCompleted') === 'true' ||
    localStorage.getItem('levelSource') === 'placement_test';

  useEffect(() => {
    const currentUserRaw = localStorage.getItem('currentUser');
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

    setName(
      localStorage.getItem('userName') ||
        currentUser?.name ||
        ''
    );

    setEmail(
      localStorage.getItem('userEmail') ||
        currentUser?.email ||
        ''
    );

    setLevel(
      localStorage.getItem('userLevel') ||
        currentUser?.level ||
        'A2'
    );

    setLanguage(
      localStorage.getItem('userLanguage') ||
        currentUser?.language ||
        'Deutsch'
    );

    setProfileImage(localStorage.getItem('userProfileImage') || '');
  }, []);

  const handleImageChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Bitte wählen Sie eine Bilddatei.');
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 220;

      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');

      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;

      ctx.drawImage(
        img,
        sx,
        sy,
        minSide,
        minSide,
        0,
        0,
        size,
        size
      );

      const compressedImage = canvas.toDataURL('image/jpeg', 0.75);

      if (compressedImage.length > 300000) {
        alert('Das Bild ist zu groß. Bitte ein kleineres Bild wählen.');
        return;
      }

      setProfileImage(compressedImage);
      localStorage.setItem('userProfileImage', compressedImage);
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
};

  const handleSave = () => {
    const currentUserRaw = localStorage.getItem('currentUser');
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

    const updatedUser = {
  ...(currentUser || {}),
  name,
  email,
  level,
  language,
};

    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userLevel', level);
    localStorage.setItem('userLanguage', language);
  const handleImageChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = () => {
    const imageData = reader.result;

    if (imageData.length > 1000000) {
      alert('Das Bild ist zu groß. Bitte ein kleineres Bild wählen.');
      return;
    }

    setProfileImage(imageData);
    localStorage.setItem('userProfileImage', imageData);
  };

  reader.readAsDataURL(file);
};
    if (profileImage && profileImage.length < 1000000) {
  localStorage.setItem('userProfileImage', profileImage);
}
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const usersRaw = localStorage.getItem('austriaPathUsers');
    const users = usersRaw ? JSON.parse(usersRaw) : [];

    const updatedUsers = users.map((user) =>
      user.email?.toLowerCase() === email.toLowerCase()
        ? { ...user, ...updatedUser }
        : user
    );

    localStorage.setItem('austriaPathUsers', JSON.stringify(updatedUsers));

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    setActiveTab('login');
  };

  return (
    <div style={pageStyle}>
      <button onClick={() => setActiveTab('profile')} style={backButtonStyle}>
        ← Zurück
      </button>

      <div style={headerCardStyle}>
        <div style={profileHeaderStyle}>
          <div style={avatarStyle}>
            {profileImage ? (
              <img src={profileImage} alt="Profil" style={avatarImageStyle} />
            ) : (
              <span>👤</span>
            )}
          </div>

          <div>
            <p style={badgeStyle}>Konto</p>
            <h1 style={titleStyle}>Account Einstellungen</h1>
            <p style={subtitleStyle}>
              {name || 'Dein Name'} · {email || 'deine@email.com'}
            </p>
          </div>
        </div>

        <label style={imageButtonStyle}>
          📷 Bild ändern
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>Name</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
        />

        <label style={labelStyle}>E-Mail</label>
        <input
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.com"
        />

        <label style={labelStyle}>Sprache</label>
        <select
          style={inputStyle}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option>Deutsch</option>
          <option>العربية</option>
          <option>Türkçe</option>
          <option>فارسی</option>
          <option>Українська</option>
        </select>

        <label style={labelStyle}>Niveau</label>

        {levelLocked ? (
          <div style={lockedLevelStyle}>
            <strong>{level}</strong>
            <span style={lockedHintStyle}>
              ✓ Durch Einstufungstest bestimmt
            </span>
          </div>
        ) : (
          <select
            style={inputStyle}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option>A2</option>
            <option>B1</option>
            <option>B2</option>
          </select>
        )}

        {saved && <p style={successStyle}>✅ Änderungen gespeichert.</p>}

        <button onClick={handleSave} style={saveButtonStyle}>
          Speichern
        </button>

        <button onClick={handleLogout} style={logoutButtonStyle}>
          Abmelden
        </button>
      </div>

      <div style={noteStyle}>
  <h3 style={noteTitleStyle}>🔒 Demnächst verfügbar</h3>

  <p style={noteTextStyle}>
    In einer zukünftigen Version von AustriaPath können Sie:
  </p>

  <ul
    style={{
      marginTop: '10px',
      marginBottom: '14px',
      paddingLeft: '22px',
      color: '#92400e',
      lineHeight: '1.8',
    }}
  >
    <li>Passwort ändern</li>
    <li>E-Mail bestätigen</li>
    <li>Konto löschen</li>
  </ul>

  <p style={noteTextStyle}>
    Diese Funktionen werden nach der vollständigen Konto-Integration
    automatisch freigeschaltet.
  </p>
</div>
    </div>
  );
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

const profileHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
};

const avatarStyle = {
  width: '76px',
  height: '76px',
  borderRadius: '50%',
  backgroundColor: '#e0f2fe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '34px',
  overflow: 'hidden',
  flexShrink: 0,
  border: '3px solid #bfdbfe',
};

const avatarImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const imageButtonStyle = {
  display: 'inline-block',
  marginTop: '16px',
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  padding: '10px 14px',
  borderRadius: '999px',
  fontWeight: '800',
  cursor: 'pointer',
  fontSize: '14px',
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#1d4ed8',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '800',
  margin: '0 0 8px',
};

const titleStyle = {
  margin: 0,
  color: '#0f172a',
  fontSize: '26px',
};

const subtitleStyle = {
  color: '#64748b',
  lineHeight: 1.5,
  margin: '6px 0 0',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '22px',
  padding: '18px',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.07)',
  border: '1px solid #e2e8f0',
};

const labelStyle = {
  display: 'block',
  fontWeight: '800',
  color: '#334155',
  marginBottom: '6px',
  marginTop: '14px',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #cbd5e1',
  borderRadius: '14px',
  padding: '12px',
  fontSize: '15px',
  outline: 'none',
};

const lockedLevelStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #bbf7d0',
  backgroundColor: '#f0fdf4',
  borderRadius: '14px',
  padding: '12px',
  color: '#166534',
};

const lockedHintStyle = {
  display: 'block',
  marginTop: '4px',
  fontSize: '13px',
  fontWeight: '700',
};

const saveButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '16px',
  fontWeight: '900',
  cursor: 'pointer',
  marginTop: '18px',
};

const logoutButtonStyle = {
  width: '100%',
  border: 'none',
  backgroundColor: '#fee2e2',
  color: '#b91c1c',
  padding: '14px',
  borderRadius: '16px',
  fontWeight: '900',
  cursor: 'pointer',
  marginTop: '10px',
};

const successStyle = {
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '10px 12px',
  borderRadius: '14px',
  fontWeight: '800',
  marginTop: '16px',
};

const noteStyle = {
  backgroundColor: '#fef9c3',
  border: '1px solid #fde68a',
  borderRadius: '20px',
  padding: '16px',
  marginTop: '16px',
};

const noteTitleStyle = {
  margin: '0 0 8px',
  color: '#854d0e',
  fontSize: '18px',
};

const noteTextStyle = {
  margin: 0,
  color: '#713f12',
  lineHeight: 1.6,
};