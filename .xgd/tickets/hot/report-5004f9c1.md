---
uid: report-5004f9c1
id: REPORT-2725
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:56:04.383241+00:00'
updated_at: '2026-08-31T05:56:04.383241+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-dfc95a22.md` (REQ-54) — **AA** (both added),
  intent/bookkeeping ticket. Rule **2e** (strict-superset branch), consistent
  with **2b**. Path is outside the sparse-checkout cone, so resolved via
  `git checkout --theirs --` + `git add --sparse --` (DOC-986 §2/§4.1).

  The two sides are byte-identical except for a single added line on the
  incoming side, inside `fields:`:

  ```
  chat_comment: comment-fd21bf4f
  ```

  Ours (HEAD, `sync_working_to_main` — "xgd: sync from xgd-working d3562e3b8285
  (post-watermark)") simply lacks that field; it never touched it. Incoming
  (`069454f824163fc2c604d14819bd4ec66fee23f8`, "xgd(ticket): update request
  request-dfc95a22", 2026-08-23) is therefore a strict superset — incoming only
  added a field the other side never set. No fact is changed differently on the
  two sides, so no `working-timeline` tiebreak was required; the superset rule
  and the enrichment's "take the more recent commit" rule converge on the same
  result. No `intent_uid` / `story_uid` / `capability_uid` fields were touched,
  and no content was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/request-dfc95a22.md` — **fully preserved, verified by blob
  identity.** The staged index blob and the incoming commit's blob are the same
  object:

  ```
  git rev-parse ":.xgd/tickets/hot/request-dfc95a22.md"      -> 635f025580cebfd59137b36789f502f30dc344b5
  git rev-parse "069454f824...:.xgd/tickets/hot/request-..." -> 635f025580cebfd59137b36789f502f30dc344b5
  ```

  The incoming commit's entire diff (180 insertions — the whole file, since this
  is an add/add) is present in the resolution verbatim.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No
code, test, or UAT files were involved in this conflict — the sole conflicted
path is a bookkeeping ticket. `git status --porcelain` shows no remaining
conflict-class lines; the file stages as `M `. The in-progress cherry-pick state
(CHERRY_PICK_HEAD) was left untouched for `cherry_pick_finalize_resolution`.
