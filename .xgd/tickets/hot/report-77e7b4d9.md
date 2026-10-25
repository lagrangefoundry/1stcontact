---
uid: report-77e7b4d9
id: REPORT-6686
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T22:47:09.524842+00:00'
updated_at: '2026-10-25T22:47:09.524842+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/bug-5bc83942.md` (BUG-44): UU on an intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep the superset. Resolved with `git checkout --ours` and staged with `git add --sparse`. The file is outside the sparse cone.
  - Header fields: HEAD is newer (updated_at 2026-10-25, against 2026-09-02 on the incoming side). HEAD has status `bundled`, `bundled_in: bundle-5607a08d`, `version: 0.2.42` and `commits`. The incoming side still has status `draft`.
  - Body: the incoming commit (a24623a2be, "update bug bug-5bc83942") adds the "What registration is actually worth" analysis, ending "Not decided here." HEAD contains all of that text word for word. It then extends it with the case against ticket-backed metadata, the "Decision: remove the registry" section, the behaviour required and the test plan.
  - The enrichment rule ("take the more recent commit by timestamp") points to the same side, HEAD.

## Incoming changes preserved

There are no code files. Every content change in the incoming ticket is already present in HEAD, so the staged diff against HEAD is empty. This commit is redundant on this branch, not discarded. The finalize step should detect the empty diff and skip it.

## Post-merge review flag

The enrichment marked this file for post-merge review because the intent was unknown on one side. A review is low-risk: the incoming side is a strict subset of HEAD.
