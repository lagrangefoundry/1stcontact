---
uid: report-67dee5b3
id: REPORT-3447
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:16:59.553988+00:00'
updated_at: '2026-09-04T01:16:59.553988+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket
  (STEP 2 rule **2e**), path outside the sparse-checkout cone (no working-tree
  markers; conflict existed in the index only, resolved via
  `git checkout --ours` + `git add --sparse`).

  Incoming commit: `14ad6499` *"xgd(ticket): update request request-3bc4b835"*
  (free_coded, authored 2026-08-31).
  HEAD side: `737359c6` *"xgd(ticket): seed_local_overlay request
  request-3bc4b835"* (2026-09-02).

  Per-fact analysis against the merge base (`0b7b530d`):

  | Fact | Incoming (theirs) | HEAD (ours) | Taken |
  |---|---|---|---|
  | body: append blank line + `-` | added | **already present** | identical on both sides — no conflict in substance |
  | `status` | `free_coding` (unchanged from base) | `bundled` | ours |
  | `updated_at` | `2026-09-01T01:30:30` | `2026-09-02T17:48:27` | ours (later) |
  | `last_field_updated` | `body` | `status` | ours (describes ours' later operation) |
  | `fields.commits` (2 working_sha entries) | absent | added | ours |
  | `fields.version: 0.2.29` | absent | added | ours |
  | `fields.bundled_in: bundle-203b1dc2` | absent | added | ours |

  Ours is a strict superset in content: it carries the incoming side's only
  substantive edit (the body append) *plus* this bundle's own bookkeeping.
  The remaining differences are frontmatter bookkeeping where ours is the
  later-positioned state. Taking theirs would have reverted the
  operator-owned `status: bundled` back to `free_coding` and dropped
  `fields.commits` / `fields.version` / `fields.bundled_in` — i.e. it would
  have un-bundled the ticket from the very bundle (`bundle-203b1dc2`)
  currently being reconciled. This also matches the auto-enriched resolution
  rule for this file ("take the more recent commit by timestamp").

## Incoming changes preserved

- `.xgd/tickets/hot/request-3bc4b835.md` — **preserved.** The incoming
  commit's entire diff is: (a) `updated_at` bump, (b)
  `last_field_updated: status` -> `body`, (c) append a blank line and a `-`
  to the end of the body. Change (c), the only substantive content edit, is
  verified present verbatim in the resolved blob (`4de1054a`, tail reads
  `...without changing it.` / blank / `-`). Changes (a) and (b) are
  bookkeeping fields superseded by the HEAD side's strictly later values.

  No BUG-1301 precedence exception was invoked; no hunk was dropped, and no
  test function was touched (no code or test files were in conflict).

## Note for the finalize step

The staged tree has **no net diff vs HEAD** (`git diff --cached HEAD` is
empty) — the HEAD-side `seed_local_overlay` commit had already folded this
commit's body edit into the branch, so `14ad6499` is redundant here
(BUG-1109/BUG-1122), not discarded. This is the STEP 3 "present via a
different route" case, not the "genuinely absent" case: the incoming key
change is demonstrably in HEAD. Per STEP 4 this is staged and exited @done
as normal; `--skip` was not called and the cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `14ad649903640866eab7e872e7dee23aa5071806`) is intact
for `cherry_pick_finalize_resolution`.
