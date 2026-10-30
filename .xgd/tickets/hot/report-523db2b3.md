---
uid: report-523db2b3
id: REPORT-6092
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:58:21.029169+00:00'
updated_at: '2026-10-04T22:58:21.029169+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resolve: request-439cd0c8 @ 3a7f62aa53 → --ours (zero net change)

Pick `3a7f62aa53` (2026-08-31 15:08:03, body edit: "Decisions from implementation
review" + new acceptance lines + rewritten open questions). HEAD `5b4029a7f0`.

Blobs: base `6087865d10` (= previous pick 59a1111358's theirs), ours `67db22b9a1`
(unmoved, == xgd-working's 09-09 re-bundle `1d1ccd1858`), theirs `da952dfa89`.

Evidence:
- `git diff :2: xgd-working:<path>` is frontmatter only (updated_at, completed_at,
  status → free_and_reconciled from the 09-11 tip `f406eb1960`). So ours' body is
  exactly xgd-working's final body.
- `comm -23` of theirs' added lines vs ours leaves only lines that later
  xgd-working commits rewrote: `a473afd7fa` (15:57, shadow → description rename)
  and `1195a7b589` (17:11, open questions moved to "Resolved after implementation").
  The other added lines appear in ours. Ours carries both rewrites. Nothing is lost.

Resolution: `git checkout --ours` + `git add --sparse`. Zero net change from HEAD.

Forecast: the later picks a473afd7fa, 72ef0ecea8, 5d360749e5, 33e3d1d4aa, aed29a320e,
1195a7b589, e1541ec5c2, 0e90542c74, cb62e7176f, 57b1a5e352 and 1d1ccd1858 should all go
`--ours`. The tip f406eb1960 (09-11, free_and_reconciled) is NOT `--ours`.
