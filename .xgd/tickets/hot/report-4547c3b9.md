---
uid: report-4547c3b9
id: REPORT-4042
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T21:39:42.725132+00:00'
updated_at: '2026-09-11T21:39:42.725132+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — AA (both added), outside the
  sparse-checkout cone (index-only, no working-tree markers). Rule 2e
  (intent/bookkeeping ticket), superset branch. Resolved with the HEAD side
  via `git checkout --ours` + `git add --sparse`.

  Both sides are the same REQ-149 ticket at different points on its own
  timeline. A blob-to-blob diff shows the ONLY lines present on the incoming
  side and absent from HEAD are older values of facts HEAD carries forward:

  - `version: 0.2.1`          → HEAD has `0.2.9`
  - `status: free_coding`     → HEAD has `free_and_reconciled`
  - `completed_at: null`      → HEAD has `2026-08-31T14:22:34`
  - `updated_at: 2026-08-22`  → HEAD has `2026-08-31`

  HEAD's `fields.commits` is a strict superset of the incoming list (6 entries
  vs 2, the incoming 2 present verbatim as the first two), and HEAD adds
  `bundled_in: bundle-b3b7c399` and `chat_comment: comment-98e86f10`, which the
  incoming side never had. The body is a strict superset too: the incoming
  body ends at the "builder must not fail silently" follow-up (AC-10/AC-11),
  and HEAD contains that section byte-identically plus two later follow-ups
  ("`bin/build` failed on a type-only reach into node", AC-12; "the deploy
  secret guard asked the wrong question", AC-13..AC-16). No section, field or
  paragraph exists on the incoming side that is missing from HEAD.

  No per-fact timeline arbitration was needed — there is no fact the two sides
  set differently other than the monotonic lifecycle values above. Both the
  superset test and the timestamp test point the same way: incoming commit
  9e5327cf is 2026-08-22 16:55 -0700; the HEAD-side commit for this file
  (5e6f3a68) is 2026-09-01 15:04 -0700.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is
a bookkeeping ticket (2e), not a code file, a spec ticket, or a UAT. No test
function on either side was deleted; the BUG-1301 precedence exception was not
invoked and no hunk was dropped under it.

Every fact the incoming side asserts is present in the resolved file, reached
by the ticket's own later evolution rather than by this resolution: its two
commit SHAs are the first two entries of HEAD's six, its version and status are
earlier points on the same monotonic progression HEAD already advanced past,
and its entire body is contained in HEAD's. This is STEP 3's "present via a
different route" case, not a discard.

Consequence: the staged tree has no diff against HEAD (`git diff --cached
--stat HEAD` is empty). Per STEP 4 this is a genuinely redundant commit, not a
discarded one — `--skip` was NOT called; the tree is staged and
CHERRY_PICK_HEAD is left in place for cherry_pick_finalize_resolution to
detect the empty staged diff and skip the commit itself.

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain.
