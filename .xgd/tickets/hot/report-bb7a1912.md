---
uid: report-bb7a1912
id: REPORT-4158
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-13T22:37:45.333284+00:00'
updated_at: '2026-09-13T22:37:45.333284+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — UU, intent/bookkeeping ticket
  (rule 2e; `request-*`, user-authored bookkeeping, not matrix state).
  Resolved by taking OURS via the per-fact timeline rule.

  Single conflict region (lines 8-18), covering exactly the frontmatter
  facts the incoming commit touched. The incoming commit
  (22c666b6fb, 2026-08-31T21:51) is a 2-line status advance:
  `status: free_coded` -> `ready_to_reconcile`, plus its `updated_at`
  bump. No body/prose changes on the incoming side at all.

  Both sides changed the SAME facts (`status`, `updated_at`,
  `completed_at`, `last_field_updated`), so this is 2e's genuine-conflict
  branch and the later-positioned intent wins per fact. HEAD is later on
  both axes:
    - wall clock: HEAD `updated_at` 2026-09-02T01:34:36 vs incoming
      2026-08-31T21:51:22.
    - lifecycle position: HEAD is at `free_and_reconciled` with
      `completed_at` set, `commits` collapsed from three `working_sha`
      entries to a single `main_sha` (4b43dd9a5c), and a populated
      `orphan_commits` old->new map. That state is strictly downstream of
      the `ready_to_reconcile` the incoming commit asks for.

  Taking incoming would have regressed the ticket behind its own
  reconciliation: resetting status to `ready_to_reconcile`, clearing
  `completed_at`, and stranding the `main_sha` / `orphan_commits`
  bookkeeping written by the reconcile cycle that has already run.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted
path is a bookkeeping ticket, and the incoming commit touches nothing
else (`git show --stat`: 1 file, 2 insertions, 2 deletions).

The incoming commit's literal field values are not present in the
resolution, and that is the redundant case rather than the discarded case
(STEP 4 / BUG-1109 / BUG-1122), established from the ticket's own history
rather than inferred:

- This branch carries `8b5aa7c1ec xgd(ticket): seed_local_overlay request
  request-13a5e206` (2026-09-01T00:01:02), which seeded the ticket
  already at `status: reconciling` — downstream of the incoming
  `ready_to_reconcile`, and dated after it.
- HEAD then advanced `reconciling` -> `free_and_reconciled` (f12e03c0e0).

So the incoming commit's intent — move REQ-162 out of `free_coded` and
into the reconcile pipeline — is present in HEAD via the seed overlay and
the completed reconcile cycle, not absent from it. STEP 3's discard guard
is therefore not tripped.

Verification performed: after `git checkout --ours`, `git diff HEAD --
.xgd/tickets/hot/request-13a5e206.md` was empty, confirming the
resolution is exactly HEAD's version and that no auto-merged incoming
content outside the conflict region was silently dropped (the incoming
diff lay wholly inside that one region).

Staged with `git add --sparse` (path is outside the sparse-checkout cone,
DOC-986 section 2 / 4.1). `git status --porcelain` is now empty: no
conflict classes remain. The staged diff vs HEAD is empty, which the
finalize step will detect and skip; `--skip` was NOT called here, and
CHERRY_PICK_HEAD (22c666b6fb) is still present.

## Flagged for post-merge review

The auto-enrichment rule for this file asked to flag it for post-merge
review. Doing so: REQ-162's frontmatter on the reconcile branch now
reflects the completed reconcile cycle, and the working-side
`ready_to_reconcile` transition is superseded rather than replayed.
