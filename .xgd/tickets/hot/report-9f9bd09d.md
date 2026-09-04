---
uid: report-9f9bd09d
id: REPORT-3301
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:15:12.367574+00:00'
updated_at: '2026-09-02T18:15:12.367574+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `packages/site-schema/src/locale.ts` — **AA (both added)**, rule 2b. HEAD's version is a strict superset: byte-identical to the incoming file for all 281 of its lines, then appends the REQ-153 block (`ISO_639_1_LANGUAGES`, `LOCALE_SHAPED`, `isLocaleShapedSlug`, `localeShapedSlugMessage`). Kept the superset; nothing from the incoming side dropped.
- `packages/site-schema/src/schema.ts` — **UU code file**, rule 2c.2 (non-overlapping, combined). The only conflicting region was the `./locale` import list. HEAD's list contains both of incoming's added symbols (`isSupportedCountry`, `isWellFormedLocale`) plus two REQ-153 ones. Kept the combined list; incoming's `country`/`locale`/`currency`/`timezone` schema fields were never in conflict and are present verbatim.
- `tools/generate/src/render/render.ts` — **UU code file**, rule 2c.2 (non-overlapping, combined). The conflicting region is the `LoadedSite` type import, which the incoming commit does not touch at all (`git diff c36373c10b 0952a9b71f -- tools/generate/src/render/render.ts` shows only the REQ-151 hunks). Incoming's side of the marker is ambient timeline drift — the pre-REQ-149 `../store/loadSite` path from its older base. Kept HEAD's `../store/assemble` import (REQ-149; `LoadedSite` is declared at `tools/generate/src/store/assemble.ts:18`), and every REQ-151 hunk from incoming.

## Incoming changes preserved

Verified by diffing each resolved file against `git show 0952a9b71f:<path>`:

- **locale.ts** — diff is `281a282,370`: pure append. 100% of incoming's content retained.
- **schema.ts** — diff is two added import lines plus HEAD's `slug` `superRefine` block. All of incoming's REQ-151 additions (`COUNTRY_DEFAULTS` import, `country`, `locale`, `currency`, `timezone` fields with their refinements) present unchanged.
- **render.ts** — the only delta from incoming is the `LoadedSite` import path (HEAD's REQ-149 fix, untouched by the incoming commit). All REQ-151 changes confirmed present: `import { resolveSiteLocale }` (:26), `ResolvedLocale` type import (:27), the `locale: ResolvedLocale` parameter on `renderModuleInstances` (:107), `const locale = resolveSiteLocale(site.config)` (:153), the `locale` prop passed to `Component({...})`, and `<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">` (:208).

No hunk was dropped under the BUG-1301 precedence exception. No test function was deleted — the incoming commit's `tests/test_UAT_FC_REQ-151_site_locale.test.ts` merged cleanly and HEAD's copy is byte-identical to incoming's.

## Note: staged tree nets to no diff vs HEAD

`git diff --cached --stat HEAD` is empty. This is the BUG-1109/BUG-1122 redundant-commit case, not a discard. HEAD already contains this commit's entire effect through an earlier route: for all four cleanly-merged paths (`packages/framework/src/l1/render.ts`, `packages/framework/src/modules/behavior.ts`, `packages/site-schema/src/index.ts`, `tests/test_UAT_FC_REQ-151_site_locale.test.ts`) `git diff HEAD 0952a9b71f -- <paths>` is empty, and for the three conflicted files the STEP 3 check above confirms incoming's key changes are present in HEAD (with REQ-149/REQ-153 layered on top). Per STEP 4 no `--skip` was issued; the resolution is staged and the finalize step detects the clean staged diff.
