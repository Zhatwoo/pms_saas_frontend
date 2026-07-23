import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { BRAND_CONFIG } from "@/lib/brand-config";

export const metadata: Metadata = {
  title: BRAND_CONFIG.companyName,
  description: `${BRAND_CONFIG.companyName} management system with role-based access control`,
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var a=localStorage.getItem('pms-accent');var presets={green:{primary:'#0B5D3B',accent:'#E8C547'},blue:{primary:'#0B4A6F',accent:'#4FA8E8'},purple:{primary:'#4C1D7A',accent:'#C084F5'},rose:{primary:'#7A1D3D',accent:'#F5738E'},amber:{primary:'#7A4A0B',accent:'#F5B84C'}};var p=presets[a];if(p){var isDark=!!window.__pmsDark;function shade(hex,amount){var n=parseInt(hex.replace('#',''),16);var r=(n>>16)&255,g=(n>>8)&255,b=n&255;function mix(c){return amount>=0?Math.round(c+(255-c)*amount):Math.round(c*(1+amount));}function clamp(v){return Math.max(0,Math.min(255,v));}function toHex(v){return clamp(v).toString(16).padStart(2,'0');}return '#'+toHex(mix(r))+toHex(mix(g))+toHex(mix(b));}var root=document.documentElement.style;root.setProperty('--brand-green',p.primary);root.setProperty('--brand-gold',p.accent);root.setProperty('--pawn-sidebar',p.primary);root.setProperty('--pawn-sidebar-light',shade(p.primary,0.18));root.setProperty('--pawn-gold',p.accent);root.setProperty('--pawn-gold-light',shade(p.accent,0.15));root.setProperty('--pawn-section',shade(p.primary,0.35));root.setProperty('--pawn-content',isDark?shade(p.primary,-0.9):shade(p.primary,0.92));}}catch(e){}})();`,
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
