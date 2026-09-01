---
uid: report-9ff78fa2
id: REPORT-3139
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T00:21:14.326428+00:00'
updated_at: '2026-09-01T00:21:14.326428+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

Incoming commit: ced4356a `feat(schema): a site knows where it is, and both
renderers say so [FREE-CODED]` (2026-08-21). All four conflicts were narrow;
every substantive hunk of the incoming commit auto-merged cleanly or was
already present in HEAD.

- **package.json** — UU, 2g config scalar. Conflict was `version` only:
  HEAD `0.2.16` vs incoming `0.2.2`. Kept HEAD. The incoming commit's bump to
  0.2.2 was superseded by later bumps already on HEAD (e.g. b1d79b4f "bump
  version to 0.2.13"); HEAD-side commit 1213d247 is 2026-08-31 vs incoming
  2026-08-21, so the timestamp rule in the enrichment metadata also selects
  HEAD. Rolling back to 0.2.2 would regress a monotonic counter.

- **packages/site-schema/src/locale.ts** — AA, rule 2b (one side a strict
  superset). Both sides added the file. Verified by byte diff of merge stages
  :2 vs :3 — ours is identical to theirs for all 281 incoming lines and then
  adds 90 lines of REQ-153 work (`ISO_639_1_LANGUAGES`, `LOCALE_SHAPED`,
  `isLocaleShapedSlug`, `localeShapedSlugMessage`). Kept the superset.

- **packages/site-schema/src/schema.ts** — UU, rule 2c.2 (non-overlapping,
  combine). Conflict was the `./locale` import list only. HEAD's list contains
  all five incoming names (`COUNTRY_DEFAULTS`, `isCurrencyCode`,
  `isKnownTimezone`, `isSupportedCountry`, `isWellFormedLocale`) plus two
  REQ-153 additions. Kept the union (= HEAD's list). The incoming commit's
  second hunk — the `country`/`locale`/`currency`/`timezone` field block — was
  never conflicted and is present at lines 928-966.

- **tools/generate/src/render/render.ts** — UU, rule 2c.2 (non-overlapping,
  combine). Kept HEAD's `import type { LoadedSite } from '../store/assemble'`.
  This is NOT an intent conflict: `git show ced4356a -- <file>` shows that
  line as unchanged *context*, not an edit. The incoming commit never
  expressed intent about it; HEAD's REQ-149 fix (94983a2b, 2026-08-30) is the
  only intent on that line, and it is a documented build fix — importing
  `LoadedSite` via `loadSite` pulls `node:fs`/`node:path` into a Worker's type
  program and fails control-app's build. Taking "incoming" here would have
  reverted that fix on a line the developer did not touch.

## Incoming changes preserved

Confirmed present in the resolved tree for every code file:

- locale.ts — all 281 incoming lines byte-identical (verified by diffing the
  incoming blob against the resolved file's first 281 lines).
- schema.ts — the four `siteConfigSchema` fields `country` (928), `locale`
  (943), `currency` (955), `timezone` (966), and all five incoming imports.
- render.ts — `resolveSiteLocale` import (26), `ResolvedLocale` type import
  (27), the `locale` prop threaded into `renderModuleInstances` (111, 130),
  `const locale = resolveSiteLocale(site.config)` (153), and
  `<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">` (208)
  replacing the `lang="en"` literal.
- The commit's four non-conflicted files are all present, including the UAT
  file `tests/test_UAT_FC_REQ-151_site_locale.test.ts`. No test function was
  deleted; the BUG-1301 precedence exception was not invoked and no hunk was
  dropped under it.

## Note: resolution nets to no diff vs HEAD

`git diff --cached HEAD` is empty — the entire effect of ced4356a is already
on HEAD, having arrived by a different route (the REQ-153 locale-slug work
builds directly on top of it, and REQ-149 later fixed one of its imports).
This is the BUG-1109/BUG-1122 redundant-commit case, NOT a discard: STEP 3's
distinguishing check passes, since the incoming commit's key changes are
demonstrably *present* in HEAD rather than absent. Per STEP 4, `--skip` was
not called; the finalize step should detect the clean staged diff and skip the
commit itself. A useful side effect: the empty diff proves the marker removal
reproduced HEAD byte-for-byte, so no syntax error was introduced.
