---
uid: report-3a4b1211
id: REPORT-7765
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:00:51.724979+00:00'
updated_at: '2026-11-01T16:00:51.724979+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-420e1a6e.md` (REQ-170) — intent/bookkeeping ticket (2e). Conflict was index-only (outside sparse cone). Rule: one side is a strict superset → keep the superset. Resolved with `git checkout --ours` + `git add --sparse`.
  - Body: byte-identical across base, ours and theirs.
  - Frontmatter: theirs (c8b231d124, "update request request-420e1a6e") advanced status free_coding → free_coded, added `fields.commits` (working_sha 5b6befd1…) and `fields.version: 0.2.71`, updated_at 2026-09-05.
  - Ours (HEAD) already contains every one of those facts and additionally carries the later lifecycle state: status `bundled`, `fields.bundled_in: bundle-39edf66d`, updated_at 2026-11-01.
  - Taking theirs would regress status from bundled to free_coded and drop bundled_in. Ours is also the more recent by timestamp, consistent with the enrichment rule.

## Incoming changes preserved

No code files were in conflict. For the ticket, every fact the incoming commit introduced (commits entry, version 0.2.71, free_coded progression) is already present in HEAD, so the incoming commit is redundant on this branch. The staged diff against HEAD is empty; finalize step is expected to detect the clean diff and skip the commit (BUG-1109/BUG-1122 shape). Not a discard — HEAD already holds the incoming intent.

Note: unrelated pre-existing worktree changes (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json` modified-unstaged; `.xgd/tickets/hot/report-afb761eb.md` untracked) were left untouched.
