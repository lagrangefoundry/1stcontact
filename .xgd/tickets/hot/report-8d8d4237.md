---
uid: report-8d8d4237
id: REPORT-4630
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T04:44:14.432974+00:00'
updated_at: '2026-09-21T04:44:14.432974+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (`request-*`, STEP 2e). Resolved by keeping the HEAD side in full.

  The two sides are different generations of the same ticket, not competing
  edits on the same fact:

  | | HEAD (`resync-7b4182de`) | incoming (`7e204dc27e`) |
  |---|---|---|
  | `updated_at` | 2026-09-09T21:32:49Z | 2026-08-30T23:19:15Z |
  | `status` | `bundled` | `draft` |
  | body | full `# What landed` write-up (commit `115f0d39ec`, v0.2.23) | pre-implementation draft ending at Acceptance / Open questions |
  | `fields` | adds `commits`, `version`, `bundled_in` | — |

  HEAD is a strict superset of the incoming side on every field and section,
  so 2e's "one side a strict superset: keep the superset" applies. No fact is
  changed differently on the two sides, so the per-fact timeline tiebreak was
  not needed; it would have selected HEAD anyway (later `updated_at`, matching
  the enrichment metadata's rule for unknown-intent sides).

  File was staged with `git checkout --ours` + `git add --sparse` (the path is
  outside the sparse-checkout cone on this resync branch, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-119dd4af.md`: `git show 7e204dc27e -- <file>` shows
  the incoming commit's entire payload is two lines — `+  chat_comment:
  comment-733e844c` under `fields:`, and the removal of the file's trailing
  newline. **`chat_comment: comment-733e844c` is present in the resolved file**
  (frontmatter, under `fields:`), having already been carried into HEAD by an
  earlier commit in this branch's history. Nothing from the incoming side was
  discarded.

  Consequently the staged tree is byte-identical to HEAD
  (`git diff --cached HEAD` is empty) and `git grep '^<<<<<<< '` over the file
  returns nothing. Per STEP 4, no `--skip` was issued; the finalize step will
  detect the empty staged diff. `CHERRY_PICK_HEAD` is intact at
  `7e204dc27e9b62cc20a1944d11c36366267ea01f`.

  The BUG-1301 precedence exception was **not** invoked — no hunk was dropped,
  and no test function was deleted.
