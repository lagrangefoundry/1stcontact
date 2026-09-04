---
uid: report-b8a28704
id: REPORT-3300
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:12:42.343791+00:00'
updated_at: '2026-09-02T18:12:42.343791+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

Cherry-pick: `ced4356a6a0fb88f2fb4f71c6d47060e65881499` — *feat(schema): a site knows where it is, and both renderers say so [FREE-CODED]* (REQ-151, authored 2026-08-21).

**Headline**: this commit's content is already present in HEAD in full — it landed earlier via a post-watermark sync — and HEAD carries two later free-coded refinements on top of it (REQ-153, REQ-149). Every conflict was HEAD-superset-vs-incoming-subset, so all four resolved toward HEAD, and the staged tree is byte-identical to HEAD (`git diff --cached HEAD` is empty). The finalize step should skip the commit (BUG-1109/BUG-1122). No `--skip` was called from here.

## Files resolved

- **`package.json`** — UU, version scalar. Kept HEAD's `0.2.20` over incoming's `0.2.2`. HEAD's side comes from `510d40823` (`[FREE-CODED] REQ-162 — version 0.2.20`, 2026-08-31), later than the incoming commit (2026-08-21); the incoming bump is bookkeeping, not code. Only diff in this file.
- **`packages/site-schema/src/locale.ts`** — AA (both added), 2b superset rule. The two versions are identical for lines 1–281; HEAD appends 90 further lines (`ISO_639_1_LANGUAGES`, `LOCALE_SHAPED`, `isLocaleShapedSlug`, `localeShapedSlugMessage`) from `6852ca135` (*reserve locale-shaped page slugs [FREE-CODED]*, REQ-153, 2026-08-22). HEAD is a strict superset — kept HEAD.
- **`packages/site-schema/src/schema.ts`** — UU on the `./locale` import block, 2c/3a. HEAD's import list is incoming's list plus `isLocaleShapedSlug` and `localeShapedSlugMessage`, which HEAD's `pageSchema.slug` `superRefine` (REQ-153) requires. `git diff HEAD:… <incoming>:…` shows HEAD ⊃ incoming for the whole file. Kept HEAD.
- **`tools/generate/src/render/render.ts`** — UU on the `LoadedSite` type import, 2c/3a. Incoming carries `import type { LoadedSite } from '../store/loadSite'` as unchanged context; HEAD changed it to `'../store/assemble'` in `94983a2b6` (*import a type from where it is declared [FREE-CODED]*, REQ-149, 2026-08-22), which is strictly later and fixes a real control-app `tsc` failure (`node:fs`/`node:path` leaking into a Worker type program). The conflict is adjacent-line churn from incoming's two new import lines directly above, both of which are already in HEAD. Kept HEAD.

## Incoming changes preserved

Verified with `git diff HEAD:<path> <CHERRY_PICK_HEAD>:<path>` per file — every diff runs one direction only (HEAD adds, never removes), i.e. HEAD is a superset of the incoming blob:

- `tools/generate/src/render/render.ts` — all four incoming hunks present in the resolved file: `import { resolveSiteLocale }` and `ResolvedLocale` (lines 26–27), the `locale: ResolvedLocale` parameter on `renderModuleInstances` (111), the `locale` prop passed to `Component({…})` (130), `const locale = resolveSiteLocale(site.config)` in `renderPage` (157), and `<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">` (212) replacing the `lang="en"` literal.
- `packages/site-schema/src/schema.ts` — both incoming hunks present: the five-symbol `./locale` import, and the four `siteConfigSchema` fields `country` / `locale` / `currency` / `timezone` with their `isSupportedCountry` / `isWellFormedLocale` / `isCurrencyCode` / `isKnownTimezone` refinements (lines 928–975).
- `packages/site-schema/src/locale.ts` — the entire incoming file (279 lines: `COUNTRY_DEFAULTS`, `DEFAULT_COUNTRY`, `UNDECLARED_LOCALE`, `localeDirection`, `resolveSiteLocale` and the four predicates) is present verbatim as the head of the resolved file.
- `package.json` — the incoming change is a version scalar only; superseded per the resync-version rule, no code lost.

The incoming commit's four non-conflicting files are byte-identical between HEAD and `CHERRY_PICK_HEAD` (`git diff HEAD <sha> -- …` empty), so nothing was lost outside the conflict set either: `packages/framework/src/l1/render.ts`, `packages/framework/src/modules/behavior.ts`, `packages/site-schema/src/index.ts`, and the UAT file `tests/test_UAT_FC_REQ-151_site_locale.test.ts` — all 308 lines of which are present in HEAD. No test function was deleted, and the BUG-1301 precedence exception was not invoked: no hunk was dropped as obsolete.
