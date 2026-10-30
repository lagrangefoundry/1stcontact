---
uid: report-3fe38cdc
id: REPORT-6101
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T23:03:35.645149+00:00'
updated_at: '2026-10-04T23:03:35.645149+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) is an intent/bookkeeping ticket, resolved under rule 2e by keeping ours (superset).
  - Pick: `ac5bb44191` (2026-08-31 15:10:20). Base: `734f26f231`. Ours: `3b6c6a92fb`. Theirs: `6d112a2b75`.
  - Base → theirs bumps `updated_at`, sets `last_field_updated: body`, and appends a "# What landed" section: parts 1–4, design decisions, test plan, verification and commits.
  - Ours (lines 88–163) already contains that entire section, with every heading and the closing lines present (envelope check, `maxBuffer`, Superseded tests, Also repaired, 2059 tests, the `c056002a52` re-bump). It differs only by line unwrapping and `*em*` → `_em_` normalization from main's `seed_local_overlay`.
  - Ours' frontmatter is the later 2026-09-09 `bundled` state, identical to xgd-working's `5a60c25f99`.
  - Resolved with `git checkout --ours` + `git add --sparse`. Zero net change from HEAD.

## Incoming changes preserved

No code files were in conflict. The ticket body text the pick adds is fully present in ours.
