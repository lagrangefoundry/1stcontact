---
uid: report-b61954c6
id: REPORT-2871
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:52:36.041087+00:00'
updated_at: '2026-08-31T08:52:36.041087+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-7e70b1db.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`). Rule **2e** applied: the incoming (free_coded, `c244b99cfe4854871b0f36021698c3a7ee29b039`) side is a **strict superset** of the HEAD side. The only delta between the two blobs (ours `bb03e404`, theirs `f4699417`) is a single added frontmatter field under `fields:`:

  ```
  + chat_comment: comment-1e21be7b
  ```

  No other field, section, or paragraph differs, so there is no competing per-fact edit and no need for a `working-timeline` tiebreak. Resolved by taking the superset: `git checkout --theirs` then `git add --sparse` (path is under `.xgd/tickets/`, outside the sparse-checkout cone on reconcile branches, DOC-986 §2/§4.1).

  The file was staged as its own standalone git write calls; the in-progress cherry-pick sequencer state (`CHERRY_PICK_HEAD`) was left untouched for `cherry_pick_finalize_resolution`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-7e70b1db.md` — **confirmed preserved.** The staged index blob is `f46994175a44bdf406fd256950525dfb0f198b76`, byte-identical to stage 3 (theirs) of the conflict, i.e. the incoming commit's version verbatim. `git diff --cached HEAD` for this path shows exactly `1 file changed, 1 insertion(+)` — the `chat_comment: comment-1e21be7b` line — which is the incoming commit's complete delta relative to HEAD. Nothing from the incoming side was dropped.
- Working tree verified free of conflict markers (`<<<<<<<` / `=======` / `>>>>>>>` count = 0) and `git status --porcelain` reports no remaining conflict-class (UU/AA/DU/UD/AU/UA) entries.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict — the sole conflicted path is a bookkeeping ticket.
