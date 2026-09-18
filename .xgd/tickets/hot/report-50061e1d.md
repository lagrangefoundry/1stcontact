---
uid: report-50061e1d
id: REPORT-4279
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T04:17:26.910606+00:00'
updated_at: '2026-09-18T04:17:26.910606+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

Incoming commit: `0952a9b7` — *Merge branch 'free-REQ-151' into xgd-working* (Fri Aug 21 13:30:01 2026 -0700).

Controlling finding: the merge's payload parent is `ced4356a` — *feat(schema): a site knows where it is, and both renderers say so [FREE-CODED]* (Aug 21 13:29:54). HEAD already carries `bbce12dd`, which is **byte-identical to `ced4356a`** across all six files the merge touched (`git diff ced4356a bbce12dd -- <the six paths>` is empty). The incoming payload is therefore already integrated into HEAD, and three *later* free_coded/workflow commits refine it:

- `6852ca13` (Aug 22 15:08) — *feat(schema): reserve locale-shaped page slugs [FREE-CODED]* → `locale.ts`, `schema.ts`
- `94983a2b` (Aug 22 17:07) — *fix(render): import a type from where it is declared [FREE-CODED]* → `render.ts`
- `b13bc835` (Sep 9) — *Workflow fix_ac_validation completed: done* → the UAT file

Both sides of every conflict are `free_coded`, so STEP 2c's stated exception applies: **take the later working-timeline position**. HEAD is later on every contested fact. Resolutions:

- `packages/site-schema/src/locale.ts` — **AA**, rule 2b (one side is a strict superset). Ours = theirs + 89 lines, zero insertions on the theirs side. Kept ours (superset), blob `7d0a89e4`.
- `packages/site-schema/src/schema.ts` — **UU**, rule 2c.3 under the both-free_coded exception. Only divergence: theirs has the older `slug: z.string()`; ours has the REQ-153 locale-shaped-slug `superRefine` plus the `isLocaleShapedSlug`/`localeShapedSlugMessage` imports added by `6852ca13`. Taking theirs would delete REQ-153. Kept ours, blob `c5ba4682`.
- `tests/test_UAT_FC_REQ-151_site_locale.test.ts` — **AA**, rules 2b + 2f. Ours = theirs + 38 lines, zero insertions on the theirs side. All 10 of theirs' `it(...)` functions are present in ours, which adds an 11th (`test_UAT_FC_REQ-151_an_unregistered_but_well_formed_language_tag_validates`). **No test function from either side was deleted** — the BUG-1301 precedence exception was not needed or used. Kept ours, blob `f268dbd2`.
- `tools/generate/src/render/render.ts` — **UU**, rule 2c.3 under the both-free_coded exception. Only divergence: theirs has `import type { LoadedSite } from '../store/loadSite'`; ours has `from '../store/assemble'` per `94983a2b`, whose in-file comment documents that importing through `loadSite` pulls `node:fs`/`node:path` into a Worker's type program and breaks control-app's build (REQ-149). Taking theirs would re-break that build. Kept ours, blob `479e813f`.

Each resolution was written with `git cat-file blob <sha> > <path>` and verified byte-exact with `git hash-object` (all four match). Conflict-marker scan returns 0 for all four files.

## Incoming changes preserved

Verified per file with `git diff ced4356a HEAD -- <path>` (incoming payload → HEAD):

- `locale.ts` — 89 insertions, **0 deletions**: every incoming line survives, HEAD only adds.
- `schema.ts` — 17 insertions, 1 deletion: the single deleted line is `slug: z.string()`, superseded in place by the later `6852ca13` refinement that still validates `slug` as a string and adds the locale-shape check.
- `test_UAT_FC_REQ-151_site_locale.test.ts` — 38 insertions, **0 deletions**: every incoming assertion and test function survives.
- `render.ts` — 8 insertions, 1 deletion: the single deleted line is the `LoadedSite` import path, redirected by the later `94983a2b` to the module that declares the type. The symbol and its use are unchanged.

No incoming hunk was discarded. The two superseded single lines are not losses of developer code — they are the older form of a line that a *later* free_coded commit by the same developer deliberately corrected, which is the case STEP 2c's both-free_coded exception exists to cover.

No hunk was dropped under the BUG-1301 precedence exception; it did not apply to any file here.

## Net result

`git status --porcelain` is empty: the staged tree equals HEAD, because the incoming merge's effect already landed via `bbce12dd` and was refined afterwards. This is the redundant-commit case described in STEP 4 (BUG-1109/BUG-1122), not a discard — STEP 3's guard is satisfied because the incoming commit's changes are demonstrably *present* in HEAD, not absent. Per STEP 4 no `--skip`/`--continue`/`--abort` was issued; `CHERRY_PICK_HEAD` is intact for `cherry_pick_finalize_resolution`.

## Flagged for post-merge review

The enrichment metadata classed all four files as "intent unknown on one or both sides." The two content decisions worth a second look are `schema.ts` (REQ-153 slug reservation retained) and `render.ts` (`LoadedSite` imported from `../store/assemble`) — both keep HEAD's later fix over the incoming's older line.
