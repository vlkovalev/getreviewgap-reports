import Script from "next/script"

export function TrackingScripts() {
  const gaId = clean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
  const metaPixelId = clean(process.env.NEXT_PUBLIC_META_PIXEL_ID)
  const linkedInPartnerId = clean(process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID)

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
          </Script>
        </>
      ) : null}
      {metaPixelId ? (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
      {linkedInPartnerId ? (
        <Script id="linkedin-insight-init" strategy="afterInteractive">
          {`_linkedin_partner_id='${linkedInPartnerId}';window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';s.parentNode.insertBefore(b,s);})(window.lintrk);`}
        </Script>
      ) : null}
    </>
  )
}

function clean(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "")
}
