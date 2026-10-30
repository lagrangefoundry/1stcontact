---
uid: report-f8012e67
id: REPORT-5975
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T21:50:03.810165+00:00'
updated_at: '2026-10-04T21:50:03.810165+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md`: intent ticket (2e). Resolved `--ours` (ours is a superset), with zero net change from HEAD.
  - The pick is `51ac0d0a8c` (2026-08-23 15:10:16 -0700). Base `8aef843df0` is the previous pick's (`e95404260a`) theirs blob. Ours `85e97c817e` (== HEAD) is unchanged.
  - From base to theirs, the pick changes two things. It bumps `updated_at`, and it rewrites the "Version bookkeeping" paragraph from 0.2.8 to 0.2.9.
  - I compared every line the pick adds against ours (`comm -23` of the line sets). Nothing is missing: ours already has the 0.2.9 paragraph verbatim.
  - Ours keeps `status: free_and_reconciled` (completed 2026-08-31). The pick still says `free_coding`, which xgd-working itself later replaced. Ours equals xgd-working's end state apart from a trailing newline.

## Incoming changes preserved

No code files were involved. All of the pick's content is present in ours, and nothing was dropped.
