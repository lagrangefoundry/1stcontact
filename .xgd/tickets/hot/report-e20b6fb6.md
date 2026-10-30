---
uid: report-e20b6fb6
id: REPORT-4847
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:36:20.504287+00:00'
updated_at: '2026-09-23T18:36:20.504287+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, intent ticket
  (§2e: `request-*` is user-authored bookkeeping, not a matrix-defining spec
  ticket). Outside the sparse cone, so staged with `git add --sparse`.
  Two hunks:

  1. **Frontmatter lifecycle block** — genuine same-fact conflict: both sides
     changed `updated_at` / `completed_at` / `last_field_updated` / `status`.
     Resolved per §2e's later-positioned-intent rule, which matches the
     auto-enrichment's instruction to take the more recent side by timestamp.
     HEAD: `updated_at 2026-09-19T15:15:29Z`, `completed_at 2026-09-14T10:29:05Z`,
     `status: free_and_reconciled`. Incoming (`4305ac944e`, authored
     2026-09-01T21:33:14Z): `updated_at 2026-09-01T21:33:14Z`,
     `completed_at: null`, `status: free_coding`. HEAD is eighteen days later
     and strictly further along the lifecycle; taking incoming would regress a
     reconciled, completed ticket back to in-progress. **HEAD kept.**

  2. **Final line of the test-plan section** — spurious conflict: both sides are
     byte-identical (`unnamed binary staying unnamed.`). The only real
     difference is EOF newline — HEAD had none, incoming adds one. Took a single
     copy **with** the trailing newline: that is the incoming side's
     contribution, and it is the majority convention in `.xgd/tickets/hot/`
     (16 of 23 files sampled end with a newline).

## Incoming changes preserved

Confirmed. `git show 4305ac944e -- .xgd/tickets/hot/request-8b33a146.md` is an
83-insertion/30-deletion body rewrite (`last_field_updated: body`). Every
substantive edit in it is present in the resolved file, having merged cleanly
outside the two conflict hunks:

- render table row widened to `any other text/* (plain, csv, log), plus JSON and XML`
- new paragraph capping the reader window height so a long document does not
  push the rights record and description off the pane
- expand-button paragraph reworded to "the builder's **existing** modal shell …
  the shell is reused rather than rebuilt"
- PDF paragraph's added "The bytes are read once: the frame asks the route for
  them itself" sentence
- `[[BUG-41]]` provenance sentence on the content-type duplication paragraph
- the entire new "**Material that predates the field resolves its type from its
  own name**" section (`resolveContentType` fallback)

Nothing from the incoming commit was discarded. The BUG-1301 precedence
exception was not invoked — no hunk was dropped.

## Flagged for post-merge review

The auto-enrichment reported intent unknown on both sides (both commits carry
the generic `xgd(ticket): update request request-8b33a146` subject) and asked
that this file be flagged. Flagging it here: the frontmatter resolution rests
on timestamp ordering alone, not on a stated operation narrative. The body is
not at risk — both sides agree on it — so any review is limited to whether
`status: free_and_reconciled` / `completed_at: 2026-09-14` is the intended
terminal state for REQ-172.
