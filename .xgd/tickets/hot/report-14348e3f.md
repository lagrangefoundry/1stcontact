---
uid: report-14348e3f
id: REPORT-7937
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:05:41.828668+00:00'
updated_at: '2026-11-02T00:05:41.828668+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-420e1a6e.md` (REQ-170): intent/bookkeeping ticket (rule 2e, request ticket). Rule applied: **keep the strict superset**, which is HEAD (ours).
  - Incoming ba24e059b8 (2026-09-04, status `draft`) appended the "Correction 2026-09-04: four relations, not two (DOC-42 §4 as corrected)" section and its "Two schema gaps" subsection.
  - HEAD already contains that body text verbatim (`git diff ba24e059b8 HEAD` shows no body differences other than HEAD's own additions). HEAD also has later facts: status advanced to `free_and_reconciled` with completed_at/updated_at 2026-11-01, `commits`/`version: 0.2.71`/`bundled_in` fields, and the appended "What was implemented, including consequences of the above" section.
  - Frontmatter conflict (updated_at/completed_at/last_field_updated/status): HEAD's values are the later state of the same ticket (2026-11-01 vs 2026-09-05), so HEAD kept.
  - Resolved with `git checkout --ours` plus `git add --sparse` (outside the sparse cone). Staged result is identical to HEAD, so the commit is redundant and the finalize step should detect the empty diff (BUG-1109/BUG-1122 shape).

## Incoming changes preserved

No code files were in conflict. The incoming commit's only content change (the correction section) is already in HEAD verbatim, so nothing was discarded: the commit is redundant, not dropped. The incoming frontmatter values (`status: draft`, `completed_at: null`) are superseded by HEAD's later lifecycle state and were intentionally not reapplied, because reapplying them would regress a reconciled ticket to draft.

Unrelated working-tree state was left untouched: unstaged `.xgd/_changes/log.ndjson` and `.xgd/_changes/meta.json`, plus untracked `.xgd/tickets/hot/report-4a6c4113.md`. None of these are part of this cherry-pick.
