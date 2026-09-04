---
uid: report-d0fb5adf
id: REPORT-3448
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:18:38.976159+00:00'
updated_at: '2026-09-04T01:18:38.976159+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket
  (STEP 2 rule **2e**, strict-superset branch), path outside the
  sparse-checkout cone (conflict existed in the index only, no working-tree
  markers; resolved via `git checkout --ours` + `git add --sparse`, each
  issued as the sole content of its own call per BUG-1294).

  Incoming commit: `14cd3cdd` *"xgd(ticket): update request request-3bc4b835"*
  (free_coded, authored 2026-08-31 18:31:19 -0700).
  HEAD side: `737359c6` *"xgd(ticket): seed_local_overlay request
  request-3bc4b835"* (2026-09-02).
  Merge base blob: `1df25fa3` (the ticket state left by `14ad6499`, the
  commit resolved at scope 236/0 immediately before this one).

  Direct theirs-vs-ours diff (`e6b5619e` -> `4de1054a`) is three lines:

  | Fact | Incoming (theirs) | HEAD (ours) | Taken |
  |---|---|---|---|
  | `status` | `free_coded` | `bundled` | ours — same lifecycle, one step further |
  | `updated_at` | `2026-09-01T01:31:19` | `2026-09-02T17:48:27` | ours (later) |
  | `fields.bundled_in` | absent | `bundle-203b1dc2` | ours |
  | `last_field_updated: status` | set | set | identical |
  | `fields.commits` (2 working_sha entries) | added | **already present, identical** | no conflict in substance |
  | `fields.version: 0.2.29` | added | **already present, identical** | no conflict in substance |
  | body | unchanged from base | unchanged from base | identical |

  Ours is a **strict superset**: every field the incoming commit introduces is
  already present in HEAD with identical values, and `status` has advanced one
  further step along the same lifecycle (`free_coding` -> `free_coded` ->
  `bundled`). Rule 2e's superset branch therefore selects ours, which also
  agrees with the auto-enriched rule for this file ("take the more recent
  commit by timestamp"). Taking theirs would have rolled `status` backwards
  from `bundled` to `free_coded` and dropped `bundled_in: bundle-203b1dc2` —
  un-bundling the ticket from the very bundle being reconciled.

## Incoming changes preserved

- `.xgd/tickets/hot/request-3bc4b835.md` — **preserved.** The incoming
  commit's diff introduces exactly four things: `status: free_coding` ->
  `free_coded`, `last_field_updated: body` -> `status`, the two-entry
  `fields.commits` list (`61a0becc…`, `deaf3f98…`), and `fields.version:
  0.2.29`. All four are verified present in the resolved blob `4de1054a`:
  `commits`, `version`, and `last_field_updated` byte-identical; `status`
  present in a further-advanced form (`bundled`) that supersedes rather than
  contradicts `free_coded`. The only incoming value not carried verbatim is
  the `updated_at` timestamp, which HEAD supersedes with a strictly later one.

  No BUG-1301 precedence exception was invoked; no hunk was dropped, and no
  code or test files were in conflict.

## Note for the finalize step

The staged tree has **no net diff vs HEAD** (`git diff --cached HEAD` is
empty; resolved index entry is stage 0 blob `4de1054a`, which is also the
HEAD blob). The HEAD-side `seed_local_overlay` commit had already folded this
commit's effect into the branch, so `14cd3cdd` is redundant here
(BUG-1109/BUG-1122), not discarded — this is STEP 3's "present via a different
route" case, and the checks above demonstrate the incoming changes are in
HEAD rather than merely absent. Per STEP 4, staged and exited @done as normal;
`--skip` was not called and the cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `14cd3cdd4131a5983655c11fa14882953bc8fff9`) is intact
for `cherry_pick_finalize_resolution`.

This is the second consecutive commit in this bundle to resolve this way
(scope 236/0 handled `14ad6499` identically), which is consistent: the
`seed_local_overlay` on the HEAD side captured the ticket's end state, so each
individual working-timeline update to it replays as a no-op.
