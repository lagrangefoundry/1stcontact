---
uid: report-ecc55250
id: REPORT-2838
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:13:09.715398+00:00'
updated_at: '2026-08-31T08:13:09.715398+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-bc936f38.md` — class **AA** (both added; no stage-1 base in the index). Intent/bookkeeping ticket (`request-*`), so rule **2e** applies, superset branch: the incoming side is a strict superset of HEAD's, so the incoming version was taken whole via `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Basis for "strict superset": a full `diff -u` of the two index blobs (ours `31b601d3b0`, theirs `20ddf81a88`) yields exactly one hunk — theirs adds `chat_comment: comment-532fd455` to the `fields:` frontmatter block. All other 119 lines, including every other frontmatter field (`version: 0.0.110`, `story_points: 2`, `bundled_in: bundle-ab9e0cb6`) and the entire markdown body, are byte-identical. There is no fact changed differently on the two sides, so no per-fact `xgd working-timeline` tiebreak was required, and no field was invented that was not present on the incoming side.

  The enrichment metadata's fallback rule ("intent unknown on one or both sides; take the more recent commit by timestamp and flag for post-merge review") did not need to be exercised: the two sides do not compete. Flagging for post-merge review is therefore not warranted on intent-conflict grounds — the resolution is content-determined, not timestamp-determined.

## Incoming changes preserved

- `.xgd/tickets/hot/request-bc936f38.md` — **preserved in full.** The incoming commit `c9ca1440` (`xgd(ticket): update request request-bc936f38`, Martin Westhead, Sun Aug 23 13:23:24 2026 -0700) touches only this one file. Post-resolution, the worktree file is byte-identical to the incoming blob `20ddf81a88` (verified by `diff -u` against the extracted blob: no differences). The staged diff vs HEAD is exactly the incoming commit's unique contribution:

  ```
  @@ -20,6 +20,7 @@ fields:
     version: 0.0.110
     story_points: 2
     bundled_in: bundle-ab9e0cb6
  +  chat_comment: comment-532fd455
   ---
  ```

  Nothing from the incoming diff is absent from the resolved file, so STEP 3's discard guard is satisfied. No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict; no test function on either side was deleted.

## Tree state

`git status --porcelain` reports no remaining conflict-class entries (UU/AA/DU/UD/AU/UA/DD). The single resolved path is staged as `M`. The in-progress cherry-pick was left untouched — `CHERRY_PICK_HEAD` (`c9ca144015e3ecb7aace99d424618a9ce37998a6`) is still present for `cherry_pick_finalize_resolution`. No `--continue`/`--skip`/`--quit`/`--abort`/`reset` was issued, and no full-suite quality check was run.
