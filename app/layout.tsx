import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { getAccentBootstrapScript } from "@/lib/accent-vars";

export const metadata: Metadata = {
  title: BRAND_CONFIG.companyName,
  description: `${BRAND_CONFIG.companyName} management system with role-based access control`,
  icons: {
    icon: "/logo_quickpawn-removebg-preview.png",
    shortcut: "/logo_quickpawn-removebg-preview.png",
    apple: "/logo_quickpawn-removebg-preview.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --brand-green: ${BRAND_CONFIG.primaryColor};
                --brand-gold: ${BRAND_CONFIG.secondaryColor};
                --pawn-gold: ${BRAND_CONFIG.accentColor};
                --pawn-sidebar: ${BRAND_CONFIG.primaryColor};
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pms-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dark':'light');window.__pmsDark=d;}catch(e){document.documentElement.classList.add('light');window.__pmsDark=false;}})();`,
          }}
        />
        <link rel="icon" href="/logo_quickpawn-removebg-preview.png" sizes="any" />
        <link rel="icon" type="image/png" href="/logo_quickpawn-removebg-preview.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo_quickpawn-removebg-preview.png" />
        <meta name="msapplication-TileImage" content="/logo_quickpawn-removebg-preview.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: getAccentBootstrapScript(),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    const filters = [
      'The width(-1) and height(-1) of chart should be greater than 0',
      'Empty response body',
      '[AuthContext] Failed to refresh profile:',
    ];

    function shouldFilter(args) {
      try {
        if (!args || args.length === 0) return false;
        const first = args[0];
        const s = typeof first === 'string' ? first : JSON.stringify(first);
        return filters.some(f => s.includes(f));
      } catch (e) {
        return false;
      }
    }

    console.warn = function(...args) {
      if (shouldFilter(args)) return;
      return origWarn(...args);
    };

    console.error = function(...args) {
      if (shouldFilter(args)) return;
      return origError(...args);
    };
  } catch (e) {
    // noop
  }
})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
