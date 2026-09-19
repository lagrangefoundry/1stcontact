---
uid: report-265e1e42
id: REPORT-4377
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T10:17:09.849995+00:00'
updated_at: '2026-09-19T10:17:09.849995+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-119dd4af.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**: "one side is a strict superset of the other —
  keep the superset." Kept HEAD (`git checkout --ours` + `git add --sparse`).

  Incoming `7e204dc27e` ("xgd(ticket): update request request-119dd4af",
  2026-08-31) changed exactly one fact: it added
  `fields.chat_comment: comment-733e844c` (2 insertions / 1 deletion, the
  second being the file's trailing newline).

  HEAD (`xgd(ticket): seed_local_overlay request request-119dd4af`) already
  carries that identical field, plus `fields.commits`, `fields.version:
  0.2.23`, `fields.bundled_in: bundle-87be4669`, `status: bundled`,
  `updated_at: 2026-09-09T21:32:49Z`, and the full "What landed" body section.
  No fact is changed differently on the two sides — HEAD strictly contains the
  incoming side, so no per-fact `working-timeline` tiebreak was needed. The
  enrichment's fallback rule (take the more recent commit by timestamp) points
  the same way: HEAD's `updated_at` is 2026-09-09, the incoming commit is
  2026-08-31.

## Incoming changes preserved

Confirmed. `chat_comment: comment-733e844c` — the incoming commit's entire
contribution — sits at line 18 of the resolved file, *outside both conflict
hunks*, on the common side of the merge. The two hunks were HEAD-only
additions (fields block; body rewrite) against an unmodified incoming tail.

No hunk was dropped; the BUG-1301 precedence exception was not invoked. No
test functions were involved.

## Note for the finalize step

The staged tree nets to **no diff vs HEAD** (`git diff --cached --stat HEAD`
is empty). This is the redundant-commit case of BUG-1109/BUG-1122, not a
discard: STEP 3's discriminator is satisfied — the incoming commit's key
change is *present* in HEAD (verified above), not merely absent. Per STEP 4,
`--skip` was not called; the cherry-pick sequencer state is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.
