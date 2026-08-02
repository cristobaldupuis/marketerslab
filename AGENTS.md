<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Marketers Lab

Read `DECISIONS.md` and `PROJECT_BRIEF.md` before structural changes. `README.md` maps what
exists and where the later passes plug in.

## Things that look arbitrary but are not

- **Brand is a taxonomy axis, not a tenant.** A solo marketer's instance has one brand, an
  agency's has three. Same code path, no permission system, no "agency mode".
- **Franchise vs. loonshot changes rigor defaults**, it is not a badge. Loonshots get looser
  kill criteria and longer runways because franchise criteria kill novel ideas before they can
  prove out. `rigor_tier` is settable independently, and the detail view calls out divergence.
- **The rigor dial is a view switcher, not a permission.** Same person, different need.
- **Four taxonomy axes is the ceiling.** Legibility in a 3-minute demo beats completeness.
- **`kill_criteria.registered_at` always precedes `launched_at`.** The UI leans on that gap as
  proof the criteria were pre-registered. Do not seed data that breaks it.

## Conventions

- All data is fabricated and static, in `lib/data/`. No API calls, no auth, no persistence.
- Design tokens live in `app/globals.css` under `@theme`. Colour is semantic and rationed —
  read the comment block there before adding one.
- Taxonomy is carried by chips, state by glyph marks. Keep the two channels separate.
- Dates are formatted with `lib/format.ts`, never `toLocaleDateString` (hydration drift).
- Run `npm run lint` before committing; the React Compiler rules are enabled and strict.
