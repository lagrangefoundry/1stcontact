---
uid: report-d2c5f545
id: REPORT-6239
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-05T03:04:42.224527+00:00'
updated_at: '2026-10-05T03:04:42.224527+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resolution: `14cd3cdd41` on `.xgd/tickets/hot/request-3bc4b835.md` (REQ-167) → `--ours`

Pick: 2026-08-31 18:31:19, `free_coding` → `free_coded`, adds `fields.commits`
(working_sha `61a0becc61`, `deaf3f98c4`) and `fields.version: 0.2.29`.

Stages: base `1df25fa338`, ours `ec7bfaafc8` (== HEAD blob), theirs `e6b5619e95`.

Evidence:
- `git diff :3: :2:`: ours already holds theirs' `commits` list and `version: 0.2.29`
  byte-identically. Ours differs only by being later: `status: bundled`, `updated_at`
  2026-09-09, `bundled_in: bundle-87be4669`, plus a body note about the
  account/business split appended after the stray `-` line.
- `git diff :2: xgd-working:<path>`: only the 09-11 `free_and_reconciled` flip
  (`updated_at`/`completed_at`/`status`). Incoming itself moves past `free_coded`.

Nothing incoming is lost. Resolved with `git checkout --ours` + `git add --sparse`.
Net change from HEAD is zero. CHERRY_PICK_HEAD is intact.

Forecast: later REQ-167 picks before the 09-09 re-bundle `57398a6649` should go
`--ours`. The xgd-working tip `392ef4fc5f` (09-11 `free_and_reconciled`) is NOT `--ours`.
