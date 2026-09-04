---
uid: report-a2ee65c7
id: REPORT-3391
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T22:58:46.030874+00:00'
updated_at: '2026-09-03T22:58:46.030874+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — class **UU**, rule **2e** (intent/bookkeeping ticket; `bundle-*.md`, not a matrix-defining spec ticket). Single conflicted hunk: the lifecycle frontmatter block (`updated_at`, `completed_at`, `last_field_updated`, `status`). Both sides changed the SAME facts, so the per-fact timeline rule applies:
  - HEAD (`4b197af0eb`, 2026-08-31 19:19:50Z): `status: free_and_reconciled`, `completed_at: 2026-08-31T19:19:32Z`, `last_field_updated: result`.
  - Incoming (`bcb265bba4`, 2026-08-31 14:23:56Z): `status: reconciling`, `completed_at: null`, `last_field_updated: status`.

  HEAD is later by ~5h on both commit timestamp and the ticket's own `updated_at`, and its state is the terminal position of the same lifecycle path — HEAD additionally carries `result: pass` and `merged_at_commit: 96a76934e0`. Kept HEAD's four lines. Taking incoming would have rewound an operator-owned status from `free_and_reconciled` back to `reconciling`. This matches the auto-enrichment's stated rule ("intent unknown on one or both sides — take the more recent commit by timestamp"); flagging it here for post-merge review as that rule directs.

  Resolved by editing the marker region in place rather than `checkout --ours`, so the file's cleanly-merged non-conflicted regions were preserved. No fields were invented; no `intent_uid`/`story_uid`/`capability_uid` touched.

## Incoming changes preserved

The incoming commit `bcb265bba4` touched only this one ticket file, in two hunks. Both are accounted for in HEAD — this is BUG-1109/BUG-1122 redundancy, not a STEP 3 discard:

1. **Lifecycle frontmatter hunk** (`status: ready_to_reconcile` → `reconciling`). The incoming commit's intent was to advance this bundle out of `ready_to_reconcile`. That advance is present in HEAD, which moved through `reconciling` and on to `free_and_reconciled` with `result: pass`. The incoming value is superseded by a later position on the identical field, not absent — the developer's intent for this field landed via a different route.
2. **EOF hunk** (removal of the trailing newline after the `Regression scope:` line). Already identical in HEAD; verified because the staged index matches HEAD exactly and the resolved file carries no trailing newline.

Consequently `git diff --cached HEAD` is empty. Per STEP 4 this is staged and exited `@done` as normal — `--skip` was not called, and the cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `bcb265bba4a9cff617f895a406daec38c42938cc`) is left intact for `cherry_pick_finalize_resolution`.

No code files, UAT test files, or config files were in this conflict set, so the 2c/2f/2g rules and the BUG-1301 precedence exception did not come into play.
