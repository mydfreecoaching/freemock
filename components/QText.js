/** Renders question text: plain lines as paragraphs, consecutive "x | y" lines as a table. */
export default function QText({ text }) {
  if (!text) return null;
  const lines = String(text).split('\n');
  const blocks = [];
  for (const ln of lines) {
    if (ln.includes(' | ')) {
      const cells = ln.split(' | ').map((c) => c.trim());
      const last = blocks[blocks.length - 1];
      if (last && last.t === 'tbl') last.rows.push(cells); else blocks.push({ t: 'tbl', rows: [cells] });
    } else if (ln.trim()) blocks.push({ t: 'p', s: ln });
  }
  return (
    <div className="qtext">
      {blocks.map((b, i) => b.t === 'p'
        ? <div key={i}>{b.s}</div>
        : <table key={i} className="qtable"><tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => j === 0 && b.rows.length > 1 && /^(column|list|பட்டியல்|வரிசை)/i.test(r[0]) ? <th key={k}>{c}</th> : <td key={k}>{c}</td>)}</tr>)}</tbody></table>)}
    </div>
  );
}
