---
uid: report-ae55a0b6
id: REPORT-4538
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:29:25.462498+00:00'
updated_at: '2026-09-20T20:29:25.462498+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-554ac441.md` — UU, intent/bookkeeping ticket (REQ-149,
  a `request-*` ticket; §2e class, living in `hot/`). Both sides changed the SAME
  three frontmatter facts (`status`, `completed_at`, `updated_at`), so this is a
  genuine per-fact intent conflict, not a pair of disjoint edits that could be
  combined. Resolved by the §2e later-positioned-intent rule, per fact:
    - `status`: HEAD `free_and_reconciled` kept (incoming: `ready_to_reconcile`)
    - `completed_at`: HEAD `2026-08-31T14:22:34.874054+00:00` kept (incoming: `null`)
    - `updated_at`: HEAD `2026-08-31T14:22:34.874054+00:00` kept (incoming:
      `2026-08-24T01:11:09.731950+00:00`)
  The ticket body (~490 lines: decisions D1–D7, schema, ACs 1–16, the four
  follow-up sections) was byte-identical on both sides and is untouched.

  Ordering evidence — the HEAD side is unambiguously the later intent:
    - incoming `CHERRY_PICK_HEAD` 67b8efddf4, committed 2026-08-23T18:11:09-07:00
    - HEAD-side commit 232e75a2cd, committed 2026-09-14T03:15:49-07:00
    - frontmatter `updated_at` agrees: HEAD 2026-08-31 vs incoming 2026-08-24
  This matches the auto-enrichment rule supplied for this file ("take the more
  recent commit by timestamp"), which applied because the xgd-kind/intent
  lookup was inconclusive on both sides (both subjects are the generic
  `xgd(ticket): update request request-554ac441`).

## Incoming changes preserved

The incoming commit 67b8efddf4 is a 2-line frontmatter edit and contains no
code. Its entire payload is the lifecycle transition `free_coded` →
`ready_to_reconcile` (plus the matching `updated_at` bump). That transition is
NOT present in the resolved file, and that absence is correct rather than a
discard of developer work:

- `ready_to_reconcile` is an intermediate state that HEAD has already advanced
  *through*. HEAD's `free_and_reconciled` + non-null `completed_at` is the
  terminal state downstream of it, recorded by the resync branch's own tip
  commit acb0d7985c ("xgd(reconciliation): terminal state complete").
- Re-applying the incoming value would move the ticket BACKWARD in its
  lifecycle and null out a real `completed_at`. Under §2e that is exactly the
  "same fact changed differently on both sides" case, and the later intent
  (HEAD, three weeks newer) governs.

No code/implementation files were in conflict, so STEP 3's per-file
`git show $CPHEAD -- <file>` verification has no code targets. No UAT test
function on either side of this conflict was deleted, and the BUG-1301
PRECEDENCE exception was not invoked — no hunk was dropped on
already-removed-target grounds.

## Staging state

`git status --porcelain` is empty: the resolved content is byte-identical to
HEAD, so this cherry-pick reduces to an empty commit. Per STEP 4 this was
staged and left alone — `--continue`/`--skip`/`--quit`/`--abort` were NOT
called, and `CHERRY_PICK_HEAD` (67b8efddf4) is still present for the finalize
step to detect the clean staged diff and skip the commit itself.
