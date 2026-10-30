---
uid: report-53f380e5
id: REPORT-4723
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:02:21.939363+00:00'
updated_at: '2026-09-21T14:02:21.939363+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket
  (`request-*` kind, §2e). Resolved to **ours** (blob `b4342d0d`).

  Three-way read of the index stages:

  | stage | status | updated_at | extras |
  |---|---|---|---|
  | base (`1df25fa3`) | `free_coding` | 2026-09-01T01:30:30 | — |
  | theirs (`e6b5619e`, CHERRY_PICK_HEAD `14cd3cdd41`) | `free_coded` | 2026-09-01T01:31:19 | + `commits` list, `version: 0.2.29` |
  | ours (`b4342d0d`, HEAD) | `bundled` | 2026-09-09T21:32:50 | + `commits` list, `version: 0.2.29`, `bundled_in: bundle-87be4669`, + body note on the account/business split |

  §2e's **"one side a strict superset: keep the superset"** applies directly.
  A direct `diff theirs -> ours` confirms ours is a strict successor: it already
  contains every line theirs adds, and additionally advances the lifecycle
  (`free_coded` -> `bundled`), carries the newer `updated_at`, adds
  `bundled_in`, and appends the REQ-178 body note. There is no field whose
  value the two sides set differently in a way that needs per-fact arbitration —
  every field theirs touches, ours sets to the same value or to a strictly later
  state. The auto-enriched metadata rule ("take the more recent commit by
  timestamp") independently selects the same side.

  Mechanics: the path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so
  the conflict existed only in the index with no working-tree markers. Resolved
  via `git update-index --cacheinfo` to ours' blob, collapsing stages 1/2/3 to
  stage 0, then restored the `skip-worktree` bit (cleared by the conflict) to
  match every sibling under `.xgd/tickets/hot/`.

## Incoming changes preserved

Confirmed. This is a ticket-metadata file, not an implementation file, but the
incoming-preservation check passes in the strongest form available: every change
`14cd3cdd41` makes is present byte-identically in the resolved version.

`git show 14cd3cdd41 -- .xgd/tickets/hot/request-3bc4b835.md` introduces exactly
three things beyond base — the two `working_sha` entries
(`61a0becc6122ee61948352cac03237307b292b31`,
`deaf3f98c482ba39a2bf1107ecc1d1c1602a77f9`, each with
`reconcile_sha: null` / `main_sha: null`), `version: 0.2.29`, and the
`free_coding -> free_coded` status advance. The first two appear verbatim in the
staged result; the third is subsumed, since ours has already carried the ticket
past `free_coded` to `bundled` via the same lifecycle path. No incoming content
was discarded.

**No BUG-1301 precedence exception was invoked** — no hunk was dropped, and no
test function was deleted.

## Note for the finalize step

The resolution leaves **no net change from HEAD**: `git diff --cached HEAD` is
empty, because ours already subsumed theirs. Per the brief, this was staged and
exited normally rather than skipped here; finalize should detect the clean
staged diff and skip the commit. `CHERRY_PICK_HEAD` (`14cd3cdd41`) was left
intact — no `--continue`, `--skip`, `--quit`, or `--abort` was run.
