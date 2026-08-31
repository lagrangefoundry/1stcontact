---
uid: report-16dbcbc1
id: REPORT-2764
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:41:06.829324+00:00'
updated_at: '2026-08-31T06:41:06.829324+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-f5aad951.md` — class **AA** (both added), intent/bookkeeping
  ticket (`request-*`). Rules **2b** / **2e**: incoming is a *strict superset* of ours, so
  the superset was kept (`git checkout --theirs` + `git add --sparse`).
  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed in
  the index only — the working tree held the ours-side blob with no conflict markers.

  Byte-level diff between the two stages was a single added line, nothing else:

  ```
   fields:
     priority: medium
     auto_merge_back: true
     needs_review: false
  +  chat_comment: comment-7cfc457d
   ---
  ```

  No timeline lookup was needed: the sides do not disagree on any fact. Ours touches no
  field that incoming changes; incoming only adds a field ours never had. Body content
  (Scope, Dependencies, Deliverables, UATs, Out of scope, and the
  "ABANDONED — superseded by the framework pivot (2026-08-20)" section) is identical on
  both sides, so composing the two sides and taking the superset give the same result.

  The enrichment metadata listed both subjects as `xgd(ticket): update request
  request-f5aad951` with intent unknown on one or both sides, which would ordinarily
  route to "take the more recent commit and flag for post-merge review." That rule was
  not needed here — superset containment resolves the file without discarding anything
  from either side. No post-merge review flag is warranted: the ours side is fully
  contained in the result.

## Incoming changes preserved

- `.xgd/tickets/hot/request-f5aad951.md` — **preserved in full.** The resolved blob is
  byte-identical to the incoming stage-3 blob
  (`899f546965776821089152442040db8e6dcdd729`; verified via `git hash-object` on the
  resolved working-tree file). The incoming commit
  (`9be12c08008911e8d4ba689dba3e41b135e830cc`) adds this file as 70 insertions; every one
  of those lines, including the sole line that distinguishes it from ours
  (`chat_comment: comment-7cfc457d`), is present in the staged result.

No code/implementation files were in conflict. No hunks were dropped, so the BUG-1301
precedence exception was not invoked. No test function on either side was deleted.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD`) left intact for
`cherry_pick_finalize_resolution`; no `--continue`/`--skip`/`--quit`/`--abort`/`reset`
was run.
