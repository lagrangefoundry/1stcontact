---
uid: report-81f60f89
id: REPORT-2736
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:08:34.312170+00:00'
updated_at: '2026-08-31T06:08:34.312170+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-d18ad577.md` — **AA** (both added), intent/bookkeeping
  ticket → **rule 2e** (`bug-*` ticket: user-authored content, not matrix state).
  Both sides added the file with no common ancestor stage. The two blobs
  (`320ef54a` ours / `2d8a0bde` incoming) are byte-identical except for a single
  added frontmatter field on the incoming side:

  ```
   fields:
     ...
     bundled_in: bundle-cceaba25
  +  chat_comment: comment-6f4f1ffa
  ```

  No field or section is changed differently on the two sides, so this is not a
  genuine per-fact conflict — incoming is a **strict superset** (adds a field
  ours never touched). Per 2e's superset clause, kept the superset: staged via
  `git checkout --theirs` then `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

No other conflict-class entries were present: `git status --porcelain` showed
exactly one conflict line (`AA` on the above path); the remaining `??` entries
are untracked ticket files, not conflicts.

## Incoming changes preserved

Incoming commit `f00a85e7a818f540c7d4c1e291c3264ce628f0f1`
(*xgd(ticket): update bug bug-d18ad577*, 1 file, +69) touches only this ticket.

Verified: `git diff --cached f00a85e7a8 -- .xgd/tickets/hot/bug-d18ad577.md`
returns **empty** — the staged blob is byte-identical to the incoming commit's
version of the file. Every line of the incoming change is present; nothing was
discarded.

The staged diff vs HEAD is the single `chat_comment: comment-6f4f1ffa` addition,
which is precisely the incoming side's contribution.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked. No
code/implementation files, UAT test files, spec tickets, or config files were
involved in this conflict.

Cherry-pick sequencer state left untouched: `CHERRY_PICK_HEAD` still present for
`cherry_pick_finalize_resolution`. Only `checkout --theirs` and `add --sparse`
were issued.
