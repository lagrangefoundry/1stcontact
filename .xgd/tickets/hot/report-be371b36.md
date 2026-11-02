---
uid: report-be371b36
id: REPORT-8118
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:10:37.545890+00:00'
updated_at: '2026-11-02T01:10:37.545890+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-b6268a25.md` (BUG-55) — UU, intent/bookkeeping ticket (2e). Rule: one side is a strict superset → keep the superset (ours/HEAD).
  - Incoming (f0effb9985) changed base→theirs: body edits only (rewrote "The coverage exists and is red", added "What this ticket does NOT fix", revised two Acceptance bullets), updated_at 2026-09-06T00:52, status draft.
  - Ours (HEAD) already contains that exact body text verbatim (ours vs theirs body diff is empty apart from a trailing newline), plus later frontmatter: status `bundled`, `commits` list, `version: 0.2.82`, `bundled_in: bundle-5052a63c`, updated_at 2026-11-01.
  - Resolved by writing stage :2 (ours) and `git add --sparse`. The file now has no net diff vs HEAD (redundant incoming hunk, not discarded).

## Incoming changes preserved

No code files conflicted. For the one ticket file, every body change from the incoming commit is present in the resolved version (it was already integrated in HEAD). Only the incoming side's stale frontmatter (status draft, older updated_at, missing commits/bundled_in) was not taken, because HEAD's values are later lifecycle state for the same facts.

Other staged files from the cherry-pick (comment-36485e09, comment-5200935a, todo-3c78b018) applied cleanly and were left untouched. Unstaged `.xgd/_changes/*` and untracked `report-f1fd50ae.md` predate this step and were not touched.
