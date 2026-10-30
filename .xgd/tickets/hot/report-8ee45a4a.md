---
uid: report-8ee45a4a
id: REPORT-6286
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:28:48.265419+00:00'
updated_at: '2026-10-05T03:28:48.265419+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` (REQ-155): intent ticket (rule 2e). Resolved `--ours`.
  - Pick `1596690add` (2026-09-01 11:58:00 -0700) changes only `updated_at` (+5 s) and
    `last_field_updated: status → story_points`.
  - Base `bb33d558bd` is the previous pick's (`e0795d9332`) theirs blob.
  - Ours `e5c0842463` is unchanged and equals `HEAD:<path>`. It is a superset: `free_and_reconciled`,
    `completed_at` 09-14, `bundled_in: bundle-8e1807f6`, and `updated_at` 09-19. That makes it later
    than the incoming 09-01 values.
  - The result is zero net change from HEAD `1543af3c11`. `git status --porcelain` is empty.

## Incoming changes preserved

No code files are involved. The incoming change is a metadata-only bookkeeping write, and ours
supersedes it with a later `updated_at`.

The xgd-working tip is still the only expected exception on this ticket: it wins `updated_at` alone.
