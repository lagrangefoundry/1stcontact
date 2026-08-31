---
uid: report-886b1c04
id: REPORT-2866
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:46:53.212541+00:00'
updated_at: '2026-08-31T08:46:53.212541+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-c50fdfcc.md` — **AA (both added)**, intent/bookkeeping ticket
  (rule 2b + 2e). Outside the sparse-checkout cone, so the conflict existed only in
  the index with no working-tree markers; resolved with
  `git checkout --theirs` + `git add --sparse`.

  Both sides added a 128/129-line `bug-c50fdfcc` ticket. Diffing stage 2 (ours,
  `ab71a05faa` — Aug 5 2026) against stage 3 (theirs, `2ede16d5b1` — Aug 23 2026)
  showed the incoming side is a **strict superset**: identical in every line except
  one added frontmatter field under `fields:`

  ```
  +  chat_comment: comment-546ad063
  ```

  No field is changed differently on the two sides, so there is no genuine per-fact
  conflict and no timeline lookup was needed. Rule 2b ("if one side is strictly a
  superset: keep the superset — incoming wins if incoming is the larger version")
  and rule 2e ("incoming only appended a comment or added a field the other side
  never touched: keep the superset") both point the same way. Took the incoming
  version whole.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-c50fdfcc.md` — confirmed. The resolved file is byte-identical
  to the incoming blob (`git show 2ede16d5b13716e2eb2b53cde4a2e3277d42d5b8` — a
  130-line pure addition), so every incoming change is present by construction. The
  staged diff vs HEAD is exactly the one line the incoming commit contributed over the
  ours side:

  ```
   fields:
     version: 0.0.197
     story_points: 3
     bundled_in: bundle-4ff83a8b
  +  chat_comment: comment-546ad063
   ---
  ```

  Nothing from the ours side was dropped: the ours version contains no line absent from
  the resolved file. No hunks were dropped under the BUG-1301 precedence exception, and
  no code, test, or spec-ticket files were involved in this conflict.

## Staging state

`git status --porcelain` reports `M  .xgd/tickets/hot/bug-c50fdfcc.md` with no
remaining conflict-class (UU/AA/DU/UD/AU/UA) entries. CHERRY_PICK_HEAD
(`2ede16d5b13716e2eb2b53cde4a2e3277d42d5b8`) is left intact for
`cherry_pick_finalize_resolution`; no `--continue`/`--skip`/`--abort`/`reset` was run.
