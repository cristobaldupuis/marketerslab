"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BRANDS } from "@/lib/data/brands";
import { EXPERIMENTS } from "@/lib/data/experiments";
import { ThemeToggle } from "./theme-toggle";

type Section = {
  mark: string;
  name: string;
  blurb: string;
  href: string;
  /** Sections keyed to a single record (Laboratory, Microscope) only resolve to
   *  a real destination once a record is already in view — see `currentId`. */
  needsRecord?: boolean;
  /** Not built yet (Pass C / Pass D) — shown so the six-section IA reads as a
   *  whole even before every room has something in it. */
  comingSoon?: boolean;
};

const SECTIONS: Section[] = [
  { mark: "OB", name: "Observatory", blurb: "Every record, at a glance", href: "/observatory" },
  { mark: "VV", name: "Vivarium", blurb: "What's running right now", href: "/vivarium" },
  { mark: "MC", name: "Microscope", blurb: "Close read of one record", href: "/microscope", needsRecord: true },
  { mark: "LB", name: "Laboratory", blurb: "Design, evidence, patterns", href: "/laboratory", needsRecord: true },
  { mark: "QT", name: "Quarantine", blurb: "Kill criteria unconfirmed", href: "/quarantine", comingSoon: true },
  { mark: "SC", name: "Supercomputer", blurb: "Plan-builder, roadmap gen", href: "/supercomputer" },
];

/** Pulls the record id out of the path when we're already inside a
 *  Laboratory or Microscope view, so those two sections can jump straight to
 *  the same record instead of losing context. */
function currentRecordId(pathname: string): string | null {
  const match = pathname.match(/^\/(laboratory|microscope)\/([^/]+)/);
  return match ? match[2] : null;
}

export function SidebarNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const recordId = currentRecordId(pathname);

  // Close the mobile drawer on navigation. Adjusted during render (React's
  // documented pattern for state derived from a changing prop) rather than in
  // an effect, so there is no extra render pass just to close the drawer.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  return (
    <>
      <MobileTopBar onOpen={() => setOpen(true)} />

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col border-r border-rule bg-paper-deep transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div className="px-5 pt-6 pb-5">
          <Link href="/observatory" className="flex items-baseline gap-2.5">
            <span
              className="text-[16px] leading-none font-semibold tracking-[0.01em] text-ink"
              style={{ fontStretch: "118%" }}
            >
              Marketers Lab
            </span>
          </Link>
          <p className="field-label mt-2">
            {BRANDS.length} brands · {EXPERIMENTS.length} records
          </p>
        </div>

        <nav aria-label="Sections" className="flex-1 overflow-y-auto border-t border-rule px-2.5 py-3">
          <ul className="space-y-0.5">
            {SECTIONS.map((s) => (
              <SectionLink key={s.name} section={s} pathname={pathname} recordId={recordId} />
            ))}
          </ul>
        </nav>

        <div className="border-t border-rule px-4 py-4">
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}

function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule-2 bg-paper-deep px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open navigation"
        className="flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-rule-2 text-ink-2"
      >
        <span aria-hidden className="font-mono text-[13px] leading-none">
          ≡
        </span>
      </button>
      <Link
        href="/observatory"
        className="text-[15px] leading-none font-semibold tracking-[0.01em] text-ink"
        style={{ fontStretch: "118%" }}
      >
        Marketers Lab
      </Link>
    </div>
  );
}

function SectionLink({
  section,
  pathname,
  recordId,
}: {
  section: Section;
  pathname: string;
  recordId: string | null;
}) {
  const isActive = pathname.startsWith(section.href);
  const resolvedHref = section.needsRecord && recordId ? `${section.href}/${recordId}` : section.href;
  const disabled = section.comingSoon || (section.needsRecord && !recordId);

  const inner = (
    <>
      <span
        className={[
          "inline-flex size-[22px] shrink-0 items-center justify-center rounded-[3px] border font-mono text-[9.5px] leading-none font-semibold tracking-[0.02em]",
          isActive
            ? "border-ink bg-ink text-paper"
            : disabled
              ? "border-rule text-ink-4"
              : "border-rule-2 bg-sunk text-ink-2",
        ].join(" ")}
      >
        {section.mark}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={[
            "block text-[13px] leading-tight font-medium",
            isActive ? "text-ink" : disabled ? "text-ink-4" : "text-ink-2",
          ].join(" ")}
        >
          {section.name}
        </span>
        <span className="block truncate text-[10.5px] leading-tight text-ink-4">
          {section.comingSoon ? "Coming soon" : section.needsRecord && !recordId ? "Open a record first" : section.blurb}
        </span>
      </span>
    </>
  );

  const rowClass = "flex items-center gap-2.5 rounded-[5px] px-2.5 py-2 transition-colors";

  if (disabled) {
    return (
      <li>
        <div aria-disabled className={`${rowClass} cursor-not-allowed opacity-70`} title={section.comingSoon ? "Not built yet" : "Open a record from Observatory or Vivarium first"}>
          {inner}
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={resolvedHref}
        aria-current={isActive ? "page" : undefined}
        className={`${rowClass} ${isActive ? "bg-surface" : "hover:bg-surface/60"}`}
      >
        {inner}
      </Link>
    </li>
  );
}
