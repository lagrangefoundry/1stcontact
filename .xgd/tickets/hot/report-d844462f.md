---
uid: report-d844462f
id: REPORT-2840
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:16:29.404723+00:00'
updated_at: '2026-08-31T08:16:29.404723+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-56cb1897.md` — **AA** (both added), intent/bookkeeping
  ticket (`request-*`), resolved under **rule 2e — strict superset**.
  Both sides were byte-identical except that the incoming (`free_coded`) side
  adds one field the HEAD side never touched:

  ```
  22a23
  >   chat_comment: comment-dbad764d
  ```

  No competing edit on any shared field, so no timeline lookup was needed —
  the superset subsumes the HEAD side in full. Resolved with
  `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

  The auto-enriched metadata flagged intent as unknown on one or both sides and
  suggested "take the more recent commit by timestamp and flag for post-merge
  review." That fallback was not needed here: the two sides are not in conflict
  over any fact, so composing them yields exactly the incoming version. No
  post-merge review item arises from this resolution.

## Incoming changes preserved

- `.xgd/tickets/hot/request-56cb1897.md` — verified by blob identity rather
  than by inspection: the staged index blob and the incoming commit's blob are
  the same object.
  - staged: `git rev-parse :.xgd/tickets/hot/request-56cb1897.md`
    → `b58a747d17f85b5e6c9cdaecb9e77b47eb9db570`
  - incoming: `git rev-parse 61d6d2c0db2322d48d63cb8a1bd0f64c519ba86f:.xgd/tickets/hot/request-56cb1897.md`
    → `b58a747d17f85b5e6c9cdaecb9e77b47eb9db570`

  Every line of the incoming commit's 72-line addition is present in the
  resolution. Nothing from the HEAD side was lost either — HEAD's content is a
  proper subset of the incoming content.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No
code/implementation files were involved in this conflict — the sole conflicted
path is a bookkeeping ticket.

## Final state

`git ls-files -u` returns 0 unmerged entries. `git status --porcelain` shows the
file as `M ` (staged, resolved); no `UU`/`AA`/`DU`/`UD` lines remain. The
in-progress cherry-pick was left untouched — `CHERRY_PICK_HEAD`
(`61d6d2c0db2322d48d63cb8a1bd0f64c519ba86f`) is still present for
`cherry_pick_finalize_resolution`.
