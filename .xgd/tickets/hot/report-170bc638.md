---
uid: report-170bc638
id: REPORT-2943
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:39:16.342530+00:00'
updated_at: '2026-08-31T14:39:16.342530+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

Cherry-picked commit: 0952a9b71f334817147366081ea06925e8268a94
("Merge branch 'free-REQ-151' into xgd-working", 2026-08-21, mainline parent
c36373c10b87e81815aa7bff01d786e5e554178f).

## Headline

This commit's payload is ALREADY IN HEAD, landed by a different route. HEAD
carries `bbce12ddd4 feat(schema): a site knows where it is, and both renderers
say so [FREE-CODED]`, whose diff is byte-for-byte the incoming merge's mainline
diff — the same 7 files with the same shape (716 insertions, 8 deletions:
packages/framework/src/l1/render.ts, packages/framework/src/modules/behavior.ts,
packages/site-schema/src/index.ts, packages/site-schema/src/locale.ts,
packages/site-schema/src/schema.ts, tests/test_UAT_FC_REQ-151_site_locale.test.ts,
tools/generate/src/render/render.ts).

HEAD then carries two LATER free-coded commits built on top of it:

  - 6852ca1359 feat(schema): reserve locale-shaped page slugs [FREE-CODED] (REQ-153)
  - 94983a2b61 fix(render): import a type from where it is declared [FREE-CODED] (REQ-149)

All three conflicts are that gap and nothing else: on every conflicted file, the
HEAD side is the incoming side plus one of those later commits. Both sides are
`free_coded`, so the STEP 2 exception applies — later working-timeline position
wins, per fact. Every conflict resolved to ours; each was verified as a strict
superset of theirs first, not assumed.

The staged tree therefore nets to no diff vs HEAD. Per STEP 4 this is the
redundant-commit case (BUG-1109/BUG-1122), NOT a discard: STEP 3's check below
confirms the incoming commit's key changes are present in HEAD, not absent.
`--skip` was not called; finalize will detect the clean staged diff.

## Files resolved

- `packages/site-schema/src/locale.ts` — AA (both added). Rule 2b, "one side is
  strictly a superset". `git diff :2 :3` is 89 deletions and zero insertions:
  ours is theirs' 279 lines verbatim plus REQ-153's `ISO_639_1_LANGUAGES`,
  `LOCALE_SHAPED`, `isLocaleShapedSlug()` and `localeShapedSlugMessage()`.
  Resolved to ours (the superset). `git checkout --ours`, `git add`.

- `packages/site-schema/src/schema.ts` — UU, code file. One conflict hunk: the
  `./locale` import list. Ours = theirs plus `isLocaleShapedSlug` and
  `localeShapedSlugMessage`, the two symbols REQ-153's `slug` superRefine needs.
  All of theirs' REQ-151 content (`country`/`locale`/`currency`/`timezone` on
  `siteConfigSchema`, and the `COUNTRY_DEFAULTS`/`isCurrencyCode`/
  `isKnownTimezone`/`isSupportedCountry`/`isWellFormedLocale` imports) is present
  in ours and never conflicted. Resolved to ours.

- `tools/generate/src/render/render.ts` — UU, code file. One conflict hunk: the
  `LoadedSite` type import. Theirs has `from '../store/loadSite'`; ours has
  `from '../store/assemble'` with REQ-149's comment explaining why (loadSite
  merely re-exports the type while importing `node:path`, which put `node:fs`/
  `node:path` into a Worker's TYPE program and failed control-app's build).
  `tools/generate/src/store/assemble.ts` is tracked and is where `LoadedSite` is
  declared, so ours resolves. Ours is theirs plus that fix. Resolved to ours.

## Incoming changes preserved

No hunk was dropped under the BUG-1301 precedence exception; nothing was deleted
and no test function was touched. Every incoming change is present in the
resolved tree — verified against `git diff c36373c1 0952a9b7 -- <file>`:

- render.ts, all six REQ-151 hunks present in the resolved file:
  `import { resolveSiteLocale }` and the `ResolvedLocale` type import (L26–27);
  the `locale: ResolvedLocale` parameter on `renderModuleInstances` (L111);
  `locale` passed through to `Component({...})` with its REQ-151 comment
  (L120–131); `const locale = resolveSiteLocale(site.config)` and its pass to
  `renderModuleInstances` (L157–158); the REQ-151 `lang`/`dir` comment and
  `<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">` (L205–212).
  These all merged cleanly and were never in conflict.
  The one incoming line NOT in the result is
  `import type { LoadedSite } from '../store/loadSite'`. That is not a discard:
  it is the exact line HEAD's later free-coded commit 94983a2b61 deliberately
  corrected. Keeping theirs would reintroduce the Worker type-program breakage
  REQ-149 was written to fix.

- schema.ts: theirs' entire 63-line REQ-151 addition is present in ours
  unchanged. The only divergence is ours' two extra imports, which are additive.

- locale.ts: ours contains theirs in full — the `git diff :2 :3` between the two
  stages is deletions only, so not one incoming line is missing.

- The commit's other four files (framework l1/render.ts, framework
  modules/behavior.ts, site-schema/index.ts, and
  tests/test_UAT_FC_REQ-151_site_locale.test.ts) never conflicted; all four are
  tracked in HEAD via bbce12ddd4.

Nothing here needs post-merge review: the "intent unknown" enrichment note
resolved on inspection to both-sides-free_coded with a clean superset relation on
every file.
