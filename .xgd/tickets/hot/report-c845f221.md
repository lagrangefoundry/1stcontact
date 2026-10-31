---
uid: report-c845f221
id: REPORT-6965
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:29:09.011330+00:00'
updated_at: '2026-10-31T21:29:09.011330+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` — intent/bookkeeping ticket (2e). Rule: one side is a strict superset → keep the superset (HEAD / ours). Also consistent with the enrichment rule "take the more recent commit by timestamp": HEAD's last edits are a5ac60a426 / 56b47b5bf8 (2026-10-30), incoming ca07ea9bf2 is 2026-09-01. Staged via `git checkout --ours` + `git add --sparse` (outside sparse cone).

## Incoming changes preserved

Incoming ca07ea9bf2 ("update bug bug-5bc83942", body edit) added the "Decision: remove the registry" section, "Behaviour required" (1–6) and "Test plan" sections. Every added line is already present verbatim in HEAD. The only incoming line not in HEAD is its stale frontmatter `updated_at: '2026-09-02T00:27:31...'` (and with it `status: draft`, `completed_at: null`), which HEAD superseded with `status: free_and_reconciled`, `completed_at: 2026-10-30`, and the commits/version/bundled_in fields. Commit is redundant (BUG-1109/BUG-1122 shape): staged diff vs HEAD is empty; finalize step should skip it. Flagged for post-merge review per enrichment rule, though no content loss was found.
