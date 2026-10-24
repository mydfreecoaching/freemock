/** "அலகு" chips for General Tamil tests. items: [{ unit, n }]; href(u) → link, or onPick(u) for client lists. */
export default function UnitChips({ items, current = 0, href, onPick, total }) {
  if (!items.length) return null;
  const chip = (u, label) => href
    ? <a key={u} className={`tab ${current === u ? 'on' : ''}`} href={href(u)}>{label}</a>
    : <button key={u} type="button" className={`tab ${current === u ? 'on' : ''}`} onClick={() => onPick(u)}>{label}</button>;
  return (
    <nav className="tabs chips unit-chips" aria-label="அலகு">
      {chip(0, `அனைத்து அலகுகள்${total != null ? ` (${total})` : ''}`)}
      {items.map(({ unit, n }) => chip(unit, `அலகு ${unit} (${n})`))}
    </nav>
  );
}
/** Count tests per unit: [{ unit, n }] sorted. */
export const unitCounts = (tests) => Object.entries(tests.reduce((m, t) => (t.unit ? ((m[t.unit] = (m[t.unit] || 0) + 1), m) : m), {}))
  .map(([u, n]) => ({ unit: Number(u), n })).sort((a, b) => a.unit - b.unit);
