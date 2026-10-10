/** Header, watermark and page footer for printable admin reports (PDF via the browser). */
export default function PrintHead({ title, sub, footer, landscape = false }) {
  const esc = (v) => String(v || '').replace(/[\\"]/g, ' ').replace(/[\r\n<>]/g, ' ');
  const css = `@media print{@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:11mm 10mm 15mm;
    @bottom-center{content:"${esc(footer)}  ·  பக்கம் / Page " counter(page) " / " counter(pages);font:10px sans-serif;color:#333;white-space:nowrap}}}`;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <img className="paper-wm" src="/tn-emblem.png" alt="" aria-hidden="true" />
      <div className="paper-head printonly">
        <img src="/tn-emblem.png" alt="" width="54" height="59" />
        <div>
          <div className="ph-1">இலவச இணையவழி மாதிரி தேர்வு / Free Online Mock Test</div>
          <div className="ph-2">மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம் · தன்னார்வ பயிலும் வட்டம், மயிலாடுதுறை &amp; திருவாரூர்</div>
        </div>
      </div>
      <h1 className="paper-title printonly">{title}</h1>
      {sub && <p className="printonly small" style={{ margin: '0 0 8px' }}>{sub}</p>}
    </>
  );
}
