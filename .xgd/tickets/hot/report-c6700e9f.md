---
uid: report-c6700e9f
id: REPORT-4848
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:39:14.585023+00:00'
updated_at: '2026-09-23T18:39:14.585023+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` (REQ-172) — **UU**, intent/bookkeeping
  ticket (§2e: `request-*` is user-authored, not a matrix-defining spec ticket).
  Index-only conflict — the path is outside the sparse-checkout cone (DOC-986
  §2/§4.1), so there were no working-tree markers; resolved via
  `git checkout --ours` then `git add --sparse`.

  **Rule applied: §2e "one side a strict superset — keep the superset."**
  Not the later-timestamp tiebreak, because there is no fact on which the two
  sides genuinely compete.

  Incoming is `8760eac3104d25f377bac302bb62a2342b20b995` (authored
  2026-09-01T21:34:31-07:00). Diffing base (stage 1, `180dc007d3`) against
  theirs (stage 3, `09f46fb895`) isolates exactly what this commit contributes,
  and each item is already satisfied by HEAD (stage 2, `284e1e08f9`):

  - `commits:` list — `eb6655c337…` and `324b55bf19…`, both with null
    reconcile/main shas: **already present in HEAD, byte-identical**
  - `version: 0.2.37`: **already present in HEAD, identical**
  - `last_field_updated: body → status`: HEAD already reads `status` — identical
  - `status: free_coding → free_coded`: HEAD is `free_and_reconciled`, which is
    downstream of `free_coded` in the lifecycle
  - `updated_at → 2026-09-01T21:34:31`: HEAD is `2026-09-19T15:15:29`, 18 days later
  - drops the trailing EOF newline: cosmetic serializer churn, see note below

  HEAD additionally carries `completed_at: 2026-09-14T10:29:05` (incoming:
  `null`) and `bundled_in: bundle-8e1807f6` (absent from incoming). So HEAD
  contains every fact incoming asserts, at an equal-or-later lifecycle position,
  plus two facts incoming lacks. Nothing was discarded to reach this resolution.

  Resulting staged blob is `284e1e08f9…`, identical to HEAD's blob for this
  path — the staged diff is therefore empty. Left staged as-is per the standing
  instruction not to invoke `--skip`; finalize owns that decision.

## Incoming changes preserved

Confirmed — and in this case preserved *without modification*, because HEAD
already subsumed the incoming commit's entire payload. The two substantive
additions (`commits:` and `version:`) appear verbatim in the resolved file.
Verified by direct blob comparison rather than by eyeballing merge output:
`git diff 284e1e08f9 09f46fb895` reports only the five frontmatter lines listed
above, on every one of which HEAD holds the later or strictly-richer value.

No hunk was dropped, so the BUG-1301 precedence exception was **not** invoked.

One cosmetic note, recorded for completeness rather than as a concern: this
commit removes the EOF newline, whereas the immediately preceding commit in
this same resync queue (`4305ac944e`, attempt 297) *added* it. The xgd ticket
serializer is evidently inconsistent across successive writes to the same file.
The resolved file keeps the newline, matching HEAD and the majority convention
in `.xgd/tickets/hot/` (16 of 23 files sampled). No bearing on ticket semantics.

## Flagged for post-merge review

The auto-enrichment reported intent unknown on both sides — both commits carry
the generic subject `xgd(ticket): update request request-8b33a146`, with no
free-text operation narrative to read — and asked that the file be flagged.

Flagging it, though the risk here is low: unlike a genuine same-fact collision,
this resolution did not require choosing a winner, since incoming is wholly
contained in HEAD. Any review is limited to confirming that
`status: free_and_reconciled` with `completed_at: 2026-09-14` and
`bundled_in: bundle-8e1807f6` is the intended terminal state for REQ-172 — that
the 2026-09-19 reconcile genuinely supersedes this 2026-09-01 free-coding
checkpoint, which both the lifecycle ordering and the 18-day gap indicate.
