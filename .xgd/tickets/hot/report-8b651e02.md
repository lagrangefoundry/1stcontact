---
uid: report-8b651e02
id: REPORT-5303
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:36:59.807702+00:00'
updated_at: '2026-09-28T06:36:59.807702+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` — **UU**, index-only (path outside the sparse-checkout
  cone, DOC-986 §2/§4.1: no working-tree markers). Class: intent/bookkeeping ticket → **STEP 2e**.
  Resolved `--ours` (blob `57357427c8`) via `git checkout --ours` + `git add --sparse`.
  Enrichment reported *"Intent unknown on one or both sides"* with both subjects
  `xgd(ticket): update request request-b88b79fe`; settled per-fact rather than by raw
  `updated_at` ordering.

  Per-fact resolution:

  | Fact | Ours (HEAD) | Theirs (`3b9156ae89`) | Taken | Why |
  |---|---|---|---|---|
  | `status` | `bundled` | `ready_to_reconcile` (= merge base, untouched) | ours | Theirs has **no intent** on status — unchanged base context adjacent to the hunk. Ours moved it forward. |
  | `fields.bundled_in` | `bundle-8eef3846` | absent (= base) | ours | Only ours added it; taking theirs would orphan the request from its bundle. |
  | `updated_at` | `2026-08-31T05:05:09Z` | `2026-08-31T00:52:48Z` | ours | Both bumped; ours is 3h12m later on the working timeline. |
  | `last_field_updated` | `status` | `body` | ours | The only fact theirs moved, but it records theirs' body edit — which is not being taken — and ours' `status` write is the later one. HEAD's own blob `36e51a0c74` (theirs' body + ours' frontmatter) already settled this scalar as `status`. |
  | body | markdown tables intact, prose hard-wrapped | tables flattened, prose unwrapped, `*`→`_` emphasis drift | ours | Semantically identical (see below); ours is the structural superset. |

  Body classification — token-normalize per the STEP 2e/BUG-1030 method (strip `^\s*>\s?`,
  table rule rows, `|`, `*`, `_`, then diff token streams): 2079 vs 2083 tokens, ratio 0.9986,
  opcodes **`delete=0, insert=0, replace=1`**. The single `replace` is a tokenization artifact
  of emphasis drift — ours `(`setContent`/`data:`)` vs theirs `(**`setContent`**/**`data:`**)`.
  Zero content difference. The raw diff is 120+/158-, entirely rewrap: the incoming commit
  removes **19 pipe-bearing lines and adds none**, flattening a 10-row `## Files` table and a
  6-row `## AC status` table into loose one-cell-per-paragraph lines. That is real information
  loss on the incoming side, so ours is a strict structural superset — the inverse of the usual
  `seed_local_overlay` reflow direction, where the overlay is the flattener.

  Corroborating: HEAD is `bundled`, which per `ticket_types.yaml`'s `immutable:` block freezes
  `body`/`title` — an incoming body edit is inapplicable at HEAD's lifecycle position.

## Incoming changes preserved

No code/implementation files were in this conflict — the pick touches one bookkeeping ticket only
(`git show --stat 3b9156ae89` = 1 file, 120+/158-). Nothing was discarded, and the BUG-1301
precedence exception was **not** invoked (no test function and no refactored-away target is
involved).

The incoming content is **redundant, not dropped** — it is already an ancestor of HEAD, proven by
attribution rather than timestamp inference:

- HEAD's history for this path contains **three** commits whose author date is exactly the picked
  commit's `2026-08-30T17:52:48-07:00` — `0897d89404`, `d86cbfd7ca`, `bc62f2857d` — and all three
  resolve this path to blob `36e51a0c74`.
- Blob `36e51a0c74` **is** theirs' reflowed body composed with ours' frontmatter
  (`status: bundled`, `bundled_in: bundle-8eef3846`, `updated_at 05:05:09Z`,
  `last_field_updated: status`). So the incoming reflow already landed on this branch, three
  times, and was composed with the lifecycle advance each time.
- The queue then **superseded** it three times: the 08-28-dated commits `98ea6de3a7`,
  `6bb5dd1799`, `faf98fe3a2` and the tip `c88aed46b0` all resolve this path to blob
  `57357427c8` — the table-bearing version — restoring the tables while keeping the `bundled`
  frontmatter. `57357427c8` is the current tip's blob and is what was staged.

This is the `reconcile-picked-commit-already-on-head` inversion of the "incoming is newer" rule:
same subject and same author date under a different sha, with later workflow refinements stacked
on top. Every fact on which theirs differs points backwards (`bundled` → `ready_to_reconcile`,
`bundled_in` deleted, `updated_at` rewound, two tables flattened), which makes this subsumption
rather than a contest.

Staged diff against HEAD is therefore **empty** — the resolution equals HEAD's blob. Left for
Python's finalize step to skip the commit; `--skip`/`--continue`/`--abort`/`--quit` were not
called and `CHERRY_PICK_HEAD` (`3b9156ae89cee27c1fd61bca451b67e4e75b6f0b`) is still present.
