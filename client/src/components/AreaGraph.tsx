import type { WeightEntry } from '../api';

type Props = {
  data: WeightEntry[];
};

function formatTick(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AreaGraph({ data }: Props) {
  if (data.length === 0) {
    return <div className="empty-state">No entries yet — log one to see your graph.</div>;
  }
  if (data.length === 1) {
    const only = data[0];
    return (
      <div className="empty-state">
        One entry so far: {only.value.toFixed(1)} on {formatTick(only.date)}. Come back
        tomorrow.
      </div>
    );
  }

  const W = 320;
  const H = 140;
  const PL = 4;
  const PR = 4;
  const PT = 10;
  const PB = 24;
  const cw = W - PL - PR;
  const ch = H - PT - PB;

  const vals = data.map((d) => d.value);
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const range = max - min || 1;
  const x = (i: number) => PL + (i / (data.length - 1)) * cw;
  const y = (v: number) => PT + (1 - (v - min) / range) * ch;

  const pts = data.map((d, i) => [x(i), y(d.value)] as [number, number]);
  const lineD = pts
    .map((p, i) => {
      if (i === 0) return `M${p[0]},${p[1]}`;
      const prev = pts[i - 1];
      const mx = (prev[0] + p[0]) / 2;
      return `C${mx},${prev[1]} ${mx},${p[1]} ${p[0]},${p[1]}`;
    })
    .join(' ');
  const areaD = `${lineD} L${pts[pts.length - 1][0]},${PT + ch} L${pts[0][0]},${PT + ch} Z`;

  const tickIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1={PL}
          x2={W - PR}
          y1={PT + f * ch}
          y2={PT + f * ch}
          stroke="var(--border)"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path
        d={lineD}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="var(--accent)" />
      {tickIdx.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 2}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-dim)"
          fontFamily="DM Sans, sans-serif"
        >
          {formatTick(data[i].date)}
        </text>
      ))}
    </svg>
  );
}
