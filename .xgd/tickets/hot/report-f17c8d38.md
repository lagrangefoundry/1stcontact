---
uid: report-f17c8d38
id: REPORT-3262
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:19:04.746244+00:00'
updated_at: '2026-09-01T23:19:04.746244+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/doc-14f256a7.md` — class **AA** (both added), bookkeeping/doc ticket. Rule applied: 2e (intent/bookkeeping ticket, per-fact judgment) → **incoming taken in full**.

  The AA is an artifact, not a genuine both-created conflict: the incoming branch contains `0d11a014` *"xgd(resync): strip .xgd/tickets, .xgd/config.yaml, .xgd/permissions.yaml, .xgd/quality.yaml from main snapshot (BUG-904)"*, which removed the path and left the merge base with no stage-1 blob.

  Per-fact analysis of the two sides (`git diff :2: :3:`) shows exactly two differing facts and no competing edits:
  - `fields.system_kb: true` — present on HEAD, removed by incoming.
  - `updated_at` — `2026-08-16T01:21:56Z` (HEAD) vs `2026-08-31T19:43:36Z` (incoming).

  The entire 300-line document body is byte-identical on both sides.

  Timeline is unambiguous without needing `xgd working-timeline`: HEAD's most recent edit to this file is `39eb48e8` (2026-08-15 18:22), and `git merge-base --is-ancestor 39eb48e8 6c7e26a0` confirms it is a **direct ancestor** of the incoming commit. HEAD's version *is* the incoming commit's parent state for this path, so incoming is strictly later on the same lineage — nothing on the HEAD side is disjoint or unreplayed.

## Incoming changes preserved

Incoming commit `6c7e26a0` — *"xgd(ticket): update doc doc-14f256a7 / field: retire system_kb boolean; membership moves to doc_kind (DOC-39 3.3)"*.

Its sole intent is retiring the `system_kb` boolean. Verified present in the resolved file:
- `fields.system_kb: true` is **gone**; `fields.doc_kind: architecture` retained (the field the operation moves membership onto).
- `updated_at` is incoming's `2026-08-31T19:43:36.024100+00:00`.
- No conflict markers remain.

Staged diff vs HEAD is `1 insertion(+), 2 deletions(-)` — exactly the incoming commit's change, nothing more, nothing dropped. No code/implementation files were involved in this conflict, and no hunks were dropped under the BUG-1301 precedence exception.
