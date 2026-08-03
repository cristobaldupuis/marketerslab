import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { SidebarNav } from "@/components/sidebar-nav";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Marketers Lab — experiment register",
  description:
    "Design a marketing experiment with real rigor, watch it run, and understand why it won or lost — across paid, CRM, PDP and offline.",
};

/**
 * Sets `data-theme` on <html> before first paint, so a returning visitor with
 * an explicit light/dark choice never sees a flash of the wrong palette. No
 * localStorage entry means "system" — the prefers-color-scheme media query in
 * globals.css handles that case with no attribute needed.
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("ml-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col lg:flex-row">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[var(--sidebar-width)]">
          <main id="main" className="flex-1">
            {children}
          </main>
          <Colophon />
        </div>
      </body>
    </html>
  );
}

function Colophon() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-mono text-[11px] text-ink-3">
          Every record here is fabricated demo data. No live integrations.
        </p>
        <p className="font-mono text-[11px] text-ink-4">
          Taxonomy · kill criteria · segment trees · cross-brand patterns
        </p>
      </div>
    </footer>
  );
}
