---
uid: report-dcd46deb
id: REPORT-3140
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:24:15.171895+00:00'
updated_at: '2026-09-01T00:24:15.171895+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `packages/site-schema/src/locale.ts` — AA (both added), rule 2b (one side
  strictly a superset). HEAD's blob is byte-identical to the incoming blob for
  its full 281 lines, then appends the REQ-153 block
  (`ISO_639_1_LANGUAGES`, `LOCALE_SHAPED`, `isLocaleShapedSlug`,
  `localeShapedSlugMessage`). Kept the superset (HEAD); stripped markers only.
  `diff <incoming blob> <resolved>` reports zero `<` lines — nothing from
  incoming is absent.

- `packages/site-schema/src/schema.ts` — UU, rule 2c.2/2c.3a. Single conflict
  region: the `./locale` import list. HEAD's list is a strict superset of
  incoming's (adds `isLocaleShapedSlug`, `localeShapedSlugMessage` alongside
  incoming's `isSupportedCountry`, `isWellFormedLocale`). Kept the superset.
  Incoming's other hunk (the +63-line `country`/`locale`/`currency`/`timezone`
  block on `siteConfigSchema`) auto-merged and is present verbatim.

- `tools/generate/src/render/render.ts` — UU. Single conflict region: the
  `LoadedSite` type import. Kept HEAD (`../store/assemble`, the REQ-149 fix)
  over `../store/loadSite`. Both sides are free_coded, so the working-timeline
  rule applies: HEAD's commit 94983a2b61 `fix(render): import a type from where
  it is declared [FREE-CODED]` is dated 2026-08-22 17:07, later than the
  incoming merge 0952a9b71f dated 2026-08-21 13:30. Independently, the incoming
  commit does not modify this line at all — it appears as an unchanged context
  line in `git show 0952a9b71f -m --first-parent -- tools/generate/src/render/render.ts`.
  The conflict arose only because HEAD rewrote this line while incoming rewrote
  the line above it. `LoadedSite` is declared at `tools/generate/src/store/assemble.ts:18`,
  so the kept import resolves.

## Incoming changes preserved

Verified per file by diffing the incoming blob against the resolved working-tree
file and inspecting every `<` (incoming-only) line.

- `locale.ts` — no incoming-only lines. Resolution is a strict superset.

- `schema.ts` — one incoming-only line, `    slug: z.string(),`, superseded by
  HEAD's `slug: z.string().superRefine(...)` REQ-153 refinement of the same
  field. Not a discard: the incoming commit's own diff for this file does not
  touch the `slug` line (it is pre-existing on both sides), and all four of
  incoming's `siteConfigSchema` locale fields plus its `./locale` import are
  present in the resolution.

- `render.ts` — the only difference from the incoming blob is the `LoadedSite`
  import line discussed above. All four of incoming's REQ-151 hunks are present
  verbatim: `resolveSiteLocale` value import and `ResolvedLocale` type import
  (lines 26-27), the `locale: ResolvedLocale` parameter on
  `renderModuleInstances` (line 111), the `locale` prop passed to `Component`
  (line 130), `const locale = resolveSiteLocale(site.config)` (line 157), and
  `<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">` (line 212).

No hunks were dropped under the BUG-1301 precedence exception; no test files
were in conflict.

## Net staged diff

The resolution nets to no diff vs HEAD — `git status --porcelain` shows no `M`
lines after staging. The REQ-151 content this commit carries is already in HEAD
via the earlier free-REQ-151 integration, so this is the redundant-commit case
(BUG-1109/BUG-1122), not a discard: STEP 3's check confirms the incoming
commit's key changes are *present* in HEAD rather than absent. Per STEP 4,
`--skip` was NOT called; the cherry-pick sequencer state (CHERRY_PICK_HEAD) is
intact for cherry_pick_finalize_resolution.
