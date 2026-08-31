---
uid: report-e06f9080
id: REPORT-2813
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:42:48.953476+00:00'
updated_at: '2026-08-31T07:42:48.953476+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-77be58e0.md` — **AA** (both added), intent/bookkeeping ticket (REQ-49). Rule **2e** applied (superset case), not 2b's generic merge: a full-text diff of `:2` (ours, `sync_working_to_main` 597681c166c6) vs `:3` (incoming, `xgd(ticket): update request request-77be58e0` @ 12eb4f0401301b9beb54ce33b091deaa62ccd204) showed the two sides identical except for a single added frontmatter field on the incoming side:

  ```
  @@ -23,6 +23,7 @@
       reconcile_sha: null
       main_sha: null
     version: 0.0.63
  +  chat_comment: comment-83adea6d
   ---
  ```

  Incoming is a strict superset — it only adds `fields.chat_comment`, a field the HEAD side never touched. No field is changed differently on the two sides, so no per-fact timeline arbitration was required and `xgd working-timeline` was not consulted. Resolved with `git checkout --theirs` + `git add --sparse` (path is under `.xgd/tickets/`, out of the sparse cone).

## Incoming changes preserved

- `.xgd/tickets/hot/request-77be58e0.md` — incoming taken whole, so every byte of the incoming commit's version is present by construction. Verified positively: `fields.chat_comment: comment-83adea6d` is present at line 26 of the resolved file, and a marker scan (`<<<<<<<` / `=======` / `>>>>>>>`) over the resolved file returned nothing. All prose sections (Scope, Capabilities 1–5, Implementation, Post-implementation findings, Iteration 2, applied-to-gigabytealchemy, and the two fluid-vs-fixed residual sections) are byte-identical on both sides and are retained.

No code/implementation files were in conflict — the cherry-picked commit `12eb4f04` touches only this one ticket file (`171 insertions(+)`, 1 file changed). No hunks were dropped; the BUG-1301 precedence exception was not invoked and no test function on either side was deleted.

## Staging state

`git status --porcelain` after staging shows no `UU`/`AA`/`DU`/`UD`/`AU`/`UA` lines; the file appears as `M ` (staged modification). The in-progress cherry-pick was left untouched — `CHERRY_PICK_HEAD` is still present for `cherry_pick_finalize_resolution`. The remaining `??` entries under `.xgd/tickets/hot/` are pre-existing untracked comment/report tickets, unrelated to this conflict.
