---
uid: report-30f583d3
id: REPORT-2795
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:19:07.781346+00:00'
updated_at: '2026-08-31T07:19:07.781346+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-f26cbe32.md` — class **AA** (both added), intent/bookkeeping
  ticket (`request-*`). Rule **2e — strict superset**: took the incoming side whole via
  `git checkout --theirs` + `git add --sparse`.

  The two sides were not in genuine conflict. Diffing the two index blobs
  (ours `2dd3254a`, theirs `7768bbbc`) showed a single hunk: **1 insertion, 0
  deletions**. Incoming adds one field inside `fields:` that the ours side never
  touched:

  ```
  @@ -20,6 +20,7 @@ fields:
       main_sha: null
     version: 0.0.203
     bundled_in: bundle-4ff83a8b
  +  chat_comment: comment-506604c6
   ---
  ```

  Theirs is therefore a proper superset of ours — no field, section, or body
  paragraph differs between the sides, so no per-fact timeline arbitration
  (`xgd working-timeline`) was needed and no ours-side content was dropped.

  The enrichment metadata flagged intent as unknown on one or both sides with a
  "take the more recent commit and flag for post-merge review" fallback. That
  fallback did not have to be exercised: because the sides are in a strict
  superset relation, superset and recency select the same content, so the
  resolution does not rest on the unknown-intent guess. Incoming
  (`ec64dffcc1f66d46423adf87af53a7e52182db07`, 2026-08-23) is also the later
  commit, so the fallback would have chosen identically.

## Incoming changes preserved

- `.xgd/tickets/hot/request-f26cbe32.md` — **fully preserved.** The resolved
  working-tree file was verified byte-identical to the incoming blob
  `7768bbbc` (`git diff --no-index` against `git show` of the blob returned
  empty). The incoming commit's sole change, `chat_comment: comment-506604c6`,
  is present at line 23 of the resolved file.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No
code, test, or UAT files were involved in this conflict — the single conflicted
path is a bookkeeping ticket.

Staging verified: no `UU`/`AA`/`DU`/`UD`/`AU`/`UA` entries remain; the file
stages as `M`. The in-progress cherry-pick was left untouched — `CHERRY_PICK_HEAD`
is still present for `cherry_pick_finalize_resolution`.
