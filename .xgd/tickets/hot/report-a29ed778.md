---
uid: report-a29ed778
id: REPORT-7089
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:47:12.594836+00:00'
updated_at: '2026-10-31T22:47:12.594836+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-631866be.md` (REQ-177) — AA, intent/bookkeeping ticket (2b/2e). Rule: one side is a strict superset → keep the superset. HEAD (ours, "update request request-631866be") is the completed ticket: status `free_and_reconciled`, completed_at set, `chat_comment`, `commits` (working_sha 246333cbfe), `version: 0.2.48`, `bundled_in: bundle-5607a08d`, plus "What landed" and "Test plan" sections. Incoming (theirs, 38e270be35 "create request request-631866be") is the original draft: status `draft`, no completion fields, and only the "Related" section, which HEAD also contains word for word. Every fact on the incoming side is either identical in HEAD or superseded by HEAD's later lifecycle update (status/updated_at/completed_at advanced from draft). Resolved with `git checkout --ours` and staged with `git add --sparse` (path is outside the sparse cone).

## Incoming changes preserved

There were no code files in this conflict. The incoming commit only creates the ticket, and all of its content already exists in HEAD, which holds the later revision of the same ticket. The resolution therefore has no diff against HEAD: the commit is redundant (its effect landed through the later update commit), not discarded. The finalize step should detect the empty staged diff and skip it.

Unrelated pre-existing working-tree changes (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `report-cb67446c.md`) were left untouched.
