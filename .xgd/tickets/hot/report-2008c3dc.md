---
uid: report-2008c3dc
id: REPORT-6681
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:41:31.101959+00:00'
updated_at: '2026-10-25T22:41:31.101959+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` — class 2e (intent/bookkeeping ticket, bug), UU, index-only (outside sparse cone). Rule: one side is a strict superset → keep the superset. Resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming (2ef40f9d6f, "update bug bug-5bc83942", updated_at 2026-09-01T22:43) changed exactly two things vs base: `updated_at`, and the Fault 4 bullet under "Remaining here" (→ "the promote/register asymmetry above. Likely the highest-value fix of the four for the client, and independent of lf BUG-39.").
  - Ours (HEAD, updated_at 2026-10-25T22:19) contains that identical Fault 4 bullet verbatim, plus all later edits: status `bundled`, `bundled_in: bundle-5607a08d`, commits/version fields, expanded Fault 4 analysis, Status rewrite, registry-removal Decision, Behaviour required, Test plan.
  - Only overlapping fact is `updated_at`; ours is later and accompanies the superset content.

## Incoming changes preserved

No code files in conflict. For the ticket, the incoming commit's only substantive change (Fault 4 bullet) is present verbatim in the resolved file. Resolution nets to no diff vs HEAD — the commit is redundant (its effect already landed via later ticket updates), not discarded. Finalize step should detect the empty staged diff and skip.
