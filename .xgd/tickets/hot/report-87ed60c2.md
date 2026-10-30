---
uid: report-87ed60c2
id: REPORT-4484
type: report
title: 'Resync resolve conflicts: 18ffaec45665d29545db8bfd323ee4bf6d1f8678'
created_by: xgd
created_at: '2026-09-20T18:54:24.559035+00:00'
updated_at: '2026-09-20T18:54:24.559035+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Summary

Cherry-pick of `ced4356a6a` — *"feat(schema): a site knows where it is, and both renderers say so [FREE-CODED]"* (REQ-151, authored 2026-08-21).

All 5 conflicts resolved toward HEAD. Every ours-side commit in this conflict set is dated 2026-08-22 against the incoming commit's 2026-08-21, so the injected per-file rule ("take the more recent commit by timestamp, flag for post-merge review") points to HEAD uniformly.

**The resolved tree is byte-identical to HEAD — this pick is a verified no-op.** `git diff --cached HEAD` is empty. Per STEP 4, staged and exited without calling `--skip`; finalize will detect the clean staged diff.

## Files resolved

- **`package.json`** — UU, class 2g (config, scalar). Kept HEAD's `"version": "0.2.40"` over incoming `"0.2.2"`. 2g says "scalar conflicts: incoming wins", but the incoming value is a *lower* free-coded bookkeeping bump from a month-old commit; taking it would regress the published version. Resolved per the injected timestamp rule instead. Flagged below.
- **`packages/site-schema/src/locale.ts`** — AA, class 2b (both added). HEAD is a **strict superset**: `git diff ced4356a6a:<f> HEAD:<f>` = 89 insertions, **0 deletions**. Incoming's 281 lines are present verbatim as merged common context; HEAD adds the REQ-153 locale-shaped-slug reservation on top. 2b: "incoming wins where one is a strict superset" — here HEAD is the superset, so HEAD carries both sides.
- **`packages/site-schema/src/schema.ts`** — UU, class 2c (code). Import-list conflict only. HEAD's 4 symbols (`isLocaleShapedSlug`, `isSupportedCountry`, `isWellFormedLocale`, `localeShapedSlugMessage`) ⊃ incoming's 2. Kept HEAD; all 4 verified in use (lines 561, 562, 930, 945), so no dangling import.
- **`tests/test_UAT_FC_REQ-151_site_locale.test.ts`** — AA, 3 hunks, class 2f (UAT). HEAD is a **strict superset**: 38 insertions, **0 deletions**. **No test function on either side was deleted.** Incoming's 308 lines are fully present; HEAD adds `DEFAULT_COUNTRY` to the import, strengthens the AC-1 assertion block, and adds `test_UAT_FC_REQ-151_an_unregistered_but_well_formed_language_tag_validates`. The BUG-1301 precedence exception was **not** needed or invoked.
- **`tools/generate/src/render/render.ts`** — UU, class 2c (code). See below; the one substantive call.

## Incoming changes preserved

Verified against `git show ced4356a6a -- <file>` for each of the commit's 8 files.

**Conflicted files — incoming content confirmed present:**

- `locale.ts`, UAT test — confirmed by blob diff: 0 deletions in both directions of incoming→HEAD, i.e. HEAD contains 100% of incoming's lines.
- `schema.ts` — incoming's `isSupportedCountry`/`isWellFormedLocale` imports and their `.refine()` call sites (lines 930, 945) present.
- `render.ts` — incoming's `resolveSiteLocale` import and `ResolvedLocale` type import survive as merged common context (lines 26–27).

**Non-conflicted files from the same commit — confirmed already on HEAD:**

- `packages/framework/src/l1/render.ts` — `<html lang="${escapeHtml(resolved.locale)}" dir="${resolved.dir}">` at line 2507, the commit's headline `lang` fix.
- `packages/framework/src/modules/behavior.ts` — `locale?: ResolvedLocale` prop at line 183.
- `packages/site-schema/src/index.ts` — `export * from './locale'` at line 20.

These three merged without conflict and the tree still equals HEAD, which confirms the content was already present rather than silently applied from the older side.

### Flagged for post-merge review

**1. `tools/generate/src/render/render.ts` — incoming's literal import line was NOT taken.**

This is the only place incoming's literal text was rejected, so it is called out explicitly rather than buried:

- incoming (`ced4356a6a`, 2026-08-21): `import type { LoadedSite } from '../store/loadSite'`
- HEAD (`94983a2b61`, 2026-08-22, *"fix(render): import a type from where it is declared"*): `import type { LoadedSite } from '../store/assemble'`

Same symbol, same purpose — only the source module differs. HEAD's commit is a documented REQ-149 fix whose in-code rationale states that re-exporting `LoadedSite` through `loadSite` drags `node:fs`/`node:path` into a Worker's **type** program (erased for the bundler, not for `tsc`), breaking control-app's build. Taking incoming here would reintroduce a fixed build failure. No functionality is lost: the type resolves identically.

This is a genuine overlapping edit where the two sides are mutually exclusive on one line. Generic rule 2c would say "incoming wins"; the injected per-file rule says "more recent by timestamp" (HEAD, by one day) — the injected rule governs, and it agrees with the engineering reality. Flagging per that rule's "flag for post-merge review" clause.

**2. `package.json` version scalar** — HEAD `0.2.40` retained over incoming `0.2.2`, as described above.

### BUG-1301 precedence exception

**Not invoked.** No hunk was dropped on the grounds that its target had already been removed. No test function was deleted. Both AA files resolved as HEAD-superset with zero deletions in either direction.
