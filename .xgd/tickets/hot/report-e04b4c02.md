---
uid: report-e04b4c02
id: REPORT-4858
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T19:00:50.087561+00:00'
updated_at: '2026-09-23T19:00:50.087561+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e) with the enrichment rule "intent unknown on one or both sides →
  take the more recent commit by timestamp and flag for post-merge review".
  A single conflict hunk, entirely frontmatter lifecycle state; the body and
  the whole `fields:` block merged without conflict.

  Timestamps: HEAD side `771b0857` *(xgd(ticket): seed_local_overlay,
  2026-09-17 13:23 -0700)* vs incoming `881fa998` *(xgd(ticket): update,
  2026-09-01 15:15 -0700)*. HEAD is the more recent side, so HEAD's value was
  taken for each conflicting fact:

  | fact | HEAD (kept) | incoming (superseded) |
  |---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` |
  | `completed_at` | `2026-09-14T10:29:03` | `null` |
  | `updated_at` | `2026-09-16T01:48:38` | `2026-09-01T22:15:38` |

  All three are the *same fact* on both sides, and every incoming value is a
  strictly earlier point in the same lifecycle
  (`draft → free_coded → ready_to_reconcile → … → bundled`). Taking incoming
  would have regressed the ticket from `bundled` to `ready_to_reconcile` and
  dropped its completion timestamp. Per-fact resolution, not whole-file
  winner-picking — there were no disjoint edits to combine, because incoming
  touched nothing but these three fields.

  Staged with `git add --sparse` (`.xgd/tickets/**` is outside the
  sparse-checkout cone on resync branches, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-51514090.md` — incoming `881fa998` is a two-line
  diff and nothing more: `status: free_coded → ready_to_reconcile` and the
  accompanying `updated_at` bump. It adds no fields, no body text, and no
  `fields.commits`/`version` entries. There is therefore no non-lifecycle
  incoming content that could have been discarded — the entire commit is
  superseded status bookkeeping, as tabulated above.

  No code files were involved in this conflict, so the BUG-1301 precedence
  exception was not invoked and no hunk was dropped under it.

  Net result: the resolved file is byte-identical to
  `HEAD:.xgd/tickets/hot/request-51514090.md` (verified with
  `git diff --no-index`), so this cherry-pick stages an empty diff. Per STEP 4
  that is left as-is for Python's finalize step to detect and skip — no
  `--skip`/`--continue` was issued, and `CHERRY_PICK_HEAD` (`881fa998`) is
  still present.

## Note

This is the second consecutive resync commit to conflict on this one file for
the same structural reason: HEAD carries REQ-156 at `bundled` (via the
`seed_local_overlay` commit `771b0857`, 2026-09-17), while the xgd-working
queue is replaying that ticket's earlier status transitions from 2026-09-01
one commit at a time (`free_coded` in `56087d83`, now `ready_to_reconcile` in
`881fa998`). Each such commit resolves to HEAD and stages empty. Expect
further no-op conflicts on this file for the remaining status transitions
between `ready_to_reconcile` and `bundled`.

## Post-merge review flag

Per the enrichment rule's "flag this file for post-merge review": HEAD's
lifecycle state (`bundled`, `bundled_in: bundle-8e1807f6`) comes from a
`seed_local_overlay` commit, i.e. it originates from the main-rooted overlay
rather than from xgd-working. Worth a confirming glance that
`bundle-8e1807f6` is the intended bundle for REQ-156 once the resync lands.
