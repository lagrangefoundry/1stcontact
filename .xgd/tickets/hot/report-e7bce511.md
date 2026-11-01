---
uid: report-e7bce511
id: REPORT-7419
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:50:29.957451+00:00'
updated_at: '2026-11-01T06:50:29.957451+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-72001560.md` (REQ-171): intent/bookkeeping ticket (rule 2e). The ours (HEAD) side is a strict superset of the incoming side, so I kept ours (`git checkout --ours` + `git add --sparse`). The file was outside the sparse cone and the conflict existed only in the index.

## Incoming changes preserved

The incoming commit (f42b3644fc, "update request request-72001560", updated_at 2026-09-03T02:38) changed the ticket in three ways compared with the merge base:
- It added a `## Decisions` section covering Scope, Where product-level material lives, and How the ledger is written.
- It removed the "Scope split" and "Where (1) physically lives" open questions.
- It extended the "Group descriptions" open question ("optional decoration ... lagrange-framework concern rather than this ticket's").

HEAD already contains all of these. HEAD also has a later revision of the "How the ledger is written" paragraph: incoming's "narrow host operation ... follows the existing `extraOps` pattern" became "purpose-built surface", and HEAD explicitly says "A SURFACE RATHER THAN `extraOps`, which was the first instinct and is wrong". HEAD further adds the "What the record has to guarantee" and "The record is written for retrieval" decisions. HEAD's front matter is newer as well: status bundled, version 0.2.58, bundled_in bundle-94dbe947, commits list, updated_at 2026-11-01.

So the incoming commit is redundant with HEAD, and its one differing fact (extraOps) was deliberately superseded later in the same ticket. The resolution stages no diff vs HEAD (redundant commit, BUG-1109/BUG-1122 shape). Finalize should detect that and skip.

The enrichment's "take the more recent" rule agrees: HEAD's content (2026-11-01) is later than incoming's (2026-09-03).
