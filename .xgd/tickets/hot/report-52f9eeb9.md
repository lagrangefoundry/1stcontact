---
uid: report-52f9eeb9
id: REPORT-7413
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:47:02.527060+00:00'
updated_at: '2026-11-01T06:47:02.527060+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48), intent/bookkeeping ticket (rule 2e), conflict existed in the index only because the file is outside the sparse cone. Rule applied: **strict superset, so keep ours** (`git checkout --ours` + `git add --sparse`).
  - Incoming `e0379b4286` ("xgd(ticket): update bug bug-cb59cc4a") changed only one fact relative to the merge base: it added `fields.chat_comment: comment-2a38a753`, and it also dropped the file's trailing newline.
  - HEAD already carries `chat_comment: comment-2a38a753` (HEAD `2ee721eb74` is the commit that created comment-2a38a753). HEAD additionally carries status `bundled`, `commits`, `version: 0.2.60`, `bundled_in: bundle-94dbe947`, newer `updated_at`, and the S1-S6 / C1-C4 body sections. The incoming body is a byte-identical prefix of HEAD's.
  - Taking incoming would have regressed status to `draft` and discarded the bundled-state fields and scoped-behaviour sections, so HEAD is the superset.

## Incoming changes preserved

- The incoming commit's only substantive change (`chat_comment: comment-2a38a753`) is present in the resolved file. The trailing newline change is whitespace-only and not carried.
- The resolved file has no staged diff vs HEAD, so this commit is redundant: its effect already landed via HEAD. Per STEP 4 it is staged as-is for finalize to detect and skip. No code files were involved.
- Unrelated unstaged `.xgd/_changes/{log.ndjson,meta.json}` and untracked `.xgd/tickets/hot/report-6068c4c6.md` were left untouched.
