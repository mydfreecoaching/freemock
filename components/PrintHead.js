/** Header, watermark and page footer for printable admin reports (PDF via the browser). */
export default function PrintHead({ title, sub, footer, landscape = false }) {
  const esc = (v) => String(v || '').replace(/[\\"]/g, ' ').replace(/[\r\n<>]/g, ' ');
  const css = `@media print{@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:11mm 10mm 15mm;
    @bottom-center{content:"${esc(footer)}  ·  பக்கம் / Page " counter(page) " / " counter(pages);font:10px sans-serif;color:#333;white-space:nowrap}}}`;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="paper-head printonly">
        <div>
          <div className="ph-1">இலவச இணையவழி மாதிரி தேர்வுகள் / Free Mock Tests</div>
        </div>
      </div>
      <h1 className="paper-title printonly">{title}</h1>
      {sub && <p className="printonly small" style={{ margin: '0 0 8px' }}>{sub}</p>}
    </>
  );
}
