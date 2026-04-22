import { useState } from 'react';
import type { Me } from '../api';
import { logout as apiLogout, updateMe } from '../api';

type Props = {
  me: Me;
  onUserChange: (me: Me) => void;
  onSignOut: () => void;
};

export function SettingsScreen({ me, onUserChange, onSignOut }: Props) {
  const [notifs, setNotifs] = useState(true);
  const [savingUnit, setSavingUnit] = useState(false);

  const initials = (me.name ?? me.email).trim().charAt(0).toUpperCase() || 'A';

  const setUnit = async (unit: 'lbs' | 'kg') => {
    if (unit === me.unit || savingUnit) return;
    setSavingUnit(true);
    try {
      const next = await updateMe({ unit });
      onUserChange(next);
    } finally {
      setSavingUnit(false);
    }
  };

  const handleSignOut = async () => {
    await apiLogout();
    onSignOut();
  };

  return (
    <div className="screen scroll">
      <div className="settings-header">
        <div className="settings-h">Settings</div>
      </div>

      <div className="profile-card">
        <div className="avatar">
          {me.pictureUrl ? <img src={me.pictureUrl} alt="" /> : initials}
        </div>
        <div>
          <div className="profile-name">{me.name ?? 'You'}</div>
          <div className="profile-email">{me.email}</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-kicker">Preferences</div>
        <div className="settings-row">
          <div className="settings-label">Units</div>
          <div className="seg">
            {(['lbs', 'kg'] as const).map((u) => (
              <button
                key={u}
                className={`seg-btn ${me.unit === u ? 'active' : ''}`}
                onClick={() => setUnit(u)}
                disabled={savingUnit}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">Morning reminder</div>
          <div
            className={`toggle ${notifs ? 'on' : ''}`}
            onClick={() => setNotifs((n) => !n)}
            role="switch"
            aria-checked={notifs}
          >
            <div className="toggle-knob" />
          </div>
        </div>
        {notifs && (
          <div className="settings-row">
            <div className="settings-label">Reminder time</div>
            <div style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>08:00</div>
          </div>
        )}
      </div>

      <div className="settings-section" style={{ paddingTop: 20 }}>
        <div className="settings-kicker">Account</div>
        <button className="signout" onClick={handleSignOut}>
          Sign out
        </button>
      </div>

      <div className="footer">tare v1.0 · made with intention</div>
    </div>
  );
}
