import { useMemo, useState } from 'react';
import { postWeight, type WeightEntry } from '../api';

type Props = {
  unit: 'lbs' | 'kg';
  weights: WeightEntry[];
  onLogged: (entry: WeightEntry) => void;
  onViewProgress: () => void;
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HomeScreen({ unit, weights, onLogged, onViewProgress }: Props) {
  const today = todayStr();
  const loggedToday = weights.find((w) => w.date === today) ?? null;
  const yesterday = useMemo(() => {
    return weights.filter((w) => w.date !== today).slice(-1)[0] ?? null;
  }, [weights, today]);

  const initial = loggedToday?.value ?? yesterday?.value ?? (unit === 'kg' ? 84.0 : 185.0);
  const [weight, setWeight] = useState<number>(initial);
  const [justLogged, setJustLogged] = useState<WeightEntry | null>(loggedToday);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const whole = Math.floor(weight);
  const dec = Math.round((weight - whole) * 10);
  const adj = (delta: number) =>
    setWeight((w) => Math.max(30, +(w + delta).toFixed(1)));

  const handleLog = async () => {
    setSaving(true);
    setErr(null);
    try {
      const saved = await postWeight(weight, today);
      setJustLogged(saved);
      onLogged(saved);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (justLogged) {
    const val = justLogged.value;
    return (
      <div className="screen">
        <div className="logged">
          <div className="logged-tile">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M5 14l7 7L23 7"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="logged-h">Logged</div>
          <div className="logged-val">
            {val.toFixed(1)} <span className="unit">{unit}</span>
          </div>
          <div className="logged-sub">See you tomorrow morning.</div>
          <button className="ghost-btn" onClick={onViewProgress}>
            View progress →
          </button>
        </div>
      </div>
    );
  }

  const diffVal = yesterday ? +(weight - yesterday.value).toFixed(1) : null;

  const recent30 = weights.slice(-30);
  const avg30 =
    recent30.length > 0
      ? recent30.reduce((a, w) => a + w.value, 0) / recent30.length
      : null;

  return (
    <div className="screen">
      <div className="home-header">
        <div className="home-date">{dateStr}</div>
        <div className="home-greeting">Good morning</div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">yesterday</div>
          <div className="stat-val">
            {yesterday ? `${yesterday.value.toFixed(1)} ${unit}` : '—'}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">change</div>
          <div className={`stat-val ${diffVal === null ? '' : diffVal <= 0 ? 'good' : 'bad'}`}>
            {diffVal === null ? '—' : `${diffVal > 0 ? '+' : ''}${diffVal} ${unit}`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">30d avg</div>
          <div className="stat-val">
            {avg30 === null ? '—' : `${avg30.toFixed(1)} ${unit}`}
          </div>
        </div>
      </div>

      <div className="entry-center">
        <div className="entry-label">Today's weight</div>
        <div className="picker-row">
          <div className="picker-col">
            <button className="adj" onClick={() => adj(1)} aria-label="increase whole">+</button>
            <div className="picker-big">{whole}</div>
            <button className="adj" onClick={() => adj(-1)} aria-label="decrease whole">–</button>
          </div>
          <div className="picker-dot">.</div>
          <div className="picker-col">
            <button className="adj" onClick={() => adj(0.1)} aria-label="increase decimal">+</button>
            <div className="picker-big dim">{dec}</div>
            <button className="adj" onClick={() => adj(-0.1)} aria-label="decrease decimal">–</button>
          </div>
          <div className="picker-unit">{unit}</div>
        </div>
      </div>

      {err && <div className="err-banner" style={{ margin: '0 24px' }}>{err}</div>}

      <div className="btn-wrap">
        <button className="log-btn" onClick={handleLog} disabled={saving}>
          {saving ? 'Saving…' : 'Log weight'}
        </button>
      </div>
    </div>
  );
}
