---
uid: report-68ffa1a7
id: REPORT-1447
type: report
title: 'Sync-main review: reconcile-BUNDLE-13'
created_by: xgd
created_at: '2026-08-06T19:45:59.516585+00:00'
updated_at: '2026-08-06T19:45:59.516585+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-13
---

{
  "findings": [
    {
      "risk": "CRITICAL",
      "file": ".xgd/tickets/hot/bundle-e0143ffa.md",
      "description": "Semantic revert of main's intent. Since the old merge-base (fa6888c31), main updated this bundle's 11 `working_sha` pointers from pre-resync SHAs to post-resync SHAs (commits 7e676e266, 58fb208d6, 039cf1722, 49fd6e47e - the xgd-working resync / BUG-848 restore) and ADDED an `orphan_commits` field mapping 2 rewritten commits (16e828c65->338b1085d, e99a33f38->a99a7fe3d). The result HEAD reverts BOTH: all 11 working_sha values are restored to the stale pre-resync values, and the `orphan_commits` block main added is deleted entirely. Verified reachability: the restored SHAs (e.g. 7676a1a76, 0c8c223bf, 408ec05d4) exist but are NOT reachable from xgd-working (orphaned by the resync), while main's values (e1d1f75ce, 573764b1b, e045ea6cf) ARE on xgd-working. Cause: commit e6cb113e3 'xgd(ticket): update bundle bundle-e0143ffa' is the OLDEST commit replayed onto main (position 231/231); it writes a full-file snapshot captured before main's resync remap, so it applied cleanly and silently clobbered main's newer state. No later branch commit touches this file, so the stale version is the final state. Merging this to main would leave the bundle pointing at 11 non-existent working commits and lose the BUG-848 orphan mapping, breaking main_sha stamp-back. Note: strict_advance_gate did not catch this because it does not cover .xgd/tickets/."
    },
    {
      "risk": "LOW",
      "file": ".xgd/tickets/hot/request-1b56fccd.md",
      "description": "Cosmetic only. The branch appended a stray bare '-' plus blank line to the body, leaving a duplicated dangling '-' at end of file. Main's substantive change to this file (working_sha 408ec05d4 -> e045ea6cf) SURVIVED intact - this is not a revert."
    },
    {
      "risk": "OK",
      "file": "tools/generate/src/deploy/, apps/public-site/src/, bin/verify_req108_pointer.mjs, tests/req1*.test.ts",
      "description": "No resurrection. The briefing marked these '(deleted)', but the marker is a diff-direction artifact - verified via `git cat-file -e main:<path>` and `git log main -- <path>` that these paths have ZERO commits in main's history and never existed on main. They are net-new branch additions from the FREE-CODED bundle commits (REQ-108/109/110/111/113). Main made no code changes at all between the old merge-base and its head (diff is confined to .xgd/tickets/), so code-side semantic reverts are impossible by construction. No conflict markers anywhere. `pnpm -r build` passes; `vitest run` passes 1022 tests / 152 files (4 files, 67 tests skipped), confirming no integration inconsistency from the replay."
    }
  ]
}
