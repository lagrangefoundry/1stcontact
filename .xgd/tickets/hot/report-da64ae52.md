---
uid: report-da64ae52
id: REPORT-5128
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:17:48.993386+00:00'
updated_at: '2026-09-26T21:17:48.993386+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Summary

All 5 conflicts resolved. In every case HEAD already contained the **entire**
effect of the incoming commit `ced4356a` (REQ-151, "a site knows where it is"),
reached through main by a different path, with later refinements layered on top.
Resolution therefore took HEAD on each file — verified per-file to be a strict
superset of the incoming side, never a discard of developer code.

Net staged diff against HEAD is **empty**. Per the step brief this is staged and
reported as normal; `--skip` was not called and `CHERRY_PICK_HEAD`
(`ced4356a6a0fb88f2fb4f71c6d47060e65881499`) is left intact for the finalize step.

## Files resolved

- **`package.json`** — UU, config scalar (2g) + BUG-1301 precedence.
  Two deltas: `version` 0.2.2 (incoming) vs 0.2.40 (HEAD), and an `astro`
  devDependency present on the incoming side only. Kept HEAD for both.
  The incoming commit's *only* authored change to this file was the version
  bump 0.2.1 → 0.2.2; it did not add `astro` (that line is unchanged context).

- **`packages/site-schema/src/locale.ts`** — AA, strict superset (2b).
  Incoming is 281 lines; ours is those same 281 lines byte-identical (verified
  by diff) plus 89 lines of REQ-153 (`ISO_639_1_LANGUAGES`, `LOCALE_SHAPED`,
  `isLocaleShapedSlug`, `localeShapedSlugMessage`). Kept ours.

- **`packages/site-schema/src/schema.ts`** — UU, import-list union (2c).
  Sole conflict was the `./locale` import list; HEAD's list is a superset of
  incoming's. Full-file diff ours-vs-theirs shows ours differs *only* by the
  REQ-153 additions (`isLocaleShapedSlug`, `localeShapedSlugMessage`, and the
  `slug` `superRefine`). All four incoming REQ-151 fields are present. Kept ours.

- **`tests/test_UAT_FC_REQ-151_site_locale.test.ts`** — AA, keep-both (2b/2f).
  Full-file diff ours-vs-theirs is **additions only** — no `<` lines. Ours adds
  the `DEFAULT_COUNTRY` import, extra assertions inside
  `test_UAT_FC_REQ-151_a_site_declaring_no_locale_renders_exactly_as_before`,
  and the whole extra test
  `test_UAT_FC_REQ-151_an_unregistered_but_well_formed_language_tag_validates`.
  **No test function present on either side was deleted.** Kept ours.

- **`tools/generate/src/render/render.ts`** — UU, adjacency not intent (2c).
  Sole conflict is the `LoadedSite` import source. Full-file diff ours-vs-theirs
  shows this one line is the *only* difference. See next section.

## Incoming changes preserved

Verified present in the resolved tree:

- `render.ts`: `import { resolveSiteLocale }` (L26), `ResolvedLocale` type import
  (L27), the `locale: ResolvedLocale` parameter on `renderModuleInstances` (L107),
  `const locale = resolveSiteLocale(site.config)` (L153), and
  `<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">` (L208) —
  i.e. every REQ-151 change the commit authored to this file.
- `schema.ts`: all four REQ-151 `siteConfigSchema` fields (`country`, `locale`,
  `currency`, `timezone`) with their `refine` validators, at L922–L973.
- `locale.ts`: all 281 incoming lines byte-identical.
- UAT test: all incoming test functions intact.
- The commit's three non-conflicting files (`packages/framework/src/l1/render.ts`,
  `packages/framework/src/modules/behavior.ts`, `packages/site-schema/src/index.ts`)
  merged without conflict.

### Hunks not applied, under the BUG-1301 precedence exception

Two incoming *context* regions were not restored because a legitimate refactor
already integrated into HEAD had removed their target. Neither was authored by
`ced4356a` — both appear as unchanged context in its diff, so nothing the
developer wrote in this commit was discarded.

1. **`render.ts` — `import type { LoadedSite } from '../store/loadSite'`.**
   HEAD imports from `'../store/assemble'` instead, per **REQ-149**
   ("fix(render): import a type from where it is declared"), whose in-file
   comment documents the reason: `loadSite` merely re-exports `LoadedSite` while
   importing `node:path` and filesystem helpers, which is erased for the bundler
   but *not* for `tsc`, putting `node:fs`/`node:path` into a Worker's type
   program and failing control-app's build. Restoring `loadSite` would
   reintroduce a known build break. This is a documented, targeted, later fix —
   a legitimate refactor, not a resolution shortcut.

2. **`package.json` — the `"astro": "^7.0.4"` devDependency.**
   Removed by **REQ-148**, which eliminated Astro from the render path entirely;
   `render.ts` opens with "ASTRO IS GONE FROM THIS FILE (REQ-148)" and explains
   that behavior modules are now plain TypeScript functions with no container to
   create. Re-adding the dependency would resurrect a package a completed
   refactor deliberately deleted.

The `package.json` version was kept at HEAD's 0.2.40 rather than incoming's
0.2.2: the resync branch is rooted on main, which is 38 patch releases ahead,
and accepting the older scalar would regress the published version.
