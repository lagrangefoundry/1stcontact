---
uid: report-a65ca022
id: REPORT-7023
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:06:38.519474+00:00'
updated_at: '2026-10-31T22:06:38.519474+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-2bd9d184.md` — intent/bookkeeping ticket (2e), outside sparse cone (index-only conflict). Rule: one side is a strict superset → keep the superset. HEAD (blob 7ff40489af) already contains the incoming commit's body edits (both `[[REQ-176]]` → `[[BUG-48]]` replacements) plus later state the incoming side lacks: status `bundled`, `bundled_in: bundle-fd009b93`, `commits` list, `version: 0.2.50`, `chat_comment`, and the "Decisions (agreed with the operator)" D1–D6 section. The only other incoming differences (`updated_at` 2026-09-02, `last_field_updated: body`) are older than HEAD's (2026-10-31, `status`), so HEAD's values were kept. Resolved by setting stage 0 to the HEAD blob; skip-worktree flag kept.

## Incoming changes preserved

Incoming commit 4a238499be ("fix cross-reference: the discovery half is BUG-48, not a placeholder id") changes two lines, and both are in the resolved file (lines 63 and 117 read `[[BUG-48]]`). No `[[REQ-176]]` is left. The resolution has no staged diff vs HEAD because HEAD already contains this commit's effect (BUG-1109/BUG-1122 redundant-commit shape), so finalize should detect the empty diff and skip the commit. Unrelated unstaged xgd bookkeeping (`.xgd/_changes/log.ndjson`, `meta.json`, `report-11b4428e.md`) was left untouched.
