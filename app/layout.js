import './globals.css';

export const metadata = {
  title: 'Grey Cells Prompt Library',
  description: 'Browse and explore our collection of AI prompts',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  // Use NEXT_PUBLIC_GA_MEAS_ID in your env; fallback shown for safety.
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEAS_ID || 'G-S0KQLLN0JT';

  return (
    <html lang="en">
      <head>
        {/* Google Analytics library */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        ></script>

        {/* Google Analytics base config (we'll send page_view manually) */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: false });
            `,
          }}
        />
      </head>

      <body>
        {children}

        {/* Client-side page_view sender for SPA navigation (history API + popstate) */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                // send a page_view to GA if gtag is ready and user is online
                function sendPageView(url) {
                  try {
                    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
                    if (!window.gtag) return;
                    var page_path = url || (window.location.pathname + window.location.search);
                    window.gtag('event', 'page_view', {
                      page_location: window.location.href,
                      page_path: page_path,
                      page_title: document.title
                    });
                  } catch (e) {
                    // swallow errors - analytics should never break the app
                    console.warn('gtag page_view error', e);
                  }
                }

                // wait for gtag to load, then send the initial pageview
                var tries = 0;
                var maxTries = 50; // ~10 seconds (50 * 200ms)
                var gaReadyInterval = setInterval(function () {
                  tries++;
                  if (window.gtag) {
                    clearInterval(gaReadyInterval);
                    sendPageView();
                    return;
                  }
                  if (tries >= maxTries) {
                    clearInterval(gaReadyInterval);
                  }
                }, 200);

                // patch history methods to catch SPA navigations
                (function () {
                  var _pushState = history.pushState;
                  history.pushState = function () {
                    var result = _pushState.apply(this, arguments);
                    try {
                      // the 3rd arg is the new URL (may be undefined)
                      var url = arguments.length > 2 ? arguments[2] : undefined;
                      // Delay slightly to allow the new route to render title, etc.
                      setTimeout(function () { sendPageView(url); }, 50);
                    } catch (e) {}
                    return result;
                  };

                  var _replaceState = history.replaceState;
                  history.replaceState = function () {
                    var result = _replaceState.apply(this, arguments);
                    try {
                      var url = arguments.length > 2 ? arguments[2] : undefined;
                      setTimeout(function () { sendPageView(url); }, 50);
                    } catch (e) {}
                    return result;
                  };

                  window.addEventListener('popstate', function () {
                    setTimeout(function () { sendPageView(); }, 50);
                  });
                })();
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
