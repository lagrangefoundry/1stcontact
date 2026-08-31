---
uid: report-132359ff
id: REPORT-2844
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:20:58.939925+00:00'
updated_at: '2026-08-31T08:20:58.939925+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-de67e1a1.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`, REQ-128). Rule applied: **2b superset / 2e "keep the superset"**.
  Resolved with `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone — `.xgd/tickets/**` is negated in `sparse-checkout list` — so the
  conflict existed only in the index, with no working-tree markers; DOC-986 §2/§4.1).

  Diffing the two index stages (ours `b6930f5c`, theirs `ee103d1c`) showed the incoming
  side is a **strict superset**: identical byte-for-byte except for one added frontmatter
  field under `fields:`

  ```
  +  chat_comment: comment-2e8da8c2
  ```

  No field was changed differently on the two sides, so 2e's genuine-conflict branch
  (working-timeline per fact) does not apply and no timeline lookup was needed. Nothing
  was invented that was not present on either side.

## Incoming changes preserved

- `.xgd/tickets/hot/request-de67e1a1.md` — **fully preserved, verified**. Incoming commit
  `48c69f7207017c8d08a93df9e50da01997461bad` (_xgd(ticket): update request
  request-de67e1a1_, 2026-08-23) contributes this file as a whole-file add
  (228 insertions, 1 file). `git diff --cached 48c69f72 -- <path>` returns **empty** — the
  staged blob is byte-identical to the incoming commit's version, so every incoming
  change, including the `chat_comment: comment-2e8da8c2` linkage, is present in the
  resolution. Ours-side content was not discarded either: it is a proper subset of what
  was staged.

- No hunks were dropped. The BUG-1301 PRECEDENCE exception was **not** invoked, and no
  test files or code files were involved in this conflict.

## Post-resolution state

- `git status --porcelain`: no `UU`/`AA`/`DU`/`UD`/`AU`/`UA` lines remain; the file is
  staged as `M`.
- `CHERRY_PICK_HEAD` still present (`48c69f7207017c8d08a93df9e50da01997461bad`) — the
  cherry-pick remains paused for `cherry_pick_finalize_resolution`. No
  `--continue`/`--skip`/`--quit`/`--abort`/`reset` was issued.
