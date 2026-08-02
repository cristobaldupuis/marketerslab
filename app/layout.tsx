import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { BRANDS } from "@/lib/data/brands";
import { EXPERIMENTS } from "@/lib/data/experiments";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>
        <Masthead />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Colophon />
      </body>
    </html>
  );
}

function Masthead() {
  return (
    <header className="grid-paper border-b border-rule-2 bg-paper-deep">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-baseline gap-3">
          <span
            className="text-[17px] leading-none font-semibold tracking-[0.01em] text-ink"
            style={{ fontStretch: "118%" }}
          >
            Marketers Lab
          </span>
          <span className="field-label hidden sm:inline">Experiment register</span>
        </Link>

        <div className="ml-auto flex items-baseline gap-3">
          <span className="field-label">Instance</span>
          <span className="font-mono text-[11px] text-ink-2">
            {BRANDS.length} brands · {EXPERIMENTS.length} records
          </span>
        </div>
      </div>
    </header>
  );
}

function Colophon() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-mono text-[11px] text-ink-3">
          Every record here is fabricated demo data. No live integrations.
        </p>
        <p className="font-mono text-[11px] text-ink-4">Pass 1 — taxonomy and rigor dial</p>
      </div>
    </footer>
  );
}
