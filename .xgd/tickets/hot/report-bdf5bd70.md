---
uid: report-bdf5bd70
id: REPORT-3429
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:38:39.771953+00:00'
updated_at: '2026-09-04T00:38:39.771953+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — class **UU**, intent/bookkeeping ticket (rule **2e**, `request-*`). Resolved by taking the HEAD side (`git checkout --ours`, staged with `git add --sparse` since `.xgd/tickets/` is outside the sparse cone).

  Per-fact analysis against the merge base (`a65ba54fdb`):
  - **Incoming** (`0c7b4f9072`, free_coded, 2026-09-01T00:01:02Z) changed exactly two facts: `status: ready_to_reconcile` → `reconciling`, and the matching `updated_at` bump. Nothing else.
  - **HEAD** (`6a4c2e4a97`, 2026-09-02T01:34:36Z) changed the same `status` fact to `free_and_reconciled`, plus `completed_at`, `last_field_updated: result`, `result: pass`, `merged_at_commit: 4b43dd9a5c0f...`, the `working_sha`/`main_sha` resolution, and a ~250-entry `orphan_commits` remap list.

  Only one fact genuinely competes (`status`). HEAD wins it on both available orderings: it is the later commit by timestamp (2026-09-02 vs 2026-09-01 — the rule prescribed by the auto-enrichment for this file), and `free_and_reconciled` is the terminal state of the very lifecycle whose intermediate state (`reconciling`) the incoming commit was setting. On every other field HEAD is a strict superset — the incoming side touches none of them. No content was invented; no `intent_uid`/`story_uid`/`capability_uid` field was modified.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping ticket, so there is no developer-authored code at risk here.

The incoming commit's only substantive change (`status: reconciling`) does not appear verbatim in the resolution, and that is the **superseded, not discarded** case described in STEP 4: HEAD already passed through `reconciling` and recorded the completed outcome of that same reconcile (`status: free_and_reconciled`, `result: pass`, `merged_at_commit: 4b43dd9a5c0f...`). Re-applying the incoming value would roll the ticket backwards into an intermediate state of work that has since finished. No BUG-1301 precedence drop was needed; no test function on either side was deleted.

Net staged diff vs HEAD is empty — this commit's effect is already present in HEAD by a later route. Left staged as-is for `cherry_pick_finalize_resolution` to handle; `--skip`/`--continue` were not invoked, and `CHERRY_PICK_HEAD` remains in place.

Flagged for post-merge review per the auto-enrichment rule ("intent unknown on one or both sides"): `.xgd/tickets/hot/request-13a5e206.md`.
