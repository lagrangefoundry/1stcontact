---
uid: report-4d5405a7
id: REPORT-4105
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:00:06.323370+00:00'
updated_at: '2026-09-12T19:00:06.323370+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `package.json` — UU, config file (rule 2g + enrichment's timeline rule).
  Conflict was the `version` scalar only: HEAD `0.2.31` vs incoming `0.2.11`.
  Both sides are `free_coded` (HEAD side `2fbb0f5f02` "chore: bump version to
  0.2.31 for REQ-165 [FREE-CODED]", 2026-09-01; incoming `de71981f8a` merge of
  `free-BUG-37` into `xgd-working`, 2026-08-24), so the both-free_coded
  exception applies: take the later working-timeline position → HEAD's
  `0.2.31`. This agrees with the enrichment's "more recent commit by
  timestamp" rule.

  Additionally, incoming's value is not merely older but already landed:
  `0.2.11` was introduced at `677fdffda9` (2026-08-24), a confirmed ancestor
  of HEAD, and was then superseded along HEAD's own version chain
  0.2.13 → 0.2.19 → 0.2.20 → 0.2.31. Keeping `0.2.31` therefore discards
  nothing; taking `0.2.11` would have regressed the version.

## Incoming changes preserved

The incoming commit `de71981f8a` touched three files (diff taken against its
first parent `557fdace5c`, since it is a merge commit). All three are present
in HEAD:

- `package.json` — incoming change was `0.2.10` → `0.2.11`. Present in HEAD's
  ancestry at `677fdffda9`, superseded by later bumps up to `0.2.31`.
  Redundant, not discarded.
- `tools/generate/src/store/d1r2-store.ts` — incoming added the per-isolate
  assembled-draft memo for BUG-37. Verified present in HEAD: `ASSEMBLED` map
  (line 185), `assembledKey` (188), `resetAssembledCache` (196), the `forget`
  eviction (405), and the `loadDraft` version-checked hit path (803-824).
  HEAD additionally extends this region with the refused/accepted asset-name
  partitioning, i.e. HEAD is a superset of the incoming version. No conflict
  was raised on this file.
- `tests/.../test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts` —
  byte-identical between incoming and HEAD (`git diff de71981f8a HEAD` over
  this path is empty). All 223 added lines of the UAT suite are present; no
  test function was deleted.

No hunk was dropped under the BUG-1301 precedence exception.

## Note for the finalize step

The staged diff is empty vs HEAD (`git diff --cached --stat HEAD` → 0 files
changed). This is the BUG-1109/BUG-1122 redundant-commit case, not a discard:
STEP 3's check confirms every key change from the incoming commit is present
in HEAD via a different route, as evidenced above. Per STEP 4, `--skip` was
not called; the cherry-pick sequencer state is left intact for
`cherry_pick_finalize_resolution`.
