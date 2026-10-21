/** A question / option picture (stored id → /qimg/<id>.webp). */
export default function QImg({ id, alt = '' }) {
  if (!id) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="qimg" src={`/qimg/${id}.webp`} alt={alt} loading="lazy" decoding="async" />;
}
