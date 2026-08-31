---
uid: report-27827bcf
id: REPORT-3034
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T19:38:13.380788+00:00'
updated_at: '2026-08-31T19:38:13.380788+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `packages/site-schema/src/locale.ts` — **AA (both added)**, rule 2b (superset).
  A byte-level diff of `:2:` vs `:3:` showed a single hunk, `281a282,370`: the
  incoming (free_coded, REQ-151) 281-line file is an exact prefix of HEAD's, and
  HEAD appends the REQ-153 `ISO_639_1_LANGUAGES` / `isLocaleShapedSlug` /
  `localeShapedSlugMessage` block. HEAD is a strict superset that already
  contains every incoming line, so `git checkout --ours` keeps both sides'
  content with nothing from incoming dropped.

- `packages/site-schema/src/schema.ts` — **UU**, rule 2c.2 (non-overlapping,
  combine). The only conflict was the `./locale` import list: incoming imports
  `COUNTRY_DEFAULTS, isCurrencyCode, isKnownTimezone, isSupportedCountry,
  isWellFormedLocale`; HEAD imports those same five plus `isLocaleShapedSlug`
  and `localeShapedSlugMessage`. Kept the seven-name union. Incoming's other
  hunk (the `country`/`locale`/`currency`/`timezone` fields on
  `siteConfigSchema`) merged without conflict and is present at lines 900–970.

- `tools/generate/src/render/render.ts` — **UU**, rule 2c.2 plus the ambient-hunk
  check. Incoming's authored change to this file is the
  `resolveSiteLocale`/`ResolvedLocale` import, the `locale: ResolvedLocale`
  parameter threaded through `renderModuleInstances`, the
  `resolveSiteLocale(site.config)` call in `renderPage`, and
  `<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">`. All of that
  merged clean and is present (lines 26–27, 107, 126, 153, 208).
  The conflicted region was the adjacent `LoadedSite` import line, which
  incoming did **not** touch — `git diff c36373c1 0952a9b7 -- <file>` shows it
  only as context. HEAD's side is the deliberate REQ-149 fix
  (`../store/loadSite` → `../store/assemble`, with its explanatory comment),
  landed after the incoming commit. Incoming's `../store/loadSite` here is
  timeline drift, not developer intent, so HEAD's `../store/assemble` import was
  kept. Verified `tools/generate/src/store/assemble.ts:18` declares
  `export interface LoadedSite`, so the import resolves.

## Incoming changes preserved

Confirmed for every code file — and, in this case, more strongly than usual:
the staged tree is byte-identical to HEAD (`git diff --cached --stat HEAD` is
empty), and `git diff HEAD 0952a9b7` over the incoming commit's four
clean-merged files (`tests/test_UAT_FC_REQ-151_site_locale.test.ts`,
`packages/framework/src/l1/render.ts`,
`packages/framework/src/modules/behavior.ts`,
`packages/site-schema/src/index.ts`) is also empty.

This is the BUG-1109/BUG-1122 redundant-commit case, not a discard. The whole of
REQ-151 already reached this branch through a different route: HEAD's
`feat(schema): reserve locale-shaped page slugs [FREE-CODED]` and
`fix(render): import a type from where it is declared [FREE-CODED]` were both
authored on top of the REQ-151 work and carry it. STEP 3's discriminator is
satisfied in the "present" direction — every key change from the incoming diff
was located in HEAD by name, not merely assumed absent:

- `schema.ts` — `COUNTRY_DEFAULTS`, `isCurrencyCode`, `isKnownTimezone`,
  `isSupportedCountry`, `isWellFormedLocale` imported; the four
  `country`/`locale`/`currency`/`timezone` `siteConfigSchema` fields present with
  their `.refine()` validators.
- `render.ts` — `resolveSiteLocale` import, `ResolvedLocale` type import,
  `locale: ResolvedLocale` parameter, `locale` passed to `Component({…})`,
  `resolveSiteLocale(site.config)`, and the `lang`/`dir` attributes.
- `locale.ts` — all 281 incoming lines present verbatim as the file's prefix.
- `tests/test_UAT_FC_REQ-151_site_locale.test.ts` — tracked and identical to the
  incoming version; no test function was dropped, and the BUG-1301 precedence
  exception was not invoked anywhere in this resolution.

No hunk was dropped under the BUG-1301 exception. The one hunk not carried
forward is `render.ts`'s `../store/loadSite` import line, which is ambient
context in the incoming commit rather than an authored change, superseded by the
REQ-149 fix already integrated into HEAD.

Per STEP 4, `--skip` was not called; the staged-clean tree is left for
`cherry_pick_finalize_resolution` to detect. The cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `0952a9b71f334817147366081ea06925e8268a94`) is untouched.
