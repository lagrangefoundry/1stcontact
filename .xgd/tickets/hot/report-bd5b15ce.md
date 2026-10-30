---
uid: report-bd5b15ce
id: REPORT-6077
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:49:08.697332+00:00'
updated_at: '2026-10-04T22:49:08.697332+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Resync conflict resolution — `.xgd/tickets/hot/doc-edba99c9.md`

- Picked commit: `6d1b914e05` (2026-08-31 14:59:35 -0700, "xgd(ticket): update doc doc-edba99c9", +3/-3)
- HEAD: `d5678200bb`; apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`; anchor `report-10bbd54c`
- `prior_stage_failure`: empty

### Evidence
Stages: base `aed617700c` / ours `7769c2ba9e` (== `HEAD:<path>`) / theirs `163f60fa68`.

Both sides rewrite the SAME base blob with the SAME substantive change:
`doc_kind: architecture` → `system_kb`, `last_field_updated` → `doc_kind`. Bodies untouched on both sides.

The only divergence is `updated_at`: theirs `2026-08-31T21:59:34.965834`, ours
`2026-09-11T09:33:34.884446`. Main replayed xgd-working's 08-31 decision on 09-11 — a
catch-up replay, not a competing decision. `git diff :2: xgd-working:<path>` is that single
`updated_at` line, so incoming's tip == theirs and there is no later incoming intent.

### Resolution
`--ours`. No facts lost: every value theirs introduces is already in HEAD. This leaves zero
net change from HEAD, which matches the enrichment's "more recent timestamp" rule (ours is
the later of the two).
