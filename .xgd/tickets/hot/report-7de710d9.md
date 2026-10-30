---
uid: report-7de710d9
id: REPORT-6128
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:18:37.993437+00:00'
updated_at: '2026-10-04T23:18:37.993437+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — request-78370159 (REQ-161) / 0d29fbb504

Picked commit `0d29fbb504` (2026-08-31 15:57, xgd-working): the shadow→description
rename in the body (3 lines) plus `updated_at`/`last_field_updated: body` and the
EOF newline.

Blobs: base `e83e40bbb9`, ours `c5565fa271` (== HEAD), theirs `15b0507d7c`.

Evidence:
- `git diff :2: xgd-working:<path>` touches only frontmatter (`updated_at`,
  `completed_at`, `status` → the later 09-11 `free_and_reconciled` pick). The body
  of ours is byte-identical to the xgd-working tip.
- Ours already carries every rename hunk ("The description is editable", "write the
  description") and has no remaining "shadow" in those lines.
- Ours' `updated_at` (09-09 re-bundle) is later than theirs' (08-31), and
  `status: bundled` / `bundled_in` on ours are later lifecycle state.

Resolution: `git checkout --ours` + `git add --sparse`. Zero net change from HEAD;
nothing from incoming is lost (the rename is already present).

Forecast: later picks on this ticket through the 09-09 re-bundle are `--ours`; the
09-11 `free_and_reconciled` tip is NOT (it is genuinely later than ours).
