---
uid: report-b861f8b8
id: REPORT-6148
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:29:59.153802+00:00'
updated_at: '2026-10-04T23:29:59.153802+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resolve: request-439cd0c8 @ 5d360749e5 → --ours (zero net change)

Pick `5d360749e5` (2026-08-31 16:36, body append: "What was built…" section, a
no-store acceptance bullet, open-question edits). Stages: base `c39a7dc639`,
ours `67db22b9a1` (== HEAD blob), theirs `deaeda92d8`.

Evidence:
- `git diff --stat :2: 1d1ccd1858:<path>` is EMPTY — ours is xgd-working's 09-09
  re-bundle state (`bundled`, `bundle-87be4669`), a later state of the same ledger.
- `comm -23` of theirs' added lines vs ours leaves only `updated_at`,
  `last_field_updated: body`, and the two open questions (describeImage owner,
  re-describe trigger). `git log -S'prefer whichever lands sooner' xgd-working`
  shows `1195a7b589` (17:11, 35 min later) removing them — resolved in the body.
  Ours carries that resolution; nothing is lost.

Resolution: `git checkout --ours` + `git add --sparse`; `git status --porcelain`
empty, CHERRY_PICK_HEAD intact.

Forecast: remaining picks `33e3d1d4aa`, `aed29a320e`, `1195a7b589`, `e1541ec5c2`,
`0e90542c74` and the 09-09 trio → `--ours`; the tip `f406eb1960` is NOT.
