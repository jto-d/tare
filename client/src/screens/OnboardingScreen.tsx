import { useState } from 'react';
import { postWeight, updateMe } from '../api';

type Props = {
  initialUnit: 'lbs' | 'kg';
  onDone: (unit: 'lbs' | 'kg') => void;
};

export function OnboardingScreen({ initialUnit, onDone }: Props) {
  const [step, setStep] = useState<0 | 1>(0);
  const [unit, setUnit] = useState<'lbs' | 'kg'>(initialUnit);
  const [weight, setWeight] = useState<number>(initialUnit === 'kg' ? 84.0 : 185.0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const whole = Math.floor(weight);
  const dec = Math.round((weight - whole) * 10);
  const adj = (delta: number) =>
    setWeight((w) => Math.max(30, +(w + delta).toFixed(1)));

  const finish = async () => {
    setSaving(true);
    setErr(null);
    try {
      await updateMe({ unit });
      const today = new Date().toISOString().slice(0, 10);
      await postWeight(weight, today);
      await updateMe({ onboarded: true });
      onDone(unit);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
      setSaving(false);
    }
  };

  if (step === 0) {
    return (
      <div className="section-pad">
        <div style={{ marginBottom: 'auto' }}>
          <div className="kicker">Step 1 of 2</div>
          <div className="h1">Your unit</div>
          <div className="sub">You can change this later in settings.</div>
        </div>
        <div className="unit-row">
          {(['lbs', 'kg'] as const).map((u) => (
            <button
              key={u}
              className={`unit-btn ${unit === u ? 'active' : ''}`}
              onClick={() => setUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            setWeight(unit === 'kg' ? 84.0 : 185.0);
            setStep(1);
          }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="section-pad">
      <div>
        <div className="kicker">Step 2 of 2</div>
        <div className="h1">Starting weight</div>
        <div className="sub">We'll track your progress from here.</div>
      </div>

      <div className="picker">
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

      {err && <div className="err-banner">{err}</div>}

      <button className="primary-btn" onClick={finish} disabled={saving}>
        {saving ? 'Saving…' : 'Start tracking'}
      </button>
    </div>
  );
}
