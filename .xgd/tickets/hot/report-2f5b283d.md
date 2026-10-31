---
uid: report-2f5b283d
id: REPORT-7145
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:27:34.988881+00:00'
updated_at: '2026-10-31T23:27:34.988881+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` — intent/bookkeeping ticket (2e), UU (index-only, outside sparse cone). Rule: one side is a strict superset → keep the superset. Resolved with `git checkout --ours` + `git add --sparse`.

  - Incoming (7becbf6410, "update request request-407a6fd8"): updated_at 2026-09-03T00:02, status `free_coded`, version 0.2.51, `commits` list with two working_shas (b1cafc80, 68db3937), body otherwise base + trailing-newline change.
  - HEAD: updated_at 2026-10-31T20:54, status `bundled`, version 0.2.68, story_points 4, `bundled_in: bundle-fd009b93`, the same two `commits` entries (plus `working_sha_history`), and the body extended with the "second commit" note, the DOC-42 reopen amendment, its landed consequences, and amendment test plan.
  - HEAD is a later state of the same ticket and contains every fact the incoming side introduces; the incoming status/version/updated_at are earlier lifecycle values that HEAD has already advanced past. Keeping HEAD loses nothing.

## Incoming changes preserved

No code files in conflict. For the ticket, every incoming fact (status advance past free_coding, the two commit SHAs, a version field) is present in HEAD in a later form. The resolution nets to no diff vs HEAD — the commit is redundant (its effect already landed), not discarded; finalize step may skip it.
