"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BRANDS } from "@/lib/data/brands";
import { useRegister } from "@/lib/quarantine";
import {
  LabMark,
  ObservatoryIcon,
  QuarantineIcon,
  SupercomputerIcon,
  VivariumIcon,
} from "./nav-icons";
import { ThemeToggle } from "./theme-toggle";

type Section = {
  icon: (props: { className?: string }) => React.ReactNode;
  name: string;
  href: string;
  /** Live count in the badge slot, where Quarantine's "Soon" label used to
   *  sit before Pass C built it. Zero renders nothing. */
  count?: number;
};

/**
 * Two groups instead of one flat list. Both are places you can land on
 * directly from a cold start — that's the dividing line, not topic:
 *
 *   Signal   — Observatory and Vivarium, the two places you go to watch the
 *              register as it stands right now.
 *   Protocol — Quarantine and Supercomputer, the two places you go to *do*
 *              something to it: clear a record to launch, or generate one.
 *
 * Laboratory and Microscope are deliberately not listed here at all — see
 * DEFINITIONS.md. Both only resolve to a real destination once a record is
 * already in view, and a sidebar entry that's disabled until you've already
 * gone somewhere else isn't navigation, it's decoration. They're reachable
 * from any card, and cross-link to each other once you're inside one.
 */
function groups(heldCount: number): { label: string; sections: Section[] }[] {
  return [
    {
      label: "Signal",
      sections: [
        { icon: ObservatoryIcon, name: "Observatory", href: "/observatory" },
        { icon: VivariumIcon, name: "Vivarium", href: "/vivarium" },
      ],
    },
    {
      label: "Protocol",
      sections: [
        { icon: QuarantineIcon, name: "Quarantine", href: "/quarantine", count: heldCount },
        { icon: SupercomputerIcon, name: "Supercomputer", href: "/supercomputer" },
      ],
    },
  ];
}

export function SidebarNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Same pool the Observatory reads, so the record count under the wordmark
  // can never claim records the Observatory isn't showing.
  const { register, held } = useRegister();
  const navGroups = groups(held.length);

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
          <Link href="/observatory" className="flex items-center gap-2">
            <LabMark className="size-[19px] shrink-0 text-ink" />
            <span
              className="text-[16px] leading-none font-semibold tracking-[0.01em] text-ink"
              style={{ fontStretch: "118%" }}
            >
              Marketers Lab
            </span>
          </Link>
          <p className="mt-2 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-4 uppercase">
            Growth science
          </p>
          <p className="field-label mt-3">
            {BRANDS.length} brands · {register.length} records
          </p>
        </div>

        <nav aria-label="Sections" className="flex-1 overflow-y-auto border-t border-rule px-3 py-4">
          {navGroups.map((group, i) => (
            <div key={group.label} className={i === 0 ? "" : "mt-5"}>
              <p className="field-label px-2.5">{group.label}</p>
              <ul className="mt-2 space-y-0.5">
                {group.sections.map((s) => (
                  <SectionLink key={s.name} section={s} pathname={pathname} />
                ))}
              </ul>
            </div>
          ))}
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
      <Link href="/observatory" className="flex items-center gap-2">
        <LabMark className="size-[16px] shrink-0 text-ink" />
        <span
          className="text-[15px] leading-none font-semibold tracking-[0.01em] text-ink"
          style={{ fontStretch: "118%" }}
        >
          Marketers Lab
        </span>
      </Link>
    </div>
  );
}

function SectionLink({ section, pathname }: { section: Section; pathname: string }) {
  const isActive = pathname.startsWith(section.href);
  const Icon = section.icon;

  return (
    <li>
      <Link
        href={section.href}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-[5px] px-2.5 py-[7px] transition-colors ${
          isActive ? "bg-surface" : "hover:bg-surface/60"
        }`}
      >
        <Icon className={`size-[16px] shrink-0 ${isActive ? "text-ink" : "text-ink-3"}`} />
        <span
          className={`min-w-0 flex-1 truncate text-[13px] leading-tight font-medium ${
            isActive ? "text-ink" : "text-ink-2"
          }`}
        >
          {section.name}
        </span>
        {section.count !== undefined && section.count > 0 && (
          <span
            title={`${section.count} held`}
            className="shrink-0 rounded-full border border-rule-2 px-1.5 py-px font-mono text-[9.5px] leading-[1.5] font-medium text-ink-3"
          >
            {section.count}
          </span>
        )}
      </Link>
    </li>
  );
}
