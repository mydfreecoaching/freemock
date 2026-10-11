/** One District Employment & Career Guidance Centre: Tamil / English name, address, phone or WhatsApp. */
export default function OfficeCard({ o, highlight = false }) {
  return (
    <div className={`card office ${highlight ? 'office-mine' : ''}`}>
      <div className="small muted">{o.no ? `${o.no}. ` : ''}{o.district} / {o.districtEn}</div>
      <h3>{o.title}</h3>
      <div className="small muted">{o.titleEn}</div>
      {o.addressTa && <p style={{ margin: '6px 0 0' }}>📍 {o.addressTa}</p>}
      <p style={{ margin: '4px 0 6px' }} className={o.addressTa ? 'small' : ''}>{o.addressTa ? '' : '📍 '}{o.address}</p>
      <div className="row">
        {o.wa && <a className="btn wa-btn" href={`https://wa.me/${o.wa}`} target="_blank" rel="noopener noreferrer">💬 WhatsApp {o.waLabel}</a>}
        {o.phone && <a className="btn alt" href={`tel:${o.phone.replace(/[^0-9]/g, '')}`}>☎ {o.phone}</a>}
        <a className="btn alt" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`} target="_blank" rel="noopener noreferrer">🗺️ வரைபடம்</a>
      </div>
    </div>
  );
}
