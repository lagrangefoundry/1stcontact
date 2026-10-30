---
uid: report-1b2f061e
id: REPORT-4857
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:59:06.284835+00:00'
updated_at: '2026-09-23T18:59:06.284835+00:00'
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
  Both conflict hunks were pure frontmatter lifecycle state; the body merged
  without conflict.

  Timestamps: HEAD side `771b0857` *(xgd(ticket): seed_local_overlay,
  2026-09-17 13:23 -0700)* vs incoming `56087d83` *(xgd(ticket): update,
  2026-09-01 15:10 -0700)*. HEAD is the more recent side, so HEAD's value
  was taken for each conflicting fact:

  | fact | HEAD (kept) | incoming (superseded) |
  |---|---|---|
  | `status` | `bundled` | `free_coded` |
  | `completed_at` | `2026-09-14T10:29:03` | `null` |
  | `updated_at` | `2026-09-16T01:48:38` | `2026-09-01T22:10:38` |
  | `fields.bundled_in` | `bundle-8e1807f6` | absent |

  Every conflicting field is the *same fact* on both sides, and the incoming
  value is a strictly earlier point in the same lifecycle
  (`draft → free_coded → … → bundled`). Taking incoming would have regressed
  the ticket to `free_coded` and dropped its completion timestamp and bundle
  reference. Per-fact resolution, not whole-file winner-picking: there were no
  disjoint edits to combine, because incoming's only other contribution was
  already present on HEAD (next section).

  Staged with `git add --sparse` (`.xgd/tickets/**` is outside the
  sparse-checkout cone on resync branches, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-51514090.md` — incoming `56087d83` made exactly
  three contributions: (1) `status: draft → free_coded`, (2) an `updated_at`
  bump, and (3) the addition of `fields.commits` (three `working_sha` entries:
  `f5807330`, `92e927e7`, `d612c1aa`, each with `reconcile_sha: null` /
  `main_sha: null`) plus `fields.version: 0.2.39`.

  Contribution (3) — the only non-lifecycle content — **is present verbatim in
  the resolved file**; HEAD already carried the identical `fields.commits`
  block and `version: 0.2.39`, so nothing needed grafting. Contributions (1)
  and (2) are superseded lifecycle state as tabulated above, not discarded
  developer content.

  No code files were involved in this conflict, so the BUG-1301 precedence
  exception was not invoked and no hunk was dropped under it.

  Net result: the resolved file is byte-identical to
  `HEAD:.xgd/tickets/hot/request-51514090.md` (verified with
  `git diff --no-index`), so this cherry-pick stages an empty diff. Per STEP 4
  this is left as-is for Python's finalize step to detect and skip — no
  `--skip`/`--continue` was issued, and `CHERRY_PICK_HEAD` (`56087d83`) is
  still present.

## Post-merge review flag

Per the enrichment rule's "flag this file for post-merge review": the HEAD-side
commit is a `seed_local_overlay`, so its lifecycle state (`bundled`,
`bundle-8e1807f6`) originates from the main-rooted overlay rather than from
xgd-working. Worth a confirming glance that `bundle-8e1807f6` is the intended
bundle for REQ-156 once the resync lands.
