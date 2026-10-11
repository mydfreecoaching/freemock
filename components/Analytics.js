import Script from 'next/script';
import { firebaseConfig } from '@/lib/firebaseConfig';

/** Google Analytics 4 (Firebase measurement ID): page views only – no names, registration numbers or answers are sent. */
export default function Analytics() {
  const id = firebaseConfig.measurementId;
  if (!id || process.env.NODE_ENV !== 'production') return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}</Script>
  </>;
}
