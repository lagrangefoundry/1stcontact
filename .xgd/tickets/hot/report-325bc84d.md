---
uid: report-325bc84d
id: REPORT-6993
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:48:03.147466+00:00'
updated_at: '2026-10-31T21:48:03.147466+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- apps/control-app/src/material.ts — code file (2c) — HEAD side kept via STEP 3h (incoming already integrated; see below)
- package.json — config scalar (2g) — HEAD `0.2.48` kept; incoming `0.2.42` is a stale, older version string
- tests/reconciliation-site-asset-listing.test.ts — test file (2c) — HEAD side kept (stricter entry-shape assertions, "asset store" wording)
- tests/test_UAT_FC_BUG-44_surface_tells_the_truth.test.ts — AA / UAT (2b/2f) — HEAD side kept
- tools/generate/src/cli/ai/l1-surface.json — code/data (2c) — HEAD side kept ("Site asset" label from REQ-176)

## Incoming changes preserved

The incoming commit d46756fefa ("fix(assets): a site's assets are the bytes it holds", BUG-44) is ALREADY ON HEAD as 55827606bc with the same subject. The code-file portion is the same (16 files, +301/-456 in both). The commit's key changes (site-level `assets` registry removed, `get_asset` answers from the listing, promotion goes through `editAssetAdd`, BUG-44 UATs) are all present in HEAD. After resolution the staged diff vs HEAD for the code files is empty — a redundant commit, not a discarded one (BUG-1109/BUG-1122 shape). Finalize should detect the empty diff and skip.

Every conflicting hunk is in a region that LATER HEAD commits changed on top of 55827606bc:
- material.ts: 7a37fb8682 (free-BUG-47) added `recordPlacement`/`placedOn`; the incoming side would delete them.
- l1-surface.json and BUG-44 UAT: 8c01747965 (free-REQ-176) renamed the drop-area label "Put it on the site" → "Site asset"; the UAT assertion follows that rename.
- BUG-44 UAT: 328f474f91 (reconcile review) moved the `write_image` stand-in test to test_UAT_AC2014_drawing_is_declared_never_to_stand_in_for_a_client_supplied_file in reconciliation-beyond-l1-authoring.test.ts. The test is moved, not deleted.
- reconciliation-site-asset-listing.test.ts: 328f474f91 tightened the assertions and added the legacy-`assets`-key-ignored check.
- package.json: free-REQ-177 bumped the version to 0.2.48.

## Arbitration of last resort (BUG-1460)

All five files were resolved via STEP 3h, tier 1 — evidence that the incoming commit is stale on this branch: its content is already integrated as 55827606bc (Oct 30) and later intents (BUG-47, REQ-176, REQ-177, reconcile bundle-5607a08d) were built on top of it. Taking the incoming side on these hunks would revert those later intents, not apply BUG-44. Side dropped: incoming (theirs) hunks only. No developer content is lost. Flag for post-merge review per the enrichment rule: material.ts, package.json, l1-surface.json, and both test files.
