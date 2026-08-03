import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-28 sm:px-8">
      <p className="field-label">404</p>
      <h1 className="mt-3 text-[28px] font-semibold text-ink" style={{ fontStretch: "108%" }}>
        No record at this address.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[14.5px] leading-[1.6] text-ink-2">
        Every experiment in this instance carries an ID like <span className="font-mono">EXP-0112</span>.
        Head back to the register to find the one you were after.
      </p>
      <Link
        href="/observatory"
        className="mt-6 inline-block rounded-[4px] bg-ink px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-paper uppercase transition-opacity hover:opacity-85"
      >
        Open the Observatory
      </Link>
    </div>
  );
}
