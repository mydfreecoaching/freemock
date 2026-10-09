/** Simple responsive SVG line chart; series = [{ name, cls, values: [number|null] }] in 0–100. */
export default function LineChart({ labels, series }) {
  const W = 420, H = 200, L = 30, R = 10, T = 10, B = 30;
  const n = labels.length;
  const x = (i) => L + (n === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
  const y = (v) => T + (1 - v / 100) * (H - T - B);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="முன்னேற்ற வரைபடம்">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}><line x1={L} x2={W - R} y1={y(g)} y2={y(g)} className="grid" /><text x={L - 6} y={y(g) + 4} textAnchor="end" className="ax">{g}</text></g>
      ))}
      {labels.map((l, i) => <text key={i} x={x(i)} y={H - B + 16} textAnchor="middle" className="ax">{l}</text>)}
      {series.map((s) => {
        const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
        return (
          <g key={s.name} className={s.cls}>
            <polyline fill="none" points={pts.map((p) => p.join(',')).join(' ')} />
            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" />)}
          </g>
        );
      })}
    </svg>
  );
}

