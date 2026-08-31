---
uid: report-227686fa
id: REPORT-2942
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:35:49.997980+00:00'
updated_at: '2026-08-31T14:35:49.997980+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

Incoming commit: `ced4356a6a` — _feat(schema): a site knows where it is, and both renderers say so [FREE-CODED]_ (2026-08-21).

- **package.json** — UU, config scalar (2g / conflict-metadata timeline rule). Kept HEAD's `"version": "0.2.9"`. Incoming's only package.json change is a bookkeeping bump `0.2.1 → 0.2.2`; HEAD's `07afe0840d` (2026-08-23, _"chore: version bump — 0.2.8 was claimed at the working tip by this ticket's own auto-commit"_) is the later commit and its value already supersedes it. The second difference (`"astro": "^7.0.4"` present on the incoming side, absent on HEAD's) is untouched context in the incoming commit — its diff is one line, the version only — and was removed by the REQ-148 de-Astro refactor already integrated into HEAD, documented at the top of `tools/generate/src/render/render.ts` ("ASTRO IS GONE FROM THIS FILE (REQ-148)"). No incoming value dropped.

- **packages/site-schema/src/locale.ts** — AA, both added (2b, "one side is strictly a superset"). Kept HEAD's version. Verified byte-identical: the incoming file (281 lines) equals HEAD's first 281 lines exactly (`diff` clean), and HEAD adds 89 further lines (REQ-153: `ISO_639_1_LANGUAGES`, `LOCALE_SHAPED`, `isLocaleShapedSlug`, `localeShapedSlugMessage`). HEAD is a strict superset; nothing incoming is lost.

- **packages/site-schema/src/schema.ts** — UU, code file (2c.3.a, incoming is a subset of HEAD in the conflicted region). Kept HEAD's version. The conflict is the `./locale` import block: incoming imports 5 symbols, HEAD imports those same 5 plus `isLocaleShapedSlug` and `localeShapedSlugMessage`. The only other ours/theirs difference is `slug: z.string()` (theirs) vs HEAD's REQ-153 `superRefine` form. Incoming's own additions — the four REQ-151 `siteConfigSchema` fields — are already present, unmodified, at lines 922–971.

- **tools/generate/src/render/render.ts** — UU, code file (2c.2, non-overlapping changes). Kept HEAD's version. The sole ours/theirs difference is the `LoadedSite` import: HEAD's `from '../store/assemble'` (REQ-149, with its rationale comment — `assemble.ts:18` declares the interface, `loadSite.ts:10` merely re-exports it while pulling `node:fs`/`node:path` into a Worker's type program) vs incoming's `from '../store/loadSite'`. That line is **context** in the incoming diff, not a change it authored — its hunk `@@ -23,7 +23,8 @@` carries it with a leading space. So the two sides are not competing: keeping HEAD's path preserves the REQ-149 fix and discards nothing incoming.

## Incoming changes preserved

Verified by `git show ced4356a6a -- <file>` against the resolved tree. Every hunk of the incoming commit is present in HEAD:

- `tools/generate/src/render/render.ts` — all four REQ-151 hunks present: `resolveSiteLocale` value import (L26), `ResolvedLocale` type import (L27), the `locale: ResolvedLocale` parameter on `renderModuleInstances` (L111) with the locale prop passed to `Component({…, locale})` (L120), `const locale = resolveSiteLocale(site.config)` in `renderPage` (L157), and `<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">` replacing the `lang="en"` literal (L205–212).
- `packages/site-schema/src/schema.ts` — the `./locale` import and all four `siteConfigSchema` fields (`country`, `locale`, `currency`, `timezone`, L922–971) present with their validation refinements.
- `packages/site-schema/src/locale.ts` — the whole 281-line incoming file present verbatim.
- `package.json` — version bump superseded by a strictly later, higher bump on HEAD.
- Files from the commit that merged without conflict, spot-checked as carrying their REQ-151 content: `packages/site-schema/src/index.ts` (L19), `packages/framework/src/l1/render.ts` (`resolveSiteLocale` import L18, call at L2505), `packages/framework/src/modules/behavior.ts` (`ResolvedLocale` import L5, `locale?: ResolvedLocale` prop L183), and the UAT file `tests/test_UAT_FC_REQ-151_site_locale.test.ts` (present, 13636 bytes, test cases intact — note it needs `grep -a`, it reads as binary).

No hunk was dropped under the BUG-1301 precedence exception; nothing needed dropping.

**Net result: `git diff --cached --stat` is empty — the resolution nets to no diff vs HEAD.** This is the redundant-commit case (BUG-1109/BUG-1122), not a discard: STEP 3's distinguishing check confirms the incoming commit's changes are *present* in HEAD (enumerated above with file:line evidence), having arrived through a prior sync, rather than absent. Per STEP 4 no `--skip` was called; the tree is staged and `CHERRY_PICK_HEAD` is intact for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit itself.

## Flagged for post-merge review

The conflict metadata marked all four files "intent unknown on one or both sides — flag for post-merge review". Two are worth a human glance, though both resolutions are evidence-backed above:

- `package.json` — the astro devDependency removal rides along with the version choice.
- `tools/generate/src/render/render.ts` — the `LoadedSite` import path resolves toward HEAD (REQ-149) rather than incoming.

No conflict markers remain; `git status --porcelain` reports no conflict-class lines (only six pre-existing untracked `.xgd/tickets/hot/` files, unrelated to this cherry-pick).
