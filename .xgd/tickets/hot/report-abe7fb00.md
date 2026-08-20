---
uid: report-abe7fb00
id: REPORT-2276
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-19'
created_by: xgd
created_at: '2026-08-20T00:34:51.601342+00:00'
updated_at: '2026-08-20T00:34:51.601342+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-19
---

## Files resolved

- `package.json` — UU, config file / monotonic version scalar (rule 2g + conflict-intent enrichment).
  HEAD (`sync_working_to_main`, `xgd: sync from xgd-working 5ed608341606`, 2026-08-19) carried
  `"version": "0.1.58"`; incoming (`free_coded` e70668dd1, 2026-08-15) carried `"version": "0.1.46"`.
  The enrichment rule for unknown-intent pairs is "take the more recent commit by timestamp" — HEAD
  is four days newer, and its value is strictly higher on a monotonic counter. Kept `0.1.58`.
  Taking incoming would have regressed the project version to a number twelve bumps behind, one
  already consumed by later commits on main. Flagged for post-merge review per the enrichment rule.

Auto-merged by git, no markers, already staged (verified against the incoming diff, not re-resolved):

- `tests/test_UAT_FC_REQ-137_palette_shade.test.ts` — M, staged.
- `tests/test_UAT_FC_REQ-140_segment_colour.test.ts` — M, staged.
- `.xgd/working-merge.lock` — M, staged.

## Incoming changes preserved

- `package.json` — the incoming commit's only change to this file was the version bump
  `0.1.45 → 0.1.46`. That intent (advance the version) is present in HEAD via a different
  route: HEAD is already at `0.1.58`, past `0.1.46`. This is the STEP 4 / BUG-1109 "superseded,
  not discarded" case, not the STEP 3 "developer code absent" case — no developer logic exists
  in this hunk to lose.

- `tests/test_UAT_FC_REQ-137_palette_shade.test.ts` — `git diff --cached HEAD` for this file is
  byte-identical to `git show e70668dd1 -- <file>`. Present: the `existsSync` import, the rewritten
  `storedSlugs()` doc comment, and the added
  `.filter((slug) => existsSync(path.join(SITES, slug, 'draft', 'site.json')))`.

- `tests/test_UAT_FC_REQ-140_segment_colour.test.ts` — `git diff --cached HEAD` for this file is
  byte-identical to `git show e70668dd1 -- <file>`. Present: the `SITES` local, the two
  `site.json` / `revisions` assertions replacing the bare directory assertion, and the
  `surviving` filter on the non-empty-store check. No test function was removed — the single
  touched `it()` (`test_UAT_FC_REQ-140_the_dead_example_sites_are_gone_from_the_store`) is
  modified in place and still present.

## Staging state

`git status --porcelain` shows no conflict classes (UU/AA/DU/UD/AU/UA). `package.json` no longer
appears as modified because the resolved content equals HEAD — expected for a superseded version
bump. `CHERRY_PICK_HEAD` left intact for `cherry_pick_finalize_resolution`; no
`--continue`/`--skip`/`--abort`/`reset` was run. Untracked `.xgd/tickets/hot/*` entries are
pre-existing and untouched.
