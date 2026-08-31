---
uid: report-d0ca06cc
id: REPORT-2821
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:52:33.074744+00:00'
updated_at: '2026-08-31T07:52:33.074744+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-2936cebf.md` — class **AA** (both added), intent/bookkeeping ticket
  (rule **2e**, superset case; staged with `--sparse` since `.xgd/tickets/` is outside the
  sparse-checkout cone). Both sides carry the same commit subject
  (`xgd(ticket): update bug bug-2936cebf`), so the enrichment's "intent unknown" note applied.
  Rather than pick a side by timestamp, the two blobs were diffed directly: they are identical
  except for a single line the incoming side adds inside the frontmatter —
  `chat_comment: comment-fc659764`. The incoming side is therefore a strict superset (205 lines
  ours, 206 lines theirs; one pure insertion, zero deletions, zero modifications). Resolved by
  taking the incoming side via `git checkout --theirs`, which under a strict-superset diff loses
  nothing from HEAD. No content was invented; no `intent_uid` / `story_uid` / `capability_uid`
  field was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-2936cebf.md` — **fully preserved**. The resolved working-tree file is
  byte-identical to the incoming blob `4b10f3a` (verified with `diff -q` → identical), so every
  line of the incoming commit `0e79884` is present. The one substantive incoming change,
  `chat_comment: comment-fc659764`, is confirmed present at line 22 of the resolved file.
  No conflict markers remain (`grep -c` for `<<<<<<<`/`=======`/`>>>>>>>` → 0).

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No code,
test, or spec-ticket files were in conflict — this cherry-pick touched exactly one file.

Post-resolution state: `git status --porcelain` shows `M  .xgd/tickets/hot/bug-2936cebf.md`
(staged, no conflict-class entries). `CHERRY_PICK_HEAD` left intact at `0e79884` for
`cherry_pick_finalize_resolution`.
