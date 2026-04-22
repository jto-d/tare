import { useMemo, useState } from 'react';
import type { WeightEntry } from '../api';
import { AreaGraph } from '../components/AreaGraph';

type Props = {
  unit: 'lbs' | 'kg';
  weights: WeightEntry[];
};

const RANGES = [7, 14, 30, 60] as const;

function shortLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function GraphScreen({ unit, weights }: Props) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);

  const slice = useMemo(() => weights.slice(-range), [weights, range]);

  const stats = useMemo(() => {
    if (slice.length === 0) return null;
    const vals = slice.map((w) => w.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const start = slice[0].value;
    const end = slice[slice.length - 1].value;
    const change = +(end - start).toFixed(1);
    return { min, max, avg, change };
  }, [slice]);

  return (
    <div className="screen scroll">
      <div className="home-header">
        <div className="home-greeting">Progress</div>
        <div className="home-date" style={{ marginTop: 2 }}>Your weight over time</div>
      </div>

      <div className="range-tabs">
        {RANGES.map((r) => (
          <button
            key={r}
            className={`range-tab ${range === r ? 'active' : ''}`}
            onClick={() => setRange(r)}
          >
            {r}d
          </button>
        ))}
      </div>

      <div className="chart-card">
        <AreaGraph data={slice} />
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat">
            <div className="stat-label">{range}d change</div>
            <div className={`stat-val ${stats.change <= 0 ? 'good' : 'bad'}`}>
              {stats.change > 0 ? '+' : ''}
              {stats.change} {unit}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">{range}d avg</div>
            <div className="stat-val">
              {stats.avg.toFixed(1)} {unit}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">lowest</div>
            <div className="stat-val">
              {stats.min.toFixed(1)} {unit}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">highest</div>
            <div className="stat-val">
              {stats.max.toFixed(1)} {unit}
            </div>
          </div>
        </div>
      )}

      <div className="history">
        <div className="history-title">Recent entries</div>
        {slice.length === 0 ? (
          <div className="empty-state">No entries in this range.</div>
        ) : (
          slice
            .slice()
            .reverse()
            .slice(0, 10)
            .map((w, i, arr) => {
              const prev = arr[i + 1];
              const delta = prev ? +(w.value - prev.value).toFixed(1) : null;
              return (
                <div key={w.id} className="history-row">
                  <div className="history-label">{shortLabel(w.date)}</div>
                  <div className="history-right">
                    {delta !== null && (
                      <div className={`history-delta ${delta <= 0 ? 'good' : 'bad'}`}>
                        {delta > 0 ? '+' : ''}
                        {delta}
                      </div>
                    )}
                    <div className="history-val">{w.value.toFixed(1)}</div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
