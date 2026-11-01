---
uid: report-cbe3655a
id: REPORT-7735
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:43:12.533729+00:00'
updated_at: '2026-11-01T15:43:12.533729+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178): intent/bookkeeping ticket (2e), UU, frontmatter only (body auto-merged with no conflict). Resolved to OURS (HEAD) with `git checkout --ours` + `git add --sparse` (outside the sparse cone).
  - Status/timestamps: same fact changed on both sides. Incoming (d909bce767, 2026-09-04) moves `free_coding` -> `free_coded` with updated_at 2026-09-05. HEAD is 2026-11-01, status `free_and_reconciled`, completed_at set. HEAD is the later state and a lifecycle successor of incoming's `free_coded`, so HEAD is kept (it is also the more recent commit by timestamp, per the enrichment rule).
  - `commits` list: HEAD is a strict superset. Same four working_shas, plus reconcile_shas for 68db393 and cd6002e and working_sha_history on every entry. Incoming lists fa0b857 twice and has reconcile_sha null everywhere, so taking incoming would have erased real reconcile records.

## Incoming changes preserved

Not a code file. Incoming's status transition and commit entries are already present in HEAD or superseded by it. The resolution stages with no net diff vs HEAD (redundant commit; finalize should detect the empty diff).

## Arbitration of last resort (BUG-1460)

- `.xgd/tickets/hot/request-407a6fd8.md`, `fields.version: 0.2.68`: incoming has this field and HEAD does not. Dropped on tier 1 evidence: HEAD's later ticket state (free_and_reconciled, 2026-11-01) was written after the incoming commit, and that write left the field out. The value is also recorded in the ticket body ("this commit carries the bump to 0.2.68"), so no information is lost. Flagged for post-merge review in case `version` should have survived reconcile.
