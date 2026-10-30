---
uid: report-4f22b020
id: REPORT-6284
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:27:59.808263+00:00'
updated_at: '2026-10-05T03:27:59.808263+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

# Resolve: request-01ea4eec (REQ-155) / e0795d9332

Pick `e0795d9332` (2026-09-01 11:57:55 -0700): `free_coding` → `free_coded`, adds
`commits` (working_sha `ab467d6ce3`) and `version: 0.2.32`, and drops the EOF newline.
It touches only the frontmatter.

Blobs: base `81426561ec`, ours `e5c0842463` (the same as `HEAD:<path>`), theirs `bb33d558bd`.

Evidence:
- Ours already has the same `commits` entry (working_sha `ab467d6ce3…`) and `version: 0.2.32`, byte for byte.
- Ours is `free_and_reconciled` with `completed_at` set to 09-14.
- `git diff :2: xgd-working:<path>` changes only `updated_at`, by 18.4 s, so ours is the
  xgd-working end state.

Resolution: `--ours`. HEAD `1543af3c11` has zero net change, and `git status --porcelain` is empty.

Forecast: the remaining pre-09-11 picks on this ticket should also resolve `--ours`. The
xgd-working tip is the exception; it wins only `updated_at`.
